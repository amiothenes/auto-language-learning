/**
 * Vocabulary and learning status type definitions.
 *
 * Auto-Language-Learning tracks vocabulary at the LEMMA level (root word form),
 * not surface forms. All statistics, progress calculations, and learning status
 * are tracked at the lemma level, never at the surface form level.
 */

// ============================================================================
// VocabularyStatus Enum
// ============================================================================

/**
 * Vocabulary learning status levels.
 *
 * Auto-Language-Learning tracks vocabulary at the LEMMA level (root form),
 * not surface forms. All statistics and progress calculations use lemmas.
 *
 * **Status Progression:**
 * ```
 * UNKNOWN → NEWLY_SEEN → FAMILIAR → KNOWN → WELL_KNOWN
 * ```
 *
 * **Special Statuses:**
 * - `UNKNOWN`: Word exists in DB but user has not reviewed it yet.
 *   Excluded from ALL stats calculations (neither numerator nor denominator).
 * - `IGNORE`: User manually excluded (proper nouns, names, etc.)
 *
 * **Visual Highlighting:**
 * - `UNKNOWN`: Neutral gray tint background
 * - `NEWLY_SEEN`: Red tint background
 * - `FAMILIAR`: Orange tint background
 * - `KNOWN`: Subtle green background
 * - `WELL_KNOWN`: No styling
 * - `IGNORE`: Dashed underline, reduced opacity
 */
export enum VocabularyStatus {
  /** Word exists in DB but user has not reviewed it yet — excluded from all stats */
  UNKNOWN = 'UNKNOWN',
  /** First encounter acknowledged by user */
  NEWLY_SEEN = 'NEWLY_SEEN',
  /** Seen multiple times, partially learned */
  FAMILIAR = 'FAMILIAR',
  /** Confidently understood */
  KNOWN = 'KNOWN',
  /** Mastered, no highlighting needed */
  WELL_KNOWN = 'WELL_KNOWN',
  /** User manually excluded (proper nouns, etc.) */
  IGNORE = 'IGNORE'
}

// ============================================================================
// WordData Interface
// ============================================================================

/**
 * Word data for a single lemma occurrence in a text.
 *
 * Represents an individual word in the reader, tracking both its surface form
 * (as it appears in the text) and its lemma (root form), which is the source
 * of truth for all vocabulary tracking and statistics.
 *
 * **CRITICAL DISTINCTIONS:**
 *
 * **Surface vs Lemma:**
 * - `surface`: The actual word form in the text (e.g., "habló", "running")
 * - `lemma`: The root form - source of truth (e.g., "hablar", "run")
 * - Statistics, status, and progress are tracked by LEMMA, not surface form
 *
 * **Frequency Types:**
 * - `dictionaryFrequency`: How common this word is in the language (0-100 scale)
 *   - Based on language corpus analysis
 *   - NOT an encounter count
 *   - Helps prioritize high-value vocabulary
 * - `userFrequency`: How many times the user has encountered this lemma (1+)
 *   - Increments each time the user sees this lemma in any text
 *   - Tracks personal exposure, not language commonality
 *
 * These two frequency metrics are NEVER merged or conflated.
 *
 * @example
 * ```typescript
 * const wordData: WordData = {
 *   id: 'w123',
 *   surface: 'corrieron', // Past tense, 3rd person plural
 *   lemma: 'correr',      // Infinitive form
 *   pos: 'verb',
 *   inflection: 'past, 3pl',
 *   translation: 'to run',
 *   dictionaryFrequency: 75,  // Common verb in Spanish
 *   userFrequency: 8,          // User has seen "correr" 8 times total
 *   status: VocabularyStatus.FAMILIAR
 * };
 * ```
 */
export type WordData = {
  /** Unique identifier for this word occurrence (instance ID) */
  id: string;
  /** Lemma-level word ID — used for status mutation API calls */
  wordId: string;
  /** Surface form displayed to user (e.g., "habló") */
  surface: string;
  /** Root lemma form - source of truth for all stats (e.g., "hablar") */
  lemma: string;
  /** Part of speech (verb, noun, adjective, etc.) */
  pos: string;
  /** Grammatical inflection info (past tense, plural, etc.) */
  inflection: string;
  /** Translation in user's native language */
  translation: string;
  /** How common in the language (0-100, NOT encounter count) */
  dictionaryFrequency: number;
  /** User's encounter count for this lemma (1+) */
  userFrequency: number;
  /** Current learning status */
  status: VocabularyStatus;
  /** Raw morphological features from spaCy — used by tooltip for collapsible "show more" */
  inflectionData?: Record<string, unknown> | null;
  /** Formatted relative date of first encounter (e.g. "3 days ago") */
  firstSeen?: string;
  /** All possible meanings grouped by POS from auto-translation (lemma-level, not context-specific) */
  meanings?: { pos: string; definitions: string[]; confidence: number }[] | null;
  /** Example sentence in the source language */
  exampleSentence?: string | null;
  /** Example sentence translated into the user's native language */
  exampleSentenceTranslation?: string | null;
}

// ============================================================================
// VocabularyItem Interface
// ============================================================================

/**
 * Vocabulary item for display in the vocabulary browser.
 *
 * Represents a lemma in the user's vocabulary list, with all associated
 * metadata for filtering, sorting, and display. Unlike `WordData`, which
 * represents a specific occurrence in a text, `VocabularyItem` represents
 * the lemma as an entry in the user's overall vocabulary.
 *
 * **Display Context:**
 * - Used in vocabulary table view (desktop)
 * - Used in vocabulary card view (mobile/tablet)
 * - Supports bulk selection and multi-select operations
 * - Filterable by status, searchable by lemma/translation
 *
 * **Lemma-Level Tracking:**
 * All fields represent aggregate data for the lemma across all texts,
 * not a specific occurrence in a single text.
 */
export type VocabularyItem = {
  /** Unique identifier for this vocabulary entry */
  id: string;
  /** Root lemma form (e.g., "hablar") */
  lemma: string;
  /** Current learning status for this lemma */
  status: VocabularyStatus;
  /** How common this lemma is in the language (0-100) */
  dictionaryFrequency: number;
  /** Total encounter count for this lemma across all texts (1+) */
  userFrequency: number;
  /** Translation in user's native language */
  translation: string;
  /** User-defined tags for categorization */
  tags: string[];
  /** Number of distinct texts this lemma appears in */
  textCount: number;
}
