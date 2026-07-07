import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateLanguageRequest, UpdateLanguageResponse, LanguageItem } from '@/lib/types/api';

export function useUpdateLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateLanguageRequest & { id: string }): Promise<LanguageItem> => {
      const { id, ...body } = data;
      const res = await fetch(`/api/languages/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Failed to update language');
      }
      const result: UpdateLanguageResponse = await res.json();
      return result.language;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
    },
  });
}
