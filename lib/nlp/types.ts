/**
 * Type definitions for NLP services
 *
 * This module defines the core interfaces for multilingual lemmatization,
 * tokenization, and POS tagging using Transformers.js with Universal
 * Dependencies-informed linguistic analysis.
 */

// ============================================================================
// Tokenization Types
// ============================================================================

/**
 * Options for text tokenization
 */
export interface TokenizeOptions {
  /** ISO 639-1 language code (e.g., 'en', 'es', 'fr') */
  languageCode: string;

  /** Language-specific regex for sentence splitting (from database) */
  sentenceSplitRegex?: string;

  /** Character substitutions for normalization (e.g., Spanish accents) */
  characterSubstitutions?: Record<string, string>;

  /** Whether language is right-to-left (Arabic, Hebrew) */
  isRTL?: boolean;

  /** Whether to preserve whitespace characters in output */
  preserveWhitespace?: boolean;

  /** Whether to include punctuation as separate tokens */
  includePunctuation?: boolean;
}

/**
 * Individual token from text with position metadata
 *
 * Represents a word or punctuation mark extracted from text,
 * with sufficient metadata to reconstruct the original text
 * and map tokens back to their source positions.
 */
export interface Token {
  /** Original token as it appears in text (with punctuation) */
  surfaceForm: string;

  /** Normalized form (lowercase, no punctuation) for processing */
  cleanForm: string;

  /** Character offset from start of text (0-indexed) */
  position: number;

  /** Sentence index (0-indexed) */
  sentenceIndex: number;

  /** Token index within sentence (0-indexed) */
  tokenIndex: number;

  /** Whether this is a word (true) or punctuation/whitespace (false) */
  isWord: boolean;

  /** Whether this token is a contraction (e.g., "don't") */
  isContraction?: boolean;

  /** Sub-tokens if this is a contraction (e.g., ["do", "n't"]) */
  subTokens?: string[];

  /** Romanized form for non-Latin scripts (null if Latin script) */
  romanization?: string | null;
}

// ============================================================================
// POS Tagging Types
// ============================================================================

/**
 * Result from POS tagging a single word
 *
 * Includes part-of-speech tag and morphological features
 * as extracted from Transformers.js token classification model.
 */
export interface POSTagResult {
  /** Universal Dependencies POS tag (NOUN, VERB, ADJ, etc.) */
  pos: string;

  /** Morphological features (tense, case, gender, number, etc.) */
  morphFeatures: Record<string, string>;

  /** Confidence score from model (0-1) */
  confidence: number;
}

// ============================================================================
// Lemmatization Types
// ============================================================================

/**
 * Result from lemmatizing a single word
 *
 * Contains the lemma (root form), POS tag, inflection metadata,
 * and confidence score for accuracy monitoring.
 */
export interface LemmatizeResult {
  /** Root form of the word (e.g., "run" for "running") */
  lemma: string;

  /** Universal Dependencies POS tag */
  pos: string;

  /** Grammatical inflection metadata */
  inflectionData: {
    /** Verb tense (present, past, future, etc.) */
    tense?: string;

    /** Verb mood (indicative, subjunctive, imperative, etc.) */
    mood?: string;

    /** Person (1st, 2nd, 3rd) */
    person?: string;

    /** Number (singular, plural) */
    number?: string;

    /** Gender (masculine, feminine, neuter) */
    gender?: string;

    /** Case (nominative, accusative, genitive, etc.) */
    case?: string;

    /** Voice (active, passive) */
    voice?: string;

    /** Aspect (perfective, imperfective, progressive, etc.) */
    aspect?: string;

    /** Additional language-specific features */
    [key: string]: unknown;
  };

  /** Confidence score (0-1) for monitoring accuracy */
  confidence: number;
}

// ============================================================================
// Language Handler Interface
// ============================================================================

/**
 * Interface for language-specific lemmatization handlers
 *
 * Each language implements its own lemmatization rules based on
 * Universal Dependencies patterns and morphological features.
 */
export interface LanguageHandler {
  /** ISO 639-1 language code this handler supports */
  readonly code: string;

  /** Human-readable language name */
  readonly name: string;

  /**
   * Lemmatize a word based on POS tag and morphological features
   *
   * @param word - Surface form to lemmatize
   * @param pos - Universal Dependencies POS tag
   * @param morphFeatures - Morphological features from POS tagger
   * @returns Lemmatized root form
   */
  lemmatize(
    word: string,
    pos: string,
    morphFeatures: Record<string, string>
  ): Promise<string>;

  /**
   * Optional custom tokenizer for languages with special requirements
   * (e.g., Chinese/Japanese word segmentation)
   */
  tokenize?(text: string): Promise<Token[]>;
}

// ============================================================================
// Batch Processing Types
// ============================================================================

/**
 * Batch lemmatization request
 */
export interface LemmatizeBatchRequest {
  /** Words to lemmatize */
  words: string[];

  /** Language code for all words */
  languageCode: string;

  /** Optional sentence context for each word (for disambiguation) */
  contexts?: string[];
}

/**
 * Batch lemmatization response
 */
export interface LemmatizeBatchResponse {
  /** Lemmatization results in same order as input */
  results: LemmatizeResult[];

  /** Cache hit rate for this batch (0-1) */
  cacheHitRate: number;

  /** Processing time in milliseconds */
  processingTime: number;
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Cache key for lemmatization lookups
 */
export type CacheKey = `${string}:${string}`; // Format: "languageCode:cleanWord"

/**
 * LRU Cache statistics
 */
export interface CacheStats {
  /** Current number of entries in cache */
  size: number;

  /** Maximum cache capacity */
  maxSize: number;

  /** Total cache hits */
  hits: number;

  /** Total cache misses */
  misses: number;

  /** Cache hit rate (0-1) */
  hitRate: number;
}

// ============================================================================
// Romanization Types
// ============================================================================

/**
 * Script type for a language
 */
export type ScriptType = 'latin' | 'cjk' | 'arabic' | 'cyrillic' | 'hangul';

/**
 * Romanization options
 */
export interface RomanizeOptions {
  /** Include tone marks for Chinese (default: true) */
  includeTones?: boolean;

  /** Preserve whitespace in output (default: false) */
  preserveWhitespace?: boolean;
}

/**
 * Result from romanizing text
 *
 * Contains the romanized version along with metadata about
 * the script type and whether mixed scripts were detected.
 */
export interface RomanizeResult {
  /** Original text */
  original: string;

  /** Romanized text (null if Latin script) */
  romanized: string | null;

  /** Script type detected */
  scriptType: ScriptType;

  /** Language code */
  languageCode: string;

  /** Whether text contains mixed scripts */
  isMixed?: boolean;
}

/**
 * Interface for language-specific romanization handlers
 *
 * Each language implements its own romanization rules based on
 * standard romanization systems (e.g., Pinyin for Chinese,
 * Revised Romanization for Korean).
 */
export interface RomanizeHandler {
  /** ISO 639-1 language code this handler supports */
  readonly code: string;

  /** Human-readable language name */
  readonly name: string;

  /** Primary script type for this language */
  readonly scriptType: ScriptType;

  /**
   * Romanize text to Latin script
   *
   * @param text - Text to romanize
   * @param options - Optional romanization settings
   * @returns Romanized text, or null if already Latin script
   */
  romanize(text: string, options?: RomanizeOptions): Promise<string | null>;
}
