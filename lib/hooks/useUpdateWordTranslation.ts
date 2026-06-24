import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { WordInstanceItem } from '@/lib/types/api';

const isDemo = !process.env.NEXT_PUBLIC_ADMIN_API_KEY;

export function useUpdateWordTranslation(textId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wordId, translation }: { wordId: string; translation: string }) => {
      if (isDemo) return undefined;
      const res = await fetch(`/api/words/${wordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '',
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
