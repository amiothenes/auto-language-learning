import { useQuery } from '@tanstack/react-query';
import type { SentencesListResponse } from '@/lib/types/api';

export function useSentences(textId: string) {
  return useQuery({
    queryKey: ['sentences', textId],
    queryFn: async () => {
      const res = await fetch(`/api/texts/${textId}/sentences`);
      if (!res.ok) throw new Error('Failed to fetch sentences');
      const data: SentencesListResponse = await res.json();
      return data.sentences;
    },
    enabled: !!textId,
  });
}
