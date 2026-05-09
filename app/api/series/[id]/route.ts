import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { series, texts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { formatRelativeTime } from '@/lib/utils';
import type { Text, SeriesDetail } from '@/lib/types/content';
import type { SeriesDetailResponse, ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// GET /api/series/[id] — Series detail with all its texts
// ============================================================================

/**
 * Returns a single series with its full texts list and aggregate statistics.
 * Used on the series detail page.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Series ID is required' },
        { status: 400 }
      );
    }

    console.log(`[Series Detail] Fetching series: ${id}`);

    // ========================================================================
    // Query series with texts (including their tags)
    // ========================================================================

    const s = await db.query.series.findFirst({
      where: eq(series.id, id),
      with: {
        texts: {
          with: {
            tags: {
              with: { tag: true },
            },
          },
        },
      },
    });

    if (!s) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Series not found with ID: ${id}` },
        { status: 404 }
      );
    }

    console.log(`[Series Detail] Found: "${s.name}" with ${s.texts.length} texts`);

    // ========================================================================
    // Compute aggregate statistics
    // ========================================================================

    const textCount = s.texts.length;
    const totalWords = s.texts.reduce((sum, t) => sum + t.wordCount, 0);
    const overallProgress =
      textCount > 0
        ? Math.round(s.texts.reduce((sum, t) => sum + t.knownPercentage, 0) / textCount)
        : 0;

    const latestText = s.texts.reduce<(typeof s.texts)[0] | null>((latest, t) => {
      if (!latest) return t;
      return t.updatedAt > latest.updatedAt ? t : latest;
    }, null);

    // ========================================================================
    // Map texts to Text[] shape
    // ========================================================================

    const texts: Text[] = s.texts.map((t) => ({
      id: t.id,
      title: t.title,
      wordCount: t.wordCount,
      uniqueWordCount: t.uniqueWordCount,
      knownPercentage: t.knownPercentage,
      lastRead: formatRelativeTime(t.lastViewedAt),
      preview: t.content.slice(0, 150).trimEnd(),
    }));

    const seriesDetail: SeriesDetail = {
      id: s.id,
      name: s.name,
      description: s.description ?? '',
      textCount,
      totalWords,
      overallProgress,
      lastUpdated: formatRelativeTime(latestText?.updatedAt ?? s.updatedAt),
      texts,
    };

    return NextResponse.json<SeriesDetailResponse>({ series: seriesDetail });
  } catch (error) {
    console.error('[Series Detail] Unexpected error:', error);

    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error fetching series',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/series/[id] — Update series name or description
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body as { name?: string; description?: string };

    if (!name && description === undefined) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'At least one field (name or description) is required' },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;

    const [updated] = await db
      .update(series)
      .set(updates)
      .where(eq(series.id, id))
      .returning({ id: series.id, name: series.name });

    if (!updated) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Series not found: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ series: updated });
  } catch (error) {
    console.error('[Series Update] Unexpected error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Internal server error updating series' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/series/[id] — Delete series (texts become uncategorized)
// ============================================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // texts.seriesId has onDelete: 'set null' in schema — DB handles orphaning automatically
    const [deleted] = await db
      .delete(series)
      .where(eq(series.id, id))
      .returning({ id: series.id });

    if (!deleted) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Series not found: ${id}` },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[Series Delete] Unexpected error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Internal server error deleting series' },
      { status: 500 }
    );
  }
}
