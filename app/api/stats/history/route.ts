import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { languages, words } from '@/lib/db/schema';
import { eq, and, ne, isNotNull, sql } from 'drizzle-orm';
import type { StatsHistoryResponse, ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// GET /api/stats/history — Cumulative vocab growth over time for a language
// ============================================================================

/**
 * Returns a time-series of cumulative known word counts, derived from
 * words.statusChangedAt. Uses daily granularity; switches to weekly when
 * there are more than 60 distinct dates (keeps chart readable).
 *
 * Query params:
 *   languageCode  string  required
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('languageCode');

    if (!languageCode || languageCode.trim().length === 0) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'languageCode query parameter is required' },
        { status: 400 }
      );
    }

    const language = await db.query.languages.findFirst({
      where: eq(languages.code, languageCode),
    });

    if (!language) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Language not found with code: ${languageCode}` },
        { status: 404 }
      );
    }

    // First pass: daily grouping to check how many distinct dates exist
    const dailyRows = await db
      .select({
        date: sql<string>`DATE(${words.statusChangedAt})`,
        status: words.status,
        cnt: sql<number>`COUNT(*)`,
      })
      .from(words)
      .where(
        and(
          eq(words.languageId, language.id),
          ne(words.status, 'UNKNOWN'),
          ne(words.status, 'IGNORE'),
          isNotNull(words.statusChangedAt),
        )
      )
      .groupBy(sql`DATE(${words.statusChangedAt})`, words.status)
      .orderBy(sql`DATE(${words.statusChangedAt})`);

    const distinctDates = new Set(dailyRows.map((r) => r.date)).size;

    let rows: { date: string; status: string; cnt: number }[];

    if (distinctDates > 60) {
      // Switch to weekly grouping for readability
      const weeklyRows = await db
        .select({
          date: sql<string>`TO_CHAR(DATE_TRUNC('week', ${words.statusChangedAt}), 'YYYY-MM-DD')`,
          status: words.status,
          cnt: sql<number>`COUNT(*)`,
        })
        .from(words)
        .where(
          and(
            eq(words.languageId, language.id),
            ne(words.status, 'UNKNOWN'),
            ne(words.status, 'IGNORE'),
            isNotNull(words.statusChangedAt),
          )
        )
        .groupBy(sql`DATE_TRUNC('week', ${words.statusChangedAt})`, words.status)
        .orderBy(sql`DATE_TRUNC('week', ${words.statusChangedAt})`);

      rows = weeklyRows;
    } else {
      rows = dailyRows;
    }

    // Build cumulative totals in TypeScript
    const dateMap = new Map<string, { known: number; total: number }>();
    for (const row of rows) {
      if (!dateMap.has(row.date)) dateMap.set(row.date, { known: 0, total: 0 });
      const entry = dateMap.get(row.date)!;
      entry.total += Number(row.cnt);
      if (row.status === 'KNOWN' || row.status === 'WELL_KNOWN' || row.status === 'FAMILIAR') {
        entry.known += Number(row.cnt);
      }
    }

    const sortedDates = Array.from(dateMap.keys()).sort();
    let cumKnown = 0;
    let cumTotal = 0;

    const history = sortedDates.map((date) => {
      const { known, total } = dateMap.get(date)!;
      cumKnown += known;
      cumTotal += total;
      return { date, knownCount: cumKnown, totalReviewed: cumTotal };
    });

    return NextResponse.json<StatsHistoryResponse>({ history });
  } catch (error) {
    console.error('[Stats/History] Unexpected error:', error);
    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error fetching stats history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
