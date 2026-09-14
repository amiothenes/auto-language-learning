import { useQuery } from '@tanstack/react-query';
import type { SrsSessionResponse } from '@/lib/types/api';

export function useSrsSession(languageId: string | undefined) {
  return useQuery({
    queryKey: ['srs-session', languageId],
    queryFn: async () => {
      const res = await fetch(`/api/srs/session?languageId=${languageId}`);
      if (!res.ok) throw new Error('Failed to fetch review session');
      return res.json() as Promise<SrsSessionResponse>;
    },
    enabled: !!languageId,
  });
}
