import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { ApiErrorResponse } from '@/lib/types/api';
import { syncAllTextsForWord } from '@/lib/utils/vocabularySync';

// ============================================================================
// PATCH /api/words/[id] — Update word vocabulary status
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!Object.values(VocabularyStatus).includes(status)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Invalid status: ${status}` },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(words)
      .set({
        status,
        statusChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(words.id, id))
      .returning({ id: words.id, status: words.status });

    if (!updated) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Word not found: ${id}` },
        { status: 404 }
      );
    }

    await syncAllTextsForWord(id);

    return NextResponse.json({ wordId: updated.id, status: updated.status });
  } catch (error) {
    console.error('[Word Update] Error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to update word status' },
      { status: 500 }
    );
  }
}
