import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { VocabularyItem, VocabularyStatus } from '@/lib/types/vocabulary';

interface VocabularyFilters {
  search?: string;
  status?: VocabularyStatus;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface VocabularyResponse {
  words: VocabularyItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useVocabulary(filters: VocabularyFilters = {}) {
  const { selectedLanguage } = useLanguage();

  return useQuery({
    queryKey: ['vocabulary', selectedLanguage, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ languageCode: selectedLanguage });
      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));

      const res = await fetch(`/api/vocabulary?${params}`);
      if (!res.ok) throw new Error('Failed to fetch vocabulary');
      return res.json() as Promise<VocabularyResponse>;
    },
    enabled: !!selectedLanguage,
  });
}
