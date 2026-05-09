import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { StatsResponse } from '@/lib/types/api';

export function useStats() {
  const { selectedLanguage } = useLanguage();

  return useQuery({
    queryKey: ['stats', selectedLanguage],
    queryFn: async () => {
      const res = await fetch(`/api/stats?languageCode=${selectedLanguage}`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json() as Promise<StatsResponse>;
    },
    enabled: !!selectedLanguage,
  });
}
