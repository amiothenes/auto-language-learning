import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { texts, series, languages } from '@/lib/db/schema';
import { eq, desc, isNotNull, and } from 'drizzle-orm';
import { formatRelativeTime } from '@/lib/utils';
import type { LastPositionResponse, ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// GET /api/reader/last-position — Most recently read text for a language
// ============================================================================

/**
 * Returns the last text the user was reading for the given language,
 * along with paragraph position data for the ResumeBar.
 *
 * Query params:
 *   languageCode  string  required
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('languageCode');

    if (!languageCode?.trim()) {
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

    // Join texts → series to get the series name in one query
    const rows = await db
      .select({
        textId: texts.id,
        textTitle: texts.title,
        seriesName: series.name,
        paragraphIndex: texts.lastParagraphIndex,
        content: texts.content,
        knownPercentage: texts.knownPercentage,
        lastViewedAt: texts.lastViewedAt,
      })
      .from(texts)
      .innerJoin(series, eq(texts.seriesId, series.id))
      .where(and(eq(texts.languageId, language.id), isNotNull(texts.lastViewedAt)))
      .orderBy(desc(texts.lastViewedAt))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    const row = rows[0];
    const totalParagraphs = row.content
      .split('\n\n')
      .filter((p) => p.trim().length > 0).length;

    const response: LastPositionResponse = {
      textId: row.textId,
      textTitle: row.textTitle,
      seriesName: row.seriesName,
      paragraphIndex: row.paragraphIndex,
      totalParagraphs,
      knownPercentage: Math.round(row.knownPercentage),
      lastReadAt: formatRelativeTime(row.lastViewedAt!),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Last Position] Unexpected error:', error);
    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error fetching last position',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
