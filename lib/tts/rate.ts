const MIN_RATE = 0.5;
const MAX_RATE = 1.25;
const STEP = 0.05;

// Quantized so nearby speed-slider values (e.g. 0.91 vs 0.93) share the same
// cache row instead of each triggering a fresh synthesis.
export function quantizeRate(rate: number): number {
  const clamped = Math.min(MAX_RATE, Math.max(MIN_RATE, rate));
  return Math.round(clamped / STEP) * STEP;
}

export function rateToRatePercent(rate: number): number {
  return Math.round(quantizeRate(rate) * 100);
}

export function rateToSsmlPercent(rate: number): string {
  const percentDelta = Math.round((quantizeRate(rate) - 1) * 100);
  return percentDelta >= 0 ? `+${percentDelta}%` : `${percentDelta}%`;
}
