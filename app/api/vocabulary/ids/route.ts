import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words, languages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';
import { buildVocabularyWhereClause } from '@/lib/vocabulary/vocabularyFilter';

// ============================================================================
// GET /api/vocabulary/ids — Every word id matching the given filters, unpaginated
// ============================================================================

/**
 * Lightweight companion to GET /api/vocabulary: same filters (languageCode,
 * status, search), but returns just ids with no joins and no pagination, for
 * materializing a "select all matching" bulk-action selection without
 * paging through full word records to read their ids.
 *
 * Query params: languageCode (required), status, search — see GET /api/vocabulary.
 */
export async function GET(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('languageCode');
    const statusParam = searchParams.get('status');
    const searchParam = searchParams.get('search');

    if (!languageCode?.trim()) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'languageCode query parameter is required' },
        { status: 400 }
      );
    }

    const language = await db.query.languages.findFirst({
      where: and(eq(languages.code, languageCode), eq(languages.userId, user.id)),
    });

    if (!language) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Language not found: ${languageCode}` },
        { status: 404 }
      );
    }

    const whereClause = buildVocabularyWhereClause({
      languageId: language.id,
      userId: user.id,
      statusParam,
      searchParam,
    });

    const rows = await db.select({ id: words.id }).from(words).where(whereClause);

    return NextResponse.json({ ids: rows.map((r) => r.id) });
  } catch (error) {
    console.error('[Vocabulary Ids] Error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Internal server error fetching vocabulary ids' },
      { status: 500 }
    );
  }
}
