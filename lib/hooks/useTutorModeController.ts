'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { useSentencePlayer } from './useSentencePlayer';
import { useTtsManifest } from './useTtsManifest';
import { prefetchSentenceAudio } from '@/lib/tts/sentenceAudioCache';
import { useActiveVoice } from './useActiveVoice';
import { karaokeSession } from '@/lib/tts/karaokeHighlighter';
import { buildWordDataFromInstance } from '@/lib/utils/wordData';
import { VocabularyStatus } from '@/lib/types';
import type { WordData } from '@/lib/types';
import type { SentenceListItem, WordInstanceItem } from '@/lib/types/api';

/** How many sentences ahead to warm while the current one plays. */
const PREFETCH_AHEAD = 2;

/**
 * Learning progression, lowest first. A word interrupts when its rank is at
 * or below the configured threshold, so "up to Familiar" also covers Unknown
 * and Newly Seen. IGNORE is absent on purpose — it means "never ask me about
 * this" — and so is WELL_KNOWN, which is the definition of learned.
 */
const TUTOR_THRESHOLD_RANK: Record<string, number> = {
  [VocabularyStatus.UNKNOWN]: 0,
  [VocabularyStatus.NEWLY_SEEN]: 1,
  [VocabularyStatus.FAMILIAR]: 2,
  [VocabularyStatus.KNOWN]: 3,
};

/**
 * WordTooltip/MobileWordSheet close themselves on a delay after grading (for
 * their exit animation). Opening the next check immediately would land inside
 * that window and the delayed close would then shut the NEW tooltip, so
 * stepping on is deferred past the longer of the two.
 */
const ADVANCE_DELAY_MS = 350;

/** What should happen once the current queue of checks is exhausted. */
type QueuePhase = 'before' | 'after' | null;

interface UseTutorModeControllerArgs {
  sentences: SentenceListItem[] | undefined;
  wordInstances: WordInstanceItem[] | undefined | null;
  /** Same ref instance already threaded into WordTooltip/MobileWordSheet in
   * page.tsx — dependency-injected, not duplicated, so a word graded
   * manually is never re-quizzed by Tutor Mode and vice versa. */
  testedLemmasThisSession: React.RefObject<Set<string>>;
  /** = page.tsx's handleWordClick — opens the exact same tooltip/sheet a
   * real tap would, anchored to the word's real on-screen position. */
  onOpenWord: (wordData: WordData, anchorRect: DOMRect) => void;
  textId: string;
}

/**
 * Sentence-walker driving plain autoplay-through-text and, when Tutor Mode is
 * on, its pause-and-check behaviour.
 *
 * Three check timings are supported (settings.tutorModeTiming):
 *  - `atWord`  — the word's own audio timing (the same WordBoundary marks
 *                that drive karaoke) is armed in karaokeSession, so playback
 *                freezes the instant an unfamiliar word finishes being
 *                spoken, with that word still highlighted. Heard in context,
 *                then asked.
 *  - `before`  — all of the sentence's checks are front-loaded, then it plays
 *                through uninterrupted.
 *  - `after`   — the sentence plays whole, then its words are reviewed before
 *                moving on (comprehension-first).
 */
