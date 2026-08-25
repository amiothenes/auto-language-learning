'use client';

import { useQuery } from '@tanstack/react-query';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { primeFromManifest } from '@/lib/tts/sentenceAudioCache';
import { rateToRatePercent } from '@/lib/tts/rate';
import { useActiveVoice } from './useActiveVoice';
import type { TtsManifestResponse } from '@/lib/types/api';

/**
 * Loads every already-cached sentence's audio URL + marks for a text in one
 * request and seeds the module-level playback cache, so sentence transitions
 * don't each pay an API round trip. Keyed by quantized rate because a
 * different playback speed is a different set of cached audio.
 *
 * Purely an optimization: sentences the manifest doesn't cover (never
 * synthesized) fall through to the lazy per-sentence route, so a failure
 * here degrades speed, never correctness.
 */
export function useTtsManifest(textId: string) {
  const { settings } = useReaderSettings();
  const rate = settings.playbackSpeed;
  const voiceId = useActiveVoice();

  return useQuery({
    queryKey: ['tts-manifest', textId, rateToRatePercent(rate), voiceId ?? 'default'],
    queryFn: async () => {
      const params = new URLSearchParams({ rate: String(rate) });
      if (voiceId) params.set('voiceId', voiceId);
      const res = await fetch(`/api/texts/${textId}/tts-manifest?${params}`);
      if (!res.ok) throw new Error('Failed to load TTS manifest');
      const data: TtsManifestResponse = await res.json();
      primeFromManifest(data.entries, data.ratePercent, voiceId);
      return data;
    },
    enabled: !!textId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
