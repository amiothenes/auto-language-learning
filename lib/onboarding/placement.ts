/**
 * Placement for the onboarding word picker: a vocabulary-size test.
 *
 * The picker shows six bands of target-language words drawn from frequency
 * ranks (A1 = the 1k most common lemmas ... C2 = ranks 20k-40k). The learner
 * taps the words they know. Each band is a sample of a frequency range, so
 * the hit rate in a band estimates how much of that whole range they know:
 *
 *   estimated vocabulary = Σ rate(band) × size(band)
 *
 * From the same rates we:
 *   - estimate Fluency (Zipf-weighted reading coverage), with the same formula
 *     as app/api/stats/route.ts, so the reveal number equals the dashboard's;
 *   - derive a level from the vocabulary size (which chapter to start at);
 *   - interpolate a known-word list: the top rate×pool lemmas of each band are
 *     pre-marked (see planKnownWords).
 *
 * Robustness:
 *   - Decoys (pseudo-words) detect over-ticking. From DECOY_PENALTY_MIN ticks
 *     on, every rate is scaled by (1 - decoy rate).
 *   - Rates are smoothed to be non-increasing from A1 to C2 (pool-adjacent-
 *     violators), since knowing more rare words than common ones is noise.
 *   - The comprehension check can scale the rates down (adjustForComprehension).
 */

export const PLACEMENT_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type PlacementLevel = (typeof PLACEMENT_LEVELS)[number];

/**
 * Lemma-rank range each band samples, [from, to). Must match the band windows
 * in content/<lang>/placement-bands.json and scripts/build-onboarding-content.ts.
 */
export const BAND_RANGES: Record<PlacementLevel, readonly [number, number]> = {
  A1: [0, 1000],
  A2: [1000, 2500],
  B1: [2500, 5000],
  B2: [5000, 10000],
  C1: [10000, 20000],
  C2: [20000, 40000],
};

/** Vocabulary size at which each level starts (null = below A1). */
const LEVEL_THRESHOLDS: Array<[PlacementLevel, number]> = [
  ['C2', 16000],
  ['C1', 8000],
  ['B2', 4000],
  ['B1', 2000],
  ['A2', 900],
  ['A1', 300],
];

/** Decoy ticks before the penalty applies (1 is an honest mis-tap). */
export const DECOY_PENALTY_MIN = 2;
/** Band rate at or above which pre-marked words are WELL_KNOWN, not KNOWN. */
export const WELL_KNOWN_RATE = 0.85;
/** Rate multiplier for a comprehension-check "no". */
export const COMPREHENSION_NO_FACTOR = 0.7;
/** Max number of comprehension-check adjustments. */
export const MAX_ADJUSTMENTS = 2;

// Must match app/api/stats/route.ts section 5.
const MAX_VOCAB = 10_000;
const H_MAX = Math.log(MAX_VOCAB) + 0.5772;

export interface BandSelection {
  /** Real (non-decoy) words shown in the band. */
  shown: number;
  /** Real words ticked in the band. */
  picked: number;
}

export interface PlacementEstimate {
  /** Level by estimated vocabulary size, or null for "below A1". */
  level: PlacementLevel | null;
  /** Smoothed, decoy-adjusted rate per band, 0..1, in PLACEMENT_LEVELS order. */
  bandRates: number[];
  /** Estimated known lemmas. */
  vocabSize: number;
  /** Estimated Fluency (Zipf-weighted reading coverage), 0..98, one decimal. */
  fluency: number;
  decoyRate: number;
  penalized: boolean;
}

export function estimatePlacement(
  bands: BandSelection[],
  decoys: { shown: number; picked: number }
): PlacementEstimate {
  if (bands.length !== PLACEMENT_LEVELS.length) {
    throw new Error(`Expected ${PLACEMENT_LEVELS.length} bands, got ${bands.length}`);
  }
  const decoyRate = decoys.shown > 0 ? clamp01(decoys.picked / decoys.shown) : 0;
  const penalized = decoys.picked >= DECOY_PENALTY_MIN;
  const factor = penalized ? 1 - decoyRate : 1;

  const raw = bands.map((b) => (b.shown > 0 ? clamp01(b.picked / b.shown) * factor : 0));
  return fromRates(smoothNonIncreasing(raw), decoyRate, penalized);
}

/** Build an estimate from (already smoothed) band rates. */
export function fromRates(bandRates: number[], decoyRate = 0, penalized = false): PlacementEstimate {
  let vocabSize = 0;
  let zipf = 0;
  PLACEMENT_LEVELS.forEach((lvl, i) => {
    const [from, to] = BAND_RANGES[lvl];
    vocabSize += bandRates[i] * (to - from);
    // Zipf mass of ranks (from, to] within the stats route's 10k horizon:
    // Σ 1/r ≈ ln(to/from), with the harmonic sum from 1 for the first band.
    const lo = Math.min(from, MAX_VOCAB);
    const hi = Math.min(to, MAX_VOCAB);
    if (hi > lo) zipf += bandRates[i] * (lo === 0 ? Math.log(hi) + 0.5772 : Math.log(hi / lo));
  });
  vocabSize = Math.round(vocabSize);
  const fluency = Math.min(98, Math.round((zipf / H_MAX) * 1000) / 10);
  const level = LEVEL_THRESHOLDS.find(([, min]) => vocabSize >= min)?.[0] ?? null;
  return { level, bandRates, vocabSize, fluency, decoyRate, penalized };
}

