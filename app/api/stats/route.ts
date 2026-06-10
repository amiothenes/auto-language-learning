import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { languages, words, texts } from '@/lib/db/schema';
import { eq, and, isNotNull, count, inArray, sql, desc } from 'drizzle-orm';
import type { StatsResponse, ApiErrorResponse, CefrBand } from '@/lib/types/api';

// ============================================================================
// GET /api/stats — Aggregate dashboard statistics for a language
// ============================================================================

/**
 * Returns vocabulary and text counts for the dashboard.
 *
 * Vocabulary breakdown uses the [languageId, status] composite index on words
 * for efficient groupBy queries.
 *
 * Query params:
 *   languageCode  string  required — e.g. "ru", "es"
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('languageCode');

    // ========================================================================
    // 1. Validate required params
    // ========================================================================

    if (!languageCode || languageCode.trim().length === 0) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'languageCode query parameter is required' },
        { status: 400 }
      );
    }

    // ========================================================================
    // 2. Resolve language
    // ========================================================================

    const language = await db.query.languages.findFirst({
      where: eq(languages.code, languageCode),
    });

    if (!language) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Language not found with code: ${languageCode}` },
        { status: 404 }
      );
    }

    console.log(`[Stats] Fetching stats for language: ${language.name}`);

    // ========================================================================
    // 3. Run queries in parallel
    //    - word counts grouped by status (uses [languageId, status] composite index)
    //    - total text count
    //    - read text count (lastViewedAt not null)
    // ========================================================================

    const [statusRows, [totalTextsRow], [readTextsRow], knownWordRows, activityDates] = await Promise.all([
      db
        .select({ status: words.status, total: count() })
        .from(words)
        .where(eq(words.languageId, language.id))
        .groupBy(words.status),

      db
        .select({ total: count() })
        .from(texts)
        .where(eq(texts.languageId, language.id)),

      db
        .select({ total: count() })
        .from(texts)
        .where(and(eq(texts.languageId, language.id), isNotNull(texts.lastViewedAt))),

      db
        .select({ dictionaryFrequency: words.dictionaryFrequency })
        .from(words)
        .where(and(
          eq(words.languageId, language.id),
          inArray(words.status, ['KNOWN', 'WELL_KNOWN']),
        )),

      db
        .selectDistinct({ date: sql<string>`DATE(${texts.lastViewedAt} AT TIME ZONE 'UTC')` })
        .from(texts)
        .where(and(eq(texts.languageId, language.id), isNotNull(texts.lastViewedAt)))
        .orderBy(desc(sql`DATE(${texts.lastViewedAt} AT TIME ZONE 'UTC')`)),
    ]);

    // ========================================================================
    // 4. Build status map and compute aggregates
    // ========================================================================

    const statusMap = Object.fromEntries(statusRows.map((r) => [r.status, r.total]));

    const unknown   = statusMap['UNKNOWN']    ?? 0;
    const newlySeen = statusMap['NEWLY_SEEN'] ?? 0;
    const familiar  = statusMap['FAMILIAR']   ?? 0;
    const known     = statusMap['KNOWN']      ?? 0;
    const wellKnown = statusMap['WELL_KNOWN'] ?? 0;
    const ignored   = statusMap['IGNORE']     ?? 0;
    // "reviewed" total excludes UNKNOWN (used for vocabulary display counts)
    const total = newlySeen + familiar + known + wellKnown + ignored;
    // overallKnownPercentage: IGNORE excluded from both sides, consistent with per-text formula
    const allLemmas = newlySeen + familiar + known + wellKnown + unknown;
    const overallKnownPercentage =
      allLemmas > 0 ? Math.round(((known + wellKnown + familiar) / allLemmas) * 100) : 0;

    // ========================================================================
    // 5. Zipf-weighted reading coverage (accounts for full language vocabulary)
    //    Based on Paul Nation's frequency band research + Zipf's Law.
    //    MAX_VOCAB = 10,000 word families; H ≈ ln(10000) + 0.5772 ≈ 9.787
    //    Validated: top-1K → 76.5% (Nation: ~77%), top-2K → 83.6% (~84-87%) ✓
    // ========================================================================

    const MAX_VOCAB = 10_000;
    const H = Math.log(MAX_VOCAB) + 0.5772; // harmonic series approximation

    const zipfNumerator = knownWordRows.reduce((sum, w) => {
      const rank = MAX_VOCAB * (1 - w.dictionaryFrequency / 100) + 1;
      return sum + 1 / rank;
    }, 0);

    const readingCoverage = Math.min(98, Math.round((zipfNumerator / H) * 1000) / 10);

    const cefrBand: CefrBand =
      readingCoverage >= 96 ? 'C2' :
      readingCoverage >= 92 ? 'C1' :
      readingCoverage >= 84 ? 'B1-B2' :
      readingCoverage >= 77 ? 'A2-B1' : 'A1-A2';

    // ========================================================================
    // 6. Compute reading streak (consecutive UTC calendar days with activity)
    // ========================================================================

    const prevDay = (d: string) =>
      new Date(new Date(d).getTime() - 86_400_000).toISOString().slice(0, 10);

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = prevDay(today);
    const dates = activityDates.map((r) => r.date);

    let streak = 0;
    let cursor: string | null =
      dates[0] === today || dates[0] === yesterday ? dates[0] : null;

    if (cursor) {
      for (const d of dates) {
        if (d === cursor) { streak++; cursor = prevDay(cursor); }
        else break;
      }
    }

    console.log(
      `[Stats] Words: ${total} reviewed + ${unknown} unknown, ${known + wellKnown} known/well-known (${overallKnownPercentage}%), reading coverage: ${readingCoverage}% (${cefrBand}), streak: ${streak} days`
    );

    const response: StatsResponse = {
      vocabulary: { total, unknown, newlySeen, familiar, known, wellKnown, ignored },
      texts: {
        total: totalTextsRow?.total ?? 0,
        read: readTextsRow?.total ?? 0,
      },
      overallKnownPercentage,
      readingCoverage,
      cefrBand,
      streak,
    };

    return NextResponse.json<StatsResponse>(response);
  } catch (error) {
    console.error('[Stats] Unexpected error:', error);

    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error fetching stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
