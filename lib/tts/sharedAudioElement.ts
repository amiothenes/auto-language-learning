'use client';

// One <audio> element for the whole Reader session (word taps, sentence
// playback, Tutor Mode), not one per component. Browsers (notably iOS
// Safari) track "autoplay allowed" per already-gesture-played element —
// creating a fresh element per track would silently re-trigger the
// autoplay-permission block on programmatic (non-gesture) advances.
let sharedAudio: HTMLAudioElement | null = null;

export function getSharedAudioElement(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio();
  }
  return sharedAudio;
}

let wordAudio: HTMLAudioElement | null = null;

/**
 * A SEPARATE element for word-tap pronunciation, deliberately not the
 * narration one above.
 *
 * Sharing them silently corrupted narration: playing a word overwrote the
 * narration element's `src` AND its `onended` handler — the very handler that
 * signals end-of-sentence and drives auto-advance — so after one word tap,
 * resuming replayed the word, sentence chaining stopped, and the play/pause
 * toggle operated on a dead element.
 *
 * The autoplay-policy reasoning that makes narration a singleton doesn't
 * apply here: word audio is always triggered by a tap on the speaker button,
 * so it always has a user gesture behind it.
 */
export function getWordAudioElement(): HTMLAudioElement {
  if (!wordAudio) {
    wordAudio = new Audio();
  }
  return wordAudio;
}
