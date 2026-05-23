'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { LanguageItem } from '@/lib/types/api';

// ============================================================================
// LwtLanguageModal
// Shown before LWT import to let the user confirm which DB language to use.
// Handles the mismatch between LWT native language names (e.g. "Русский") and
// the English names stored in the database ("Russian").
// ============================================================================

interface LwtLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the selected language's DB id */
  onConfirm: (languageId: string) => void;
  /** Raw language name extracted from column 6 of the TSV/TXT file */
  detectedLanguageName: string;
}

export function LwtLanguageModal({
  isOpen,
  onClose,
  onConfirm,
  detectedLanguageName,
}: LwtLanguageModalProps) {
  const [mounted, setMounted] = useState(false);
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [fetching, setFetching] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // SSR guard for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch languages and pre-select best match when modal opens
  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement;

    const load = async () => {
      setFetching(true);
      try {
        const res = await fetch('/api/languages');
        if (!res.ok) return;
        const data = await res.json();
        const list: LanguageItem[] = data.languages ?? [];
        setLanguages(list);

        const match = list.find(
          (l) => l.name.toLowerCase() === detectedLanguageName.toLowerCase()
        );
        setSelectedId(match?.id ?? list[0]?.id ?? '');
      } finally {
        setFetching(false);
      }
    };

    load();
  }, [isOpen, detectedLanguageName]);

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

  // Escape key dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    const selector =
      'button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

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

  const handleConfirm = useCallback(() => {
    if (selectedId) onConfirm(selectedId);
  }, [selectedId, onConfirm]);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const autoMatched =
    languages.length > 0 &&
    languages.some((l) => l.name.toLowerCase() === detectedLanguageName.toLowerCase());

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
          aria-labelledby="lwt-lang-title"
          aria-describedby="lwt-lang-desc"
          className="w-full max-w-md bg-paper rounded-card shadow-modal animate-modal-enter p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="lwt-lang-title" className="font-sans text-ui-lg font-semibold text-ink">
            Confirm Language
          </h2>

          <p id="lwt-lang-desc" className="mt-2 font-sans text-ui-base text-muted">
            {autoMatched ? (
              <>
                The file uses the language name{' '}
                <span className="font-semibold text-ink">&ldquo;{detectedLanguageName}&rdquo;</span>.
                Confirm the language below before importing.
              </>
            ) : (
              <>
                The language name{' '}
                <span className="font-semibold text-ink">&ldquo;{detectedLanguageName}&rdquo;</span>{' '}
                wasn&rsquo;t recognized automatically. Select the matching language to continue.
              </>
            )}
          </p>

          <div className="mt-4">
            <label
              htmlFor="lwt-lang-select"
              className="block font-sans text-ui-sm font-medium text-ink mb-1.5"
            >
              Import as
            </label>

            {fetching ? (
              <div className="flex items-center gap-2 text-muted font-sans text-ui-sm">
                <Loader2 size={14} className="animate-spin" />
                Loading languages…
              </div>
            ) : (
              <select
                id="lwt-lang-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-desk border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              >
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              disabled={fetching || !selectedId}
            >
              Import
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
