'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { getWordAudioElement } from '@/lib/tts/sharedAudioElement';
import { requestNarrationPause } from '@/lib/tts/narrationControl';
import { prefetchWordAudio, resolveWordAudio } from '@/lib/tts/wordAudioCache';
import { useActiveVoice } from './useActiveVoice';

export type WordAudioButtonState = 'idle' | 'loading' | 'playing' | 'error';

/**
 * Shared word-tap-to-hear playback state — used identically by WordTooltip,
 * MobileWordSheet, and WordDetailsPanel so this logic isn't triplicated on
 * top of their already-independently-duplicated reveal/grading state.
 */
export function useWordAudioButton(wordId: string) {
  const { settings } = useReaderSettings();
  const voiceId = useActiveVoice();
  const [state, setState] = useState<WordAudioButtonState>('idle');
  const playTokenRef = useRef(0);
  // Word audio plays on a module-level singleton shared across every mount of
  // this hook, so unmount cleanup must only pause it if THIS instance is the
  // one actually playing — otherwise a different word's button unmounting
  // elsewhere in the app could cut audio it never started.
  const isPlayingRef = useRef(false);

  // This hook only ever mounts inside an open tooltip/sheet, so mounting IS
  // "the user is looking at this word" — the right moment to warm its audio,
  // well before the speaker button can be clicked. Cache-only: looking at a
  // word never spends synthesis quota, only pressing play does.
  useEffect(() => {
    if (wordId) prefetchWordAudio(wordId, settings.playbackSpeed, voiceId);
  }, [wordId, settings.playbackSpeed, voiceId]);

  const play = useCallback(async () => {
    const token = ++playTokenRef.current;
    isPlayingRef.current = false;
    setState('loading');
    // Word audio has its own element, so narration is asked to pause rather
    // than being clobbered — its src, its end-of-sentence handler, its marks
    // and any armed Tutor Mode stops all stay intact, ready to resume.
    requestNarrationPause();

    try {
      // Usually already resolved (or in flight) from the prefetch above, in
      // which case this returns without touching the network.
      const data = await resolveWordAudio(wordId, settings.playbackSpeed, voiceId);
      if (token !== playTokenRef.current) return;

      const audio = getWordAudioElement();
      audio.src = data.audioUrl;
      audio.onended = () => {
        isPlayingRef.current = false;
        setState('idle');
      };
      audio.onerror = () => {
        isPlayingRef.current = false;
        setState('error');
      };
      await audio.play();
      if (token !== playTokenRef.current) return;
      isPlayingRef.current = true;
      setState('playing');
    } catch (error) {
      if (token !== playTokenRef.current) return;
      console.error('[TTS] Word audio playback failed:', error);
      setState('error');
    }
  }, [wordId, settings.playbackSpeed, voiceId]);

  // Stop playback this instance started when it unmounts (e.g. a flashcard
  // being dismissed) so audio doesn't bleed into whatever's shown next.
  useEffect(() => {
    return () => {
      playTokenRef.current++;
      if (isPlayingRef.current) {
        getWordAudioElement().pause();
        isPlayingRef.current = false;
      }
    };
  }, []);

  return { state, play };
}
