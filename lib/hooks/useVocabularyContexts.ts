import { useQuery } from '@tanstack/react-query';
import type { VocabularyContextsResponse } from '@/lib/types/api';

export function useVocabularyContexts(wordId: string) {
  return useQuery({
    queryKey: ['vocabulary-contexts', wordId],
    queryFn: async () => {
      const res = await fetch(`/api/vocabulary/${wordId}/contexts`);
      if (!res.ok) throw new Error('Failed to fetch word contexts');
      return res.json() as Promise<VocabularyContextsResponse>;
    },
    enabled: !!wordId,
  });
}
