import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import { syncAllTextsForWord } from '@/lib/utils/vocabularySync';
import type { ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// POST /api/vocabulary/bulk-update — Update status on multiple words at once
// ============================================================================

/**
 * Body: { wordIds: string[], status: VocabularyStatus }
 * Returns: { updated: number }
 */
export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json();
    const { wordIds, status } = body as { wordIds: string[]; status: string };

    if (!Array.isArray(wordIds) || wordIds.length === 0) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'wordIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!Object.values(VocabularyStatus).includes(status as VocabularyStatus)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Invalid status: ${status}` },
        { status: 400 }
      );
    }

    await db
      .update(words)
      .set({
        status: status as VocabularyStatus,
        statusChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(words.id, wordIds));

    // Sync knownPercentage for all texts containing any of these words
    await Promise.all(wordIds.map((id) => syncAllTextsForWord(id)));

    return NextResponse.json({ updated: wordIds.length });
  } catch (error) {
    console.error('[Vocabulary Bulk Update] Error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Internal server error updating vocabulary' },
      { status: 500 }
    );
  }
}
