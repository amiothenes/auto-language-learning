import { useMutation } from '@tanstack/react-query';
import type { FetchUrlRequest, FetchUrlResponse } from '@/lib/types/api';

const isDemo = !process.env.NEXT_PUBLIC_ADMIN_API_KEY;

export function useFetchUrl() {
  return useMutation({
    mutationFn: async (data: FetchUrlRequest): Promise<FetchUrlResponse> => {
      if (isDemo) return { title: '', content: '', resolvedUrl: '', detectedLang: '' };
      const response = await fetch('/api/texts/fetch-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch URL');
      }

      return response.json();
    },
  });
}
