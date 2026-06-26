/**
 * API request and response type definitions for Auto-Language-Learning backend
 */

import type { Series, SeriesDetail, TextData } from './content';
import type { VocabularyStatus } from './vocabulary';
import type { TranslationMeaning, TranslationSource } from '../db/schema/wordTranslations';

// ============================================================================
// Text Import API
// ============================================================================

/**
 * Request payload for POST /api/texts/import
 */
export interface ImportTextRequest {
  /** Title of the text (1-200 characters) */
  title: string;

  /** Full text content (minimum 10 characters) */
  content: string;

  /** Language code (e.g. 'es', 'fr', 'ru') — looked up to resolve DB id */
  languageCode: string;

  /** Optional series ID (foreign key to series table) */
  seriesId?: string;

  /** Optional array of tag names (create if new, max 10 tags) */
  tags?: string[];

  /** Source URL when text was imported from a web page — saved to texts.sourceURI on first chunk */
  sourceURI?: string;
}

/**
 * Response for successful text import
 */
export interface ImportTextResponse {
  success: true;

  /** The series used (auto-created if no seriesId was in the request) */
  seriesId: string;

  /** All created text pages (1 for short texts, N for auto-split long texts) */
  texts: Array<{
    id: string;
    title: string;
    wordCount: number;
    uniqueWordCount: number;
    knownPercentage: number;
  }>;

  /** Processing statistics aggregated across all chunks */
  statistics: {
    newWordsCreated: number;
    sentencesCreated: number;
    processingTime: number;
  };

  /** Tags associated with the first text page */
  tags: Array<{ id: string; name: string }>;

  /** Number of UNKNOWN proper nouns auto-ignored during import */
  ignoredPropnCount: number;
}

/**
 * Error response for failed API requests
 */
export interface ApiErrorResponse {
  /** User-friendly error message */
  error: string;

  /** Technical details (dev mode only) */
  details?: string;

  /** Processing stage where error occurred */
  stage?: string;
}

// ============================================================================
// LWT Vocabulary Import API — POST /api/vocabulary/import-lwt
// ============================================================================

export interface ImportLwtResponse {
  imported: number;
  skipped: number;
  errors: string[];
}

// ============================================================================
// Languages API
// ============================================================================

export interface LanguageItem {
  id: string;
  code: string;
  name: string;
  isRTL: boolean;
  dictURI: string | null;
  googleTTSCode: string | null;
  includeForeignScript: boolean;
}

export interface LanguagesListResponse {
  languages: LanguageItem[];
}

export interface CreateLanguageRequest {
  name: string;
  code: string;
  isRTL?: boolean;
  dictURI?: string;
  googleTTSCode?: string;
  includeForeignScript?: boolean;
}

export interface CreateLanguageResponse {
  language: LanguageItem;
}

export interface UpdateLanguageRequest {
  dictURI?: string | null;
  googleTTSCode?: string | null;
  isRTL?: boolean;
  includeForeignScript?: boolean;
}

export interface UpdateLanguageResponse {
  language: LanguageItem;
}

// ============================================================================
// Texts List API  — GET /api/texts
// ============================================================================

export interface TextListItem {
  id: string;
  title: string;
  wordCount: number;
  uniqueWordCount: number;
  knownPercentage: number;
  /** Human-readable last viewed timestamp (e.g. "2 days ago") */
  lastRead: string;
  /** First ~150 characters of the text content */
  preview: string;
  seriesId: string | null;
  seriesName: string | null;
  tags: string[];
  /** ISO timestamp of when the text was imported */
  createdAt: string;
}

export interface TextsListResponse {
  texts: TextListItem[];
  total: number;
}

// ============================================================================
// Text Detail API — GET /api/texts/[id]
// ============================================================================

/** Reuses TextData from content.ts */
export interface TextDetailResponse {
  text: TextData;
}

// ============================================================================
// Word Instances API — GET /api/texts/[id]/word-instances
// ============================================================================

