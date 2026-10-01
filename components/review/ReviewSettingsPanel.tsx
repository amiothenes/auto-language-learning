'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSrsSettings, useUpdateSrsSettings } from '@/lib/hooks/useSrsSettings';
import { useAutoSaveToast } from '@/components/ui/AutoSaveToast';
import { ReviewSettingsFields } from './ReviewSettingsFields';
import type { SrsSettingsPayload } from '@/lib/types/api';

// ============================================================================
// ReviewSettingsPanel — popover from the gear button in the Review page
// header. Mirrors ReaderSettingsPanel's shell mechanics (anchored popover,
// closes on outside click/Escape/✕) but with no tabs — just the one flat
// field list from ReviewSettingsFields.
// ============================================================================

interface ReviewSettingsPanelProps {
  anchorEl: HTMLButtonElement;
  languageId: string;
  onClose: () => void;
}

const PANEL_W = 296;
const GAP = 8;

export function ReviewSettingsPanel({ anchorEl, languageId, onClose }: ReviewSettingsPanelProps) {
  const router = useRouter();
  const { data: settings, isLoading } = useSrsSettings(languageId);
  const updateSettings = useUpdateSrsSettings(languageId);
  const { showSaved, showError, ToastComponent } = useAutoSaveToast();
  const panelRef = useRef<HTMLDivElement>(null);

  function patch(update: Partial<SrsSettingsPayload>) {
    updateSettings.mutate(update, {
      onSuccess: showSaved,
      onError: () => showError('Failed to save review settings'),
    });
  }

  const rect = anchorEl.getBoundingClientRect();
  const left = Math.max(8, Math.min(rect.right - PANEL_W, window.innerWidth - PANEL_W - 8));
  const top = rect.bottom + GAP;

  useEffect(() => {
    const t = setTimeout(() => {
      const handler = (e: MouseEvent) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node) && !anchorEl.contains(e.target as Node)) {
          onClose();
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, 10);
    return () => clearTimeout(t);
  }, [onClose, anchorEl]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-[50]" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-label="Review settings"
        className="fixed z-[51] bg-paper border border-border rounded-card shadow-modal p-4"
        style={{ top, left, width: PANEL_W }}
      >
        <div
          className="absolute -top-[5px] right-3 w-2.5 h-2.5 bg-paper border-l border-t border-border rotate-45"
          aria-hidden="true"
        />

        <div className="flex items-center justify-between mb-4">
          <p className="font-sans text-ui-sm font-semibold text-ink">Review Settings</p>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors -mr-1 p-0.5 cursor-pointer">
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        {isLoading || !settings ? (
          <div className="space-y-3 animate-pulse">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 bg-desk rounded" />
            ))}
          </div>
        ) : (
          <ReviewSettingsFields settings={settings} onChange={patch} onMoreSettings={() => router.push('/settings/review')} />
        )}
      </div>

      {ToastComponent}
    </>
  );
}
