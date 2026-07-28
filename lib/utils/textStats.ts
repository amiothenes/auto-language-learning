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
