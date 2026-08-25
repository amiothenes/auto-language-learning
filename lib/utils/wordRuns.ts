/**
 * Shared vocabulary for TTS karaoke targeting, used by both the server-side
 * alignment (lib/tts/alignment.ts) and the Reader's rendering
 * (components/reader/ReaderContent.tsx). Both sides must agree on what
 * counts as a speakable run and on how a run's character offset becomes a
 * DOM target id, so both live here rather than being written twice.
 */

// Symbols Azure actually pronounces ("%" -> "процентов", "№" -> "номер").
// They belong in a run so a token like "50%" is one highlightable unit rather
// than a highlighted "50" next to an unhighlighted "%". Purely structural
// punctuation (. , ; : — « » ? !) is deliberately absent: it's silent, and
// giving it a target would make the highlight jump onto commas.
const PRONOUNCEABLE_SYMBOLS = '%$€£¥₽№§°+×÷=@#&';

// Combining marks (\p{M}) are included deliberately: "Федо́тов" carries a
// combining acute accent, and excluding it would split the word into two
// runs ("Федо" + "тов") where Azure — and a reader — see one.
const WORD_RUN_RE = new RegExp(`[\\p{L}\\p{N}\\p{M}${PRONOUNCEABLE_SYMBOLS}]+`, 'gu');

export function extractWordRuns(text: string): { text: string; start: number }[] {
  return [...text.matchAll(WORD_RUN_RE)].map((m) => ({ text: m[0], start: m.index }));
}

/**
 * Karaoke target id for a spoken run that has no wordInstance of its own —
 * a number, an off-script word, or one with combining accents. Keyed by the
 * run's absolute character offset in the text's content, which both sides
 * compute independently from the same coordinate space (wordInstance
 * positions), so they agree without sharing state or counters.
 */
export function gapTargetId(absoluteOffset: number): string {
  return `tts-abs:${absoluteOffset}`;
}
