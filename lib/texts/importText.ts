import { db } from '@/lib/db';
import { texts } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { processTextForImport, autoIgnoreProperNouns } from '@/lib/nlp/textProcessor';
import { syncTextStatistics } from '@/lib/utils/vocabularySync';
import { splitIntoChunks } from '@/lib/nlp/textChunker';

/**
 * The text-import pipeline shared by POST /api/texts/import and onboarding
 * seeding: chunk → NLP-process each page → auto-ignore proper nouns → resync
 * stats. Translation is NOT started here; callers schedule
 * processTranslationsForText in after() so it never blocks a response.
 *
 * Throws TextProcessingError (from textProcessor) on an NLP failure; callers
 * map it to an HTTP response.
 */

export interface ImportedPage {
  id: string;
  title: string;
  wordCount: number;
  uniqueWordCount: number;
  knownPercentage: number;
}

export interface ImportTextResult {
  pages: ImportedPage[];
  textIds: string[];
  statistics: { newWordsCreated: number; sentencesCreated: number; processingTime: number };
  ignoredPropnCount: number;
}

export interface ImportTextParams {
  userId: string;
  languageId: string;
  seriesId: string;
  title: string;
  content: string;
  /**
   * Order of the first page. Defaults to after the series' last text, so an
   * import never disturbs a manually arranged Custom Order.
   */
  startOrder?: number;
  logTag?: string;
}

export async function nextOrderInSeries(seriesId: string): Promise<number> {
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`COALESCE(MAX(${texts.order}), 0)` })
    .from(texts)
    .where(eq(texts.seriesId, seriesId));
  return Number(maxOrder) + 1;
}

export async function importTextPages({
  userId,
  languageId,
  seriesId,
  title,
  content,
  startOrder,
  logTag = '[Text Import]',
}: ImportTextParams): Promise<ImportTextResult> {
  const firstOrder = startOrder ?? (await nextOrderInSeries(seriesId));
  const cleanTitle = title.trim();

  const chunks = splitIntoChunks(content.replace(/\r\n/g, '\n').trim());
  const isMultiChunk = chunks.length > 1;
  const pageTitle = (i: number) => (isMultiChunk ? `${cleanTitle} (Part ${i + 1})` : cleanTitle);
  console.log(`${logTag} Split into ${chunks.length} chunk(s)`);

  const results: Awaited<ReturnType<typeof processTextForImport>>[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const result = await processTextForImport(pageTitle(i), chunks[i], languageId, seriesId, firstOrder + i, undefined, userId);
    console.log(`${logTag} Chunk ${i + 1}/${chunks.length} done: ${result.wordCount} words, ${result.processingTime}ms`);
    results.push(result);
  }

  const textIds = results.map((r) => r.textId);

  // Auto-ignore proper nouns synchronously (pure SQL, <10ms). That changes each
  // text's denominator, so resync to keep knownPercentage fresh.
  const ignoredPropnCount = await autoIgnoreProperNouns(textIds);
  const knownPercentages =
    ignoredPropnCount > 0 ? await Promise.all(textIds.map((id) => syncTextStatistics(id))) : results.map((r) => r.knownPercentage);

  return {
    pages: results.map((r, i) => ({
      id: r.textId,
      title: pageTitle(i),
      wordCount: r.wordCount,
      uniqueWordCount: r.uniqueWordCount,
      knownPercentage: knownPercentages[i],
    })),
    textIds,
    statistics: {
      newWordsCreated: results.reduce((s, r) => s + r.newWordsCreated, 0),
      sentencesCreated: results.reduce((s, r) => s + r.sentencesCreated, 0),
      processingTime: results.reduce((s, r) => s + r.processingTime, 0),
    },
    ignoredPropnCount,
  };
}
