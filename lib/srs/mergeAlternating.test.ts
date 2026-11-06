import { describe, it, expect } from 'vitest';
import { mergeAlternating } from './mergeAlternating';

describe('mergeAlternating', () => {
  it('alternates text-word and deck cards', () => {
    expect(mergeAlternating(['t1', 't2'], ['d1', 'd2'], 10)).toEqual(['t1', 'd1', 't2', 'd2']);
  });

  it('respects the daily new-card budget', () => {
    expect(mergeAlternating(['t1', 't2', 't3'], ['d1', 'd2', 'd3'], 3)).toEqual(['t1', 'd1', 't2']);
  });

  it('fills from the other list when one runs out', () => {
    expect(mergeAlternating([], ['d1', 'd2', 'd3'], 2)).toEqual(['d1', 'd2']);
    expect(mergeAlternating(['t1', 't2', 't3'], ['d1'], 4)).toEqual(['t1', 'd1', 't2', 't3']);
  });

  it('handles a zero budget and empty inputs', () => {
    expect(mergeAlternating(['t1'], ['d1'], 0)).toEqual([]);
    expect(mergeAlternating([], [], 5)).toEqual([]);
  });
});
