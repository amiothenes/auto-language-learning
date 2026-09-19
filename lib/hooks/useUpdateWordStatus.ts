import { useMutation, useQueryClient } from '@tanstack/react-query';
import { VocabularyStatus } from '@/lib/types/vocabulary';

export function useUpdateWordStatus(textId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wordId, status }: { wordId: string; status: VocabularyStatus }) => {
      const res = await fetch(`/api/words/${wordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update word status');
      return res.json() as Promise<{ wordId: string; status: VocabularyStatus }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['word-instances'] });
      queryClient.invalidateQueries({ queryKey: ['text', textId] });
      // Word status changes shift knownPercentage for every text containing the
      // word (see syncAllTextsForWord), so refresh series views too. The series
      // a text belongs to isn't known here, so invalidate broadly rather than
      // threading seriesId through this hook.
      queryClient.invalidateQueries({ queryKey: ['series'] });
      queryClient.invalidateQueries({ queryKey: ['series-list'] });
    },
  });
}
