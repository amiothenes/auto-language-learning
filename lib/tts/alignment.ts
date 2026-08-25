import type { WordBoundaryMark } from '../db/schema/sentenceAudio';
import { extractWordRuns, gapTargetId } from '../utils/wordRuns';

export type AlignedMark = {
  /** Every highlight target this mark covers. Usually one, but Azure merges
   * some spans into a single WordBoundary — "10 января 1923" arrives as one
   * mark covering a number, a word and another number — and all of them
   * should light up together for its duration. */
  targetIds: string[];
  startMs: number;
  endMs: number;
  text: string;
};

type InstanceRow = { id: string; surfaceForm: string; position: number };
type TargetUnit = { id: string; start: number; end: number };

function toUnaligned(marks: WordBoundaryMark[]): AlignedMark[] {
  return marks.map((mark) => ({
    targetIds: [],
    startMs: mark.audioOffsetMs,
    endMs: mark.audioOffsetMs + mark.durationMs,
    text: mark.text,
  }));
}

/**
 * Locates the sentence's absolute start offset in the text's full content.
 *
 * `sentences` stores only content + order, no start offset, but the
 * sentence's own wordInstances carry absolute `position`s. Locating the
 * first instance's surface form inside the sentence content gives its offset
 * within the sentence, and `position - thatOffset` is the sentence's
 * absolute start. Returns null when nothing could be located, which forces
 * the caller to degrade rather than emit offsets that would highlight the
 * wrong words.
 */
function findSentenceStart(content: string, sortedInstances: InstanceRow[]): number | null {
  for (const inst of sortedInstances) {
    const idx = content.indexOf(inst.surfaceForm);
    if (idx !== -1) return inst.position - idx;
  }
  return null;
}

/**
 * Every highlightable unit in the sentence, in absolute coordinates:
 * the real wordInstances, plus the speakable runs that have none.
 *
 * That second group exists because the import pipeline drops tokens the
 * voice still reads aloud — numbers (spaCy's `is_word` is `token.is_alpha`,
 * false for digits), off-script words like "XX" in Russian text
 * (`matchesLanguageScript`), and words carrying combining accents such as
 * "Федо́тов". They get a position-derived `tts-abs:<n>` id that
 * ReaderContent.tsx stamps onto the same character offset, so they highlight
 * without existing as vocabulary.
 */
function buildTargetUnits(
  content: string,
  sentenceStart: number,
  sortedInstances: InstanceRow[]
): TargetUnit[] {
  const units: TargetUnit[] = sortedInstances.map((inst) => ({
    id: inst.id,
    start: inst.position,
    end: inst.position + inst.surfaceForm.length,
  }));

  for (const run of extractWordRuns(content)) {
    const start = sentenceStart + run.start;
    const end = start + run.text.length;
    // A run overlapping a real instance IS that instance (or a tokenization
    // disagreement about its edges) — never a separate target.
    const overlapsInstance = units.some((u) => u.start < end && start < u.end);
    if (!overlapsInstance) units.push({ id: gapTargetId(start), start, end });
  }

  return units.sort((a, b) => a.start - b.start);
}

/**
 * Maps Azure's WordBoundary marks onto karaoke targets by CHARACTER RANGE.
 *
 * Range intersection rather than sequential text matching, because Azure's
 * tokenization does not correspond one-to-one with spaCy's: it merges dates
 * into a single mark, and a pointer walking both lists in parallel stalls on
 * the first such token and never recovers, silently killing highlighting for
 * the entire sentence. Here each mark independently asks "which units occupy
 * these characters?", so a merged, split, or unrecognized token affects only
 * itself.
 *
 * Mark offsets are plain-text and sentence-relative (normalized at the vendor
 * boundary in azureSpeechClient.ts); unit positions are absolute.
 */
export function alignMarksToWordInstances(
  marks: WordBoundaryMark[],
  sentenceContent: string,
  wordInstances: InstanceRow[]
): AlignedMark[] {
  const sortedInstances = [...wordInstances].sort((a, b) => a.position - b.position);
  const sentenceStart = findSentenceStart(sentenceContent, sortedInstances);
  if (sentenceStart === null) {
    return toUnaligned(marks);
  }

  const units = buildTargetUnits(sentenceContent, sentenceStart, sortedInstances);

  return marks.map((mark) => {
    const markStart = sentenceStart + mark.textOffset;
    const markEnd = markStart + mark.wordLength;
    return {
      targetIds: units
        .filter((u) => u.start < markEnd && markStart < u.end)
        .map((u) => u.id),
      startMs: mark.audioOffsetMs,
      endMs: mark.audioOffsetMs + mark.durationMs,
      text: mark.text,
    };
  });
}
