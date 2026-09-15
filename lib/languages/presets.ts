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

export const PRESET_LANGUAGES: LanguagePreset[] = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸', ttsCode: 'es-ES', rtl: false, includeForeignScript: false },
  { code: 'fr', name: 'French', flag: '🇫🇷', ttsCode: 'fr-FR', rtl: false, includeForeignScript: false },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', ttsCode: 'ru-RU', rtl: false, includeForeignScript: true },
  { code: 'en', name: 'English', flag: '🇬🇧', ttsCode: 'en-US', rtl: false, includeForeignScript: false },
];
