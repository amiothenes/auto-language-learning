import { useQuery } from '@tanstack/react-query';

interface AdjacentText {
  id: string;
  title: string;
}

interface AdjacentTextsData {
  prev: AdjacentText | null;
  next: AdjacentText | null;
}

export function useAdjacentTexts(textId: string, sort = 'title-asc') {
  return useQuery({
    queryKey: ['adjacent-texts', textId, sort],
    queryFn: async (): Promise<AdjacentTextsData> => {
      const res = await fetch(`/api/texts/${textId}/adjacent?sort=${sort}`);
      if (!res.ok) throw new Error('Failed to fetch adjacent texts');
      return res.json();
    },
    enabled: !!textId,
  });
}
