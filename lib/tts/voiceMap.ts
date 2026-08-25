// Per-language TTS voices, system-managed — deliberately NOT sourced from
// languages.googleTTSCode (a live, user-editable column for an unrelated,
// unimplemented Google TTS concept; left untouched). The supported-language
// set is small and fixed, so a code-level constant is simpler than a
// DB-backed value.
//
// Pure data with no secrets and no server-only imports, so the settings UI
// can import it directly to render the picker.

export interface VoiceOption {
  id: string;
  label: string;
  gender: 'female' | 'male';
}

/** First entry per language is that language's default voice. */
export const LANGUAGE_VOICE_OPTIONS: Record<string, VoiceOption[]> = {
  en: [
    { id: 'en-US-AriaNeural', label: 'Aria (US)', gender: 'female' },
    { id: 'en-US-GuyNeural', label: 'Guy (US)', gender: 'male' },
    { id: 'en-GB-SoniaNeural', label: 'Sonia (UK)', gender: 'female' },
    { id: 'en-GB-RyanNeural', label: 'Ryan (UK)', gender: 'male' },
  ],
  es: [
    { id: 'es-ES-ElviraNeural', label: 'Elvira (Spain)', gender: 'female' },
    { id: 'es-ES-AlvaroNeural', label: 'Álvaro (Spain)', gender: 'male' },
    { id: 'es-MX-DaliaNeural', label: 'Dalia (Mexico)', gender: 'female' },
    { id: 'es-MX-JorgeNeural', label: 'Jorge (Mexico)', gender: 'male' },
  ],
  fr: [
    { id: 'fr-FR-DeniseNeural', label: 'Denise (France)', gender: 'female' },
    { id: 'fr-FR-HenriNeural', label: 'Henri (France)', gender: 'male' },
    { id: 'fr-CA-SylvieNeural', label: 'Sylvie (Canada)', gender: 'female' },
  ],
  ru: [
    { id: 'ru-RU-SvetlanaNeural', label: 'Svetlana', gender: 'female' },
    { id: 'ru-RU-DmitryNeural', label: 'Dmitry', gender: 'male' },
    { id: 'ru-RU-DariyaNeural', label: 'Dariya', gender: 'female' },
  ],
};

export function getVoiceOptions(languageCode: string): VoiceOption[] {
  return LANGUAGE_VOICE_OPTIONS[languageCode] ?? [];
}

export function getVoiceForLanguage(languageCode: string): string | null {
  return LANGUAGE_VOICE_OPTIONS[languageCode]?.[0]?.id ?? null;
}

/**
 * Resolves a client-supplied voice against the allow-list for its language,
 * falling back to the default. Validating rather than trusting matters
 * because voiceId reaches Azure AND becomes part of the shared cache key —
 * an unchecked value would let one user write cache rows under an arbitrary
 * key that every other user then reads.
 */
export function resolveVoiceForLanguage(
  languageCode: string,
  requestedVoiceId?: string | null
): string | null {
  const options = LANGUAGE_VOICE_OPTIONS[languageCode];
  if (!options || options.length === 0) return null;
  if (requestedVoiceId && options.some((v) => v.id === requestedVoiceId)) {
    return requestedVoiceId;
  }
  return options[0].id;
}
