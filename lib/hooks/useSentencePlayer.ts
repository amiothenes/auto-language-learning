'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onNarrationPauseRequest } from '@/lib/tts/narrationControl';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { getSharedAudioElement } from '@/lib/tts/sharedAudioElement';
import { karaokeSession } from '@/lib/tts/karaokeHighlighter';
import { resolveSentenceAudio } from '@/lib/tts/sentenceAudioCache';
import { useActiveVoice } from './useActiveVoice';

// 'ended' (natural completion) is distinct from 'idle' (never played / explicitly
// stopped) specifically so autoplay-chaining consumers can watch for 'ended'
// transitions without the initial mount state looking like a completed play.
export type SentencePlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export function useSentencePlayer() {
  const { settings } = useReaderSettings();
  const voiceId = useActiveVoice();
  const [state, setState] = useState<SentencePlaybackState>('idle');

  // Monotonic token instead of an AbortController: requests are now shared
  // through sentenceAudioCache (a prefetch and a play can await the same
  // in-flight promise), so aborting would cancel work another caller still
  // wants. Superseded plays are dropped on arrival instead.
  const playTokenRef = useRef(0);
  const isCurrent = (token: number) => token === playTokenRef.current;

  const play = useCallback(
    async (sentenceId: string): Promise<{ durationMs: number } | null> => {
      const token = ++playTokenRef.current;

      setState('loading');
      karaokeSession.reset();
      try {
        const data = await resolveSentenceAudio(sentenceId, settings.playbackSpeed, voiceId);
        if (!isCurrent(token)) return null;

        if (!data.audioUrl) {
          // Degenerate/empty sentence — nothing to play; treat as an
          // immediate natural completion so autoplay chaining still advances.
          setState('ended');
          return { durationMs: 0 };
        }

        const audio = getSharedAudioElement();
        audio.src = data.audioUrl;
        audio.playbackRate = 1; // rate is baked into the SSML server-side, not applied client-side
        audio.onended = () => {
          karaokeSession.reset();
          setState('ended');
        };
        audio.onerror = () => {
          karaokeSession.reset();
          setState('error');
        };
        await audio.play();
        if (!isCurrent(token)) return null;
        // Marks are handed to the session only once playback is actually
        // under way, so a highlight can never appear ahead of the audio.
        karaokeSession.setMarks(data.marks);
        karaokeSession.start();
        setState('playing');
        return { durationMs: data.durationMs };
      } catch (error) {
        if (!isCurrent(token)) return null;
        console.error('[TTS] Sentence audio playback failed:', error);
        karaokeSession.reset();
        setState('error');
        return null;
      }
    },
    [settings.playbackSpeed, voiceId]
  );

  const pause = useCallback(() => {
    getSharedAudioElement().pause();
    // freeze() halts the rAF loop but keeps marks AND the current highlight,
    // so resume() picks up mid-sentence and the paused-on word stays marked.
    karaokeSession.freeze();
    setState('paused');
  }, []);

  /** Syncs state when something outside this hook paused the shared element —
   * specifically a Tutor Mode interrupt, which pauses inside the rAF loop to
   * stop the next word speaking over the question. */
  const notifyExternallyPaused = useCallback(() => setState('paused'), []);

  // Resumes from the exact paused position — unlike play(), does not re-fetch
  // or reset src/currentTime (pause() leaves both intact).
  const resume = useCallback(async () => {
    try {
      await getSharedAudioElement().play();
      karaokeSession.start();
      setState('playing');
    } catch (error) {
      console.error('[TTS] Resume playback failed:', error);
      setState('error');
    }
  }, []);

  const stop = useCallback(() => {
    const audio = getSharedAudioElement();
    audio.pause();
    audio.currentTime = 0;
    karaokeSession.reset();
    setState('idle');
  }, []);

  // Word-tap playback asks narration to stand down; pause() keeps marks and
  // the current highlight, so resuming continues exactly where it left off.
  useEffect(() => onNarrationPauseRequest(() => {
    if (!getSharedAudioElement().paused) pause();
  }), [pause]);

  // Memoized because consumers put this object in effect dependency arrays —
  // a fresh object each render re-ran the sentence auto-advance effect on
  // every render, which could double-advance and skip a sentence.
  return useMemo(
    () => ({ state, play, pause, resume, stop, notifyExternallyPaused }),
    [state, play, pause, resume, stop, notifyExternallyPaused]
  );
}
