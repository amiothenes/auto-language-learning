import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words, wordReviews } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/requireUser';
import { syncAllTextsForWord } from '@/lib/utils/vocabularySync';
import { applySm2, dueAtFromInterval } from '@/lib/srs/sm2';
import { stepStatusDown, stepStatusUp } from '@/lib/vocabulary/statusProgression';
import { bumpDailyStats } from '@/lib/srs/queue';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { ApiErrorResponse, SrsReviewRequest, SrsReviewResponse } from '@/lib/types/api';

// ============================================================================
// POST /api/srs/review — Grade a card: advances SM-2 schedule + word status
// ============================================================================

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  let body: SrsReviewRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { wordId, grade } = body;
  if (!wordId || (grade !== 'DIDNT_KNOW' && grade !== 'KNEW')) {
    return NextResponse.json<ApiErrorResponse>({ error: 'wordId and a valid grade are required' }, { status: 400 });
  }

  try {
    const word = await db.query.words.findFirst({
      where: and(eq(words.id, wordId), eq(words.userId, user.id)),
      columns: { id: true, status: true, languageId: true },
    });
    if (!word) {
      return NextResponse.json<ApiErrorResponse>({ error: `Word not found: ${wordId}` }, { status: 404 });
    }

    const existingReview = await db.query.wordReviews.findFirst({ where: eq(wordReviews.wordId, wordId) });
    const isNew = !existingReview;

    const nextSm2 = applySm2(
      {
        easeFactor: existingReview?.easeFactor ?? 2.5,
        intervalDays: existingReview?.intervalDays ?? 0,
        repetitions: existingReview?.repetitions ?? 0,
      },
      grade
    );
    const dueAt = dueAtFromInterval(nextSm2.intervalDays);

    const currentStatus = word.status as VocabularyStatus;
    const nextStatus = grade === 'KNEW' ? stepStatusUp(currentStatus) : stepStatusDown(currentStatus);

    await db.transaction(async (tx) => {
      await tx
        .insert(wordReviews)
        .values({
          wordId,
          userId: user.id,
          easeFactor: nextSm2.easeFactor,
          intervalDays: nextSm2.intervalDays,
          repetitions: nextSm2.repetitions,
          dueAt,
          lastReviewedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: wordReviews.wordId,
          set: {
            easeFactor: nextSm2.easeFactor,
            intervalDays: nextSm2.intervalDays,
            repetitions: nextSm2.repetitions,
            dueAt,
            lastReviewedAt: new Date(),
            updatedAt: new Date(),
          },
        });

      await tx
        .update(words)
        .set({ status: nextStatus, statusChangedAt: new Date(), updatedAt: new Date() })
        .where(eq(words.id, wordId));
    });

    // Not part of the transaction above: this is a daily cap counter, not
    // state that needs atomicity with the SRS schedule/status update.
    await bumpDailyStats(user.id, word.languageId, isNew ? 'newIntroducedCount' : 'reviewsCompletedCount');
    await syncAllTextsForWord(wordId);

    return NextResponse.json<SrsReviewResponse>({
      wordId,
      status: nextStatus,
      dueAt: dueAt.toISOString(),
      isNew,
    });
  } catch (error) {
    console.error('[SRS Review] Error:', error);
    return NextResponse.json<ApiErrorResponse>({ error: 'Failed to record review' }, { status: 500 });
  }
}
