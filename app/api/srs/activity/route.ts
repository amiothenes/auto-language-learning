import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { srsDailyStats } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/requireUser';
import type { ApiErrorResponse, SrsActivityResponse } from '@/lib/types/api';

const DEFAULT_DAYS = 30;

// ============================================================================
// GET /api/srs/activity — Recent daily review/new-card counts (Review page chart)
// Reads srs_daily_stats directly — that data is already collected for the
// daily-cap logic, no separate aggregation needed.
// ============================================================================

export async function GET(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const languageId = searchParams.get('languageId');
  if (!languageId) {
    return NextResponse.json<ApiErrorResponse>({ error: 'languageId query parameter is required' }, { status: 400 });
  }
  const days = Math.min(90, Math.max(1, Number(searchParams.get('days')) || DEFAULT_DAYS));

  try {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    const sinceDate = since.toISOString().slice(0, 10);

    const rows = await db.query.srsDailyStats.findMany({
      where: and(
        eq(srsDailyStats.userId, user.id),
        eq(srsDailyStats.languageId, languageId),
        gte(srsDailyStats.date, sinceDate)
      ),
    });
    const rowByDate = new Map(rows.map((r) => [r.date, r]));

    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const date = d.toISOString().slice(0, 10);
      const row = rowByDate.get(date);
      return { date, reviews: row?.reviewsCompletedCount ?? 0, newCards: row?.newIntroducedCount ?? 0 };
    });

    return NextResponse.json<SrsActivityResponse>({ buckets });
  } catch (error) {
    console.error('[SRS Activity] Error:', error);
    return NextResponse.json<ApiErrorResponse>({ error: 'Failed to build review activity' }, { status: 500 });
  }
}
