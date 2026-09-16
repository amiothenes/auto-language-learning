'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { prefetchSentenceAudio, resolveSentenceAudio } from '@/lib/tts/sentenceAudioCache';
import { useActiveVoice } from './useActiveVoice';

export type SentenceAudioButtonState = 'idle' | 'loading' | 'playing' | 'error';

/**
 * Tap-to-hear playback for a flashcard's sentence, modeled on
 * useWordAudioButton but with its own <audio> element — the Review page isn't
 * the Reader, so it doesn't need (or want) to touch narration/Tutor Mode state.
 */
export function useSentenceAudioButton(sentenceId: string | undefined) {
  const { settings } = useReaderSettings();
  const voiceId = useActiveVoice();
  const [state, setState] = useState<SentenceAudioButtonState>('idle');
  const playTokenRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (sentenceId) prefetchSentenceAudio(sentenceId, settings.playbackSpeed, voiceId);
  }, [sentenceId, settings.playbackSpeed, voiceId]);

  const play = useCallback(async () => {
    if (!sentenceId) return;
    const token = ++playTokenRef.current;
    setState('loading');

    try {
      const data = await resolveSentenceAudio(sentenceId, settings.playbackSpeed, voiceId);
      if (token !== playTokenRef.current) return;
      if (!data.audioUrl) throw new Error('No audio available for this sentence');

      if (!audioRef.current) audioRef.current = new Audio();
      const audio = audioRef.current;
      audio.src = data.audioUrl;
      audio.onended = () => setState('idle');
      audio.onerror = () => setState('error');
      await audio.play();
      if (token !== playTokenRef.current) return;
      setState('playing');
    } catch (error) {
      if (token !== playTokenRef.current) return;
      console.error('[TTS] Sentence audio playback failed:', error);
      setState('error');
    }
  }, [sentenceId, settings.playbackSpeed, voiceId]);

  return { state, play };
}
