/**
 * API request and response type definitions for Auto-Language-Learning backend
 */

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
