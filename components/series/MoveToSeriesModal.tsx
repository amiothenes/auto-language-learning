'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';

// ============================================================================
// MoveToSeriesModal — moves selected texts to a different series. Texts
// always belong to exactly one series (seriesId is NOT NULL), so this is a
// "move," never a "remove from series."
// ============================================================================

interface MoveToSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
  /** Already excludes the current series — pass only the valid move targets. */
  availableSeries: Array<{ id: string; name: string; textCount: number }>;
  onConfirm: (targetSeriesId: string) => Promise<void> | void;
}

export function MoveToSeriesModal({
  isOpen,
  onClose,
  count,
  availableSeries,
  onConfirm,
}: MoveToSeriesModalProps) {
  const [targetSeriesId, setTargetSeriesId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      setTargetSeriesId('');
      setIsLoading(false);
    }
  }, [isOpen]);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  const handleConfirm = useCallback(async () => {
    if (!targetSeriesId) return;
    setIsLoading(true);
    try {
      await onConfirm(targetSeriesId);
    } finally {
      setIsLoading(false);
    }
  }, [targetSeriesId, onConfirm]);

  const handleBackdropClick = useCallback(() => {
    if (!isLoading) onClose();
  }, [isLoading, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50 bg-ink/40 animate-modal-backdrop-enter"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="move-series-dialog-title"
          className="w-full max-w-md bg-paper rounded-card shadow-modal animate-modal-enter p-6 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="move-series-dialog-title" className="font-sans text-ui-lg font-semibold text-ink">
            Move {count} text{count === 1 ? '' : 's'}
          </h2>
          <p className="mt-2 font-sans text-ui-sm text-muted">
            Choose a destination series. The moved texts are appended after that series&apos;s existing texts.
          </p>

          <div className="mt-4">
            {availableSeries.length === 0 ? (
              <p className="font-sans text-ui-sm text-muted">
                You don&apos;t have any other series to move texts into.
              </p>
            ) : (
              <select
                value={targetSeriesId}
                onChange={(e) => setTargetSeriesId(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
              >
                <option value="">Select a series...</option>
                {availableSeries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.textCount} text{s.textCount === 1 ? '' : 's'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" size="md" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              disabled={isLoading || !targetSeriesId}
              leftIcon={isLoading ? <Loader2 size={16} className="animate-spin" strokeWidth={2} /> : undefined}
            >
              Move
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
