import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words, wordInstances, languages } from '@/lib/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { logAudit } from '@/lib/audit';

// ============================================================================
// POST /api/vocabulary/cleanup-orphaned — Permanently delete UNKNOWN words
// that appear in no text (leftover typos/import mistakes). Words still
// referenced by a text keep their RESTRICT-protected wordInstances rows and
// are never touched here — only true orphans are hard-deleted.
// ============================================================================

/**
 * Body: { languageCode: string }
 * Returns: { deleted: number }
 */
export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  const rateLimit = await checkRateLimit('cleanupOrphaned', user.id);
  if (!rateLimit.allowed) {
    return rateLimitResponse('cleanupOrphaned', rateLimit);
  }

  try {
    const body = await request.json();
    const { languageCode } = body as { languageCode?: string };

    if (!languageCode?.trim()) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'languageCode is required' },
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

    const orphaned = await db
      .select({ id: words.id })
      .from(words)
      .leftJoin(wordInstances, eq(wordInstances.wordId, words.id))
      .where(
        and(
          eq(words.languageId, language.id),
          eq(words.userId, user.id),
          eq(words.status, VocabularyStatus.UNKNOWN),
          isNull(wordInstances.id)
        )
      );

    if (orphaned.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    const orphanedIds = orphaned.map((w) => w.id);
    await db.delete(words).where(and(inArray(words.id, orphanedIds), eq(words.userId, user.id)));

    await logAudit({
      userId: user.id,
      action: 'vocabulary.cleanup_orphaned',
      targetType: 'language',
      targetId: language.id,
      metadata: { languageCode, deleted: orphanedIds.length },
    });

    return NextResponse.json({ deleted: orphanedIds.length });
  } catch (error) {
    console.error('[Vocabulary Cleanup Orphaned] Error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Internal server error cleaning up vocabulary' },
      { status: 500 }
    );
  }
}
