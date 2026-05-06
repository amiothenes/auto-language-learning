import { useQuery } from '@tanstack/react-query';
import type { TextDetailResponse } from '@/lib/types/api';

export function useText(textId: string) {
  return useQuery({
    queryKey: ['text', textId],
    queryFn: async () => {
      const res = await fetch(`/api/texts/${textId}`);
      if (!res.ok) throw new Error('Failed to fetch text');
      const data: TextDetailResponse = await res.json();
      return data.text;
    },
    enabled: !!textId,
  });
}
