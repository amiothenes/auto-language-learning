import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { Series } from '@/lib/types/content';
import type { SeriesListResponse } from '@/lib/types/api';

export function useSeriesList() {
  const { selectedLanguage } = useLanguage();

  return useQuery({
    queryKey: ['series-list', selectedLanguage],
    queryFn: async () => {
      const res = await fetch(`/api/series?languageCode=${selectedLanguage}`);
      if (!res.ok) throw new Error('Failed to fetch series list');
      const data: SeriesListResponse = await res.json();
      return data.series as Series[];
    },
    enabled: !!selectedLanguage,
  });
}
