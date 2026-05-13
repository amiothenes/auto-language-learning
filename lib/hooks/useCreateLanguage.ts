import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateLanguageResponse, LanguageItem } from '@/lib/types/api';
import type { NewLanguageData } from '@/components/settings/AddLanguageModal';

export function useCreateLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: NewLanguageData): Promise<LanguageItem> => {
      const res = await fetch('/api/languages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '',
        },
        body: JSON.stringify({
          name: data.name,
          code: data.code,
          isRTL: data.rtl,
          dictURI: data.dictUri,
          googleTTSCode: data.ttsCode,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Failed to create language');
      }
      const result: CreateLanguageResponse = await res.json();
      return result.language;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
    },
  });
}
