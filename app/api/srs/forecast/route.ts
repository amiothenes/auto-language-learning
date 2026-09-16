import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words, wordReviews } from '@/lib/db/schema';
import { eq, and, inArray, lt, sql } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/requireUser';
import { getSrsSettings, eligibleStatusesFor } from '@/lib/srs/queue';
import type { ApiErrorResponse, SrsForecastResponse } from '@/lib/types/api';

const DEFAULT_DAYS = 14;

// ============================================================================
// GET /api/srs/forecast — Cards due per day for the next N days (Review page chart)
// ============================================================================

export async function GET(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const languageId = searchParams.get('languageId');
  if (!languageId) {
    return NextResponse.json<ApiErrorResponse>({ error: 'languageId query parameter is required' }, { status: 400 });
  }
  const days = Math.min(60, Math.max(1, Number(searchParams.get('days')) || DEFAULT_DAYS));

  try {
    const settings = await getSrsSettings(user.id, languageId);
    const eligibleStatuses = eligibleStatusesFor(settings);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    // Anything already overdue is clamped into today's bucket, matching how
    // the actual queue treats it (due-now, not "due on some past date").
    const dateExpr = sql<string>`GREATEST(DATE(${wordReviews.dueAt}), CURRENT_DATE)`;

    const rows = await db
      .select({ date: dateExpr, cnt: sql<number>`COUNT(*)` })
      .from(wordReviews)
      .innerJoin(words, eq(wordReviews.wordId, words.id))
      .where(
        and(
          eq(wordReviews.userId, user.id),
          eq(words.languageId, languageId),
          inArray(words.status, eligibleStatuses),
          lt(wordReviews.dueAt, cutoff)
        )
      )
      .groupBy(dateExpr);

    const countByDate = new Map(rows.map((r) => [r.date, Number(r.cnt)]));

    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const date = d.toISOString().slice(0, 10);
      return { date, count: countByDate.get(date) ?? 0 };
    });

    return NextResponse.json<SrsForecastResponse>({ buckets });
  } catch (error) {
    console.error('[SRS Forecast] Error:', error);
    return NextResponse.json<ApiErrorResponse>({ error: 'Failed to build review forecast' }, { status: 500 });
  }
}
