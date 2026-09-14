import { useQuery } from '@tanstack/react-query';
import type { SrsDueCountResponse } from '@/lib/types/api';

/** Lightweight due/new count for the sidebar nav badge. */
export function useSrsDueCount(languageId: string | undefined) {
  return useQuery({
    queryKey: ['srs-due-count', languageId],
    queryFn: async () => {
      const res = await fetch(`/api/srs/due-count?languageId=${languageId}`);
      if (!res.ok) throw new Error('Failed to fetch due count');
      const data: SrsDueCountResponse = await res.json();
      return data.dueCount;
    },
    enabled: !!languageId,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
