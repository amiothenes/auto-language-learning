/**
 * Language configuration type definitions.
 *
 * Auto-Language-Learning operates with a single-language scope - the entire
 * app UI is filtered by ONE selected language at a time. All content, vocabulary,
 * and statistics are scoped to the currently selected language.
 */

// ============================================================================
// Language Types
// ============================================================================

/**
 * Language definition.
 *
 * Represents a language available in the application. Users select one language
 * at a time, and all content throughout the app is filtered to that language.
 *
 * **Single-Language Scope:**
 * The app does NOT support mixing languages or viewing multiple languages
 * simultaneously. When a user switches languages, all content, vocabulary
 * lists, and statistics update to reflect only the selected language.
 *
 * **Implementation Note:**
 * Language data is currently hardcoded in LanguageContext.tsx with three
 * supported languages: Spanish (es), French (fr), and Russian (ru).
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

/**
 * Language context value type.
 *
 * Provides access to the currently selected language and methods to change it.
 * This context is consumed throughout the app to filter all content by language.
 *
 * **Usage Pattern:**
 * ```typescript
 * const { selectedLanguage, currentLanguage, setSelectedLanguage } = useLanguage();
 *
 * // Filter content by language
 * const filteredTexts = allTexts.filter(text => text.languageCode === selectedLanguage);
 * ```
 *
 * **Dropdown State:**
 * The language selector dropdown state is managed in this context to coordinate
 * between the Sidebar component (desktop) and bottom navigation (mobile).
 */
export interface LanguageContextType {
  /** Currently selected language code (e.g., 'es') */
  selectedLanguage: string;
  /** Current language object with code and name */
  currentLanguage: Language | undefined;
  /** Set the selected language code */
  setSelectedLanguage: (code: string) => void;
  /** Language dropdown open state (for Sidebar) */
  isDropdownOpen: boolean;
  /** Set language dropdown open state */
  setIsDropdownOpen: (open: boolean) => void;
}
