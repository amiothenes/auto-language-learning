import { useQuery } from '@tanstack/react-query';

interface AdjacentText {
  id: string;
  title: string;
}

interface AdjacentTextsData {
  prev: AdjacentText | null;
  next: AdjacentText | null;
}

export function useAdjacentTexts(textId: string) {
  return useQuery({
    queryKey: ['adjacent-texts', textId],
    queryFn: async (): Promise<AdjacentTextsData> => {
      const res = await fetch(`/api/texts/${textId}/adjacent`);
      if (!res.ok) throw new Error('Failed to fetch adjacent texts');
      return res.json();
    },
    enabled: !!textId,
  });
}
