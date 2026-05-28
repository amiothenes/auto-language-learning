'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { VocabularyItem } from '@/lib/types';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: {
  value: VocabularyStatus;
  label: string;
  bgColor: string;
  textColor: string;
}[] = [
  { value: VocabularyStatus.UNKNOWN,    label: 'Unknown',    bgColor: 'hsla(0, 0%, 60%, 0.25)',   textColor: '#6E6D6A' },
  { value: VocabularyStatus.NEWLY_SEEN, label: 'Newly Seen', bgColor: 'hsla(0, 70%, 55%, 0.6)',   textColor: '#8B2020' },
  { value: VocabularyStatus.FAMILIAR,   label: 'Familiar',   bgColor: 'hsla(45, 85%, 55%, 0.6)',  textColor: '#8B6914' },
  { value: VocabularyStatus.KNOWN,      label: 'Known',      bgColor: 'hsla(145, 60%, 40%, 0.5)', textColor: '#1E6B3E' },
  { value: VocabularyStatus.WELL_KNOWN, label: 'Well Known', bgColor: 'hsla(145, 60%, 40%, 0.3)', textColor: '#1E6B3E' },
  { value: VocabularyStatus.IGNORE,     label: 'Ignore',     bgColor: 'hsla(0, 0%, 50%, 0.2)',    textColor: '#6E6D6A' },
];

interface EditVocabularyModalProps {
  isOpen: boolean;
  item: VocabularyItem | null;
  onClose: () => void;
  onSave: () => void;
}

export function EditVocabularyModal({ isOpen, item, onClose, onSave }: EditVocabularyModalProps) {
  const [status, setStatus] = useState<VocabularyStatus>(VocabularyStatus.UNKNOWN);
  const [translation, setTranslation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Reset form to item values whenever the modal opens with a new item
  useEffect(() => {
    if (isOpen && item) {
      setStatus(item.status);
      setTranslation(item.translation ?? '');
      setError(null);
      setIsSubmitting(false);
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen, item]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Restore focus on close
  useEffect(() => {
    if (isOpen) return;
    previousFocusRef.current?.focus();
    previousFocusRef.current = null;
  }, [isOpen]);

  // Escape key dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;
    const sel = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const els = dialogEl.querySelectorAll(sel);
      if (!els.length) return;
      const first = els[0] as HTMLElement;
      const last = els[els.length - 1] as HTMLElement;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/words/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '',
        },
        body: JSON.stringify({ status, translation }),
      });
      if (!res.ok) throw new Error('Failed to update word');
      onSave();
    } catch {
      setError('Failed to save changes. Please try again.');
      setIsSubmitting(false);
    }
  }, [item, status, translation, isSubmitting, onSave]);

  if (!mounted || !isOpen || !item) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-ink/40 animate-modal-backdrop-enter"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-vocabulary-dialog-title"
          className="w-full max-w-lg bg-paper rounded-card shadow-modal animate-modal-enter p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2
            id="edit-vocabulary-dialog-title"
            className="font-sans text-ui-lg font-semibold text-ink"
          >
            Edit Vocabulary
          </h2>
          <p className="font-sans text-ui-sm text-muted mt-0.5">{item.lemma}</p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {/* Status — visual button-grid so users can see actual highlight colors */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={cn(
                      'px-3 py-2 rounded font-sans text-ui-xs font-medium transition-all text-center',
                      status === opt.value
                        ? 'ring-2 ring-primary ring-offset-1 scale-[1.03]'
                        : 'opacity-60 hover:opacity-90'
                    )}
                    style={{ backgroundColor: opt.bgColor, color: opt.textColor }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Translation */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Translation
              </label>
              <input
                type="text"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="Translation in your native language"
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                maxLength={200}
              />
            </div>

            {error && (
              <p className="font-sans text-ui-xs text-red-600">{error}</p>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}
