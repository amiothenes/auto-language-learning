import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { ApiErrorResponse } from '@/lib/types/api';
import { syncAllTextsForWord } from '@/lib/utils/vocabularySync';

// ============================================================================
// PATCH /api/words/[id] — Update word status and/or translation
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, translation } = body as { status?: string; translation?: string };

    if (status !== undefined && !Object.values(VocabularyStatus).includes(status as VocabularyStatus)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Invalid status: ${status}` },
        { status: 400 }
      );
    }

    const setFields: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) {
      setFields.status = status;
      setFields.statusChangedAt = new Date();
    }
    if (translation !== undefined) {
      setFields.translation = translation;
    }

    const [updated] = await db
      .update(words)
      .set(setFields)
      .where(eq(words.id, id))
      .returning({ id: words.id, status: words.status, translation: words.translation });

    if (!updated) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Word not found: ${id}` },
        { status: 404 }
      );
    }

    if (status !== undefined) {
      await syncAllTextsForWord(id);
    }

    return NextResponse.json({ wordId: updated.id, status: updated.status, translation: updated.translation });
  } catch (error) {
    console.error('[Word Update] Error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to update word' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/words/[id] — Soft-delete: reset status to UNKNOWN
// Resets the word to its pre-review state across all texts (wordInstances
// FK is RESTRICT so hard delete is blocked; UNKNOWN is the untracked state).
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params;

    const [updated] = await db
      .update(words)
      .set({
        status: VocabularyStatus.UNKNOWN,
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
    console.error('[Word Delete] Error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to reset word' },
      { status: 500 }
    );
  }
}
