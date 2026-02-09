/**
 * Centralized type definitions for Auto-Language-Learning.
 *
 * This file re-exports all types from domain-specific modules for convenient
 * importing. Import from this file to access any type in the application.
 *
 * **Usage:**
 * ```typescript
 * // Import multiple types from the central hub
 * import { VocabularyStatus, WordData, Series, Language } from '@/lib/types';
 *
 * // OR import from specific domain files
 * import { VocabularyStatus, WordData } from '@/lib/types/vocabulary';
 * import { Series, Text } from '@/lib/types/content';
 * ```
 */

// ============================================================================
// Vocabulary & Learning
// ============================================================================

/**
 * Vocabulary status levels, word data, and vocabulary items.
 *
 * - `VocabularyStatus`: Enum for NEWLY_SEEN, FAMILIAR, KNOWN, WELL_KNOWN, IGNORE
 * - `WordData`: Individual word occurrence with lemma, translation, frequencies
 * - `VocabularyItem`: Lemma entry in vocabulary browser
 */
export { VocabularyStatus } from './vocabulary';
export type { WordData, VocabularyItem } from './vocabulary';

// ============================================================================
// Content Management
// ============================================================================

/**
 * Series, texts, and paragraph progress types.
 *
 * - `Series`: Collection of related texts
 * - `SeriesDetail`: Extended series data with text list
 * - `Text`: Individual text metadata
 * - `TextData`: Full text with content
 * - `ParagraphProgress`: Mini-map paragraph data
 */
export type { Series, SeriesDetail, Text, TextData, ParagraphProgress } from './content';

// ============================================================================
// Language Configuration
// ============================================================================

/**
 * Language types and context interface.
 *
 * - `Language`: Language definition (code, name)
 * - `LanguageContextType`: Context value for language selection
 */
export type { Language, LanguageContextType } from './language';

// ============================================================================
// UI & Settings
// ============================================================================

/**
 * Reader settings, font sizes, color schemes, and sorting options.
 *
 * - `FontSize`: 'small' | 'medium' | 'large'
 * - `ColorScheme`: 'light' | 'dark'
 * - `ReaderSettings`: Reader customization settings
 * - `ReaderSettingsContextType`: Context value for settings
 * - `SeriesSortOption`: Series sorting options
 * - `VocabularySortOption`: Vocabulary sorting options
 */
export type {
  FontSize,
  ColorScheme,
  ReaderSettings,
  ReaderSettingsContextType,
  SeriesSortOption,
  VocabularySortOption,
} from './ui';

// ============================================================================
// API (Future)
// ============================================================================

/**
 * API request/response types.
 *
 * Future: Will contain types for backend API integration.
 * Currently empty as the app runs frontend-only with hardcoded data.
 */
// export * from './api'; // Commented out until api.ts has actual exports
