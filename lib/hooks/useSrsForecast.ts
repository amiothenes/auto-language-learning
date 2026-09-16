import { useQuery } from '@tanstack/react-query';
import type { SrsForecastResponse } from '@/lib/types/api';

export function useSrsForecast(languageId: string | undefined, days = 14) {
  return useQuery({
    queryKey: ['srs-forecast', languageId, days],
    queryFn: async () => {
      const res = await fetch(`/api/srs/forecast?languageId=${languageId}&days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch review forecast');
      const data: SrsForecastResponse = await res.json();
      return data.buckets;
    },
    enabled: !!languageId,
  });
}
