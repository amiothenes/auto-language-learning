import { useQuery } from '@tanstack/react-query';

export function useSentenceTranslation(sentenceId: string | null) {
  return useQuery({
    queryKey: ['sentence-translation', sentenceId],
    queryFn: async () => {
      const res = await fetch('/api/translations/sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentenceId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to translate sentence');
      }
      const data: { translation: string | null } = await res.json();
      return data.translation;
    },
    enabled: false,
    staleTime: Infinity,
    retry: false,
  });
}
