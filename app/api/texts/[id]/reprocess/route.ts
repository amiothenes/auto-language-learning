import { NextRequest, NextResponse } from 'next/server';
import { reprocessTextContent, autoIgnoreProperNouns, TextProcessingError } from '@/lib/nlp/textProcessor';
import { syncTextStatistics } from '@/lib/utils/vocabularySync';
import type { ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';
import { db } from '@/lib/db';
import { texts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// ============================================================================
// POST /api/texts/[id]/reprocess — Re-run NLP on updated text content
// ============================================================================

export async function POST(
  request: NextRequest,
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

    // Verify text ownership before reprocessing
    const text = await db.query.texts.findFirst({
      where: and(eq(texts.id, id), eq(texts.userId, user.id)),
      columns: { id: true },
    });
    if (!text) {
      return NextResponse.json<ApiErrorResponse>({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json() as { content?: string; firstChangedParagraphIndex?: number };

    if (!body.content || body.content.trim().length < 10) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Content must be at least 10 characters' },
        { status: 400 }
      );
    }

    const firstChangedParagraphIndex =
      typeof body.firstChangedParagraphIndex === 'number' && body.firstChangedParagraphIndex > 0
        ? body.firstChangedParagraphIndex
        : undefined;

    console.log(`[Reprocess] Starting reprocess for text: ${id}${firstChangedParagraphIndex !== undefined ? ` (partial from para ${firstChangedParagraphIndex})` : ''}`);

    const result = await reprocessTextContent(id, body.content.trim(), undefined, firstChangedParagraphIndex, user.id);

    // Auto-ignore proper nouns newly introduced by the edit, then resync so the
    // returned knownPercentage reflects the corrected denominator (mirrors import).
    const ignoredPropnCount = await autoIgnoreProperNouns([id]);
    const knownPercentage = ignoredPropnCount > 0
      ? await syncTextStatistics(id)
      : result.knownPercentage;

    console.log(
      `[Reprocess] Complete: ${result.wordCount} words, ${Math.round(knownPercentage)}% known, ${result.processingTime}ms`
    );

    return NextResponse.json({
      success: true,
      wordCount: result.wordCount,
      uniqueWordCount: result.uniqueWordCount,
      knownPercentage,
      processingTime: result.processingTime,
    });
  } catch (error) {
    if (error instanceof TextProcessingError) {
      console.error(`[Reprocess] Failed at stage "${error.stage}":`, error.message);
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Text reprocessing failed', details: error.message, stage: error.stage },
        { status: 400 }
      );
    }

    console.error('[Reprocess] Unexpected error:', error);
    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error during reprocessing',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
