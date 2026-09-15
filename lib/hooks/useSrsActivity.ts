import { useQuery } from '@tanstack/react-query';
import type { SrsActivityResponse } from '@/lib/types/api';

export function useSrsActivity(languageId: string | undefined, days = 30) {
  return useQuery({
    queryKey: ['srs-activity', languageId, days],
    queryFn: async () => {
      const res = await fetch(`/api/srs/activity?languageId=${languageId}&days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch review activity');
      const data: SrsActivityResponse = await res.json();
      return data.buckets;
    },
    enabled: !!languageId,
  });
}
