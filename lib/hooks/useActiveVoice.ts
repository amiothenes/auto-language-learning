'use client';

import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { resolveVoiceForLanguage } from '@/lib/tts/voiceMap';

/**
 * The voice all TTS requests in the Reader should use: the user's preference
 * for the current language, validated against that language's allow-list and
 * falling back to its default. Resolved client-side as well as server-side so
 * the value can go into the client cache key — otherwise switching voice
 * would replay whatever was already cached under the old one.
 */
export function useActiveVoice(): string | undefined {
  const { settings } = useReaderSettings();
  const { selectedLanguage } = useLanguage();
  if (!selectedLanguage) return undefined;
  return resolveVoiceForLanguage(selectedLanguage, settings.preferredVoices[selectedLanguage]) ?? undefined;
}
