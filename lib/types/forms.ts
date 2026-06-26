/**
 * Form data type definitions for modals.
 *
 * Defines the data structures for form inputs across all creation and import modals.
 * These types represent the shape of data being collected from users, not persisted data.
 */

import { VocabularyStatus } from './vocabulary';

// ============================================================================
// Series Form Types
// ============================================================================

/**
 * Data for creating a new series.
 *
 * Used by NewSeriesModal to collect series information and optionally import texts.
 * The texts field is populated if the user completes Step 2 (optional text import).
 */
export interface NewSeriesData {
  /** Series name (1-100 chars) */
  name: string;
  /** Brief description of the series (optional, max 500 chars) */
  description?: string;
  /** Optional texts imported during series creation (from Step 2) */
  texts?: ImportedTextData[];
}

// ============================================================================
// Text Form Types
// ============================================================================

/**
 * Data for creating a single new text.
 *
 * Used by NewTextModal to add one text to a series.
 */
export interface NewTextData {
  /** Text title (1-200 chars) */
  title: string;
  /** Full text content (min 10 chars) */
  content: string;
  /** ID of the series to add this text to */
  seriesId: string;
  /** Optional user-defined tags (max 10 tags, each max 30 chars) */
  tags: string[];
}

/**
 * Data for an imported text (from file or bulk paste).
 *
 * Used by ImportTextsModal and NewSeriesModal (Step 2) to represent
 * a text extracted from a file or bulk paste operation.
 */
export interface ImportedTextData {
  /** Text title (extracted from filename or user-edited) */
  title: string;
  /** Full text content */
  content: string;
  /** Optional tags (from CSV/JSON metadata) */
  tags?: string[];
  /** Source URL when text was imported via URL fetch */
  sourceURI?: string;
}

// ============================================================================
// Vocabulary Form Types
// ============================================================================

/**
 * Data for creating a single new vocabulary item.
 *
 * Used by AddVocabularyModal for manual vocabulary entry.
 */
export interface NewVocabularyData {
  /** Lemma (root word form, 1-100 chars) */
  lemma: string;
  /** Translation in user's native language (1-200 chars) */
  translation: string;
  /** Learning status (defaults to NEWLY_SEEN) */
  status: VocabularyStatus;
  /** Optional dictionary frequency (0-100) */
  dictionaryFrequency?: number;
  /** Optional user-defined tags (max 10 tags, each max 30 chars) */
  tags: string[];
}

/**
 * Merge strategy for vocabulary imports.
 *
 * Determines how to handle duplicate lemmas when importing vocabulary.
 * - 'skip': Skip items with duplicate lemmas (keep existing)
 * - 'update': Update existing items with new data from import
 * - 'replace': Replace all existing vocabulary with imported data
 */
export type MergeStrategy = 'skip' | 'update' | 'replace';

/**
 * Data for bulk vocabulary import.
 *
 * Not used as form data directly, but as the result of parsing CSV/JSON files
 * in ImportVocabularyModal. Each item represents a row from the import file.
 */
export interface ImportedVocabularyData {
  /** Lemma (required) */
  lemma: string;
  /** Translation (required) */
  translation: string;
  /** Optional status (defaults to NEWLY_SEEN if not provided) */
  status?: VocabularyStatus;
  /** Optional dictionary frequency (0-100) */
  dictionaryFrequency?: number;
  /** Optional tags */
  tags?: string[];
}
