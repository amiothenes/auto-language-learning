import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateLanguageRequest, UpdateLanguageResponse, LanguageItem } from '@/lib/types/api';

const isDemo = !process.env.NEXT_PUBLIC_ADMIN_API_KEY;

export function useUpdateLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateLanguageRequest & { id: string }): Promise<LanguageItem> => {
      if (isDemo) return {} as LanguageItem;
      const { id, ...body } = data;
      const res = await fetch(`/api/languages/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '',
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
