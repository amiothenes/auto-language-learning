import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words, languages, wordTranslations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { ApiErrorResponse } from '@/lib/types/api';
import { syncAllTextsForWord } from '@/lib/utils/vocabularySync';
import { requireUser } from '@/lib/auth/requireUser';

// ============================================================================
// PATCH /api/words/[id] — Update word status and/or translation
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

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
      // Keep words.translation in sync for backward compatibility
      setFields.translation = translation;
    }

    const [updated] = await db
      .update(words)
      .set(setFields)
      .where(and(eq(words.id, id), eq(words.userId, user.id)))
      .returning({ id: words.id, status: words.status, translation: words.translation, languageId: words.languageId });

    if (!updated) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Word not found: ${id}` },
        { status: 404 }
      );
    }

    // Write user translation to word_translations as source:'user' — never overwritten by auto-translation
    // TODO(auth): add userId to wordTranslations table and scope by user.id (post-A sprint)
    if (translation !== undefined) {
      const language = await db.query.languages.findFirst({
        where: eq(languages.id, updated.languageId),
        columns: { defaultTranslationLangCode: true },
      });
      const targetLangCode = language?.defaultTranslationLangCode;
      if (targetLangCode) {
        await db
          .insert(wordTranslations)
          .values({
            wordId: id,
            targetLangCode,
            translation,
            source: 'user',
          })
          .onConflictDoUpdate({
            target: [wordTranslations.wordId, wordTranslations.targetLangCode],
            set: { translation, source: 'user', updatedAt: new Date() },
          });
      }
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
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const { id } = await params;

    const [updated] = await db
      .update(words)
      .set({
        status: VocabularyStatus.UNKNOWN,
        statusChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(words.id, id), eq(words.userId, user.id)))
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
