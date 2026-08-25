'use client';

import { getSharedAudioElement } from './sharedAudioElement';

const ACTIVE_CLASS = 'tts-karaoke-active';
const PAUSED_CLASS = 'tts-karaoke-paused';

export type KaraokeMark = {
  targetIds: string[];
  startMs: number;
  endMs: number;
};

/** Binary search for the mark whose [startMs, endMs) range contains currentMs. */
export function findActiveMark<T extends { startMs: number; endMs: number }>(
  marks: T[],
  currentMs: number
): T | null {
  let lo = 0;
  let hi = marks.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const mark = marks[mid];
    if (currentMs < mark.startMs) hi = mid - 1;
    else if (currentMs >= mark.endMs) lo = mid + 1;
    else return mark;
  }
  return null;
}

/**
 * Module-level singleton driving the karaoke highlight, deliberately living
 * OUTSIDE React for three separate reasons:
 *
 * 1. Re-render cost — pushing the active target through props on every tick
 *    would re-render the entire paragraph tree many times per second.
 * 2. Lifecycle — the <audio> element is itself a session-wide singleton, so
 *    anything derived from its playback has to outlive individual component
 *    mounts. Holding marks in a hook ref meant a Reader re-mount (a refetch
 *    flipping the loading gate, say) silently reset them to [] while the
 *    audio kept playing: highlighting stopped, sound continued.
 * 3. Tick rate — the <audio> `timeupdate` event fires only about 4x/second,
 *    but words last 200-400ms, so driving highlights from it skipped most
 *    words entirely. requestAnimationFrame samples currentTime at frame rate
 *    instead, which is what makes the highlight actually track the voice.
 */
class KaraokeSession {
  private marks: KaraokeMark[] = [];
  private activeIds: string[] = [];
  private activeEls: HTMLElement[] = [];
  private rafId: number | null = null;

  // Tutor Mode: targets to stop playback just after, in ascending end-time
  // order. Consumed as playback passes them, so each fires exactly once.
  private pendingInterrupts: Array<{ targetId: string; endMs: number }> = [];
  private onInterrupt: ((targetId: string) => void) | null = null;

  // Fired only when the spoken target actually changes (not every frame), so
  // React consumers — the paragraph map following along, say — re-render at
  // word rate rather than at 60fps.
  private onTargetChange: ((targetId: string | null) => void) | null = null;

  setOnTargetChange(listener: ((targetId: string | null) => void) | null) {
    this.onTargetChange = listener;
  }

  setMarks(marks: KaraokeMark[]) {
    this.marks = marks;
  }

  /**
   * Arms Tutor Mode stops for the current sentence. Interrupts fire just
   * AFTER a word finishes rather than before it starts, so the word is
   * actually heard in context before being asked about.
   */
  setInterrupts(targetIds: Set<string>, onInterrupt: (targetId: string) => void) {
    this.onInterrupt = onInterrupt;
    this.pendingInterrupts = this.marks
      .flatMap((m) => {
        const hit = m.targetIds.find((id) => targetIds.has(id));
        return hit ? [{ targetId: hit, endMs: m.endMs }] : [];
      })
      .sort((a, b) => a.endMs - b.endMs);
  }

  /**
   * Moves playback to the start of whichever mark covers `targetId`, if the
   * currently-loaded sentence contains it. Returns false when it doesn't, so
   * the caller can fall back to loading that word's sentence instead.
   */
  seekToTarget(targetId: string): boolean {
    const mark = this.marks.find((m) => m.targetIds.includes(targetId));
    if (!mark) return false;
    const audio = getSharedAudioElement();
    if (!audio.src) return false;
    audio.currentTime = mark.startMs / 1000;
    // Repaint immediately so the playhead lands even while paused, when no
    // rAF loop is running to do it on the next frame.
    this.apply(mark.targetIds);
    if (audio.paused) this.freeze();
    return true;
  }

  clearInterrupts() {
    this.pendingInterrupts = [];
    this.onInterrupt = null;
  }

  start() {
    if (this.rafId !== null) return;
    const tick = () => {
      this.rafId = requestAnimationFrame(tick);
      this.sync();
    };
    this.rafId = requestAnimationFrame(tick);
  }

  /** Halts the loop but keeps the highlight and marks — used when pausing, so
   * the word being asked about stays visibly marked and resuming can simply
   * pick the loop back up. Swaps the "speaking now" fill for the hollow
   * playhead marker, so a parked position never reads as live audio. */
  freeze() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    for (const el of this.activeEls) {
      el.classList.remove(ACTIVE_CLASS);
      el.classList.add(PAUSED_CLASS);
    }
  }

  stop() {
    this.freeze();
    this.clearHighlight();
  }

  /** Stops the loop and drops marks — for an explicit stop, as opposed to a
   * pause, where marks must survive so resuming picks the highlight back up. */
  reset() {
    this.stop();
    this.marks = [];
    this.clearInterrupts();
  }

  private sync() {
    const audio = getSharedAudioElement();
    const currentMs = audio.currentTime * 1000;
    const active = findActiveMark(this.marks, currentMs);
    this.apply(active?.targetIds ?? []);

    const next = this.pendingInterrupts[0];
    if (next && currentMs >= next.endMs) {
      this.pendingInterrupts.shift();
      // Pause here rather than leaving it to the callback: any delay lets the
      // next word start speaking over the question.
      audio.pause();
      this.freeze();
      this.onInterrupt?.(next.targetId);
    }
  }

  private apply(targetIds: string[]) {
    // Fast path: same targets, and every node we styled is still in the
    // document. The isConnected check matters because React can replace a
    // word's DOM node on re-render (a status change refetching wordInstances,
    // say), which silently drops the imperatively-added class — re-querying
    // when that happens is what keeps the highlight alive across re-renders.
    const sameTargets =
      targetIds.length === this.activeIds.length &&
      targetIds.every((id, i) => id === this.activeIds[i]);
    if (sameTargets && (targetIds.length === 0 || this.activeEls.every((el) => el.isConnected))) {
      return;
    }

    for (const el of this.activeEls) el.classList.remove(ACTIVE_CLASS, PAUSED_CLASS);
    this.activeEls = [];
    this.activeIds = targetIds;

    for (const id of targetIds) {
      const el = document.querySelector<HTMLElement>(
        `[data-tts-target-id="${CSS.escape(id)}"]`
      );
      if (el) {
        el.classList.remove(PAUSED_CLASS);
        el.classList.add(ACTIVE_CLASS);
        this.activeEls.push(el);
      }
    }

    this.onTargetChange?.(targetIds[0] ?? null);
  }

  private clearHighlight() {
    for (const el of this.activeEls) el.classList.remove(ACTIVE_CLASS, PAUSED_CLASS);
    this.activeEls = [];
    this.activeIds = [];
    this.onTargetChange?.(null);
  }
}

export const karaokeSession = new KaraokeSession();
