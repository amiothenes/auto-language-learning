import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { texts, tags, textTags } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { TextData } from '@/lib/types/content';
import type { TextDetailResponse, ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';

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
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

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
      where: and(eq(texts.id, id), eq(texts.userId, user.id)),
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
// PATCH /api/texts/[id] — Update text metadata (title and/or tags)
// Content is intentionally excluded — editing it would require re-running NLP.
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json() as { title?: string; newTags?: string[] };

    if (!body.title && !body.newTags) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'No updatable fields provided' },
        { status: 400 }
      );
    }

    if (body.title !== undefined) {
      const trimmed = body.title.trim();
      if (!trimmed) {
        return NextResponse.json<ApiErrorResponse>(
          { error: 'Title cannot be empty' },
          { status: 400 }
        );
      }
      await db.update(texts).set({ title: trimmed }).where(and(eq(texts.id, id), eq(texts.userId, user.id)));
    }

    if (body.newTags !== undefined) {
      await db.delete(textTags).where(eq(textTags.textId, id));

      for (const name of body.newTags) {
        const trimmed = name.trim();
        if (!trimmed) continue;

        const [tag] = await db
          .insert(tags)
          .values({ name: trimmed })
          .onConflictDoUpdate({ target: tags.name, set: { name: trimmed } })
          .returning({ id: tags.id });

        if (tag) {
          await db.insert(textTags).values({ textId: id, tagId: tag.id });
        }
      }
    }

    const updated = await db.query.texts.findFirst({
      where: and(eq(texts.id, id), eq(texts.userId, user.id)),
      with: { series: true, tags: { with: { tag: true } } },
    });

    if (!updated) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Text not found: ${id}` },
        { status: 404 }
      );
    }

    const textData: TextData = {
      id: updated.id,
      title: updated.title,
      seriesId: updated.seriesId ?? '',
      seriesName: updated.series?.name ?? '',
      wordCount: updated.wordCount,
      uniqueWordCount: updated.uniqueWordCount,
      viewCount: updated.viewCount,
      knownPercentage: updated.knownPercentage,
      tags: updated.tags.map((tt) => tt.tag.name),
      content: updated.content,
    };

    return NextResponse.json<TextDetailResponse>({ text: textData });
  } catch (error) {
    console.error('[Text PATCH] Unexpected error:', error);
    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error updating text',
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const { id } = await params;

    // sentences and wordInstances have onDelete: 'cascade' — DB handles cleanup
    const [deleted] = await db
      .delete(texts)
      .where(and(eq(texts.id, id), eq(texts.userId, user.id)))
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
