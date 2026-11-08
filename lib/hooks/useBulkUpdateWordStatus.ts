import { useMutation, useQueryClient } from '@tanstack/react-query';
import { VocabularyStatus } from '@/lib/types/vocabulary';

// API caps a single request at 500 wordIds — chunk larger lists client-side,
// same approach as app/vocabulary/page.tsx's bulk mutation.
const BULK_UPDATE_CHUNK_SIZE = 500;

export function useBulkUpdateWordStatus(textId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wordIds, status }: { wordIds: string[]; status: VocabularyStatus }) => {
      let updated = 0;
      for (let i = 0; i < wordIds.length; i += BULK_UPDATE_CHUNK_SIZE) {
        const chunk = wordIds.slice(i, i + BULK_UPDATE_CHUNK_SIZE);
        const res = await fetch('/api/vocabulary/bulk-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wordIds: chunk, status }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to update words');
        }
        const data = (await res.json()) as { updated: number };
        updated += data.updated;
      }
      return { updated };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['word-instances'] });
      queryClient.invalidateQueries({ queryKey: ['text', textId] });
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      // Word status changes shift knownPercentage for every text containing the
      // word (see syncAllTextsForWord), so refresh series views too.
      queryClient.invalidateQueries({ queryKey: ['series'] });
      queryClient.invalidateQueries({ queryKey: ['series-list'] });
    },
  });
}
