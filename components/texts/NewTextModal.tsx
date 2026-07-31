'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Toast, useToast } from '@/components/ui/Toast';
import { useImportText } from '@/lib/hooks/useImportText';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { NewTextData } from '@/lib/types/forms';
import type { ImportTextResponse } from '@/lib/types/api';

// ============================================================================
// NewTextModal Component
// Modal for adding a single text to a series
// ============================================================================

const IMPORT_STAGES = [
  'Tokenizing text…',
  'Lemmatizing words…',
  'Romanizing script…',
  'Saving to database…',
] as const;

interface NewTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (result: ImportTextResponse) => void;
  prefilledSeriesId?: string;
  availableSeries: Array<{ id: string; name: string; textCount: number }>;
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
  const { toast, showToast, hideToast } = useToast();
  const [isRateLimited, setIsRateLimited] = useState(false);
  const lockedSeriesName = prefilledSeriesId
    ? availableSeries.find((s) => s.id === prefilledSeriesId)?.name
    : null;

  const [formData, setFormData] = useState<NewTextData>({
    title: '',
    content: '',
    seriesId: prefilledSeriesId || '',
    tags: [],
  });
  const [tagsInput, setTagsInput] = useState('');
  const [userEditedTitle, setUserEditedTitle] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
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
      const initialSeries = prefilledSeriesId
        ? availableSeries.find((s) => s.id === prefilledSeriesId)
        : undefined;
      const initialTitle = initialSeries
        ? `${initialSeries.name} #${initialSeries.textCount + 1}`
        : '';
      setFormData({
        title: initialTitle,
        content: '',
        seriesId: prefilledSeriesId || '',
        tags: [],
      });
      setTagsInput('');
      setUserEditedTitle(false);
      setIsRateLimited(false);
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen, prefilledSeriesId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Cycle through NLP stage labels while mutation is pending
  useEffect(() => {
    if (!mutation.isPending) {
      setStageIndex(0);
      return;
    }
    if (stageIndex >= IMPORT_STAGES.length - 1) return;
    const timer = setTimeout(() => setStageIndex((prev) => prev + 1), 3000);
    return () => clearTimeout(timer);
  }, [mutation.isPending, stageIndex]);

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

  // Derived series info
  const selectedSeries = availableSeries.find((s) => s.id === formData.seriesId) ?? null;
  const nextNumber = selectedSeries ? selectedSeries.textCount + 1 : null;

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
      .slice(0, 10);
  };

  // Form submission handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isFormValid) return;

      const tags = parseTags(tagsInput);
      setIsRateLimited(false);

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
      } catch (err) {
        if (err instanceof Error && (err as Error & { status?: number }).status === 429) {
          setIsRateLimited(true);
          showToast(err.message, 'error');
        }
        // Non-429 errors are displayed via the inline mutation.isError banner
      }
    },
    [formData, tagsInput, isFormValid, selectedLanguage, mutation, onAdd, onClose, showToast]
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
          className="relative w-full max-w-2xl bg-paper rounded-card shadow-modal animate-modal-enter p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* NLP Processing Overlay */}
          {mutation.isPending && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-card overflow-hidden">
              <div className="absolute inset-0 animate-shimmer" />
              <div className="relative text-center px-6">
                <img
                  src="/illustrations/quill.svg"
                  width={72}
                  height={72}
                  alt=""
                  className="mx-auto mb-4 opacity-90"
                />
                <p className="font-sans text-ui-sm font-medium text-ink">
                  {estimatedParts > 1 ? `Processing ${estimatedParts} parts…` : 'Processing text…'}
                </p>
                <p className="font-sans text-ui-xs text-muted mt-1">
                  {IMPORT_STAGES[stageIndex]}
                </p>
              </div>
            </div>
          )}

          {/* Title */}
          <h2
            id="new-text-dialog-title"
            className="font-sans text-ui-lg font-semibold text-ink"
          >
            {lockedSeriesName ? `Add to: ${lockedSeriesName}` : 'Add New Text'}
          </h2>

          {/* Error banner */}
          {mutation.isError && !isRateLimited && (
            <div className="mt-3 px-3 py-2 bg-danger/10 border border-danger/30 rounded">
              <p className="font-sans text-ui-sm text-danger">
                {mutation.error?.message || 'Failed to import text. Please try again.'}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Text Title */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Title <span className="text-danger">*</span>
              </label>
              <input
                ref={titleInputRef}
                type="text"
                placeholder="e.g., Breaking News Article"
                value={formData.title}
                onChange={(e) => {
                  setUserEditedTitle(true);
                  setFormData((prev) => ({ ...prev, title: e.target.value }));
                }}
                disabled={mutation.isPending}
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
                maxLength={200}
              />
              <p className="font-sans text-ui-xs text-muted mt-1">
                {titleLength}/200 characters
              </p>
              {nextNumber !== null && (
                <p className="font-sans text-ui-xs text-muted mt-0.5">
                  Will be added as #{nextNumber} in this series
                </p>
              )}
            </div>

            {/* Series Selector — hidden when series is pre-locked from context */}
            {!lockedSeriesName && (
              <div>
                <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                  Series <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.seriesId}
                  onChange={(e) => {
                    const newSeriesId = e.target.value;
                    const newSeries = availableSeries.find((s) => s.id === newSeriesId);
                    const suggestedTitle = selectedSeries
                      ? `${selectedSeries.name} #${selectedSeries.textCount + 1}`
                      : '';
                    const shouldPrefill =
                      !userEditedTitle ||
                      formData.title === '' ||
                      formData.title === suggestedTitle;
                    const newTitle = newSeries
                      ? `${newSeries.name} #${newSeries.textCount + 1}`
                      : '';
                    setFormData((prev) => ({
                      ...prev,
                      seriesId: newSeriesId,
                      title: shouldPrefill ? newTitle : prev.title,
                    }));
                    if (shouldPrefill) setUserEditedTitle(false);
                  }}
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
            )}

            {/* Text Content */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Content <span className="text-danger">*</span>
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
                  <span className="text-danger">
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

      <Toast message={toast.message} isOpen={toast.isOpen} onClose={hideToast} type={toast.type} />
    </>,
    document.body
  );
}
