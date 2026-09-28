import { VocabularyStatus } from '@/lib/types/vocabulary';

/**
 * Completion % — fraction of non-ignored words the user has seen at least
 * once (any status other than UNKNOWN). Goal is to drive UNKNOWN to 0%.
 * Distinct from "Known %" (mastery), which lives separately in the
 * Dashboard/Vocabulary stats and is not derived from this helper.
 *
 * Returns an unrounded 0-100 value — round at display time, not here.
 */
export function calculateCompletionPercentage(statuses: VocabularyStatus[]): number {
  const gradable = statuses.filter((s) => s !== VocabularyStatus.IGNORE);
  if (gradable.length === 0) return 0;
  const seen = gradable.filter((s) => s !== VocabularyStatus.UNKNOWN);
  return (seen.length / gradable.length) * 100;
}

/**
 * Rounds a completion % for display, never showing 100 unless it truly is —
 * plain Math.round would round e.g. 99.6% up to "100%" while unknown words
 * still remain.
 */
export function roundCompletionPercentage(pct: number): number {
  if (pct >= 100) return 100;
  return Math.min(99, Math.round(pct));
}
