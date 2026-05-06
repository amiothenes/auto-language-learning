/**
 * LRU Cache for NLP Results
 *
 * Implements a Least Recently Used cache to achieve < 100ms per-word
 * performance by caching lemmatization results. Cache hits return in ~1ms
 * vs 50-150ms for cold processing.
 *
 * Cache key format: `${languageCode}:${cleanWord.toLowerCase()}`
 * Example: "en:running" → { lemma: "run", pos: "VERB", ... }
 */

import type { LemmatizeResult, CacheKey, CacheStats } from './types';

// ============================================================================
// LRU Cache Implementation
// ============================================================================

/**
 * Generic LRU Cache with configurable size
 *
 * Uses Map to maintain insertion order. When cache is full,
 * removes the least recently used item (first entry in Map).
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private readonly maxSize: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize: number = 10000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get value from cache
   *
   * If found, moves item to end (most recently used).
   * Returns undefined if not found.
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);

    if (value !== undefined) {
      this.hits++;
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    } else {
      this.misses++;
    }

    return value;
  }

  /**
   * Set value in cache
   *
   * If key exists, updates value and moves to end.
   * If cache is full, removes least recently used item.
   */
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing: delete then re-add to move to end
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Cache full: delete least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, value);
  }

  /**
   * Check if key exists in cache
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Reset statistics counters (keeps cached data)
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

// ============================================================================
// Singleton Lemma Cache
// ============================================================================

/**
 * Global lemma cache singleton
 *
 * Stores up to 10,000 lemmatization results in memory.
 * Key format: "languageCode:cleanWord"
 * Example: "es:corrieron" → { lemma: "correr", pos: "VERB", ... }
 *
 * Cache persists across API requests for maximum performance.
 */
export const lemmaCache = new LRUCache<CacheKey, LemmatizeResult>(10000);

/**
 * Create a cache key from language code and word
 *
 * @param languageCode - ISO 639-1 language code
 * @param word - Word to cache (will be lowercased)
 * @returns Formatted cache key
 *
 * @example
 * createCacheKey('en', 'Running') // => 'en:running'
 * createCacheKey('es', 'Habló')   // => 'es:habló'
 */
export function createCacheKey(
  languageCode: string,
  word: string
): CacheKey {
  return `${languageCode}:${word.toLowerCase()}` as CacheKey;
}

/**
 * Get lemmatization result from cache
 *
 * @param languageCode - ISO 639-1 language code
 * @param word - Word to look up
 * @returns Cached result or undefined
 *
 * @example
 * const result = getCachedLemma('en', 'running');
 * if (result) {
 *   console.log(result.lemma); // 'run'
 * }
 */
export function getCachedLemma(
  languageCode: string,
  word: string
): LemmatizeResult | undefined {
  const key = createCacheKey(languageCode, word);
  return lemmaCache.get(key);
}

/**
 * Store lemmatization result in cache
 *
 * @param languageCode - ISO 639-1 language code
 * @param word - Word being cached
 * @param result - Lemmatization result to cache
 *
 * @example
 * cacheLemma('en', 'running', {
 *   lemma: 'run',
 *   pos: 'VERB',
 *   inflectionData: { tense: 'present', aspect: 'progressive' },
 *   confidence: 0.95
 * });
 */
export function cacheLemma(
  languageCode: string,
  word: string,
  result: LemmatizeResult
): void {
  const key = createCacheKey(languageCode, word);
  lemmaCache.set(key, result);
}

/**
 * Get cache statistics
 *
 * @returns Current cache stats including hit rate
 *
 * @example
 * const stats = getCacheStats();
 * console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
 */
export function getCacheStats(): CacheStats {
  return lemmaCache.getStats();
}

/**
 * Clear all cached lemmas
 *
 * Use this to force re-processing of all words,
 * for example after updating lemmatization rules.
 */
export function clearLemmaCache(): void {
  lemmaCache.clear();
}
