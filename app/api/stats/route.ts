import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { languages, words, texts } from '@/lib/db/schema';
import { eq, and, isNotNull, count } from 'drizzle-orm';
import type { StatsResponse, ApiErrorResponse } from '@/lib/types/api';

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

    const [statusRows, [totalTextsRow], [readTextsRow]] = await Promise.all([
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
    ]);

    // ========================================================================
    // 4. Build status map and compute aggregates
    // ========================================================================

    const statusMap = Object.fromEntries(statusRows.map((r) => [r.status, r.total]));

    const newlySeen = statusMap['NEWLY_SEEN'] ?? 0;
    const familiar = statusMap['FAMILIAR'] ?? 0;
    const known = statusMap['KNOWN'] ?? 0;
    const wellKnown = statusMap['WELL_KNOWN'] ?? 0;
    const ignored = statusMap['IGNORE'] ?? 0;
    const total = newlySeen + familiar + known + wellKnown + ignored;

    const overallKnownPercentage =
      total > 0 ? Math.round(((known + wellKnown) / total) * 100) : 0;

    console.log(
      `[Stats] Words: ${total} total, ${known + wellKnown} known/well-known (${overallKnownPercentage}%)`
    );

    const response: StatsResponse = {
      vocabulary: { total, newlySeen, familiar, known, wellKnown, ignored },
      texts: {
        total: totalTextsRow?.total ?? 0,
        read: readTextsRow?.total ?? 0,
      },
      overallKnownPercentage,
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
