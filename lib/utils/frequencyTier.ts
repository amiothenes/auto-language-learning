// ============================================================================
// Frequency tier — CEFR-style A/B1/B2/C bucketing of the 0-100
// dictionaryFrequency score, plus display formatting for the tier badge.
//
// Pure (no `fs`) so it's safe to import from client components. The actual
// percentile lookup lives in lib/utils/wordFrequency.ts (server-only — reads
// the corpus JSON files) and is attached to API responses as
// `frequencyPercentile`; this module only formats what it's given.
//
// These letters borrow CEFR's naming convention as a familiar mental model
// for learners — they are NOT real CEFR ratings (which come from curated
// pedagogical wordlists, not raw corpus frequency). The tooltip text says so.
// ============================================================================

export type FrequencyTier = 'A' | 'B1' | 'B2' | 'C';

export const FREQUENCY_TIER_CONFIG: Record<
  FrequencyTier,
  { label: string; bgColor: string; textColor: string }
> = {
  A:  { label: 'A',  bgColor: 'hsla(145,38%,45%,.12)', textColor: 'hsl(145,32%,30%)' },
  B1: { label: 'B1', bgColor: 'hsla(195,42%,50%,.12)', textColor: 'hsl(195,38%,32%)' },
  B2: { label: 'B2', bgColor: 'hsla(35,50%,50%,.14)',  textColor: 'hsl(35,45%,32%)' },
  C:  { label: 'C',  bgColor: 'hsla(0,36%,55%,.11)',   textColor: 'hsl(0,32%,36%)' },
};

/** Score 0 is the sentinel `lookupDictionaryFrequency(...) ?? 0` writes when
 * a lemma has no corpus entry at all (rare word, proper noun, unsupported
 * language) — real corpus entries always score >= 1. */
export function tierForFrequencyScore(score: number | null | undefined): FrequencyTier {
  const s = score ?? 0;
  if (s >= 75) return 'A';
  if (s >= 55) return 'B1';
  if (s >= 35) return 'B2';
  return 'C';
}

/** One-line tooltip text: percentile + disclaimer, or a "not in corpus"
 * fallback when there's no percentile to show. */
export function formatFrequencyDetail(
  score: number | null | undefined,
  percentile: number | null | undefined
): string {
  if (!score || percentile === null || percentile === undefined) {
    return 'Not in the top 100k most common words for this language';
  }
  const pct = Math.max(1, Math.round(percentile));
  return `Top ${pct}% by frequency, estimated, not an official CEFR rating`;
}
