'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { useImportText } from '@/lib/hooks/useImportText';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { NewTextData } from '@/lib/types/forms';
import type { ImportTextResponse } from '@/lib/types/api';

// ============================================================================
// NewTextModal Component
// Modal for adding a single text to a series
// ============================================================================

interface NewTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (result: ImportTextResponse) => void;
  prefilledSeriesId?: string; // Pre-select series if provided
  availableSeries: Array<{ id: string; name: string }>; // List of series for dropdown
}

export function NewTextModal({
  isOpen,
  onClose,
  onAdd,
  prefilledSeriesId,
  availableSeries,
}: NewTextModalProps) {
  const { selectedLanguage } = useLanguage();
  const mutation = useImportText();

  const [formData, setFormData] = useState<NewTextData>({
    title: '',
    content: '',
    seriesId: prefilledSeriesId || '',
    tags: [],
  });
  const [tagsInput, setTagsInput] = useState('');
  const [mounted, setMounted] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // SSR guard for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        content: '',
        seriesId: prefilledSeriesId || '',
        tags: [],
      });
      setTagsInput('');
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen, prefilledSeriesId]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Auto-focus on title input when opened
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Restore focus on close
  useEffect(() => {
    if (isOpen) return;
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Escape key dismiss (blocked during import)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !mutation.isPending) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, mutation.isPending]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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

  // Backdrop click handler (blocked during import)
  const handleBackdropClick = useCallback(() => {
    if (!mutation.isPending) onClose();
  }, [onClose, mutation.isPending]);

  // Form validation
  const isFormValid = useMemo(() => {
    return (
      formData.title.trim() !== '' &&
      formData.title.trim().length <= 200 &&
      formData.content.trim().length >= 10 &&
      formData.seriesId !== ''
    );
  }, [formData]);

  const wordCount = useMemo(() => {
    const text = formData.content.trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }, [formData.content]);

  const estimatedParts = wordCount > 750 ? Math.ceil(wordCount / 750) : 1;

  // Parse tags from comma-separated input
  const parseTags = (input: string): string[] => {
    return input
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0 && tag.length <= 30)
      .slice(0, 10); // Max 10 tags
  };

  // Form submission handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isFormValid) return;

      const tags = parseTags(tagsInput);

      try {
        const result = await mutation.mutateAsync({
          title: formData.title.trim(),
          content: formData.content.trim(),
          languageCode: selectedLanguage,
          seriesId: formData.seriesId || undefined,
          tags,
        });

        onAdd?.(result);
        onClose();
      } catch {
        // Error state displayed via mutation.isError — no extra handling needed
      }
    },
    [formData, tagsInput, isFormValid, selectedLanguage, mutation, onAdd, onClose]
  );

  // Character counts for validation feedback
  const titleLength = formData.title.trim().length;
  const contentLength = formData.content.trim().length;

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-ink/40 animate-modal-backdrop-enter"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Dialog Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-text-dialog-title"
          className="w-full max-w-2xl bg-paper rounded-card shadow-modal animate-modal-enter p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Loading Overlay (shown during NLP processing) */}
          {mutation.isPending && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-card overflow-hidden">
              <div className="absolute inset-0 animate-shimmer" />
              <div className="relative text-center">
                <p className="font-sans text-ui-sm font-medium text-ink">
                  {estimatedParts > 1 ? `Processing ${estimatedParts} parts...` : 'Processing text...'}
                </p>
                <p className="font-sans text-ui-xs text-muted mt-1">
                  {estimatedParts > 1 ? 'Running NLP on each part — may take a moment' : 'This may take a few seconds'}
                </p>
              </div>
            </div>
          )}

          {/* Title */}
          <h2
            id="new-text-dialog-title"
            className="font-sans text-ui-lg font-semibold text-ink"
          >
            Add New Text
          </h2>

          {/* Error banner */}
          {mutation.isError && (
            <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded">
              <p className="font-sans text-ui-sm text-red-800">
                {mutation.error?.message || 'Failed to import text. Please try again.'}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Text Title */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Title <span className="text-red-600">*</span>
              </label>
              <input
                ref={titleInputRef}
                type="text"
                placeholder="e.g., Breaking News Article"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                disabled={mutation.isPending}
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
                maxLength={200}
              />
              <p className="font-sans text-ui-xs text-muted mt-1">
                {titleLength}/200 characters
              </p>
            </div>

            {/* Series Selector */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Series <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.seriesId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, seriesId: e.target.value }))
                }
                disabled={mutation.isPending}
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
              >
                <option value="">Select a series...</option>
                {availableSeries.map((series) => (
                  <option key={series.id} value={series.id}>
                    {series.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Text Content */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Content <span className="text-red-600">*</span>
              </label>
              <textarea
                placeholder="Paste the full text content here..."
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                disabled={mutation.isPending}
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-vertical disabled:opacity-50"
                rows={12}
              />
              <p className="font-sans text-ui-xs text-muted mt-1">
                {contentLength < 10 ? (
                  <span className="text-red-600">
                    Minimum 10 characters required ({contentLength}/10)
                  </span>
                ) : estimatedParts > 1 ? (
                  <span>
                    {wordCount.toLocaleString()} words{' '}
                    <span className="text-amber-600 font-medium">· will split into ~{estimatedParts} parts</span>
                  </span>
                ) : (
                  wordCount > 0 ? `${wordCount.toLocaleString()} words` : `${contentLength} characters`
                )}
              </p>
            </div>

            {/* Tags (Optional) */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Tags (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., news, politics, current-events"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                disabled={mutation.isPending}
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
              />
              <p className="font-sans text-ui-xs text-muted mt-1">
                Separate tags with commas. Max 10 tags, each max 30 characters.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!isFormValid || mutation.isPending}
              >
                {mutation.isPending ? 'Importing...' : 'Import Text'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}
