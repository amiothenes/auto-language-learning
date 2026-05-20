import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { texts, wordInstances } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { WordInstanceItem, WordInstancesResponse, ApiErrorResponse } from '@/lib/types/api';
import { VocabularyStatus } from '@/lib/types/vocabulary';

// ============================================================================
// GET /api/texts/[id]/word-instances — Word instances for reader highlighting
// ============================================================================

/**
 * Returns all word instances for a text, ordered by position.
 *
 * This is the core data feed for the reader: every word token in the text is
 * returned with its lemma's current status, translation, and frequency data.
 * The reader uses this to render highlighted words without any client-side joins.
 *
 * Results are ordered by position ASC — critical for correct document rendering.
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

    // ========================================================================
    // 1. Verify text exists
    // ========================================================================

    const text = await db.query.texts.findFirst({
      where: eq(texts.id, id),
    });

    if (!text) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Text not found with ID: ${id}` },
        { status: 404 }
      );
    }

    console.log(`[Word Instances] Fetching instances for text: "${text.title}" (${id})`);

    // ========================================================================
    // 2. Fetch all word instances with their lemma data
    // ========================================================================

    const rows = await db.query.wordInstances.findMany({
      where: eq(wordInstances.textId, id),
      with: { word: true },
      orderBy: [asc(wordInstances.position)],
    });

    // ========================================================================
    // 3. Map to flat WordInstanceItem shape
    // ========================================================================

    const instances: WordInstanceItem[] = rows.map((instance) => ({
      instanceId: instance.id,
      wordId: instance.wordId,
      surface: instance.surfaceForm,
      lemma: instance.word.lemma,
      pos: instance.pos ?? null,
      translation: instance.word.translation ?? null,
      romanization: instance.word.romanization ?? null,
      dictionaryFrequency: instance.word.dictionaryFrequency,
      userFrequency: instance.word.userFrequency,
      status: instance.word.status as VocabularyStatus,
      position: instance.position,
      sentenceId: instance.sentenceId ?? null,
      inflectionData: instance.inflectionData ?? null,
    }));

    console.log(`[Word Instances] Found ${instances.length} instances`);

    return NextResponse.json<WordInstancesResponse>({ textId: id, instances });
  } catch (error) {
    console.error('[Word Instances] Unexpected error:', error);

    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error fetching word instances',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
