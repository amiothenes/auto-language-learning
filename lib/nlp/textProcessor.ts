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
} from '@/lib/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import {
  tokenizeText,
  lemmatizeBatch,
  romanizeBatch,
  requiresRomanization,
  type Token,
  type LemmatizeResult,
} from '@/lib/nlp';

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
  order?: number,
  progressCallback?: ProgressCallback
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

    const needsRomanization = requiresRomanization(language.code);

    // Step 2: Tokenization (5-15%)
    reportProgress(progressCallback, 'tokenizing', 5, 'Tokenizing text');

    let tokens: Token[];
    try {
      tokens = await tokenizeText(content, {
        languageCode: language.code,
        sentenceSplitRegex: language.sentenceSplitRegex || undefined,
        characterSubstitutions: (language.characterSubstitutions as Record<string, string>) || undefined,
        isRTL: language.isRTL,
      });
    } catch (error) {
      throw new TextProcessingError(
        `Tokenization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'tokenizing',
        error instanceof Error ? error : undefined
      );
    }

    // Filter to word tokens only (exclude punctuation)
    const wordTokens = tokens.filter((t) => t.isWord);

    if (wordTokens.length === 0) {
      throw new TextProcessingError(
        'No word tokens found in text (only punctuation)',
        'tokenizing'
      );
    }

    // Extract unique clean forms for lemmatization
    const uniqueCleanForms = [...new Set(wordTokens.map((t) => t.cleanForm))];

    reportProgress(
      progressCallback,
      'tokenizing',
      15,
      `Tokenized ${wordTokens.length} words (${uniqueCleanForms.length} unique)`
    );

    // Step 3: Batch Lemmatization (15-50%)
    const LEMMA_BATCH_SIZE = 50;
    const lemmaResults = new Map<string, LemmatizeResult>();

    try {
      for (let i = 0; i < uniqueCleanForms.length; i += LEMMA_BATCH_SIZE) {
        const batch = uniqueCleanForms.slice(i, i + LEMMA_BATCH_SIZE);

        const response = await lemmatizeBatch({
          words: batch,
          languageCode: language.code,
        });

        // Map cleanForm → LemmatizeResult
        batch.forEach((word, idx) => {
          lemmaResults.set(word, response.results[idx]);
        });

        // Report progress per batch
        const batchProgress = 15 + Math.floor(35 * ((i + batch.length) / uniqueCleanForms.length));
        reportProgress(
          progressCallback,
          'lemmatizing',
          batchProgress,
          `Lemmatized ${i + batch.length} / ${uniqueCleanForms.length} unique words`
        );
      }
    } catch (error) {
      throw new TextProcessingError(
        `Lemmatization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'lemmatizing',
        error instanceof Error ? error : undefined
      );
    }

    // Step 4: Batch Romanization (50-60%)
    const romanizations = new Map<string, string | null>();

    try {
      if (needsRomanization) {
        const romanizedResults = await romanizeBatch(uniqueCleanForms, language.code);

        uniqueCleanForms.forEach((word, idx) => {
          romanizations.set(word, romanizedResults[idx]);
        });

        reportProgress(
          progressCallback,
          'romanizing',
          60,
          `Romanized ${uniqueCleanForms.length} words`
        );
      } else {
        // Skip for Latin-script languages
        reportProgress(
          progressCallback,
          'romanizing',
          60,
          'Skipped romanization (Latin script)'
        );
      }
    } catch (error) {
      throw new TextProcessingError(
        `Romanization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'romanizing',
        error instanceof Error ? error : undefined
      );
    }

    // Step 5: Extract Sentences from Tokens (60-65%)
    reportProgress(progressCallback, 'romanizing', 63, 'Extracting sentences');

    // Group tokens by sentenceIndex
    const sentenceMap = new Map<number, Token[]>();
    wordTokens.forEach((token) => {
      if (!sentenceMap.has(token.sentenceIndex)) {
        sentenceMap.set(token.sentenceIndex, []);
      }
      sentenceMap.get(token.sentenceIndex)!.push(token);
    });

    // Extract sentence text from original content using token positions
    const sentenceData: Array<{
      content: string;
      order: number;
      tokens: Token[];
    }> = [];

    for (const [index, sentenceTokens] of sentenceMap) {
      const firstToken = sentenceTokens[0];
      const lastToken = sentenceTokens[sentenceTokens.length - 1];
      const sentenceStart = firstToken.position;
      const sentenceEnd = lastToken.position + lastToken.surfaceForm.length;

      sentenceData.push({
        content: content.slice(sentenceStart, sentenceEnd).trim(),
        order: index,
        tokens: sentenceTokens,
      });
    }

    // Sort by order
    sentenceData.sort((a, b) => a.order - b.order);

    reportProgress(
      progressCallback,
      'romanizing',
      65,
      `Extracted ${sentenceData.length} sentences`
    );

    // ========================================================================
    // PHASE 2: DATABASE OPERATIONS (Inside Transaction)
    // ========================================================================

    try {
      const result = await db.transaction(async (tx) => {
        // Step 6: Query Existing Words (65-70%)
        reportProgress(progressCallback, 'querying_db', 65, 'Checking existing vocabulary');

        // Get all unique lemmas from lemmatization results
        const uniqueLemmas = [...new Set(Array.from(lemmaResults.values()).map((r) => r.lemma))];

        // Batch query existing words (NOT N+1 queries)
        const existingWords = await tx.query.words.findMany({
          where: and(eq(words.languageId, languageId), inArray(words.lemma, uniqueLemmas)),
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
              status: 'NEWLY_SEEN' as const,
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
                inArray(words.lemma, existingLemmas)
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
            content,
            languageId,
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

        // Query word statuses for all unique lemmas in this text
        const wordStatuses = await tx.query.words.findMany({
          where: and(eq(words.languageId, languageId), inArray(words.lemma, uniqueLemmas)),
          columns: {
            lemma: true,
            status: true,
          },
        });

        // Count known words (KNOWN or WELL_KNOWN)
        const knownCount = wordStatuses.filter(
          (w) => w.status === 'KNOWN' || w.status === 'WELL_KNOWN'
        ).length;

        // Calculate percentage based on unique lemmas (NOT total word count)
        const knownPercentage =
          uniqueWordCount > 0 ? Math.round((knownCount / uniqueWordCount) * 100) : 0;

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
          `Calculated known percentage: ${knownPercentage}%`
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
