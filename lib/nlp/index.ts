/**
 * NLP Module - Public API
 *
 * Multilingual lemmatization, tokenization, romanization, and POS tagging
 * using Transformers.js with Universal Dependencies patterns.
 *
 * **Main Functions:**
 * - `lemmatizeWord()` - Lemmatize a single word
 * - `lemmatizeBatch()` - Lemmatize multiple words efficiently
 * - `tokenizeText()` - Split text into tokens with position metadata
 * - `romanize()` - Romanize non-Latin scripts (Chinese, Japanese, Arabic, Russian, Korean)
 *
 * **Performance:**
 * - Lemmatization: < 100ms per word (with cache)
 * - Tokenization: < 500ms for 5000-word text
 * - Romanization: < 50ms per word (with cache)
 * - Cache hit rate: 70%+ on repeated text
 *
 * @example
 * import { lemmatizeWord, tokenizeText, romanize } from '@/lib/nlp';
 *
 * // Lemmatize a single word
 * const result = await lemmatizeWord('running', 'en');
 * console.log(result.lemma); // 'run'
 *
 * // Tokenize text
 * const tokens = await tokenizeText('Hello world!', { languageCode: 'en' });
 * console.log(tokens.length); // 2
 *
 * // Romanize non-Latin text
 * const romanized = await romanize('你好', 'zh');
 * console.log(romanized); // 'nǐ hǎo'
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

export {
  romanize,
  romanizeBatch,
  romanizeWithMetadata,
  getRomanizeCacheStats,
  clearRomanizeCache,
} from './romanizer';

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

  // Romanization types
  RomanizeHandler,
  RomanizeOptions,
  RomanizeResult,
  ScriptType,

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

export {
  detectScriptType,
  isMixedScript,
  requiresRomanization,
} from './utils/script-detector';

export {
  isRomanizationSupported,
  getSupportedRomanizations,
} from './romanizers';

// ============================================================================
// Text Processing
// ============================================================================

export {
  processTextForImport,
  TextProcessingError,
} from './textProcessor';

export type {
  ProgressUpdate,
  ProcessedTextResult,
  ProgressStage,
  ProgressCallback,
} from './textProcessor';
