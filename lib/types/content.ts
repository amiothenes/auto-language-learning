/**
 * Content management type definitions.
 *
 * Defines the data structures for organizing and managing language learning content.
 * Content hierarchy: Series → Texts → Paragraphs → Words/Lemmas
 *
 * All content is scoped by language via LanguageContext.
 */

// ============================================================================
// Series Types
// ============================================================================

/**
 * Series - a collection of related texts.
 *
 * Series help organize texts by theme, source, difficulty level, or any other
 * logical grouping. Users can track their progress across an entire series.
 *
 * **Examples:**
 * - "Russian News Articles"
 * - "Spanish Short Stories"
 * - "French Poetry Collection"
 *
 * **Progress Calculation:**
 * Series progress is the average of `knownPercentage` across all texts in the series.
 */
export interface Series {
  /** Unique identifier for this series */
  id: string;
  /** Series name (e.g., "Russian News Articles") */
  name: string;
  /** Brief description of the series content */
  description: string;
  /** Number of texts in this series */
  textCount: number;
  /** Overall progress percentage (0-100) */
  progress: number;
  /** Human-readable last updated timestamp (e.g., "2 days ago") */
  lastUpdated: string;
}

/**
 * Detailed series information with all texts.
 *
 * Extended series data including the full list of texts in the series.
 * Used on the series detail page to display all texts and aggregate statistics.
 *
 * **Aggregate Statistics:**
 * - `totalWords`: Sum of word counts across all texts
 * - `overallProgress`: Average known percentage across all texts
 */
export interface SeriesDetail {
  /** Unique identifier for this series */
  id: string;
  /** Series name */
  name: string;
  /** Brief description of the series content */
  description: string;
  /** Number of texts in this series */
  textCount: number;
  /** Total word count across all texts */
  totalWords: number;
  /** Overall progress percentage (0-100) */
  overallProgress: number;
  /** Human-readable last updated timestamp */
  lastUpdated: string;
  /** Array of all texts in this series */
  texts: Text[];
}

// ============================================================================
// Text Types
// ============================================================================

/**
 * Text - a single piece of content within a series.
 *
 * Represents an individual article, story, poem, or other text that the user
 * can read. Each text belongs to a series and tracks vocabulary at the lemma level.
 *
 * **Word Counts:**
 * - `wordCount`: Total number of words (all occurrences)
 * - `uniqueWordCount`: Number of unique lemmas in the text
 *
 * **Progress Tracking:**
 * - `knownPercentage`: Percentage of unique lemmas marked as KNOWN or WELL_KNOWN
 */
export interface Text {
  /** Unique identifier for this text */
  id: string;
  /** Text title */
  title: string;
  /** Total word count (including duplicates) */
  wordCount: number;
  /** Number of unique lemmas in the text */
  uniqueWordCount: number;
  /** Percentage of unique lemmas that are KNOWN or WELL_KNOWN (0-100) */
  knownPercentage: number;
  /** Human-readable last read timestamp (e.g., "1 day ago") */
  lastRead: string;
  /** Short preview of the text content (first ~100 characters) */
  preview: string;
}

/**
 * Full text data with content and metadata.
 *
 * Complete text information including the actual text content for the reader.
 * Used on the reader page to display the full text with word-level interaction.
 *
 * **Reader Features:**
 * - Interactive word highlighting based on status
 * - Click to view lemma, translation, frequencies
 * - Mini-map for paragraph navigation
 * - Progress tracking
 */
export interface TextData {
  /** Unique identifier for this text */
  id: string;
  /** Text title */
  title: string;
  /** ID of the series this text belongs to */
  seriesId: string;
  /** Name of the series this text belongs to */
  seriesName: string;
  /** Total word count (including duplicates) */
  wordCount: number;
  /** Number of unique lemmas in the text */
  uniqueWordCount: number;
  /** Number of times this text has been viewed */
  viewCount: number;
  /** Percentage of unique lemmas that are KNOWN or WELL_KNOWN (0-100) */
  knownPercentage: number;
  /** User-defined tags for categorization */
  tags: string[];
  /** Full text content (plain text with paragraph breaks) */
  content: string;
}

// ============================================================================
// Paragraph Progress Type
// ============================================================================

/**
 * Paragraph progress data for mini-map visualization.
 *
 * Tracks the known percentage for each paragraph in a text, used to render
 * the mini-map in the reader. Each paragraph is color-coded based on how
 * many of its lemmas are known.
 *
 * **Color Coding:**
 * - 90-100%: Dark green (very high)
 * - 75-89%: Medium green (high)
 * - 60-74%: Yellow-green (medium-high)
 * - 45-59%: Orange (medium)
 * - 30-44%: Red-orange (medium-low)
 * - 0-29%: Red (low)
 */
export interface ParagraphProgress {
  /** Unique identifier for this paragraph */
  id: string;
  /** Known percentage for this paragraph (0-100) */
  progress: number;
}
