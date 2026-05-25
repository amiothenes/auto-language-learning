import { useMutation, useQueryClient } from '@tanstack/react-query';
import { VocabularyStatus } from '@/lib/types/vocabulary';

const isDemo = !process.env.NEXT_PUBLIC_ADMIN_API_KEY;

export function useUpdateWordStatus(textId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wordId, status }: { wordId: string; status: VocabularyStatus }) => {
      if (isDemo) return undefined as unknown as { wordId: string; status: VocabularyStatus };
      const res = await fetch(`/api/words/${wordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '',
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update word status');
      return res.json() as Promise<{ wordId: string; status: VocabularyStatus }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['word-instances'] });
      queryClient.invalidateQueries({ queryKey: ['text', textId] });
    },
  });
}