/** Comprehension-check answers on the sample passage. */
export type ComprehensionAnswer = 'yes' | 'somewhat' | 'no';

/**
 * Apply a comprehension-check answer. "no" scales every rate by
 * COMPREHENSION_NO_FACTOR and re-estimates. That is an interpolated
 * correction: the known-word list shrinks too, not just the level label.
 * Stops on "yes"/"somewhat", once the level actually drops, or at the cap.
 */
export function adjustForComprehension(
  est: PlacementEstimate,
  answer: ComprehensionAnswer,
  adjustmentsSoFar: number
): { estimate: PlacementEstimate; done: boolean; adjusted: boolean } {
  if (answer !== 'no' || adjustmentsSoFar >= MAX_ADJUSTMENTS || est.level === null) {
    return { estimate: est, done: true, adjusted: false };
  }
  // Scale until the level label drops at least one step (it usually takes one
  // pass), so a "no" always shows an easier passage next.
  let next = est;
  for (let i = 0; i < 4 && next.level === est.level; i++) {
    next = fromRates(next.bandRates.map((r) => r * COMPREHENSION_NO_FACTOR), est.decoyRate, est.penalized);
  }
  return { estimate: next, done: adjustmentsSoFar + 1 >= MAX_ADJUSTMENTS || next.level === null, adjusted: true };
}

/** "Try harder?" after a first-try yes: scale rates up by one "no" step. */
export function stepUpEstimate(est: PlacementEstimate): PlacementEstimate {
  return fromRates(est.bandRates.map((r) => clamp01(r / COMPREHENSION_NO_FACTOR)), est.decoyRate, est.penalized);
}

/**
 * Band rates for a self-picked level (the "let me choose a level" path, and
 * languages without a word picker): bands below the level count as mostly
 * known, the level's own band as half known, and anything above as unknown.
 * Fed into fromRates / planKnownWords like a picker result, so a self-placed
 * B1 learner gets the same kind of interpolated known-word list.
 */
export function ratesForSelfLevel(level: PlacementLevel | null): number[] {
  if (level === null) return PLACEMENT_LEVELS.map(() => 0);
  const idx = PLACEMENT_LEVELS.indexOf(level);
  return PLACEMENT_LEVELS.map((_, i) => (i < idx ? 0.9 : i === idx ? 0.5 : 0));
}

export type PremarkStatus = 'KNOWN' | 'WELL_KNOWN';

/**
 * Interpolate the known-word list from the estimate.
 *
 *   pools[level] are the band's lemmas in frequency order. For each band, the
 *   top round(rate × pool size) lemmas are marked (WELL_KNOWN when the band
 *   rate ≥ WELL_KNOWN_RATE, else KNOWN).
 *   - Ticked words are always marked KNOWN or better.
 *   - Words that were shown but not ticked are never marked: the learner told
 *     us they don't know them.
 *   - Capped at `cap` lemmas, keeping the most frequent.
 */
export function planKnownWords(
  est: PlacementEstimate,
  pools: Partial<Record<PlacementLevel, string[]>>,
  ticked: Iterable<string>,
  shownUnticked: Iterable<string>,
  cap = 12_000
): Array<{ lemma: string; status: PremarkStatus }> {
  const exclude = new Set(shownUnticked);
  const tickedSet = new Set(ticked);
  const out = new Map<string, PremarkStatus>();

  PLACEMENT_LEVELS.forEach((lvl, i) => {
    const pool = pools[lvl] ?? [];
    const rate = est.bandRates[i];
    const status: PremarkStatus = rate >= WELL_KNOWN_RATE ? 'WELL_KNOWN' : 'KNOWN';
    const n = Math.round(rate * pool.length);
    let taken = 0;
    for (const lemma of pool) {
      if (taken >= n || out.size >= cap) break;
      if (exclude.has(lemma) || out.has(lemma)) continue;
      out.set(lemma, status);
      taken++;
    }
  });

  for (const lemma of tickedSet) {
    if (!out.has(lemma)) out.set(lemma, 'KNOWN');
  }

  return [...out.entries()].map(([lemma, status]) => ({ lemma, status }));
}

/**
 * Make rates non-increasing (A1 ≥ A2 ≥ ... ≥ C2) with the pool-adjacent-
 * violators algorithm: any band that beats an easier one is averaged with it.
 */
export function smoothNonIncreasing(rates: number[]): number[] {
  const blocks: Array<{ sum: number; n: number }> = [];
  for (const r of rates) {
    blocks.push({ sum: r, n: 1 });
    while (blocks.length > 1) {
      const b = blocks[blocks.length - 1];
      const a = blocks[blocks.length - 2];
      if (a.sum / a.n >= b.sum / b.n) break;
      blocks.splice(-2, 2, { sum: a.sum + b.sum, n: a.n + b.n });
    }
  }
  return blocks.flatMap((b) => Array(b.n).fill(b.sum / b.n));
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
