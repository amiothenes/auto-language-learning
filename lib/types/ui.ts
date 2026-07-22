/**
 * UI and reader settings type definitions.
 *
 * Defines types for reader customization, sorting options, and other UI-related
 * configurations. Reader settings are persisted to localStorage and applied
 * globally across all reading sessions.
 */

// ============================================================================
// Reader Settings Types
// ============================================================================

/**
 * Font size options for the reader.
 *
 * Controls the size of text in the reader panel. Applies to content text
 * (EB Garamond font) only, not UI elements.
 *
 * **Size Mapping:**
 * - `small`: 16px (1rem)
 * - `medium`: 18px (1.125rem)
 * - `large`: 20px (1.25rem)
 */
export type FontSize = 'small' | 'medium' | 'large';

/**
 * Color scheme options for the reader.
 *
 * Controls the overall color scheme of the application. Currently supports
 * light mode only, with dark mode planned for future implementation.
 *
 * **Current State:**
 * Only `'light'` is functional. Dark mode implementation is pending.
 */
export type ColorScheme = 'light' | 'dark';

/**
 * Reader settings configuration.
 *
 * Controls how text is displayed and highlighted in the reader panel.
 * All settings are persisted to localStorage and restored on page load.
 *
 * **Persistence:**
 * Settings are saved to localStorage under the key `'reader-settings'`
 * and automatically restored when the app loads.
 *
 * **Highlight Intensity:**
 * Controls the opacity of status-based highlighting:
 * - 100 = Full intensity (default)
 * - 50 = Half opacity
 * - 0 = No highlighting
 *
 * This allows users to reduce visual noise when reading while still
 * maintaining clickable word functionality.
 *
 * **Well-Known Words Toggle:**
 * When disabled, words marked as WELL_KNOWN are dimmed (50% opacity)
 * to further reduce visual clutter and focus attention on learning vocabulary.
 */
export interface ReaderSettings {
  /** Font size for reader content text */
  fontSize: FontSize;
  /** Highlight intensity for word status colors (0-100) */
  highlightIntensity: number;
  /** Whether to show well-known words at full opacity */
  showWellKnownWords: boolean;
  /** Color scheme (light/dark) - currently light only */
  colorScheme: ColorScheme;
  /** Whether status colors appear as background highlight or text underline */
  highlightMode: 'highlight' | 'underline';
  /** Whether immersion mode is active (hides the left sidebar) */
  isImmersionMode: boolean;
}

/**
 * Reader settings context value type.
 *
 * Provides access to current reader settings and methods to update them.
 * Used by the reader component and settings page.
 *
 * **Auto-Save:**
 * All update functions automatically persist changes to localStorage.
 * No manual save action is required.
 *
 * **Usage Pattern:**
 * ```typescript
 * const { settings, updateFontSize } = useReaderSettings();
 *
 * // Update font size (auto-saves to localStorage)
 * updateFontSize('large');
 * ```
 */
export interface ReaderSettingsContextType {
  /** Current reader settings */
  settings: ReaderSettings;
  /** Update font size */
  updateFontSize: (size: FontSize) => void;
  /** Update highlight intensity (clamped to 0-100) */
  updateHighlightIntensity: (intensity: number) => void;
  /** Update show well-known words setting */
  updateShowWellKnownWords: (show: boolean) => void;
  /** Update color scheme */
  updateColorScheme: (scheme: ColorScheme) => void;
  /** Update highlight mode (background highlight vs text underline) */
  updateHighlightMode: (mode: 'highlight' | 'underline') => void;
  /** Toggle immersion mode on/off (hides the left sidebar) */
  toggleImmersionMode: () => void;
  /** Reset all settings to defaults */
  resetToDefaults: () => void;
}

// ============================================================================
// Sorting Types
// ============================================================================

/**
 * Sort options for series list.
 *
 * Determines the order in which series are displayed on the series page.
 *
 * **Options:**
 * - `name-asc`: Alphabetical by name (A-Z)
 * - `progress-desc`: Progress high to low
 * - `progress-asc`: Progress low to high
 * - `read-recent`: Most recently read first (newest to oldest); series never read fall back to creation date
 */
export type SeriesSortOption = 'name-asc' | 'progress-desc' | 'progress-asc' | 'read-recent';

/**
 * Sort options for vocabulary list.
 *
 * Determines the order in which vocabulary items are displayed.
 *
 * **Options:**
 * - `lemma-asc`: Alphabetical by lemma (A-Z)
 * - `lemma-desc`: Reverse alphabetical by lemma (Z-A)
 * - `frequency-desc`: Most frequent first (userFrequency)
 * - `frequency-asc`: Least frequent first
 * - `status`: Grouped by status (NEWLY_SEEN, FAMILIAR, KNOWN, etc.)
 */
export type VocabularySortOption =
  | 'lemma-asc'
  | 'lemma-desc'
  | 'frequency-desc'
  | 'frequency-asc'
  | 'status';
