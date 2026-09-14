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

export function applySm2(state: Sm2State, grade: SrsGrade): Sm2State {
  const quality = grade === 'KNEW' ? 5 : 0;

  if (quality < 3) {
    return {
      easeFactor: state.easeFactor,
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
    intervalDays = Math.round(state.intervalDays * state.easeFactor);
  }

  const easeFactor = Math.max(
    MIN_EASE_FACTOR,
    state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  return { easeFactor, intervalDays, repetitions };
}

export function dueAtFromInterval(intervalDays: number, from: Date = new Date()): Date {
  const due = new Date(from);
  due.setDate(due.getDate() + intervalDays);
  return due;
}
