import { describe, it, expect } from 'vitest';
import {
  estimatePlacement,
  fromRates,
  adjustForComprehension,
  stepUpEstimate,
  planKnownWords,
  ratesForSelfLevel,
  smoothNonIncreasing,
  MAX_ADJUSTMENTS,
  type BandSelection,
} from './placement';

const bands = (...picked: number[]): BandSelection[] => picked.map((p) => ({ shown: 20, picked: p }));
const noDecoys = { shown: 8, picked: 0 };

describe('estimatePlacement', () => {
  it('nothing ticked → below A1, zero vocab', () => {
    const e = estimatePlacement(bands(0, 0, 0, 0, 0, 0), noDecoys);
    expect(e.level).toBeNull();
    expect(e.vocabSize).toBe(0);
    expect(e.fluency).toBe(0);
  });

  it('interpolates vocabulary size from band rates', () => {
    // A1 100% (1000) + A2 50% (750) + B1 20% (500) = 2250 → B1
    const e = estimatePlacement(bands(20, 10, 4, 0, 0, 0), noDecoys);
    expect(e.vocabSize).toBe(2250);
    expect(e.level).toBe('B1');
  });

  it('an intermediate learner lands mid-range', () => {
    // Most of A1-A2, half of B1, a little B2: 950 + 1200 + 1250 + 500 = 3900 → B1
    const e = estimatePlacement(bands(19, 16, 10, 2, 0, 0), noDecoys);
    expect(e.vocabSize).toBe(3900);
    expect(e.level).toBe('B1');
    expect(e.fluency).toBeGreaterThan(70);
    expect(e.fluency).toBeLessThan(90);
  });

  it('everything ticked honestly → C2 and near-max fluency', () => {
    const e = estimatePlacement(bands(20, 20, 20, 20, 20, 20), noDecoys);
    expect(e.level).toBe('C2');
    expect(e.vocabSize).toBe(40000);
    expect(e.fluency).toBe(98);
  });

  it('matches the stats route: knowing the top 1k ≈ 76-77% coverage', () => {
    const e = fromRates([1, 0, 0, 0, 0, 0]);
    expect(e.fluency).toBeGreaterThan(75);
    expect(e.fluency).toBeLessThan(78);
  });

  it('smooths noise where rare words beat common ones', () => {
    const e = estimatePlacement(bands(20, 4, 16, 0, 0, 0), noDecoys);
    expect(e.bandRates[1]).toBeCloseTo(e.bandRates[2]);
    expect(e.bandRates[1]).toBeCloseTo(0.5);
  });

  it('ignores a single decoy tick', () => {
    const e = estimatePlacement(bands(20, 10, 4, 0, 0, 0), { shown: 8, picked: 1 });
    expect(e.penalized).toBe(false);
    expect(e.vocabSize).toBe(2250);
  });

  it('discounts tick-everything behaviour via decoys', () => {
    const e = estimatePlacement(bands(20, 20, 20, 20, 20, 20), { shown: 8, picked: 8 });
    expect(e.penalized).toBe(true);
    expect(e.level).toBeNull();
  });

  it('rejects the wrong band count', () => {
    expect(() => estimatePlacement(bands(1, 2), noDecoys)).toThrow();
  });
});

describe('smoothNonIncreasing', () => {
  it('leaves monotone input alone and pools violators', () => {
    expect(smoothNonIncreasing([1, 0.8, 0.5])).toEqual([1, 0.8, 0.5]);
    expect(smoothNonIncreasing([1, 0.2, 0.6, 0])).toEqual([1, 0.4, 0.4, 0]);
  });
});

describe('adjustForComprehension', () => {
  const b1 = estimatePlacement(bands(20, 10, 4, 0, 0, 0), noDecoys);

  it('"no" lowers the level and shrinks the vocab estimate', () => {
    const r = adjustForComprehension(b1, 'no', 0);
    expect(r.adjusted).toBe(true);
    expect(r.estimate.level).toBe('A2');
    expect(r.estimate.vocabSize).toBeLessThan(b1.vocabSize);
    expect(r.done).toBe(false);
  });

  it('"yes" and "somewhat" keep the estimate and finish', () => {
    expect(adjustForComprehension(b1, 'yes', 0)).toEqual({ estimate: b1, done: true, adjusted: false });
    expect(adjustForComprehension(b1, 'somewhat', 1)).toEqual({ estimate: b1, done: true, adjusted: false });
  });

  it('is capped so the learner is never stuck in a loop', () => {
    const once = adjustForComprehension(b1, 'no', MAX_ADJUSTMENTS - 1);
    expect(once.done).toBe(true);
    expect(adjustForComprehension(b1, 'no', MAX_ADJUSTMENTS).adjusted).toBe(false);
  });

  it('"try harder" raises the estimate', () => {
    expect(stepUpEstimate(b1).vocabSize).toBeGreaterThan(b1.vocabSize);
  });
});

describe('ratesForSelfLevel', () => {
  it('maps a self-picked level to plausible band rates', () => {
    expect(ratesForSelfLevel(null)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(ratesForSelfLevel('B1')).toEqual([0.9, 0.9, 0.5, 0, 0, 0]);
  });

  it('round-trips: a self-picked level estimates back to that level', () => {
    for (const lvl of ['A2', 'B1', 'B2', 'C1'] as const) {
      expect(fromRates(ratesForSelfLevel(lvl)).level).toBe(lvl);
    }
  });
});

describe('planKnownWords', () => {
  const pools = {
    A1: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10'],
    A2: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10'],
  };
  const est = fromRates([0.9, 0.5, 0, 0, 0, 0]);

  it('marks the top rate × pool lemmas per band, frequency first', () => {
    const plan = planKnownWords(est, pools, [], []);
    const a1 = plan.filter((p) => p.lemma.startsWith('a'));
    const a2 = plan.filter((p) => p.lemma.startsWith('b'));
    expect(a1).toHaveLength(9);
    expect(a2.map((p) => p.lemma)).toEqual(['b1', 'b2', 'b3', 'b4', 'b5']);
  });

  it('uses WELL_KNOWN for mastered bands and KNOWN for partial ones', () => {
    const plan = planKnownWords(est, pools, [], []);
    expect(plan.find((p) => p.lemma === 'a1')?.status).toBe('WELL_KNOWN');
    expect(plan.find((p) => p.lemma === 'b1')?.status).toBe('KNOWN');
  });

  it('never marks words the learner saw but did not tick', () => {
    const plan = planKnownWords(est, pools, [], ['b2']);
    expect(plan.some((p) => p.lemma === 'b2')).toBe(false);
    expect(plan.filter((p) => p.lemma.startsWith('b'))).toHaveLength(5); // the next one fills in
  });

  it('always includes ticked words, even outside the pools', () => {
    const plan = planKnownWords(est, pools, ['zozobra'], []);
    expect(plan.find((p) => p.lemma === 'zozobra')?.status).toBe('KNOWN');
  });

  it('respects the cap', () => {
    expect(planKnownWords(est, pools, [], [], 3)).toHaveLength(3);
  });
});
