import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { TextListItem, TextsListResponse } from '@/lib/types/api';

interface UseTextsOptions {
  sortBy?: 'createdAt' | 'lastViewedAt';
  onlyRead?: boolean;
}

export function useTexts(limit?: number, options?: UseTextsOptions) {
  const { selectedLanguage } = useLanguage();

  return useQuery({
    queryKey: ['texts', { languageCode: selectedLanguage, limit, ...options }],
    queryFn: async () => {
      const params = new URLSearchParams({ languageCode: selectedLanguage });
      if (limit !== undefined) params.set('limit', String(limit));
      if (options?.sortBy) params.set('sortBy', options.sortBy);
      if (options?.onlyRead) params.set('onlyRead', 'true');
      const res = await fetch(`/api/texts?${params}`);
      if (!res.ok) throw new Error('Failed to fetch texts');
      const data: TextsListResponse = await res.json();
      return data.texts as TextListItem[];
    },
    enabled: !!selectedLanguage,
  });
}
