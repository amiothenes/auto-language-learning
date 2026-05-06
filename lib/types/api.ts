/**
 * API request and response type definitions for Auto-Language-Learning backend
 */

import type { Series, SeriesDetail, TextData } from './content';
import type { VocabularyStatus } from './vocabulary';

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
}

/**
 * Response for successful text import
 */
export interface ImportTextResponse {
  success: true;

  /** Created text metadata */
  text: {
    id: string;
    title: string;
    wordCount: number;
    uniqueWordCount: number;
    knownPercentage: number;
  };

  /** Processing statistics */
  statistics: {
    newWordsCreated: number;
    sentencesCreated: number;
    processingTime: number;
  };

  /** Tags associated with the text */
  tags: Array<{ id: string; name: string }>;
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
// Languages API
// ============================================================================

export interface LanguageItem {
  id: string;
  code: string;
  name: string;
  isRTL: boolean;
}

export interface LanguagesListResponse {
  languages: LanguageItem[];
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
// Stats API — GET /api/stats
// ============================================================================

export interface StatsResponse {
  vocabulary: {
    total: number;
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
}
