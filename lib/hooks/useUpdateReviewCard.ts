import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TranslationMeaning } from '@/lib/db/schema/wordTranslations';

export function useUpdateReviewCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      wordId,
      translation,
      meanings,
    }: {
      wordId: string;
      translation: string;
      meanings: TranslationMeaning[];
    }) => {
      const res = await fetch(`/api/words/${wordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ translation, meanings }),
      });
      if (!res.ok) throw new Error('Failed to update card');
      return res.json() as Promise<{ wordId: string; translation: string; meanings: TranslationMeaning[] }>;
    },
    onSuccess: () => {
      // Review keeps its own local session snapshot (not query-driven), so the
      // caller patches that state directly. These invalidations just keep the
      // Reader/vocabulary views fresh for the next time the word appears there.
      queryClient.invalidateQueries({ queryKey: ['word-instances'] });
      queryClient.invalidateQueries({ queryKey: ['series'] });
      queryClient.invalidateQueries({ queryKey: ['series-list'] });
    },
  });
}
