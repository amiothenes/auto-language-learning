'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';

// ============================================================================
// EditSeriesModal Component
// Modal for editing series name + description.
// Receives initial values as props (already in memory on the list page).
// PATCHes /api/series/[id] on submit, then calls onSaved() for parent to refetch.
// ============================================================================

interface EditSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesId: string;
  initialName: string;
  initialDescription: string;
  onSaved: () => void;
}

export function EditSeriesModal({
  isOpen,
  onClose,
  seriesId,
  initialName,
  initialDescription,
  onSaved,
}: EditSeriesModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form to initial values when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setName(initialName);
    setDescription(initialDescription);
    setSaveError(null);
    previousFocusRef.current = document.activeElement as HTMLElement;
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen, initialName, initialDescription]);

  // Restore focus on close
  useEffect(() => {
    if (isOpen) return;
    previousFocusRef.current?.focus();
    previousFocusRef.current = null;
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    const selector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const els = dialogEl.querySelectorAll(selector);
      if (els.length === 0) return;
      const first = els[0] as HTMLElement;
      const last = els[els.length - 1] as HTMLElement;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleBackdropClick = useCallback(() => {
    if (!isSaving) onClose();
  }, [isSaving, onClose]);

  const isFormValid = useMemo(
    () => name.trim().length > 0 && name.trim().length <= 100,
    [name]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isFormValid) return;

      setSaveError(null);
      setIsSaving(true);

      try {
        const res = await fetch(`/api/series/${seriesId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
          }),
        });

        if (!res.ok) {
          const data = await res.json() as { error?: string };
          throw new Error(data.error ?? 'Failed to save changes');
        }

        onSaved();
        onClose();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
      } finally {
        setIsSaving(false);
      }
    },
    [isFormValid, seriesId, name, description, onSaved, onClose]
  );

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-ink/40 animate-modal-backdrop-enter"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-series-dialog-title"
          className="w-full max-w-lg bg-paper rounded-card shadow-modal animate-modal-enter p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2
            id="edit-series-dialog-title"
            className="font-sans text-ui-lg font-semibold text-ink"
          >
            Edit Series
          </h2>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {saveError && (
              <div className="px-3 py-2 bg-danger/10 border border-danger/30 rounded">
                <p className="font-sans text-ui-sm text-danger">{saveError}</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Name <span className="text-danger">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                placeholder="Series name"
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
                maxLength={100}
              />
              <p className="font-sans text-ui-xs text-muted mt-1">
                {name.trim().length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                placeholder="A short description of this series"
                rows={3}
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 resize-none"
                maxLength={500}
              />
              <p className="font-sans text-ui-xs text-muted mt-1">
                {description.trim().length}/500 characters
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!isFormValid || isSaving}
              >
                {isSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}
