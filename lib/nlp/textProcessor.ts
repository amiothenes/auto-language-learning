/**
 * Text Import Processing Pipeline
 *
 * Orchestrates the complete pipeline for importing foreign-language text:
 * 1. NLP processing (tokenization, lemmatization, romanization)
 * 2. Database operations (create words, texts, sentences, word instances)
 * 3. Statistics calculation (word counts, known percentage)
 *
 * Performance target: < 3 seconds for 2000-word text
 */

import { db } from '@/lib/db';
import {
  words,
  texts,
  sentences,
  wordInstances,
  languages,
  type NewWord,
  type NewText,
  type NewSentence,
  type NewWordInstance,
  type Language,
} from '@/lib/db/schema';
import { eq, and, inArray, sql, gte } from 'drizzle-orm';
import { romanizeBatch } from '@/lib/nlp/romanizer';
import { processWithSpacy } from '@/lib/nlp/spacyClient';
import { matchesLanguageScript, requiresRomanization } from '@/lib/nlp/utils/script-detector';
import type { LemmatizeResult } from '@/lib/nlp/types';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import { calculateCompletionPercentage } from '@/lib/utils/textStats';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Progress update stages during text processing
 */
export type ProgressStage =
  | 'tokenizing'
  | 'lemmatizing'
  | 'romanizing'
  | 'querying_db'
  | 'inserting'
  | 'complete';

/**
 * Progress update sent to callback during processing
 */
export interface ProgressUpdate {
  /** Current processing stage */
  stage: ProgressStage;

  /** Progress percentage (0-100) */
  percent: number;

  /** Human-readable message */
  message: string;

  /** Optional current step number */
  currentStep?: number;

  /** Optional total steps */
  totalSteps?: number;
}

/**
 * Result returned after successful text processing
 */
export interface ProcessedTextResult {
  /** ID of created text record */
  textId: string;

  /** Total word count (all occurrences) */
  wordCount: number;

  /** Unique word count (unique lemmas) */
  uniqueWordCount: number;

  /** Percentage of known words (0-100) */
  knownPercentage: number;

  /** Number of new words created */
  newWordsCreated: number;

  /** Number of sentences created */
  sentencesCreated: number;

  /** Total processing time in milliseconds */
  processingTime: number;
}

/**
 * Optional progress callback function
 */
export type ProgressCallback = (progress: ProgressUpdate) => void;

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Custom error for text processing failures with stage context
 */
