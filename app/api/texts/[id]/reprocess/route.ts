import { NextRequest, NextResponse } from 'next/server';
import { reprocessTextContent, TextProcessingError } from '@/lib/nlp/textProcessor';
import type { ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// POST /api/texts/[id]/reprocess — Re-run NLP on updated text content
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Text ID is required' },
        { status: 400 }
      );
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

    const result = await reprocessTextContent(id, body.content.trim(), undefined, firstChangedParagraphIndex);

    console.log(
      `[Reprocess] Complete: ${result.wordCount} words, ${result.knownPercentage}% known, ${result.processingTime}ms`
    );

    return NextResponse.json({
      success: true,
      wordCount: result.wordCount,
      uniqueWordCount: result.uniqueWordCount,
      knownPercentage: result.knownPercentage,
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
