/**
 * Language configuration type definitions.
 *
 * Auto-Language-Learning operates with a single-language scope - the entire
 * app UI is filtered by ONE selected language at a time. All content, vocabulary,
 * and statistics are scoped to the currently selected language.
 */

import type { LanguageItem } from './api';

// ============================================================================
// Language Types
// ============================================================================

/**
 * Minimal language shape used internally (subset of LanguageItem).
 */
export interface Language {
  /** ISO 639-1 language code (e.g., 'es', 'fr', 'ru') */
  code: string;
  /** Human-readable language name (e.g., 'Spanish', 'French', 'Russian') */
  name: string;
}

// ============================================================================
// Language Context Type
// ============================================================================

export interface LanguageContextType {
  /** Currently selected language code (e.g., 'es') */
  selectedLanguage: string;
  /** Full LanguageItem for the currently selected language (undefined while loading) */
  currentLanguage: LanguageItem | undefined;
  /** All languages loaded from DB */
  languages: LanguageItem[];
  /** Set the selected language code */
  setSelectedLanguage: (code: string) => void;
  /** Language dropdown open state (for Sidebar) */
  isDropdownOpen: boolean;
  /** Set language dropdown open state */
  setIsDropdownOpen: (open: boolean) => void;
}
