import { useMutation } from '@tanstack/react-query';
import type { ImportTextRequest, ImportTextResponse } from '@/lib/types/api';

/**
 * TanStack Query mutation hook for importing text
 *
 * Features:
 * - Automatic retry on network failure (configured in queryClient)
 * - Loading/error states managed automatically
 * - Type-safe request/response
 *
 * Usage:
 * ```tsx
 * const mutation = useImportText();
 *
 * await mutation.mutateAsync({
 *   title: 'My Text',
 *   content: 'Lorem ipsum...',
 *   languageId: 'lang-123',
 *   seriesId: 'series-456',
 *   tags: ['tag1', 'tag2']
 * });
 *
 * if (mutation.isPending) { ... }
 * if (mutation.isError) { ... }
 * if (mutation.isSuccess) { ... }
 * ```
 */
export function useImportText() {
  return useMutation({
    mutationFn: async (data: ImportTextRequest): Promise<ImportTextResponse> => {
      const response = await fetch('/api/texts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      return response.json();
    },
  });
}
