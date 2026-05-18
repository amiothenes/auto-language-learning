/**
 * NLP Module - Public API
 *
 * Uses spaCy via FastAPI microservice for tokenization, lemmatization, and POS tagging.
 * Romanization handled locally via language-specific libraries.
 */

// ============================================================================
// Tokenization (kept for quick stats/preview — not used in import pipeline)
// ============================================================================

export {
  tokenizeText,
  quickTokenize,
  getWordCount,
  getUniqueWordCount,
} from './tokenizer';

// ============================================================================
// Romanization
// ============================================================================

export {
  romanize,
  romanizeBatch,
  romanizeWithMetadata,
  getRomanizeCacheStats,
  clearRomanizeCache,
} from './romanizer';

// ============================================================================
// spaCy client
// ============================================================================

export { processWithSpacy } from './spacyClient';
export type { SpacyToken, SpacySentence, SpacyResult } from './spacyClient';

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Tokenization types
  Token,
  TokenizeOptions,

  // Lemmatization types (type still used by textProcessor internally)
  LemmatizeResult,

  // Romanization types
  RomanizeHandler,
  RomanizeOptions,
  RomanizeResult,
  ScriptType,
} from './types';

// ============================================================================
// Utilities
// ============================================================================

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
