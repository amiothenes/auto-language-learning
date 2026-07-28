import { db } from '@/lib/db';
import { words, texts, wordInstances } from '@/lib/db/schema';
import { and, eq, ne } from 'drizzle-orm';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import { calculateCompletionPercentage } from '@/lib/utils/textStats';

/**
 * Recalculates knownPercentage (Completion %, see lib/utils/textStats.ts) for
 * a single text and persists it to the DB. Returns the computed value so
 * callers (import/reprocess, after auto-ignoring proper nouns) can use it
 * without an extra round-trip query.
 */
export async function syncTextStatistics(textId: string): Promise<number> {
  const rows = await db
    .selectDistinct({ wordId: wordInstances.wordId, status: words.status })
    .from(wordInstances)
    .innerJoin(words, eq(wordInstances.wordId, words.id))
    .where(and(eq(wordInstances.textId, textId), ne(words.status, VocabularyStatus.IGNORE)));

  const knownPercentage = calculateCompletionPercentage(
    rows.map((r) => r.status as VocabularyStatus)
  );

  await db.update(texts).set({ knownPercentage }).where(eq(texts.id, textId));
  return knownPercentage;
}

/**
 * Finds all texts containing a given word and resyncs each one.
 * Called after a word's status changes so all affected text percentages stay current.
 */
export async function syncAllTextsForWord(wordId: string): Promise<void> {
  const textRows = await db
    .selectDistinct({ textId: wordInstances.textId })
    .from(wordInstances)
    .where(eq(wordInstances.wordId, wordId));

  await Promise.all(textRows.map((r) => syncTextStatistics(r.textId)));
}
