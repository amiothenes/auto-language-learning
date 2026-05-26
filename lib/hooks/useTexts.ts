import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { TextListItem, TextsListResponse } from '@/lib/types/api';

interface UseTextsOptions {
  sortBy?: 'createdAt' | 'lastViewedAt';
  onlyRead?: boolean;
  staleTime?: number;
}

export function useTexts(limit?: number, options?: UseTextsOptions) {
  const { selectedLanguage } = useLanguage();
  const { staleTime, ...queryOptions } = options ?? {};

  return useQuery({
    queryKey: ['texts', { languageCode: selectedLanguage, limit, ...queryOptions }],
    queryFn: async () => {
      const params = new URLSearchParams({ languageCode: selectedLanguage });
      if (limit !== undefined) params.set('limit', String(limit));
      if (queryOptions.sortBy) params.set('sortBy', queryOptions.sortBy);
      if (queryOptions.onlyRead) params.set('onlyRead', 'true');
      const res = await fetch(`/api/texts?${params}`);
      if (!res.ok) throw new Error('Failed to fetch texts');
      const data: TextsListResponse = await res.json();
      return data.texts as TextListItem[];
    },
    enabled: !!selectedLanguage,
    ...(staleTime !== undefined ? { staleTime } : {}),
  });
}