export function useTutorModeController({
  sentences,
  wordInstances,
  testedLemmasThisSession,
  onOpenWord,
  textId,
}: UseTutorModeControllerArgs) {
  const { settings } = useReaderSettings();
  const player = useSentencePlayer();
  const voiceId = useActiveVoice();

  // Bulk-seeds the sentence audio cache for the whole text in one request.
  // Purely a warm-up — nothing here awaits it.
  useTtsManifest(textId);

  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [isAwaitingRecall, setIsAwaitingRecall] = useState(false);

  const sentencesRef = useRef(sentences);
  sentencesRef.current = sentences;

  const interruptsUsedRef = useRef(0);
  const interruptTextIdRef = useRef<string | null>(null);
  const openedWordInstanceIdRef = useRef<string | null>(null);
  const pendingQueueRef = useRef<WordInstanceItem[]>([]);
  const queuePhaseRef = useRef<QueuePhase>(null);
  const currentIndexRef = useRef(-1);
  currentIndexRef.current = currentSentenceIndex;

  // Reset the per-text interrupt budget whenever the text changes.
  useEffect(() => {
    if (interruptTextIdRef.current !== textId) {
      interruptTextIdRef.current = textId;
      interruptsUsedRef.current = 0;
    }
  }, [textId]);

  // sentenceId -> that sentence's word instances, position-ordered.
  const sentenceWordsMapRef = useRef<Map<string, WordInstanceItem[]>>(new Map());
  const instanceByIdRef = useRef<Map<string, WordInstanceItem>>(new Map());
  useEffect(() => {
    const map = new Map<string, WordInstanceItem[]>();
    for (const inst of wordInstances ?? []) {
      if (!inst.sentenceId) continue;
      const arr = map.get(inst.sentenceId);
      if (arr) arr.push(inst);
      else map.set(inst.sentenceId, [inst]);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.position - b.position);
    sentenceWordsMapRef.current = map;
    instanceByIdRef.current = new Map(
      (wordInstances ?? []).map((inst) => [inst.instanceId, inst])
    );
  }, [wordInstances]);

  /** Words in this sentence worth stopping on, de-duplicated by lemma so a
   * word repeated in one sentence is only ever asked about once. Respects the
   * status threshold, the per-sentence cap and the remaining per-text budget. */
  const selectInterruptWords = useCallback(
    (sentenceId: string): WordInstanceItem[] => {
      const budgetLeft = settings.tutorModeMaxInterrupts - interruptsUsedRef.current;
      if (!settings.tutorModeEnabled || budgetLeft <= 0) return [];

      const thresholdRank = TUTOR_THRESHOLD_RANK[settings.tutorModeThreshold] ?? 2;
      const perSentenceCap =
        settings.tutorModeMaxPerSentence > 0 ? settings.tutorModeMaxPerSentence : Infinity;
      const cap = Math.min(perSentenceCap, budgetLeft);

      const words = sentenceWordsMapRef.current.get(sentenceId) ?? [];
      const picked: WordInstanceItem[] = [];
      const seenLemmas = new Set<string>();

      for (const word of words) {
        if (picked.length >= cap) break;
        const rank = TUTOR_THRESHOLD_RANK[word.status];
        if (rank === undefined || rank > thresholdRank) continue; // learned, or IGNORE
        if (testedLemmasThisSession.current.has(word.lemma)) continue;
        if (seenLemmas.has(word.lemma)) continue;
        seenLemmas.add(word.lemma);
        picked.push(word);
      }
      return picked;
    },
    [
      testedLemmasThisSession,
      settings.tutorModeEnabled,
      settings.tutorModeThreshold,
      settings.tutorModeMaxPerSentence,
      settings.tutorModeMaxInterrupts,
    ]
  );

  /** Opens the same tooltip/sheet a real tap would, anchored to the word. */
  const openCheck = useCallback(
    (inst: WordInstanceItem): boolean => {
      const el = document.querySelector<HTMLElement>(
        `[data-word-instance-id="${inst.instanceId}"]`
      );
      if (!el) return false;
      interruptsUsedRef.current += 1;
      openedWordInstanceIdRef.current = inst.instanceId;
      setIsAwaitingRecall(true);
      onOpenWord(buildWordDataFromInstance(inst), el.getBoundingClientRect());
      return true;
    },
    [onOpenWord]
  );

  const playSentence = useCallback(
    (index: number) => {
      const sentence = sentencesRef.current?.[index];
      if (!sentence) return;

      const armed =
        settings.tutorModeTiming === 'atWord' ? selectInterruptWords(sentence.id) : [];

      void player.play(sentence.id).then((result) => {
        if (!result) return;
        // Armed after play() resolves, because that's when the sentence's
        // marks are loaded into the session — interrupts are matched against
        // those marks' timings.
        if (armed.length > 0) {
          karaokeSession.setInterrupts(
            new Set(armed.map((w) => w.instanceId)),
            (wordInstanceId) => {
              const inst = instanceByIdRef.current.get(wordInstanceId);
              // Audio is already paused by the session at this point; sync the
              // player's own state so the UI doesn't still read "playing".
              player.notifyExternallyPaused();
              if (!inst || !openCheck(inst)) void player.resume();
            }
          );
        } else {
          karaokeSession.clearInterrupts();
        }
      });

      // Start fetching what comes next while this sentence is still speaking.
      // Everything a transition costs — the API round trip and the MP3
      // download (~1.5-2s cold, measured) — is work that never depended on the
      // current sentence finishing, so it's all hidden behind playback here.
      for (let ahead = 1; ahead <= PREFETCH_AHEAD; ahead++) {
        const upcoming = sentencesRef.current?.[index + ahead];
        if (upcoming) prefetchSentenceAudio(upcoming.id, settings.playbackSpeed, voiceId);
      }
    },
    [
      player,
      openCheck,
      selectInterruptWords,
      settings.tutorModeTiming,
      settings.playbackSpeed,
      voiceId,
    ]
  );

  const processSentence = useCallback(
    (index: number) => {
      const sentence = sentencesRef.current?.[index];
      if (!sentence) {
        setIsRunning(false);
        setCurrentSentenceIndex(-1);
        return;
      }
      setCurrentSentenceIndex(index);
      currentIndexRef.current = index;

      if (settings.tutorModeTiming === 'before') {
        const queue = selectInterruptWords(sentence.id);
        if (queue.length > 0) {
          pendingQueueRef.current = queue;
          queuePhaseRef.current = 'before';
          // Drain via the shared runner so a missing element skips rather
          // than stalling; it plays the sentence once the queue empties.
          runQueueRef.current?.();
          return;
        }
      }
      playSentence(index);
    },
    [playSentence, selectInterruptWords, settings.tutorModeTiming]
  );

  // runQueue and processSentence are mutually recursive ('after' checks end by
  // moving to the next sentence, which may itself open 'before' checks), so
  // one side is reached through a ref to keep both definitions valid.
  const runQueueRef = useRef<(() => void) | null>(null);

  const runQueue = useCallback(() => {
    const next = pendingQueueRef.current[0];
    if (next) {
      if (openCheck(next)) return;
      // Not rendered (shouldn't normally happen) — drop it and try the next
      // rather than getting stuck waiting for a dismissal that can't come.
      pendingQueueRef.current.shift();
      runQueueRef.current?.();
      return;
    }

    const phase = queuePhaseRef.current;
    queuePhaseRef.current = null;
    setIsAwaitingRecall(false);
    openedWordInstanceIdRef.current = null;

    if (phase === 'before') playSentence(currentIndexRef.current);
    else if (phase === 'after') processSentence(currentIndexRef.current + 1);
  }, [openCheck, playSentence, processSentence]);
  runQueueRef.current = runQueue;

  // Auto-advance once a sentence finishes — or, in 'after' mode, review its
  // words first and advance only when that queue drains.
  useEffect(() => {
    if (!isRunning || isAwaitingRecall) return;
    if (player.state !== 'ended') return;

    const sentence = sentencesRef.current?.[currentSentenceIndex];
    if (settings.tutorModeTiming === 'after' && sentence) {
      const queue = selectInterruptWords(sentence.id);
      if (queue.length > 0) {
        pendingQueueRef.current = queue;
        queuePhaseRef.current = 'after';
        runQueueRef.current?.();
        return;
      }
    }
    processSentence(currentSentenceIndex + 1);
  }, [
    player.state,
    isRunning,
    isAwaitingRecall,
    currentSentenceIndex,
    processSentence,
    selectInterruptWords,
    settings.tutorModeTiming,
  ]);

  /** Steps past the check the user just finished with. */
  const advancePastCheck = useCallback(() => {
    openedWordInstanceIdRef.current = null;
    if (queuePhaseRef.current !== null) {
      // 'before'/'after': walk the queue (deferred past the tooltip's own
      // exit animation, which would otherwise close the next one).
      pendingQueueRef.current.shift();
      setTimeout(() => runQueueRef.current?.(), ADVANCE_DELAY_MS);
      return;
    }
    // 'atWord': the sentence is mid-flight — just let it continue.
    setIsAwaitingRecall(false);
    if (isRunning) void player.resume();
  }, [isRunning, player]);

  const handleWordGraded = useCallback(
    (lemma: string) => {
      if (settings.tutorModeResume !== 'onGrade') return;
      const opened = openedWordInstanceIdRef.current;
      if (!opened) return;
      if (instanceByIdRef.current.get(opened)?.lemma !== lemma) return;
      advancePastCheck();
    },
    [settings.tutorModeResume, advancePastCheck]
  );

  const handleWordDismissed = useCallback(
    (wordInstanceId: string) => {
      if (openedWordInstanceIdRef.current !== wordInstanceId) return;
      advancePastCheck();
    },
    [advancePastCheck]
  );

  const playPause = useCallback(() => {
    // Mid-check, Space/play acts as "I'm done, carry on" — the same thing
    // dismissing the tooltip does.
    if (isAwaitingRecall) {
      advancePastCheck();
      return;
    }
    if (player.state === 'playing') {
      player.pause();
      return;
    }
    if (player.state === 'paused') {
      setIsRunning(true);
      void player.resume();
      return;
    }
    setIsRunning(true);
    processSentence(currentSentenceIndex >= 0 ? currentSentenceIndex : 0);
  }, [isAwaitingRecall, advancePastCheck, player, processSentence, currentSentenceIndex]);

  /** Jump straight to a sentence, abandoning any check in progress. */
  const goToSentence = useCallback(
    (index: number) => {
      const total = sentencesRef.current?.length ?? 0;
      if (index < 0 || index >= total) return;
      pendingQueueRef.current = [];
      queuePhaseRef.current = null;
      openedWordInstanceIdRef.current = null;
      setIsAwaitingRecall(false);
      setIsRunning(true);
      processSentence(index);
    },
    [processSentence]
  );

  /**
   * Moves the audio cursor to a specific word (Ctrl/⌘-click on it). Seeks
   * within the loaded sentence when possible — instant, and keeps playback
   * state — otherwise loads that word's sentence and plays from its start.
   */
  const seekToWord = useCallback(
    (wordInstanceId: string, sentenceId: string | null) => {
      if (karaokeSession.seekToTarget(wordInstanceId)) return;
      if (!sentenceId) return;
      const index = sentencesRef.current?.findIndex((s) => s.id === sentenceId) ?? -1;
      if (index >= 0) goToSentence(index);
    },
    [goToSentence]
  );

  /** Starts narration at a given sentence index — used by "play from here". */
  const playFromSentence = useCallback(
    (index: number) => goToSentence(index),
    [goToSentence]
  );

  const nextSentence = useCallback(
    () => goToSentence((currentIndexRef.current < 0 ? 0 : currentIndexRef.current) + 1),
    [goToSentence]
  );
  const previousSentence = useCallback(
    () => goToSentence(Math.max(0, currentIndexRef.current - 1)),
    [goToSentence]
  );

  const stop = useCallback(() => {
    setIsRunning(false);
    setIsAwaitingRecall(false);
    pendingQueueRef.current = [];
    queuePhaseRef.current = null;
    openedWordInstanceIdRef.current = null;
    player.stop();
    setCurrentSentenceIndex(-1);
  }, [player]);

  // Stop playback on unmount (e.g. navigating away from the Reader) — the
  // shared <audio> element otherwise outlives this page and keeps playing.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => player.stop(), []);

  return {
    currentSentenceIndex,
    totalSentences: sentences?.length ?? 0,
    playbackState: player.state,
    isAwaitingRecall,
    playPause,
    stop,
    nextSentence,
    previousSentence,
    seekToWord,
    playFromSentence,
    handleWordGraded,
    handleWordDismissed,
  };
}
