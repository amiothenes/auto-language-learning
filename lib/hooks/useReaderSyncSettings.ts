import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReaderSyncSettingsPayload, ReaderSyncSettingsResponse } from '@/lib/types/api';

export function useReaderSyncSettings() {
  return useQuery({
    queryKey: ['reader-sync-settings'],
    queryFn: async () => {
      const res = await fetch('/api/reader-settings');
      if (!res.ok) throw new Error('Failed to fetch reader settings');
      const data: ReaderSyncSettingsResponse = await res.json();
      return data.settings;
    },
  });
}

export function useUpdateReaderSyncSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<ReaderSyncSettingsPayload>) => {
      const res = await fetch('/api/reader-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Failed to update reader settings');
      const data: ReaderSyncSettingsResponse = await res.json();
      return data.settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reader-sync-settings'] });
    },
  });
}
