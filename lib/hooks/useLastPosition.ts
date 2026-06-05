import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { LastPositionResponse } from '@/lib/types/api';

export function useLastPosition() {
  const { selectedLanguage } = useLanguage();

  return useQuery({
    queryKey: ['last-position', selectedLanguage],
    queryFn: async () => {
      const res = await fetch(`/api/reader/last-position?languageCode=${selectedLanguage}`);
      if (!res.ok) throw new Error('Failed to fetch last position');
      const json = await res.json();
      // Route returns { data: null } when no texts have been read yet
      return (json.data === null ? null : json) as LastPositionResponse | null;
    },
    enabled: !!selectedLanguage,
    staleTime: 30_000,
  });
}
