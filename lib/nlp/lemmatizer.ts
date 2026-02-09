/**
 * Lemmatizer - Main NLP Orchestrator
 *
 * Combines POS tagging (Transformers.js) with language-specific
 * lemmatization rules to provide accurate lemma extraction.
 *
 * **Pipeline:**
 * 1. Check cache for previously processed words
 * 2. Run POS tagging via Transformers.js
 * 3. Route to language-specific handler
 * 4. Apply lemmatization rules based on POS + morphology
 * 5. Cache results for future lookups
 *
 * **Performance:**
 * - Cache hit: ~1ms
 * - Cache miss: ~50-150ms (POS tagging + lemmatization)
 * - Target: < 100ms per word with 70%+ cache hit rate
 */

import { tagPOS, tagPOSBatch } from './pos-tagger';
import { getLanguageHandler, isLanguageSupported } from './language-handlers';
import {
  getCachedLemma,
  cacheLemma,
  createCacheKey,
  getCacheStats,
} from './cache';
import type {
  LemmatizeResult,
  LemmatizeBatchRequest,
  LemmatizeBatchResponse,
} from './types';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build inflection data from morphological features
 *
 * Converts POS tagger morphological features into structured
 * inflection data for database storage.
 *
 * @param morphFeatures - Raw morphological features from POS tagger
 * @returns Structured inflection data
 */
function buildInflectionData(
  morphFeatures: Record<string, string>
): LemmatizeResult['inflectionData'] {
  return {
    tense: morphFeatures.tense,
    mood: morphFeatures.mood,
    person: morphFeatures.person,
    number: morphFeatures.number,
    gender: morphFeatures.gender,
    case: morphFeatures.case,
    voice: morphFeatures.voice,
    aspect: morphFeatures.aspect,
    ...morphFeatures, // Include any additional features
  };
}

// ============================================================================
// Single Word Lemmatization
// ============================================================================

/**
 * Lemmatize a single word
 *
 * **Process:**
 * 1. Normalize word (lowercase)
 * 2. Check cache
 * 3. If not cached:
 *    a. Run POS tagging (Transformers.js)
 *    b. Get language handler
 *    c. Apply lemmatization rules
 *    d. Cache result
 * 4. Return lemma + metadata
 *
 * @param word - Surface form to lemmatize
 * @param languageCode - ISO 639-1 language code (e.g., 'en', 'es')
 * @param context - Optional sentence context for disambiguation (future use)
 * @returns Lemmatization result with lemma, POS, inflection data, confidence
 *
 * @example
 * const result = await lemmatizeWord('running', 'en');
 * // => {
 * //   lemma: 'run',
 * //   pos: 'VERB',
 * //   inflectionData: { tense: 'present', aspect: 'progressive' },
 * //   confidence: 0.95
 * // }
 *
 * @example
 * const result = await lemmatizeWord('corrieron', 'es');
 * // => {
 * //   lemma: 'correr',
 * //   pos: 'VERB',
 * //   inflectionData: { tense: 'past', number: 'plural', person: '3' },
 * //   confidence: 0.95
 * // }
 */
export async function lemmatizeWord(
  word: string,
  languageCode: string,
  context?: string
): Promise<LemmatizeResult> {
  // Normalize word
  const normalizedWord = word.trim();

  if (!normalizedWord) {
    throw new Error('Word cannot be empty');
  }

  // Check cache
  const cached = getCachedLemma(languageCode, normalizedWord);
  if (cached) {
    return cached;
  }

  // Run POS tagging
  const posResults = await tagPOS([normalizedWord], languageCode);
  const posResult = posResults[0];

  if (!posResult) {
    // Fallback if POS tagging fails
    const fallbackResult: LemmatizeResult = {
      lemma: normalizedWord.toLowerCase(),
      pos: 'X',
      inflectionData: {},
      confidence: 0,
    };
    cacheLemma(languageCode, normalizedWord, fallbackResult);
    return fallbackResult;
  }

  // Get language handler
  const handler = getLanguageHandler(languageCode);
  const isSupported = isLanguageSupported(languageCode);

  // Apply lemmatization rules
  const lemma = await handler.lemmatize(
    normalizedWord,
    posResult.pos,
    posResult.morphFeatures
  );

  // Build result
  const result: LemmatizeResult = {
    lemma,
    pos: posResult.pos,
    inflectionData: buildInflectionData(posResult.morphFeatures),
    confidence: isSupported ? 0.95 : 0, // 0 confidence if using fallback
  };

  // Cache result
  cacheLemma(languageCode, normalizedWord, result);

  return result;
}

