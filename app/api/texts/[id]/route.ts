import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { texts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { TextData } from '@/lib/types/content';
import type { TextDetailResponse, ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// GET /api/texts/[id] — Full text metadata + content for the reader
// ============================================================================

/**
 * Returns complete text data for the reader page.
 * Includes title, content, series info, word counts, tags, and known percentage.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Text ID is required' },
        { status: 400 }
      );
    }

    console.log(`[Text Detail] Fetching text: ${id}`);

    // ========================================================================
    // Query text with series and tags
    // ========================================================================

    const text = await db.query.texts.findFirst({
      where: eq(texts.id, id),
      with: {
        series: true,
        tags: {
          with: { tag: true },
        },
      },
    });

    if (!text) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Text not found with ID: ${id}` },
        { status: 404 }
      );
    }

    console.log(`[Text Detail] Found: "${text.title}"`);

    // ========================================================================
    // Map to TextData shape
    // ========================================================================

    const textData: TextData = {
      id: text.id,
      title: text.title,
      seriesId: text.seriesId ?? '',
      seriesName: text.series?.name ?? '',
      wordCount: text.wordCount,
      uniqueWordCount: text.uniqueWordCount,
      viewCount: text.viewCount,
      knownPercentage: text.knownPercentage,
      tags: text.tags.map((tt) => tt.tag.name),
      content: text.content,
    };

    return NextResponse.json<TextDetailResponse>({ text: textData });
  } catch (error) {
    console.error('[Text Detail] Unexpected error:', error);

    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error fetching text',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/texts/[id] — Delete text (cascades to sentences + wordInstances)
// ============================================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // sentences and wordInstances have onDelete: 'cascade' — DB handles cleanup
    const [deleted] = await db
      .delete(texts)
      .where(eq(texts.id, id))
      .returning({ id: texts.id });

    if (!deleted) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Text not found: ${id}` },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[Text Delete] Unexpected error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Internal server error deleting text' },
      { status: 500 }
    );
  }
}
