import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words } from '@/lib/db/schema';
import { inArray, and, eq } from 'drizzle-orm';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import { stepStatusUp, stepStatusDown } from '@/lib/vocabulary/statusProgression';
import { syncAllTextsForWord } from '@/lib/utils/vocabularySync';
import type { ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

// ============================================================================
// POST /api/vocabulary/bulk-update — Update status on multiple words at once
// ============================================================================

/**
 * Body: { wordIds: string[] } plus either
 *   - { status: VocabularyStatus } — set every word to this exact status, or
 *   - { direction: 'up' | 'down' } — step each word one level along
 *     STATUS_PROGRESSION from its OWN current status (words outside the
 *     ladder, i.e. IGNORE, or already at an end are left unchanged), using
 *     the same stepStatusUp/stepStatusDown as the in-reader grading UI.
 * Returns: { updated: number }
 */
export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { wordIds, status, direction } = body as {
      wordIds: string[];
      status?: string;
      direction?: 'up' | 'down';
    };

    if (!Array.isArray(wordIds) || wordIds.length === 0) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'wordIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (wordIds.length > 500) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Maximum 500 word IDs per request' },
        { status: 400 }
      );
    }

    if (direction !== undefined) {
      if (direction !== 'up' && direction !== 'down') {
        return NextResponse.json<ApiErrorResponse>(
          { error: `Invalid direction: ${direction}` },
          { status: 400 }
        );
      }
    } else if (!Object.values(VocabularyStatus).includes(status as VocabularyStatus)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Invalid status: ${status}` },
        { status: 400 }
      );
    }

    const rateLimit = await checkRateLimit('bulkUpdate', user.id);
    if (!rateLimit.allowed) {
      return rateLimitResponse('bulkUpdate', rateLimit);
    }

    if (direction) {
      const step = direction === 'up' ? stepStatusUp : stepStatusDown;
      await db.transaction(async (tx) => {
        const current = await tx
          .select({ id: words.id, status: words.status })
          .from(words)
          .where(and(inArray(words.id, wordIds), eq(words.userId, user.id)));

        const idsByTargetStatus = new Map<VocabularyStatus, string[]>();
        for (const w of current) {
          const currentStatus = w.status as VocabularyStatus;
          const target = step(currentStatus);
          if (target === currentStatus) continue; // already at the end of the ladder, or IGNORE
          const group = idsByTargetStatus.get(target);
          if (group) group.push(w.id);
          else idsByTargetStatus.set(target, [w.id]);
        }

        await Promise.all(
          Array.from(idsByTargetStatus.entries()).map(([target, ids]) =>
            tx
              .update(words)
              .set({ status: target, statusChangedAt: new Date(), updatedAt: new Date() })
              .where(and(inArray(words.id, ids), eq(words.userId, user.id)))
          )
        );
      });
    } else {
      await db
        .update(words)
        .set({
          status: status as VocabularyStatus,
          statusChangedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(inArray(words.id, wordIds), eq(words.userId, user.id)));
    }

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