export interface WordInstanceItem {
  /** word_instances.id */
  instanceId: string;
  /** words.id (the lemma record) */
  wordId: string;
  /** Actual form in the text (e.g. "corrieron") */
  surface: string;
  /** Root lemma form — source of truth (e.g. "correr") */
  lemma: string;
  /** Part of speech */
  pos: string | null;
  /** Translation in user's native language */
  translation: string | null;
  /** Romanization for non-latin scripts */
  romanization: string | null;
  /** How common in the language (0–100, NOT encounter count) */
  dictionaryFrequency: number;
  /** User's total encounter count for this lemma */
  userFrequency: number;
  /** Current learning status */
  status: VocabularyStatus;
  /** Position in the text (0-indexed) for rendering order */
  position: number;
  /** Sentence this instance belongs to (nullable) */
  sentenceId: string | null;
  /** Grammatical inflection metadata from NLP */
  inflectionData: Record<string, unknown> | null;
  /** All possible meanings grouped by POS (lemma-level, from auto-translation) */
  meanings: TranslationMeaning[] | null;
  /** Example sentence in the source language */
  exampleSentence: string | null;
  /** Example sentence translated into the user's target language */
  exampleSentenceTranslation: string | null;
  /** Which service provided the translation */
  translationSource: TranslationSource | null;
}

export interface WordInstancesResponse {
  textId: string;
  instances: WordInstanceItem[];
}

// ============================================================================
// Series List API — GET /api/series
// ============================================================================

/** Reuses Series from content.ts */
export interface SeriesListResponse {
  series: Series[];
}

// ============================================================================
// Series Detail API — GET /api/series/[id]
// ============================================================================

/** Reuses SeriesDetail from content.ts */
export interface SeriesDetailResponse {
  series: SeriesDetail;
}

// ============================================================================
// Reader Last Position API — GET /api/reader/last-position
// ============================================================================

export interface LastPositionResponse {
  textId: string;
  textTitle: string;
  seriesName: string;
  paragraphIndex: number;
  totalParagraphs: number;
  knownPercentage: number;
  lastReadAt: string;
}

// ============================================================================
// Stats API — GET /api/stats
// ============================================================================

export interface StatsResponse {
  vocabulary: {
    total: number;
    unknown: number;
    newlySeen: number;
    familiar: number;
    known: number;
    wellKnown: number;
    ignored: number;
  };
  texts: {
    total: number;
    /** Texts that have been opened at least once (lastViewedAt not null) */
    read: number;
  };
  /** Percentage of total vocabulary that is KNOWN or WELL_KNOWN */
  overallKnownPercentage: number;
  /** Zipf-weighted estimated reading coverage of the full language vocabulary (0-98) */
  readingCoverage: number;
  /** Approximate CEFR band based on readingCoverage */
  cefrBand: CefrBand;
  /** Consecutive calendar days (UTC) with at least one text viewed */
  streak: number;
}

// ============================================================================
// Reading Coverage types
// ============================================================================

export type CefrBand = 'A1-A2' | 'A2-B1' | 'B1-B2' | 'C1' | 'C2';

// ============================================================================
// Stats History API — GET /api/stats/history
// ============================================================================

export interface StatsHistoryPoint {
  date: string;
  knownCount: number;
  totalReviewed: number;
}

export interface StatsHistoryResponse {
  history: StatsHistoryPoint[];
}

// ============================================================================
// URL Fetch API — POST /api/texts/fetch-url
// ============================================================================

export interface FetchUrlRequest {
  url: string;
}

export interface FetchUrlResponse {
  /** Extracted article title from Readability (or hostname fallback) */
  title: string;
  /** Extracted plain-text content */
  content: string;
  /** Final URL after any redirects */
  resolvedUrl: string;
  /**
   * BCP-47 lang code read from <html lang=""> BEFORE Readability runs —
   * Readability strips the html element so this must be captured first.
   * Empty string if the attribute was absent.
   */
  detectedLang: string;
}
