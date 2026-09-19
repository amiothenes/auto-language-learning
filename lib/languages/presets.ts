// Curated set of languages selectable during onboarding and when adding a
// language from Settings. Kept in sync with voiceMap.ts's TTS voice support —
// every code here has real TTS voices, so autofilled values always work.

export interface LanguagePreset {
  code: string;
  name: string;
  flag: string;
  ttsCode: string;
  rtl: boolean;
  includeForeignScript: boolean;
}

// Languages a learner can read glosses in. Only English for now, since it's the
// only UI/gloss language the app supports.
// TODO(native-language): once the UI supports other languages, store one native
// language per user and use it as the translation target for every language.
// That also enables English learners (currently English has no target, since
// en→en translation is meaningless).
export const TRANSLATION_TARGETS: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
];

/**
 * Default translation target for a newly created language, or null when none
 * makes sense (English is the only target, so English itself has none).
 */
export function defaultTranslationTargetFor(languageCode: string): string | null {
  return languageCode.toLowerCase() === 'en' ? null : 'en';
}

/**
 * The translation target to actually use for a language row. Falls back to the
 * default when the column is NULL (rows created before the column was
 * populated), so a missing value can never silently disable auto-translation.
 */
export function resolveTranslationTarget(language: {
  code: string;
  defaultTranslationLangCode: string | null;
}): string | null {
  return language.defaultTranslationLangCode ?? defaultTranslationTargetFor(language.code);
}

export const PRESET_LANGUAGES: LanguagePreset[] = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸', ttsCode: 'es-ES', rtl: false, includeForeignScript: false },
  { code: 'fr', name: 'French', flag: '🇫🇷', ttsCode: 'fr-FR', rtl: false, includeForeignScript: false },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', ttsCode: 'ru-RU', rtl: false, includeForeignScript: true },
  { code: 'en', name: 'English', flag: '🇬🇧', ttsCode: 'en-US', rtl: false, includeForeignScript: false },
];
