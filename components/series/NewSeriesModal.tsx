'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import type { NewSeriesData } from '@/lib/types/forms';

// ============================================================================
// NewSeriesModal Component
// Single-step modal: series name + optional text paste → one submit
// ============================================================================

interface NewSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (seriesData: NewSeriesData) => Promise<void>;
}

export function NewSeriesModal({
  isOpen,
  onClose,
  onAdd,
}: NewSeriesModalProps) {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [textContent, setTextContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', description: '' });
      setTextContent('');
      setIsLoading(false);
      setSubmitError(null);
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
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

  // Auto-focus name input
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => nameInputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Restore focus on close
  useEffect(() => {
    if (isOpen) return;
    previousFocusRef.current?.focus();
    previousFocusRef.current = null;
  }, [isOpen]);

  // Escape key dismiss (blocked during loading)
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose, isLoading]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;
    const selector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const handler = (e: KeyboardEvent) => {
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
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  const handleBackdropClick = useCallback(() => {
    if (!isLoading) onClose();
  }, [onClose, isLoading]);

  const isFormValid = useMemo(
    () => formData.name.trim() !== '' && formData.name.trim().length <= 100,
    [formData.name]
  );

  const hasText = textContent.trim() !== '';

  const autoTitle = `${formData.name.trim() || 'Series'} #1`;

  const handleSubmit = useCallback(async () => {
    if (!isFormValid || isLoading) return;
    const seriesData: NewSeriesData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      texts: hasText
        ? [{ title: autoTitle, content: textContent.trim() }]
        : undefined,
    };
    setIsLoading(true);
    setSubmitError(null);
    try {
      await onAdd(seriesData);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create series');
    } finally {
      setIsLoading(false);
    }
  }, [formData, textContent, hasText, autoTitle, isFormValid, isLoading, onAdd, onClose]);

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
          aria-labelledby="new-series-dialog-title"
          className="relative w-full max-w-2xl bg-paper rounded-card shadow-modal animate-modal-enter p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-card overflow-hidden">
              <div className="absolute inset-0 animate-shimmer" />
              <div className="relative text-center">
                <p className="font-sans text-ui-sm font-medium text-ink">
                  Creating series...
                </p>
                <p className="font-sans text-ui-xs text-muted mt-1">
                  {hasText ? 'Processing text — this may take a few seconds' : 'Just a moment'}
                </p>
              </div>
            </div>
          )}

          <h2
            id="new-series-dialog-title"
            className="font-sans text-ui-lg font-semibold text-ink mb-4"
          >
            Create New Series
          </h2>

          {/* Error banner */}
          {submitError && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded">
              <p className="font-sans text-ui-sm text-red-800">{submitError}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Series Name */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Series Name <span className="text-red-600">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                placeholder="e.g., Russian News Articles"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={isLoading}
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
                maxLength={100}
              />
              <p className="font-sans text-ui-xs text-muted mt-1">
                {formData.name.trim().length}/100 characters
              </p>
            </div>

            {/* Description (optional) */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Description
                <span className="ml-1 font-normal text-muted">(optional)</span>
              </label>
              <textarea
                placeholder="Describe the series content and purpose..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                disabled={isLoading}
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-vertical disabled:opacity-50"
                rows={3}
                maxLength={500}
              />
              <p className="font-sans text-ui-xs text-muted mt-1">
                {formData.description.trim().length}/500 characters
              </p>
            </div>

            {/* Text Content (optional) */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Text Content
                <span className="ml-1 font-normal text-muted">(optional)</span>
              </label>
              <textarea
                placeholder="Paste text content here to add it to this series..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-vertical disabled:opacity-50"
                rows={8}
              />
              {hasText && (
                <p className="font-sans text-ui-xs text-muted mt-1">
                  Will be titled &ldquo;{autoTitle}&rdquo;
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSubmit}
                disabled={!isFormValid || isLoading}
              >
                {isLoading
                  ? 'Creating...'
                  : hasText
                  ? 'Create Series with Text'
                  : 'Create Empty Series'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
