'use client';

/**
 * Tiny pub/sub letting word-tap playback ask narration to stop, without
 * either hook holding a reference to the other.
 *
 * The two live in different components (useWordAudioButton inside the
 * tooltip/sheet, useSentencePlayer in the reader page's controller), so there
 * is no prop path between them. Pausing narration has to go through the
 * player rather than the raw <audio> element, otherwise the player's React
 * state would still read "playing" and the mini-player would lie.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function onNarrationPauseRequest(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Called before word audio starts, so narration never plays underneath it. */
export function requestNarrationPause(): void {
  for (const listener of listeners) listener();
}
