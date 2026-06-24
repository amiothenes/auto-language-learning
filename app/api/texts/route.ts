import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { languages, texts } from '@/lib/db/schema';
import { eq, and, desc, isNotNull, sql } from 'drizzle-orm';
import { formatRelativeTime } from '@/lib/utils';
import type { TextListItem, TextsListResponse, ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// GET /api/texts — List texts for a language
// ============================================================================

/**
 * Returns all texts for a given language, with optional series filter.
 *
 * Query params:
 *   languageCode  string  required — e.g. "ru", "es"
 *   seriesId      string  optional — filter to a specific series
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('languageCode');
    const seriesId = searchParams.get('seriesId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : undefined;
    const onlyRead = searchParams.get('onlyRead') === 'true';

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

    console.log(`[Texts List] Fetching texts for language: ${language.name}${seriesId ? ` (series: ${seriesId})` : ''}`);

    // ========================================================================
    // 3. Query texts with relations
    // ========================================================================

    const baseWhere = seriesId
      ? and(eq(texts.languageId, language.id), eq(texts.seriesId, seriesId))
      : eq(texts.languageId, language.id);
    const whereClause = onlyRead ? and(baseWhere, isNotNull(texts.lastViewedAt)) : baseWhere;
    const orderBy = [
      sql`${texts.lastViewedAt} DESC NULLS LAST`,
      desc(texts.createdAt),
    ];

    const rows = await db.query.texts.findMany({
      where: whereClause,
      with: {
        series: true,
        tags: {
          with: { tag: true },
        },
      },
      orderBy,
      ...(limit !== undefined ? { limit } : {}),
    });

    // ========================================================================
    // 4. Map to response shape
    // ========================================================================

    const result: TextListItem[] = rows.map((text) => ({
      id: text.id,
      title: text.title,
      wordCount: text.wordCount,
      uniqueWordCount: text.uniqueWordCount,
      knownPercentage: text.knownPercentage,
      lastRead: formatRelativeTime(text.lastViewedAt),
      preview: text.content.slice(0, 150).trimEnd(),
      seriesId: text.seriesId ?? null,
      seriesName: text.series?.name ?? null,
      tags: text.tags.map((tt) => tt.tag.name),
      createdAt: text.createdAt.toISOString(),
    }));

    console.log(`[Texts List] Found ${result.length} texts`);

    return NextResponse.json<TextsListResponse>({ texts: result, total: result.length });
  } catch (error) {
    console.error('[Texts List] Unexpected error:', error);

    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error fetching texts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
