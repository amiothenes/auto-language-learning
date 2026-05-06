import { useQuery } from '@tanstack/react-query';
import type { WordInstancesResponse } from '@/lib/types/api';

export function useWordInstances(textId: string) {
  return useQuery({
    queryKey: ['word-instances', textId],
    queryFn: async () => {
      const res = await fetch(`/api/texts/${textId}/word-instances`);
      if (!res.ok) throw new Error('Failed to fetch word instances');
      const data: WordInstancesResponse = await res.json();
      return data.instances;
    },
    enabled: !!textId,
  });
}
