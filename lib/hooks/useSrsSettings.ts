import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SrsSettingsPayload, SrsSettingsResponse } from '@/lib/types/api';

export function useSrsSettings(languageId: string | undefined) {
  return useQuery({
    queryKey: ['srs-settings', languageId],
    queryFn: async () => {
      const res = await fetch(`/api/srs/settings?languageId=${languageId}`);
      if (!res.ok) throw new Error('Failed to fetch review settings');
      const data: SrsSettingsResponse = await res.json();
      return data.settings;
    },
    enabled: !!languageId,
  });
}

export function useUpdateSrsSettings(languageId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<SrsSettingsPayload>) => {
      const res = await fetch(`/api/srs/settings?languageId=${languageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Failed to update review settings');
      const data: SrsSettingsResponse = await res.json();
      return data.settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['srs-settings', languageId] });
      queryClient.invalidateQueries({ queryKey: ['srs-session', languageId] });
      queryClient.invalidateQueries({ queryKey: ['srs-due-count', languageId] });
    },
  });
}
