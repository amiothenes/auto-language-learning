import { useQuery } from '@tanstack/react-query';
import type { SeriesDetailResponse } from '@/lib/types/api';

export function useSeries(seriesId: string) {
  return useQuery({
    queryKey: ['series', seriesId],
    queryFn: async () => {
      const res = await fetch(`/api/series/${seriesId}`);
      if (!res.ok) throw new Error('Failed to fetch series');
      const data: SeriesDetailResponse = await res.json();
      return data.series;
    },
    enabled: !!seriesId,
  });
}
