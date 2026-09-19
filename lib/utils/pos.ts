// Matches a word occurrence's spaCy UPOS tag (wordData.pos, e.g. "VERB", "ADP")
// against a dictionary meaning's POS tag (Azure/Wiktionary, e.g. "VERB", "PREP").
// The two taggers use overlapping but not identical vocabularies, so exact
// case-insensitive equality is widened with a small alias table for the
// common mismatches (adpositions, conjunctions, auxiliaries, proper nouns).

const POS_ALIASES: Record<string, string> = {
  ADP: 'PREP',
  CCONJ: 'CONJ',
  SCONJ: 'CONJ',
  AUX: 'MODAL',
  PROPN: 'PROPER_NOUN',
};

function normalizePOS(pos: string): string {
  const upper = pos.toUpperCase();
  return POS_ALIASES[upper] ?? upper;
}

/** True if a word occurrence's POS tag and a dictionary meaning's POS tag refer to the same part of speech. */
export function posMatches(occurrencePos: string | null | undefined, meaningPos: string | null | undefined): boolean {
  if (!occurrencePos || !meaningPos) return false;
  return normalizePOS(occurrencePos) === normalizePOS(meaningPos);
}
