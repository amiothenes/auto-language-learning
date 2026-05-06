/**
 * Romanization Service
 *
 * Main orchestrator for converting non-Latin scripts to Latin characters.
 * Provides caching, batch processing, and metadata for romanization operations.
 *
 * Supported languages:
 * - Chinese (Simplified/Traditional) → Pinyin
 * - Japanese (Hiragana/Katakana) → Romaji
 * - Arabic → Latin transliteration
 * - Russian (Cyrillic) → Latin
 * - Korean (Hangul) → Revised Romanization
 *
 * Latin-script languages (English, Spanish, French, German) return null.
 */

import type { RomanizeOptions, RomanizeResult, CacheStats } from './types';
import { LRUCache } from './cache';
import { getRomanizeHandler } from './romanizers';

// ============================================================================
// Cache Configuration
// ============================================================================

/**
 * Romanization cache (separate from lemmatization cache)
 *
 * Uses LRU (Least Recently Used) eviction policy.
 * Capacity: 10,000 entries (same as lemmatization cache).
 * Key format: "romanize:languageCode:text:options"
 */
const romanizeCache = new LRUCache<string, string | null>(10000);

// ============================================================================
// Core Romanization Functions
// ============================================================================

/**
 * Romanize text to Latin script
 *
 * Returns null for Latin-script languages (EN, ES, FR, DE).
 * Returns romanized string for non-Latin scripts.
 *
 * Performance:
 * - Cache hit: ~1ms
 * - Cache miss: 1-20ms depending on language and library
 * - Target: < 50ms per word (easily achieved)
 *
 * @param text - Text to romanize (word or phrase)
 * @param languageCode - ISO 639-1 language code
 * @param options - Optional romanization settings
 * @returns Romanized text or null
 *
 * @example
 * await romanize('你好', 'zh') // => 'nǐ hǎo'
 * await romanize('hello', 'en') // => null
 * await romanize('こんにちは', 'ja') // => 'konnichiwa'
 * await romanize('مرحبا', 'ar') // => 'mrhba'
 * await romanize('привет', 'ru') // => 'privet'
 * await romanize('안녕', 'ko') // => annyeong'
 */
export async function romanize(
  text: string,
  languageCode: string,
  options?: RomanizeOptions
): Promise<string | null> {
  // Handle empty input
  if (!text || text.trim().length === 0) {
    return null;
  }

  // Check cache first
  const cacheKey = getCacheKey(languageCode, text, options);
  const cached = romanizeCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // Get handler and romanize
  try {
    const handler = getRomanizeHandler(languageCode);
    const result = await handler.romanize(text, options);

    // Cache result (even if null for Latin scripts)
    romanizeCache.set(cacheKey, result);

    return result;
  } catch (error) {
    // Log error but don't throw - graceful degradation
    console.error(`Romanization failed for "${text}" (${languageCode}):`, error);
    return null;
  }
}

/**
 * Romanize batch of words
 *
 * Processes multiple words in parallel for better performance.
 * Each word is cached independently.
 *
 * @param words - Array of words to romanize
 * @param languageCode - ISO 639-1 language code (same for all words)
 * @param options - Optional romanization settings
 * @returns Array of romanized words (same order as input)
 *
 * @example
 * await romanizeBatch(['你好', '世界'], 'zh')
 * // => ['nǐ hǎo', 'shì jiè']
 */
export async function romanizeBatch(
  words: string[],
  languageCode: string,
  options?: RomanizeOptions
): Promise<(string | null)[]> {
  // Process all words in parallel
  return Promise.all(
    words.map(word => romanize(word, languageCode, options))
  );
}

/**
 * Romanize with metadata
 *
 * Returns romanization result along with metadata about
 * the script type and language.
 *
 * Useful for UI components that need to display additional
 * information about the romanization.
 *
 * @param text - Text to romanize
 * @param languageCode - ISO 639-1 language code
 * @param options - Optional romanization settings
 * @returns Romanization result with metadata
 *
 * @example
 * const result = await romanizeWithMetadata('你好', 'zh');
 * console.log(result);
 * // {
 * //   original: '你好',
 * //   romanized: 'nǐ hǎo',
 * //   scriptType: 'cjk',
 * //   languageCode: 'zh',
 * //   isMixed: false
 * // }
 */
export async function romanizeWithMetadata(
  text: string,
  languageCode: string,
  options?: RomanizeOptions
): Promise<RomanizeResult> {
  const handler = getRomanizeHandler(languageCode);
  const romanized = await romanize(text, languageCode, options);

  return {
    original: text,
    romanized,
    scriptType: handler.scriptType,
    languageCode,
    // TODO: Implement mixed script detection
    // For now, assume not mixed (future enhancement)
    isMixed: false
  };
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Generate cache key for romanization
 *
 * Format: "romanize:languageCode:text:options"
 * - Separate namespace from lemmatization cache
 * - Lowercase text for case-insensitive caching
 * - Serialize options to handle different settings
 *
 * @param languageCode - ISO 639-1 language code
 * @param text - Text to romanize
 * @param options - Optional romanization settings
 * @returns Cache key string
 */
function getCacheKey(
  languageCode: string,
  text: string,
  options?: RomanizeOptions
): string {
  const optionsKey = options ? JSON.stringify(options) : '';
  return `romanize:${languageCode}:${text.toLowerCase()}:${optionsKey}`;
}

/**
 * Get romanization cache statistics
 *
 * Returns metrics about cache performance including
 * size, hits, misses, and hit rate.
 *
 * @returns Cache statistics
 *
 * @example
 * const stats = getRomanizeCacheStats();
 * console.log(stats);
 * // {
 * //   size: 1234,
 * //   maxSize: 10000,
 * //   hits: 8500,
 * //   misses: 3200,
 * //   hitRate: 0.727
 * // }
 */
export function getRomanizeCacheStats(): CacheStats {
  return romanizeCache.getStats();
}

/**
 * Clear romanization cache
 *
 * Removes all cached romanization results.
 * Useful for debugging or when switching languages.
 *
 * Note: Does not affect lemmatization cache.
 *
 * @example
 * clearRomanizeCache();
 * console.log(getRomanizeCacheStats().size); // => 0
 */
export function clearRomanizeCache(): void {
  romanizeCache.clear();
}
