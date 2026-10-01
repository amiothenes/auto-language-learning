'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSrsSettings, useUpdateSrsSettings } from '@/lib/hooks/useSrsSettings';
import { useAutoSaveToast } from '@/components/ui/AutoSaveToast';
import { ReviewSettingsFields } from './ReviewSettingsFields';
import type { SrsSettingsPayload } from '@/lib/types/api';

// ============================================================================
// MobileReviewSettingsSheet — bottom-sheet variant of ReviewSettingsPanel for
// mobile/tablet (<1280px). Mirrors MobileSettingsSheet's drag-to-dismiss shell
// mechanics, rendering the same ReviewSettingsFields content.
// ============================================================================

interface MobileReviewSettingsSheetProps {
  languageId: string;
  onClose: () => void;
}

export function MobileReviewSettingsSheet({ languageId, onClose }: MobileReviewSettingsSheetProps) {
  const router = useRouter();
  const { data: settings, isLoading } = useSrsSettings(languageId);
  const updateSettings = useUpdateSrsSettings(languageId);
  const { showSaved, showError, ToastComponent } = useAutoSaveToast();

  const [dismissing, setDismissing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const draggingRef = useRef(false);
  const touchStartY = useRef(0);

  function patch(update: Partial<SrsSettingsPayload>) {
    updateSettings.mutate(update, {
      onSuccess: showSaved,
      onError: () => showError('Failed to save review settings'),
    });
  }

  const dismiss = () => {
    if (dismissing) return;
    setDismissing(true);
    setTimeout(onClose, 220);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    draggingRef.current = true;
  };
  const handleDragMove = (e: React.TouchEvent) => {
    if (!draggingRef.current) return;
    setDragY(Math.max(0, e.touches[0].clientY - touchStartY.current));
  };
  const handleDragEnd = () => {
    draggingRef.current = false;
    if (dragY > 80) dismiss();
    else setDragY(0);
  };

  const sheetStyle: React.CSSProperties = dismissing
    ? { transform: 'translateY(100%)', transition: 'transform 0.22s ease-in' }
    : {
        transform: dragY ? `translateY(${dragY}px)` : undefined,
        transition: dragY ? 'none' : 'transform 0.2s cubic-bezier(0,0,.2,1)',
      };

  return (
    <>
      <div className="fixed inset-0 z-55 bg-ink/30 backdrop-blur-[2px]" onClick={dismiss} aria-hidden="true" />

      <div
        className="fixed bottom-0 inset-x-0 z-56 bg-paper rounded-t-2xl shadow-modal h-[76dvh] flex flex-col overflow-hidden xl:hidden animate-slide-up"
        style={sheetStyle}
        role="dialog"
        aria-modal="true"
        aria-label="Review settings"
      >
        <div
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          className="shrink-0 touch-none cursor-grab active:cursor-grabbing"
        >
          <div className="pt-3 pb-1 flex justify-center">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-sans text-ui-sm font-semibold text-ink">Review Settings</p>
            <button
              onClick={dismiss}
              className="text-muted hover:text-ink transition-colors p-1 -mr-1 cursor-pointer"
              aria-label="Close settings"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4">
          {isLoading || !settings ? (
            <div className="space-y-3 animate-pulse">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 bg-desk rounded" />
              ))}
            </div>
          ) : (
            <ReviewSettingsFields
              settings={settings}
              onChange={patch}
              onMoreSettings={() => {
                router.push('/settings/review');
                dismiss();
              }}
            />
          )}
        </div>
      </div>

      {ToastComponent}
    </>
  );
}
