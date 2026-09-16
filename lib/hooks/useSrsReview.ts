import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SrsGrade, SrsReviewResponse } from '@/lib/types/api';

export function useSrsReview(languageId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wordId, grade }: { wordId: string; grade: SrsGrade }) => {
      const res = await fetch('/api/srs/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId, grade }),
      });
      if (!res.ok) throw new Error('Failed to record review');
      return res.json() as Promise<SrsReviewResponse>;
    },
    onSuccess: () => {
      // Deliberately NOT invalidating ['srs-session', ...]: the Review page
      // plays through a local snapshot of the queue it fetched at session
      // start, so re-fetching mid-session wouldn't reshuffle progress —
      // it would just be wasted work.
      queryClient.invalidateQueries({ queryKey: ['srs-due-count', languageId] });
      queryClient.invalidateQueries({ queryKey: ['word-instances'] });
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
    },
  });
}