// ============================================================================
// Batch Lemmatization
// ============================================================================

/**
 * Lemmatize multiple words in batch
 *
 * More efficient than calling lemmatizeWord() multiple times.
 * Processes words in batches of 50 for optimal performance.
 *
 * @param request - Batch request with words, language code, optional contexts
 * @returns Batch response with results, cache hit rate, processing time
 *
 * @example
 * const response = await lemmatizeBatch({
 *   words: ['running', 'quickly', 'jumped'],
 *   languageCode: 'en'
 * });
 * // => {
 * //   results: [
 * //     { lemma: 'run', pos: 'VERB', ... },
 * //     { lemma: 'quick', pos: 'ADV', ... },
 * //     { lemma: 'jump', pos: 'VERB', ... }
 * //   ],
 * //   cacheHitRate: 0.33,
 * //   processingTime: 120
 * // }
 */
export async function lemmatizeBatch(
  request: LemmatizeBatchRequest
): Promise<LemmatizeBatchResponse> {
  const { words, languageCode, contexts } = request;
  const startTime = Date.now();

  if (words.length === 0) {
    return {
      results: [],
      cacheHitRate: 0,
      processingTime: 0,
    };
  }

  // Track cache hits
  const initialStats = getCacheStats();

  // Separate cached and uncached words
  const cachedResults: (LemmatizeResult | null)[] = [];
  const uncachedIndices: number[] = [];
  const uncachedWords: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i].trim();
    const cached = getCachedLemma(languageCode, word);

    if (cached) {
      cachedResults[i] = cached;
    } else {
      cachedResults[i] = null;
      uncachedIndices.push(i);
      uncachedWords.push(word);
    }
  }

  // Process uncached words
  if (uncachedWords.length > 0) {
    // Run batch POS tagging
    const posResults = await tagPOSBatch(uncachedWords, languageCode);
    const handler = getLanguageHandler(languageCode);
    const isSupported = isLanguageSupported(languageCode);

    // Lemmatize each uncached word
    for (let i = 0; i < uncachedWords.length; i++) {
      const word = uncachedWords[i];
      const posResult = posResults[i];
      const originalIndex = uncachedIndices[i];

      if (!posResult) {
        // Fallback if POS tagging fails
        const fallbackResult: LemmatizeResult = {
          lemma: word.toLowerCase(),
          pos: 'X',
          inflectionData: {},
          confidence: 0,
        };
        cachedResults[originalIndex] = fallbackResult;
        cacheLemma(languageCode, word, fallbackResult);
        continue;
      }

      // Apply lemmatization rules
      const lemma = await handler.lemmatize(
        word,
        posResult.pos,
        posResult.morphFeatures
      );

      // Build result
      const result: LemmatizeResult = {
        lemma,
        pos: posResult.pos,
        inflectionData: buildInflectionData(posResult.morphFeatures),
        confidence: isSupported ? 0.95 : 0,
      };

      cachedResults[originalIndex] = result;
      cacheLemma(languageCode, word, result);
    }
  }

  // Calculate cache hit rate for this batch
  const finalStats = getCacheStats();
  const batchHits = finalStats.hits - initialStats.hits;
  const batchTotal = words.length;
  const cacheHitRate = batchTotal > 0 ? batchHits / batchTotal : 0;

  const processingTime = Date.now() - startTime;

  return {
    results: cachedResults as LemmatizeResult[], // All null values filled
    cacheHitRate,
    processingTime,
  };
}

/**
 * Convenience function for batch lemmatization with simple arrays
 *
 * @param words - Array of words to lemmatize
 * @param languageCode - ISO 639-1 language code
 * @returns Array of lemmatization results
 *
 * @example
 * const results = await lemmatizeWords(['running', 'quickly'], 'en');
 * // => [
 * //   { lemma: 'run', pos: 'VERB', ... },
 * //   { lemma: 'quick', pos: 'ADV', ... }
 * // ]
 */
export async function lemmatizeWords(
  words: string[],
  languageCode: string
): Promise<LemmatizeResult[]> {
  const response = await lemmatizeBatch({
    words,
    languageCode,
  });

  return response.results;
}
