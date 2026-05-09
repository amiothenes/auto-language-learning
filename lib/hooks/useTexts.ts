import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { TextListItem, TextsListResponse } from '@/lib/types/api';

export function useTexts(limit?: number) {
  const { selectedLanguage } = useLanguage();

  return useQuery({
    queryKey: ['texts', { languageCode: selectedLanguage, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({ languageCode: selectedLanguage });
      if (limit !== undefined) params.set('limit', String(limit));
      const res = await fetch(`/api/texts?${params}`);
      if (!res.ok) throw new Error('Failed to fetch texts');
      const data: TextsListResponse = await res.json();
      return data.texts as TextListItem[];
    },
    enabled: !!selectedLanguage,
  });
}
