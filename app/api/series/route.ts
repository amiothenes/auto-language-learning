import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { languages, series } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { formatRelativeTime } from '@/lib/utils';
import type { Series } from '@/lib/types/content';
import type { SeriesListResponse, ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// POST /api/series — Create a new series
// ============================================================================

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    const { name, description, languageCode } = body as {
      name?: string;
      description?: string;
      languageCode?: string;
    };

    if (!name?.trim()) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    if (!languageCode?.trim()) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'languageCode is required' },
        { status: 400 }
      );
    }

    const language = await db.query.languages.findFirst({
      where: eq(languages.code, languageCode.trim()),
    });

    if (!language) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Language not found with code: ${languageCode}` },
        { status: 404 }
      );
    }

    const [created] = await db
      .insert(series)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        languageId: language.id,
      })
      .returning();

    console.log(`[Series Create] Created series "${created.name}" (${created.id})`);

    return NextResponse.json({ series: { id: created.id, name: created.name } }, { status: 201 });
  } catch (error) {
    console.error('[Series Create] Unexpected error:', error);
    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error creating series',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/series — List all series for a language
// ============================================================================

/**
 * Returns all series for a given language with computed progress statistics.
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

    console.log(`[Series List] Fetching series for language: ${language.name}`);

    // ========================================================================
    // 3. Query series with texts (for aggregate stats)
    // ========================================================================

    const rows = await db.query.series.findMany({
      where: eq(series.languageId, language.id),
      with: { texts: true },
      orderBy: [desc(series.createdAt)],
    });

    const sortedRows = [...rows].sort((a, b) => {
      const aLast = Math.max(0, ...a.texts.map((t) => t.lastViewedAt?.getTime() ?? 0));
      const bLast = Math.max(0, ...b.texts.map((t) => t.lastViewedAt?.getTime() ?? 0));
      if (aLast !== bLast) return bLast - aLast;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // ========================================================================
    // 4. Map with computed aggregates
    // ========================================================================

    const result: Series[] = sortedRows.map((s) => {
      const textCount = s.texts.length;
      const progress =
        textCount > 0
          ? Math.round(s.texts.reduce((sum, t) => sum + t.knownPercentage, 0) / textCount)
          : 0;
      const latestText = s.texts.reduce<(typeof s.texts)[0] | null>((latest, t) => {
        if (!latest) return t;
        return t.updatedAt > latest.updatedAt ? t : latest;
      }, null);

      const maxKnownPct =
        textCount > 0 ? Math.max(...s.texts.map((t) => t.knownPercentage)) : 0;

      return {
        id: s.id,
        name: s.name,
        description: s.description ?? '',
        textCount,
        progress,
        lastUpdated: formatRelativeTime(latestText?.updatedAt ?? s.updatedAt),
        maxKnownPct,
      };
    });

    console.log(`[Series List] Found ${result.length} series`);

    return NextResponse.json<SeriesListResponse>({ series: result });
  } catch (error) {
    console.error('[Series List] Unexpected error:', error);

    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error fetching series',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
