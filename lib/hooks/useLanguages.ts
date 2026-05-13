import { useQuery } from '@tanstack/react-query';
import type { LanguagesListResponse } from '@/lib/types/api';

export function useLanguages() {
  return useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const res = await fetch('/api/languages');
      if (!res.ok) throw new Error('Failed to fetch languages');
      const data: LanguagesListResponse = await res.json();
      return data.languages;
    },
  });
}
