import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { StatsHistoryResponse } from '@/lib/types/api';

export function useStatsHistory() {
  const { selectedLanguage } = useLanguage();

  return useQuery({
    queryKey: ['stats-history', selectedLanguage],
    queryFn: async () => {
      const res = await fetch(`/api/stats/history?languageCode=${selectedLanguage}`);
      if (!res.ok) throw new Error('Failed to fetch stats history');
      return res.json() as Promise<StatsHistoryResponse>;
    },
    enabled: !!selectedLanguage,
  });
}
