'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';

// ============================================================================
// ReaderGuideModal
// Static help content behind the Reader Settings panel's "Reader Guide"
// link — explains the status-color legend, tap-to-grade, and the Tutor/TTS
// features. Same portal + focus-trap shell as ConfirmDialog/LwtLanguageModal,
// just informational (no confirm action).
// ============================================================================

interface ReaderGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_LEGEND = [
  { color: 'hsl(205,80%,58%)', label: 'Unknown', note: 'imported, not yet reviewed' },
  { color: 'hsl(2,75%,60%)', label: 'Newly Seen', note: 'just graded for the first time' },
  { color: 'hsl(32,90%,56%)', label: 'Familiar', note: 'recognized, still shaky' },
  { color: 'hsl(78,60%,48%)', label: 'Known', note: 'solid' },
  { color: 'hsl(150,40%,42%)', label: 'Well Known', note: 'I know this perfectly, no highlight shown' },
  { color: 'hsl(0,0%,50%)', label: 'Ignored', note: 'proper noun or skip, excluded from stats' },
];

export function ReaderGuideModal({ isOpen, onClose }: ReaderGuideModalProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const firstButton = dialogRef.current?.querySelector('button') as HTMLElement | null;
      firstButton?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) return;
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    const focusableSelector =
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusableElements = dialogEl.querySelectorAll(focusableSelector);
      if (focusableElements.length === 0) return;

      const first = focusableElements[0] as HTMLElement;
      const last = focusableElements[focusableElements.length - 1] as HTMLElement;

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
    onClose();
  }, [onClose]);

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
          aria-labelledby="reader-guide-title"
          className="w-full max-w-md bg-paper rounded-card shadow-modal animate-modal-enter p-6 pointer-events-auto max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="reader-guide-title" className="font-sans text-ui-lg font-semibold text-ink">
              Reader Guide
            </h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-ink transition-colors p-0.5 -mr-1 cursor-pointer"
              aria-label="Close"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>

          <div className="space-y-5">
            <section>
              <p className="font-sans text-ui-sm font-medium text-ink mb-2">Word status colors</p>
              <ul className="space-y-1.5">
                {STATUS_LEGEND.map((item) => (
                  <li key={item.label} className="flex items-start gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                      style={{ background: item.color }}
                    />
                    <span className="font-sans text-ui-sm text-ink">
                      {item.label}
                      <span className="text-muted"> · {item.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <p className="font-sans text-ui-sm font-medium text-ink mb-1">Tap any word</p>
              <p className="font-sans text-ui-sm text-muted">
                See its lemma (dictionary form), grammar (case, tense, aspect from the
                sentence it&apos;s in), and translation, then grade how well you know it.
              </p>
            </section>

            <section>
              <p className="font-sans text-ui-sm font-medium text-ink mb-1">Tutor mode and audio</p>
              <p className="font-sans text-ui-sm text-muted">
                Narration can pause on words below a status threshold so you grade them
                before it continues: configure this under the Audio tab in Settings.
                Tap the speaker icon in a word&apos;s popup to hear it pronounced.
              </p>
            </section>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="primary" size="md" onClick={onClose}>
              Got it
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
