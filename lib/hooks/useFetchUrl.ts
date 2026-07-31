import { useMutation } from '@tanstack/react-query';
import type { FetchUrlRequest, FetchUrlResponse } from '@/lib/types/api';

export function useFetchUrl() {
  return useMutation({
    mutationFn: async (data: FetchUrlRequest): Promise<FetchUrlResponse> => {
      const response = await fetch('/api/texts/fetch-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw Object.assign(new Error(error.error || 'Failed to fetch URL'), { status: response.status });
      }

      return response.json();
    },
  });
}
