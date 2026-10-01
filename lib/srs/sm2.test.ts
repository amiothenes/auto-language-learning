import { describe, expect, it } from 'vitest';
import { applySm2, dueAtFromInterval, type Sm2State } from './sm2';

const fresh: Sm2State = { easeFactor: 2.5, intervalDays: 0, repetitions: 0 };

describe('applySm2 — pass branch', () => {
  it('graduates through the 1-day then 6-day steps', () => {
    const first = applySm2(fresh, 'KNEW');
    expect(first.repetitions).toBe(1);
    expect(first.intervalDays).toBe(1);

    const second = applySm2(first, 'KNEW');
    expect(second.repetitions).toBe(2);
    expect(second.intervalDays).toBe(6);
  });

  it('grows the interval by the ease factor afterwards', () => {
    const state: Sm2State = { easeFactor: 2.5, intervalDays: 6, repetitions: 2 };
    const next = applySm2(state, 'KNEW', () => 0.5); // midpoint random -> no fuzz offset
    expect(next.repetitions).toBe(3);
    expect(next.intervalDays).toBe(Math.round(6 * 2.5));
  });

  it('increases ease factor on a pass', () => {
    const next = applySm2(fresh, 'KNEW');
    expect(next.easeFactor).toBeGreaterThan(fresh.easeFactor);
  });
});

describe('applySm2 — lapse branch (regression: ease must drop on a miss)', () => {
  it('decreases ease factor by the flat lapse penalty', () => {
    const state: Sm2State = { easeFactor: 2.5, intervalDays: 30, repetitions: 4 };
    const next = applySm2(state, 'DIDNT_KNOW');
    expect(next.easeFactor).toBeLessThan(state.easeFactor);
    expect(next.easeFactor).toBeCloseTo(2.3, 5);
  });

  it('resets interval to 1 day and repetitions to 0', () => {
    const state: Sm2State = { easeFactor: 2.5, intervalDays: 30, repetitions: 4 };
    const next = applySm2(state, 'DIDNT_KNOW');
    expect(next.intervalDays).toBe(1);
    expect(next.repetitions).toBe(0);
  });

  it('never drops ease below the floor, even across many repeated lapses', () => {
    let state: Sm2State = { easeFactor: 1.5, intervalDays: 10, repetitions: 3 };
    for (let i = 0; i < 20; i++) {
      state = applySm2(state, 'DIDNT_KNOW');
    }
    expect(state.easeFactor).toBeCloseTo(1.3, 5);
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});

describe('applySm2 — interval fuzz', () => {
  it('leaves short intervals (graduating steps, <3 days) untouched', () => {
    const first = applySm2(fresh, 'KNEW', () => 0.999);
    expect(first.intervalDays).toBe(1);
    const second = applySm2(first, 'KNEW', () => 0.999);
    expect(second.intervalDays).toBe(6);
  });

  it('bounds fuzz within +/-5% (rounded) of the unfuzzed interval', () => {
    const state: Sm2State = { easeFactor: 2.5, intervalDays: 40, repetitions: 3 };
    const unfuzzed = Math.round(40 * 2.5); // 100
    const fuzzRange = Math.round(unfuzzed * 0.05); // 5

    const high = applySm2(state, 'KNEW', () => 0.999999);
    const low = applySm2(state, 'KNEW', () => 0);
    expect(high.intervalDays).toBeLessThanOrEqual(unfuzzed + fuzzRange);
    expect(low.intervalDays).toBeGreaterThanOrEqual(unfuzzed - fuzzRange);
  });
});

describe('dueAtFromInterval', () => {
  it('is bucketed to UTC midnight regardless of the review time-of-day', () => {
    const lateNight = new Date(Date.UTC(2026, 0, 1, 23, 58, 0));
    const due = dueAtFromInterval(1, lateNight);
    expect(due.getUTCHours()).toBe(0);
    expect(due.getUTCMinutes()).toBe(0);
    expect(due.getUTCSeconds()).toBe(0);
    expect(due.getUTCFullYear()).toBe(2026);
    expect(due.getUTCMonth()).toBe(0);
    expect(due.getUTCDate()).toBe(2);
  });

  it('lands exactly N UTC-calendar-days after the review, from any time-of-day', () => {
    const morning = new Date(Date.UTC(2026, 2, 10, 6, 0, 0));
    const due = dueAtFromInterval(10, morning);
    expect(due.getUTCDate()).toBe(20);
    expect(due.getUTCMonth()).toBe(2);
  });
});
