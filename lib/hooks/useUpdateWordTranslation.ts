import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { WordInstanceItem } from '@/lib/types/api';

export function useUpdateWordTranslation(textId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wordId, translation }: { wordId: string; translation: string }) => {
      const res = await fetch(`/api/words/${wordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ translation }),
      });
      if (!res.ok) throw new Error('Failed to update translation');
      return res.json() as Promise<{ wordId: string; translation: string }>;
    },
    onSuccess: (_, { wordId, translation }) => {
      queryClient.setQueryData<WordInstanceItem[]>(['word-instances', textId], (old) =>
        old?.map((inst) => inst.wordId === wordId ? { ...inst, translation } : inst) ?? old
      );
    },
  });
}
