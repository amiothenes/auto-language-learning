/**
 * NLP Module - Public API
 *
 * Multilingual lemmatization, tokenization, and POS tagging
 * using Transformers.js with Universal Dependencies patterns.
 *
 * **Main Functions:**
 * - `lemmatizeWord()` - Lemmatize a single word
 * - `lemmatizeBatch()` - Lemmatize multiple words efficiently
 * - `tokenizeText()` - Split text into tokens with position metadata
 *
 * **Performance:**
 * - Lemmatization: < 100ms per word (with cache)
 * - Tokenization: < 500ms for 5000-word text
 * - Cache hit rate: 70%+ on repeated text
 *
 * @example
 * import { lemmatizeWord, tokenizeText } from '@/lib/nlp';
 *
 * // Lemmatize a single word
 * const result = await lemmatizeWord('running', 'en');
 * console.log(result.lemma); // 'run'
 *
 * // Tokenize text
 * const tokens = await tokenizeText('Hello world!', { languageCode: 'en' });
 * console.log(tokens.length); // 2
 */

// ============================================================================
// Core Functions
// ============================================================================

export {
  lemmatizeWord,
  lemmatizeBatch,
  lemmatizeWords,
} from './lemmatizer';

export {
  tokenizeText,
  quickTokenize,
  getWordCount,
  getUniqueWordCount,
} from './tokenizer';

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Tokenization types
  Token,
  TokenizeOptions,

  // Lemmatization types
  LemmatizeResult,
  LemmatizeBatchRequest,
  LemmatizeBatchResponse,

  // POS tagging types
  POSTagResult,

  // Language handler types
  LanguageHandler,

  // Cache types
  CacheKey,
  CacheStats,
} from './types';

// ============================================================================
// Utility Exports
// ============================================================================

export {
  getCacheStats,
  clearLemmaCache,
} from './cache';

export {
  isLanguageSupported,
  getSupportedLanguages,
} from './language-handlers';
