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
  /** TTS playback speed, 0.5-1.25 (default 0.9 — a gentle rate reduction for learners) */
  playbackSpeed: number;
  /** Chosen TTS voice per language code (e.g. { ru: 'ru-RU-DmitryNeural' }).
   * Keyed by language because a voice only makes sense for its own language;
   * anything unset falls back to that language's default voice. */
  preferredVoices: Record<string, string>;
  /** Whether Tutor Mode pauses on unfamiliar words during sentence playback */
  tutorModeEnabled: boolean;
  /** When a Tutor Mode check happens relative to the sentence's audio */
  tutorModeTiming: TutorModeTiming;
  /** Highest vocabulary status still worth stopping on — anything ranked above
   * it is treated as learned and never interrupts. IGNORE never interrupts. */
  tutorModeThreshold: TutorModeThreshold;
  /** Max checks within a single sentence (0 = no per-sentence limit) */
  tutorModeMaxPerSentence: number;
  /** Max Tutor Mode interrupts per text before it silently degrades to passive autoplay */
  tutorModeMaxInterrupts: number;
  /** Whether grading resumes playback, or the user dismissing the word does */
  tutorModeResume: TutorModeResume;
}

/**
 * `atWord` freezes playback the moment the word finishes being spoken, so
 * it's heard in context before being asked about. `before` front-loads the
 * checks for a sentence, `after` reviews them once the sentence has played
 * through (comprehension-first).
 */
export type TutorModeTiming = 'before' | 'atWord' | 'after';

/** Ordered along the vocabulary progression — see TUTOR_THRESHOLD_RANK. */
export type TutorModeThreshold = 'UNKNOWN' | 'NEWLY_SEEN' | 'FAMILIAR' | 'KNOWN';

export type TutorModeResume = 'onGrade' | 'onDismiss';

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
  /** Update TTS playback speed (clamped to 0.5-1.25) */
  updatePlaybackSpeed: (rate: number) => void;
  /** Set the preferred TTS voice for one language */
  updatePreferredVoice: (languageCode: string, voiceId: string) => void;
  /** Toggle Tutor Mode on/off */
  toggleTutorMode: () => void;
  /** Update the max Tutor Mode interrupts allowed per text */
  updateTutorModeMaxInterrupts: (max: number) => void;
  /** Update when a Tutor Mode check fires relative to the sentence audio */
  updateTutorModeTiming: (timing: TutorModeTiming) => void;
  /** Update the highest status that still triggers a check */
  updateTutorModeThreshold: (threshold: TutorModeThreshold) => void;
  /** Update the per-sentence check cap (0 = unlimited) */
  updateTutorModeMaxPerSentence: (max: number) => void;
  /** Update what resumes playback after a check */
  updateTutorModeResume: (resume: TutorModeResume) => void;
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
 * Sort options for text lists (within a series detail page, or the series
 * page's Texts tab).
 *
 * **Options:**
 * - `title-asc`: Alphabetical by title (A-Z)
 * - `progress-desc`: Completion % high to low
 * - `progress-asc`: Completion % low to high
 * - `recent`: Most recently read first (newest to oldest); texts never read fall back to creation date
 * - `date-added`: Most recently imported first (Texts tab only)
 */
export type TextSortOption =
  | 'title-asc'
  | 'progress-desc'
  | 'progress-asc'
  | 'recent'
  | 'date-added';

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
