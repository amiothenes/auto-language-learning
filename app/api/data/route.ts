import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wordInstances, textTags, sentences, words, texts, series } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';

// ============================================================================
// DELETE /api/data — Truncate all user-data tables
// Does NOT delete languages or settings.
// Order matters: child tables before parent tables to respect FK constraints.
// ============================================================================

export async function DELETE() {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    // Fetch user's text and word IDs for cascading child-table deletes
    const userTexts = await db.select({ id: texts.id }).from(texts).where(eq(texts.userId, user.id));
    const userWords = await db.select({ id: words.id }).from(words).where(eq(words.userId, user.id));
    const textIds = userTexts.map((t) => t.id);
    const wordIds = userWords.map((w) => w.id);

    // Delete child rows first (wordInstances, textTags, sentences), then parents
    if (textIds.length > 0) {
      await db.delete(wordInstances).where(inArray(wordInstances.textId, textIds));
      await db.delete(textTags).where(inArray(textTags.textId, textIds));
      await db.delete(sentences).where(inArray(sentences.textId, textIds));
    }
    if (wordIds.length > 0) {
      await db.delete(words).where(eq(words.userId, user.id));
    }
    if (textIds.length > 0) {
      await db.delete(texts).where(eq(texts.userId, user.id));
    }
    await db.delete(series).where(eq(series.userId, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Data] Error deleting all data:', error);
    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error deleting data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
