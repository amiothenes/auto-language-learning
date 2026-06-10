import { db } from '@/lib/db';
import { words, texts, wordInstances } from '@/lib/db/schema';
import { and, eq, ne } from 'drizzle-orm';
import { VocabularyStatus } from '@/lib/types/vocabulary';

/**
 * Recalculates knownPercentage for a single text and persists it to the DB.
 * knownPercentage = (KNOWN + WELL_KNOWN + FAMILIAR) / (all unique lemmas except IGNORE)
 */
export async function syncTextStatistics(textId: string): Promise<void> {
  const rows = await db
    .selectDistinct({ wordId: wordInstances.wordId, status: words.status })
    .from(wordInstances)
    .innerJoin(words, eq(wordInstances.wordId, words.id))
    .where(and(eq(wordInstances.textId, textId), ne(words.status, VocabularyStatus.IGNORE)));

  const total = rows.length;
  const known = rows.filter(
    (r) =>
      r.status === VocabularyStatus.KNOWN ||
      r.status === VocabularyStatus.WELL_KNOWN ||
      r.status === VocabularyStatus.FAMILIAR
  ).length;
  const knownPercentage = total > 0 ? (known / total) * 100 : 0;

  await db.update(texts).set({ knownPercentage }).where(eq(texts.id, textId));
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
