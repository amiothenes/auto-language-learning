import { VocabularyStatus } from '@/lib/types/vocabulary';

/**
 * The reviewable status ladder (excludes IGNORE, which sits outside the
 * progression). Shared by the manual in-reader grading UI
 * (components/reader/GradingSection.tsx) and the SRS review endpoint so a
 * "step up" / "step down" always means the same thing everywhere.
 */
export const STATUS_PROGRESSION = [
  VocabularyStatus.UNKNOWN,
  VocabularyStatus.NEWLY_SEEN,
  VocabularyStatus.FAMILIAR,
  VocabularyStatus.KNOWN,
  VocabularyStatus.WELL_KNOWN,
] as const;

/** One step up the ladder, clamped at WELL_KNOWN. Statuses outside the ladder (IGNORE) are returned unchanged. */
export function stepStatusUp(status: VocabularyStatus): VocabularyStatus {
  const idx = STATUS_PROGRESSION.indexOf(status as (typeof STATUS_PROGRESSION)[number]);
  if (idx === -1) return status;
  return STATUS_PROGRESSION[Math.min(idx + 1, STATUS_PROGRESSION.length - 1)];
}

/** One step down the ladder, clamped at UNKNOWN. Statuses outside the ladder (IGNORE) are returned unchanged. */
export function stepStatusDown(status: VocabularyStatus): VocabularyStatus {
  const idx = STATUS_PROGRESSION.indexOf(status as (typeof STATUS_PROGRESSION)[number]);
  if (idx === -1) return status;
  return STATUS_PROGRESSION[Math.max(idx - 1, 0)];
}
