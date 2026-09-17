'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';

// ============================================================================
// BulkTagModal — adds tags to multiple texts at once. Additive only: existing
// tags on each text are kept, unlike the single-text EditTextModal which
// replaces a text's whole tag set.
// ============================================================================

interface BulkTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
  onConfirm: (tagNames: string[]) => Promise<void> | void;
}

function parseTags(input: string): string[] {
  const seen = new Set<string>();
  for (const raw of input.split(',')) {
    const t = raw.trim();
    if (t.length > 0 && t.length <= 30) seen.add(t);
    if (seen.size >= 10) break;
  }
  return Array.from(seen);
}

export function BulkTagModal({ isOpen, onClose, count, onConfirm }: BulkTagModalProps) {
  const [tagsInput, setTagsInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      setTagsInput('');
      setIsLoading(false);
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
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

  const parsedTags = parseTags(tagsInput);

  const handleConfirm = useCallback(async () => {
    if (parsedTags.length === 0) return;
    setIsLoading(true);
    try {
      await onConfirm(parsedTags);
    } finally {
      setIsLoading(false);
    }
  }, [parsedTags, onConfirm]);

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
          aria-labelledby="bulk-tag-dialog-title"
          className="w-full max-w-md bg-paper rounded-card shadow-modal animate-modal-enter p-6 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="bulk-tag-dialog-title" className="font-sans text-ui-lg font-semibold text-ink">
            Add tags to {count} text{count === 1 ? '' : 's'}
          </h2>
          <p className="mt-2 font-sans text-ui-sm text-muted">
            Tags are added alongside each text&apos;s existing tags — nothing already applied gets removed.
          </p>

          <div className="mt-4">
            <label className="block font-sans text-ui-sm text-ink mb-1.5">
              Tags (comma-separated)
            </label>
            <input
              ref={inputRef}
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="news, easy, favorites"
              disabled={isLoading}
              className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-desk border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" size="md" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              disabled={isLoading || parsedTags.length === 0}
              leftIcon={isLoading ? <Loader2 size={16} className="animate-spin" strokeWidth={2} /> : undefined}
            >
              Add Tags
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
