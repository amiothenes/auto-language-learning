/**
 * SM-2 spaced-repetition scheduling, driven by a binary grade rather than the
 * classic 0-5 quality score: "Didn't Know" maps to quality 0 (relearning
 * reset), "Did Know" maps to quality 5 (full credit).
 */

import type { SrsGrade } from '@/lib/types/api';

export interface Sm2State {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

const MIN_EASE_FACTOR = 1.3;
// Anki's flat ease penalty on a lapse ("Again"). Applied regardless of how
// mature the card was — a 300-day card and a same-day new card both take the
// same hit, same as Anki.
const LAPSE_EASE_PENALTY = 0.2;
// Below this, intervals are the exact graduating steps (1 day, 6 days) and
// should land precisely; fuzz only kicks in once the interval is long enough
// that a few days' spread won't feel arbitrary.
const MIN_FUZZ_INTERVAL_DAYS = 3;
const FUZZ_RATIO = 0.05;

export function applySm2(
  state: Sm2State,
  grade: SrsGrade,
  random: () => number = Math.random
): Sm2State {
  const quality = grade === 'KNEW' ? 5 : 0;

  if (quality < 3) {
    return {
      easeFactor: Math.max(MIN_EASE_FACTOR, state.easeFactor - LAPSE_EASE_PENALTY),
      intervalDays: 1,
      repetitions: 0,
    };
  }

  const repetitions = state.repetitions + 1;
  let intervalDays: number;
  if (repetitions === 1) {
    intervalDays = 1;
  } else if (repetitions === 2) {
    intervalDays = 6;
  } else {
    intervalDays = applyFuzz(Math.round(state.intervalDays * state.easeFactor), random);
  }

  const easeFactor = Math.max(
    MIN_EASE_FACTOR,
    state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  return { easeFactor, intervalDays, repetitions };
}

/** Anki-style anti-clumping jitter: +/-5% on intervals of 3+ days, unchanged below that. */
function applyFuzz(intervalDays: number, random: () => number): number {
  if (intervalDays < MIN_FUZZ_INTERVAL_DAYS) return intervalDays;
  const fuzzRange = Math.max(1, Math.round(intervalDays * FUZZ_RATIO));
  const offset = Math.floor(random() * (2 * fuzzRange + 1)) - fuzzRange;
  return Math.max(1, intervalDays + offset);
}

/**
 * `dueAt` is bucketed to UTC midnight rather than the exact review timestamp,
 * matching the UTC-day convention `todayDateString()` already uses for daily
 * budgets/caps elsewhere in lib/srs — otherwise a card reviewed late at night
 * becomes due at that same late hour the next day instead of at day start.
 * This is a pragmatic stand-in for Anki's (configurable, local-time) day
 * rollover: there's no per-user timezone concept anywhere in this app yet, so
 * a future timezone-aware pass should replace this one UTC-day definition
 * rather than introduce a second, different boundary.
 */
export function dueAtFromInterval(intervalDays: number, from: Date = new Date()): Date {
  const due = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  due.setUTCDate(due.getUTCDate() + intervalDays);
  return due;
}