export class TextProcessingError extends Error {
  constructor(
    message: string,
    public stage: ProgressStage,
    public cause?: Error
  ) {
    super(message);
    this.name = 'TextProcessingError';
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Report progress to callback if provided
 */
function reportProgress(
  callback: ProgressCallback | undefined,
  stage: ProgressStage,
  percent: number,
  message: string
): void {
  if (!callback) return;
  callback({ stage, percent, message });
}

// ============================================================================
// Private Helper: NLP Phase
// ============================================================================

interface NLPPhaseResult {
  wordTokens: Array<{ surfaceForm: string; cleanForm: string; position: number; sentenceIndex: number }>;
  lemmaResults: Map<string, LemmatizeResult>;
  romanizations: Map<string, string | null>;
  sentenceData: Array<{ content: string; order: number }>;
  uniqueCleanForms: string[];
}

async function runNLPPhase(
  content: string,
  language: Language,
  progressCallback?: ProgressCallback
): Promise<NLPPhaseResult> {
  const needsRomanization = requiresRomanization(language.code);

  reportProgress(progressCallback, 'tokenizing', 5, 'Processing text with NLP service');

  let spacyResult: Awaited<ReturnType<typeof processWithSpacy>>;
  try {
    spacyResult = await processWithSpacy(content, language.code);
  } catch (error) {
    throw new TextProcessingError(
      `NLP service failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'tokenizing',
      error instanceof Error ? error : undefined
    );
  }

  const wordTokens = spacyResult.tokens
    .filter((t) => t.is_word)
    .filter((t) => language.includeForeignScript || matchesLanguageScript(t.surface, language.code))
    .map((t) => ({
      surfaceForm: t.surface,
      cleanForm: t.surface.toLowerCase(),
      position: t.position,
      sentenceIndex: t.sentence_index,
    }));

  if (wordTokens.length === 0) {
    throw new TextProcessingError('No word tokens found in text (only punctuation)', 'tokenizing');
  }

  const lemmaResults = new Map<string, LemmatizeResult>();
  for (const token of spacyResult.tokens.filter(
    (t) => t.is_word && (language.includeForeignScript || matchesLanguageScript(t.surface, language.code))
  )) {
    lemmaResults.set(token.surface.toLowerCase(), {
      lemma: token.lemma.toLowerCase(),
      pos: token.pos,
      inflectionData: Object.fromEntries(Object.entries(token.morph).map(([k, v]) => [k.toLowerCase(), v])),
      confidence: 0.95,
    });
  }

  const uniqueCleanForms = [...new Set(wordTokens.map((t) => t.cleanForm))];

  reportProgress(
    progressCallback,
    'lemmatizing',
    50,
    `Processed ${wordTokens.length} words (${uniqueCleanForms.length} unique) via NLP service`
  );

  const romanizations = new Map<string, string | null>();
  try {
    if (needsRomanization) {
      const romanizedResults = await romanizeBatch(uniqueCleanForms, language.code);
      uniqueCleanForms.forEach((word, idx) => {
        romanizations.set(word, romanizedResults[idx]);
      });
      reportProgress(progressCallback, 'romanizing', 60, `Romanized ${uniqueCleanForms.length} words`);
    } else {
      reportProgress(progressCallback, 'romanizing', 60, 'Skipped romanization (Latin script)');
    }
  } catch (error) {
    throw new TextProcessingError(
      `Romanization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'romanizing',
      error instanceof Error ? error : undefined
    );
  }

  reportProgress(progressCallback, 'romanizing', 63, 'Extracting sentences');

  const sentenceData: Array<{ content: string; order: number }> = spacyResult.sentences
    .map((s) => ({ content: s.text, order: s.index }))
    .sort((a, b) => a.order - b.order);

  reportProgress(progressCallback, 'romanizing', 65, `Extracted ${sentenceData.length} sentences`);

  return { wordTokens, lemmaResults, romanizations, sentenceData, uniqueCleanForms };
}

// ============================================================================
// Main Export: Text Import Processing Pipeline
// ============================================================================

/**
 * Process text for import into the database
 *
 * This function orchestrates the complete pipeline:
 * 1. Tokenizes text into sentences and words
 * 2. Lemmatizes each word with context
 * 3. Generates romanization for non-Latin scripts
 * 4. Queries database for existing lemmas
 * 5. Creates new Word records for unseen lemmas (status: NEWLY_SEEN)
 * 6. Creates WordInstance records for all occurrences
 * 7. Extracts and stores sentences
 * 8. Calculates statistics (word count, unique words, known percentage)
 * 9. Creates Text record with all data
 *
 * All database operations are atomic via transaction.
 *
 * @param title - Title of the text
 * @param content - Full text content
 * @param languageId - Database ID of the language
 * @param seriesId - Optional series ID to associate text with
 * @param progressCallback - Optional callback for progress updates
 * @returns Processing result with statistics
 * @throws TextProcessingError if any step fails
 */
export async function processTextForImport(
  title: string,
  content: string,
  languageId: string,
  seriesId: string,
  order: number | undefined,
  progressCallback: ProgressCallback | undefined,
  userId: string
): Promise<ProcessedTextResult> {
  const startTime = Date.now();

  try {
    // ========================================================================
    // PHASE 1: NLP PROCESSING (Outside Transaction)
    // ========================================================================

    // Step 1: Fetch Language Configuration (0-5%)
    reportProgress(progressCallback, 'tokenizing', 0, 'Loading language configuration');

    const language = await db.query.languages.findFirst({
      where: eq(languages.id, languageId),
    });

    if (!language) {
      throw new TextProcessingError(
        `Language not found: ${languageId}`,
        'tokenizing'
      );
    }

    // Handle empty content edge case
    if (!content || content.trim().length === 0) {
      throw new TextProcessingError(
        'Content cannot be empty',
        'tokenizing'
      );
    }

    // Strip [bracket annotations] so the stored content exactly matches what
    // spaCy processes. Without this, token.idx positions (from cleaned text)
    // are misaligned with the stored text, causing broken reader highlights.
    const processedContent = content.replace(/\[[^\]]*\]/g, '');

    // Steps 2-5: NLP via spaCy (tokenize, lemmatize, romanize, extract sentences)
    const { wordTokens, lemmaResults, romanizations, sentenceData, uniqueCleanForms } =
      await runNLPPhase(processedContent, language, progressCallback);

    // ========================================================================
    // PHASE 2: DATABASE OPERATIONS (Inside Transaction)
    // ========================================================================

    try {
      const result = await db.transaction(async (tx) => {
        // Step 6: Query Existing Words (65-70%)
        reportProgress(progressCallback, 'querying_db', 65, 'Checking existing vocabulary');

        // Get all unique lemmas from lemmatization results
        const uniqueLemmas = [...new Set(Array.from(lemmaResults.values()).map((r) => r.lemma))];

        // Batch query existing words (NOT N+1 queries) — scoped to this user
        const existingWords = await tx.query.words.findMany({
          where: and(
            eq(words.languageId, languageId),
            inArray(words.lemma, uniqueLemmas),
            eq(words.userId, userId),
          ),
        });

        // Create map: lemma → Word record
        const existingWordsMap = new Map(existingWords.map((w) => [w.lemma, w]));

        reportProgress(
          progressCallback,
          'querying_db',
          70,
          `Found ${existingWords.length} existing words`
        );

        // Step 7: Create New Word Records (70-75%)
        const newLemmas = uniqueLemmas.filter((lemma) => !existingWordsMap.has(lemma));

        let newWordsCreated = 0;

        if (newLemmas.length > 0) {
          // Prepare insert data
          const newWordsData: NewWord[] = newLemmas.map((lemma) => {
            // Find a representative token for romanization
            const representativeResult = Array.from(lemmaResults.entries()).find(
              ([_, result]) => result.lemma === lemma
            );

            const cleanForm = representativeResult?.[0];
            const romanization = cleanForm ? romanizations.get(cleanForm) : null;

            return {
              lemma,
              languageId,
              userId,
              status: 'UNKNOWN' as const,
              romanization,
              dictionaryFrequency: 0, // TODO: Integrate frequency dictionary
              userFrequency: 1,
            };
          });

          // Bulk insert with returning
          const insertedWords = await tx.insert(words).values(newWordsData).returning();

          // Add to map for later use
          insertedWords.forEach((word) => {
            existingWordsMap.set(word.lemma, word);
          });

          newWordsCreated = insertedWords.length;

          reportProgress(
            progressCallback,
            'inserting',
            75,
            `Created ${newWordsCreated} new vocabulary entries`
          );
        } else {
          reportProgress(progressCallback, 'inserting', 75, 'All words already exist in vocabulary');
        }

        // Step 8: Update User Frequency for Existing Words (75-78%)
        const existingLemmas = uniqueLemmas.filter(
          (lemma) => existingWordsMap.has(lemma) && !newLemmas.includes(lemma)
        );

        if (existingLemmas.length > 0) {
          // Batch update using single SQL query (10-100x faster than N individual queries)
          // This uses a single UPDATE with WHERE IN instead of Promise.all with N queries
          await tx
            .update(words)
            .set({
              userFrequency: sql`${words.userFrequency} + 1`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(words.languageId, languageId),
                inArray(words.lemma, existingLemmas),
                eq(words.userId, userId),
              )
            );

          reportProgress(
            progressCallback,
            'inserting',
            78,
            `Updated user frequency for ${existingLemmas.length} existing words`
          );
        }

        // Step 9: Create Text Record (78-80%)
        const wordCount = wordTokens.length; // Total occurrences
        const uniqueWordCount = uniqueCleanForms.length; // Unique lemmas

        const [insertedText] = await tx
          .insert(texts)
          .values({
            title,
            content: processedContent,
            languageId,
            userId,
            seriesId,
            order: order ?? 1,
            wordCount,
            uniqueWordCount,
            knownPercentage: 0, // Will calculate next
          })
          .returning();

        const textId = insertedText.id;

        reportProgress(progressCallback, 'inserting', 80, `Created text record: ${title}`);

        // Step 10: Insert Sentences (80-85%)
        const sentencesData: NewSentence[] = sentenceData.map((s) => ({
          textId,
          content: s.content,
          order: s.order,
        }));

        const insertedSentences = await tx.insert(sentences).values(sentencesData).returning();

        // Create map: order → sentence ID
        const sentenceIdMap = new Map(insertedSentences.map((s) => [s.order, s.id]));

        reportProgress(
          progressCallback,
          'inserting',
          85,
          `Created ${insertedSentences.length} sentences`
        );

        // Step 11: Insert Word Instances (85-92%)
        const wordInstancesData: NewWordInstance[] = wordTokens.map((token) => {
          const lemmaResult = lemmaResults.get(token.cleanForm)!;
          const word = existingWordsMap.get(lemmaResult.lemma)!;
          const sentenceId = sentenceIdMap.get(token.sentenceIndex);

          return {
            textId,
            wordId: word.id,
            sentenceId: sentenceId || null,
            surfaceForm: token.surfaceForm,
            position: token.position,
            pos: lemmaResult.pos !== 'X' ? lemmaResult.pos : null,
            inflectionData: lemmaResult.inflectionData as Record<string, unknown>,
          };
        });

        // Bulk insert in batches of 500 (prevent memory issues on large texts)
        const INSTANCE_BATCH_SIZE = 500;
        for (let i = 0; i < wordInstancesData.length; i += INSTANCE_BATCH_SIZE) {
          const batch = wordInstancesData.slice(i, i + INSTANCE_BATCH_SIZE);
          await tx.insert(wordInstances).values(batch);

          const progress = 85 + Math.floor(7 * ((i + batch.length) / wordInstancesData.length));
          reportProgress(
            progressCallback,
            'inserting',
            progress,
            `Inserted ${i + batch.length} / ${wordInstancesData.length} word instances`
          );
        }


        // Step 12: Calculate Known Percentage (92-95%)
        reportProgress(progressCallback, 'inserting', 92, 'Calculating known percentage');

        // Query word statuses for all unique lemmas in this text — scoped to this user
        const wordStatuses = await tx.query.words.findMany({
          where: and(
            eq(words.languageId, languageId),
            inArray(words.lemma, uniqueLemmas),
            eq(words.userId, userId),
          ),
          columns: {
            lemma: true,
            status: true,
          },
        });

        // Completion % — see lib/utils/textStats.ts. Unrounded; round at display time.
        const knownPercentage = calculateCompletionPercentage(
          wordStatuses.map((w) => w.status as VocabularyStatus)
        );

        // Update text with calculated percentage
        await tx
          .update(texts)
          .set({
            knownPercentage,
            updatedAt: new Date(),
          })
          .where(eq(texts.id, textId));


        reportProgress(
          progressCallback,
          'inserting',
          95,
          `Calculated known percentage: ${Math.round(knownPercentage)}%`
        );

        // Step 13: Return Result (95-100%)
        const processingTime = Date.now() - startTime;

        reportProgress(progressCallback, 'complete', 100, 'Import complete');

        return {
          textId,
          wordCount,
          uniqueWordCount,
          knownPercentage,
          newWordsCreated,
          sentencesCreated: insertedSentences.length,
          processingTime,
        };
      });

      return result;
    } catch (error) {
      throw new TextProcessingError(
        `Database transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'inserting',
        error instanceof Error ? error : undefined
      );
    }
  } catch (error) {
    // Re-throw TextProcessingError as-is
    if (error instanceof TextProcessingError) {
      throw error;
    }

    // Wrap unexpected errors
    throw new TextProcessingError(
      `Unexpected error during text processing: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'tokenizing',
      error instanceof Error ? error : undefined
    );
  }
}

// ============================================================================
// Export: Re-process existing text content
// ============================================================================

export interface ReprocessResult {
  wordCount: number;
  uniqueWordCount: number;
  knownPercentage: number;
  processingTime: number;
}

/**
 * Re-run NLP on updated content for an existing text record.
 *
 * Deletes old sentences and word instances, then creates new ones from the
 * provided content. Existing word/lemma records are preserved (they are shared
 * across all texts in the language and carry the user's status data).
 */
export async function reprocessTextContent(
  textId: string,
  newContent: string,
  progressCallback: ProgressCallback | undefined,
  firstChangedParagraphIndex: number | undefined,
  userId: string
): Promise<ReprocessResult> {
  const startTime = Date.now();

  try {
    reportProgress(progressCallback, 'tokenizing', 0, 'Loading text configuration');

    const text = await db.query.texts.findFirst({
      where: eq(texts.id, textId),
    });

    if (!text) {
      throw new TextProcessingError(`Text not found: ${textId}`, 'tokenizing');
    }

    if (!newContent || newContent.trim().length === 0) {
      throw new TextProcessingError('Content cannot be empty', 'tokenizing');
    }

    const language = await db.query.languages.findFirst({
      where: eq(languages.id, text.languageId),
    });

    if (!language) {
      throw new TextProcessingError(`Language not found: ${text.languageId}`, 'tokenizing');
    }

    // Strip bracket annotations so stored content == what spaCy processes (position alignment)
    const processedContent = newContent.replace(/\[[^\]]*\]/g, '');

    // Compute the character offset of the first changed paragraph in processedContent.
    // Unchanged leading paragraphs have identical absolute positions — safe to skip.
    const paras = processedContent.split('\n\n');
    const firstChangedIdx = firstChangedParagraphIndex ?? 0;
    let firstChangedStart = 0;
    for (let i = 0; i < firstChangedIdx && i < paras.length; i++) {
      firstChangedStart += paras[i].length + 2; // +2 for '\n\n' separator
    }

    const nlpInput = firstChangedStart > 0
      ? processedContent.slice(firstChangedStart)
      : processedContent;

    const { wordTokens, lemmaResults, romanizations, sentenceData, uniqueCleanForms } =
      await runNLPPhase(nlpInput, language, progressCallback);

    // Shift spaCy positions to be absolute within processedContent
    for (const t of wordTokens) t.position += firstChangedStart;

    try {
      const result = await db.transaction(async (tx) => {
        reportProgress(progressCallback, 'querying_db', 65, 'Clearing old word data');

        // Delete word instances only for the changed region; unchanged leading paragraphs
        // have correct absolute positions and are preserved as-is.
        const instanceDeleteFilter = firstChangedStart > 0
          ? and(eq(wordInstances.textId, textId), gte(wordInstances.position, firstChangedStart))
          : eq(wordInstances.textId, textId);
        await tx.delete(wordInstances).where(instanceDeleteFilter);

        // Always delete sentences — we only have spaCy sentence data for the changed
        // portion. The sentenceId FK on word_instances is SET NULL, not cascade.
        await tx.delete(sentences).where(eq(sentences.textId, textId));

        reportProgress(progressCallback, 'querying_db', 68, 'Checking existing vocabulary');

        const uniqueLemmas = [...new Set(Array.from(lemmaResults.values()).map((r) => r.lemma))];

        const existingWords = await tx.query.words.findMany({
          where: and(
            eq(words.languageId, language.id),
            inArray(words.lemma, uniqueLemmas),
            eq(words.userId, userId),
          ),
        });

        const existingWordsMap = new Map(existingWords.map((w) => [w.lemma, w]));

        const newLemmas = uniqueLemmas.filter((lemma) => !existingWordsMap.has(lemma));

        if (newLemmas.length > 0) {
          const newWordsData: NewWord[] = newLemmas.map((lemma) => {
            const representativeResult = Array.from(lemmaResults.entries()).find(
              ([, result]) => result.lemma === lemma
            );
            const cleanForm = representativeResult?.[0];
            const romanization = cleanForm ? romanizations.get(cleanForm) : null;
            return {
              lemma,
              languageId: language.id,
              userId,
              status: 'UNKNOWN' as const,
              romanization,
              dictionaryFrequency: 0,
              userFrequency: 1,
            };
          });

          const insertedWords = await tx.insert(words).values(newWordsData).returning();
          insertedWords.forEach((word) => existingWordsMap.set(word.lemma, word));

          reportProgress(
            progressCallback,
            'inserting',
            75,
            `Created ${insertedWords.length} new vocabulary entries`
          );
        } else {
          reportProgress(progressCallback, 'inserting', 75, 'All words already exist in vocabulary');
        }

        const wordCount = wordTokens.length;
        const uniqueWordCount = uniqueCleanForms.length;

        await tx
          .update(texts)
          .set({ content: processedContent, wordCount, uniqueWordCount, updatedAt: new Date() })
          .where(eq(texts.id, textId));

        reportProgress(progressCallback, 'inserting', 80, 'Updated text content');

        const sentencesData: NewSentence[] = sentenceData.map((s) => ({
          textId,
          content: s.content,
          order: s.order,
        }));

        const insertedSentences = await tx.insert(sentences).values(sentencesData).returning();
        const sentenceIdMap = new Map(insertedSentences.map((s) => [s.order, s.id]));

        reportProgress(
          progressCallback,
          'inserting',
          85,
          `Created ${insertedSentences.length} sentences`
        );

        const wordInstancesData: NewWordInstance[] = wordTokens.map((token) => {
          const lemmaResult = lemmaResults.get(token.cleanForm)!;
          const word = existingWordsMap.get(lemmaResult.lemma)!;
          const sentenceId = sentenceIdMap.get(token.sentenceIndex);
          return {
            textId,
            wordId: word.id,
            sentenceId: sentenceId || null,
            surfaceForm: token.surfaceForm,
            position: token.position,
            pos: lemmaResult.pos !== 'X' ? lemmaResult.pos : null,
            inflectionData: lemmaResult.inflectionData as Record<string, unknown>,
          };
        });

        const INSTANCE_BATCH_SIZE = 500;
        for (let i = 0; i < wordInstancesData.length; i += INSTANCE_BATCH_SIZE) {
          const batch = wordInstancesData.slice(i, i + INSTANCE_BATCH_SIZE);
          await tx.insert(wordInstances).values(batch);
          const progress = 85 + Math.floor(7 * ((i + batch.length) / wordInstancesData.length));
          reportProgress(
            progressCallback,
            'inserting',
            progress,
            `Inserted ${i + batch.length} / ${wordInstancesData.length} word instances`
          );
        }

        reportProgress(progressCallback, 'inserting', 92, 'Calculating known percentage');

        const wordStatuses = await tx.query.words.findMany({
          where: and(
            eq(words.languageId, language.id),
            inArray(words.lemma, uniqueLemmas),
            eq(words.userId, userId),
          ),
          columns: { lemma: true, status: true },
        });

        // Completion % — see lib/utils/textStats.ts. Unrounded; round at display time.
        const knownPercentage = calculateCompletionPercentage(
          wordStatuses.map((w) => w.status as VocabularyStatus)
        );

        await tx
          .update(texts)
          .set({ knownPercentage, updatedAt: new Date() })
          .where(eq(texts.id, textId));

        reportProgress(progressCallback, 'complete', 100, 'Reprocess complete');

        return { wordCount, uniqueWordCount, knownPercentage, processingTime: Date.now() - startTime };
      });

      return result;
    } catch (error) {
      throw new TextProcessingError(
        `Database transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'inserting',
        error instanceof Error ? error : undefined
      );
    }
  } catch (error) {
    if (error instanceof TextProcessingError) throw error;
    throw new TextProcessingError(
      `Unexpected error during reprocessing: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'tokenizing',
      error instanceof Error ? error : undefined
    );
  }
}

// ============================================================================
// autoIgnoreProperNouns
// Sets UNKNOWN words tagged PROPN by spaCy to IGNORE for a set of just-imported
// texts. Runs synchronously before the import response so the count can be
// returned to the client. Pure SQL — no external API calls.
// ============================================================================

export async function autoIgnoreProperNouns(textIds: string[]): Promise<number> {
  if (textIds.length === 0) return 0;

  const propnWords = await db
    .select({ wordId: wordInstances.wordId })
    .from(wordInstances)
    .innerJoin(words, eq(wordInstances.wordId, words.id))
    .where(
      and(
        inArray(wordInstances.textId, textIds),
        eq(wordInstances.pos, 'PROPN'),
        eq(words.status, VocabularyStatus.UNKNOWN)
      )
    )
    .groupBy(wordInstances.wordId);

  if (propnWords.length === 0) return 0;

  const ids = propnWords.map((r) => r.wordId);
  await db
    .update(words)
    .set({ status: VocabularyStatus.IGNORE, updatedAt: new Date() })
    .where(inArray(words.id, ids));

  console.log(`[PROPN Auto-Ignore] Ignored ${ids.length} proper noun(s)`);
  return ids.length;
}
