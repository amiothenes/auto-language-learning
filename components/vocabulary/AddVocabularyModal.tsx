'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { NewVocabularyData } from '@/lib/types/forms';

// ============================================================================
// AddVocabularyModal Component
// Modal for manually adding a single vocabulary item
// ============================================================================

interface AddVocabularyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (vocabData: NewVocabularyData) => void;
}

export function AddVocabularyModal({
  isOpen,
  onClose,
  onAdd,
}: AddVocabularyModalProps) {
  const [formData, setFormData] = useState<NewVocabularyData>({
    lemma: '',
    translation: '',
    status: VocabularyStatus.NEWLY_SEEN,
    dictionaryFrequency: undefined,
    tags: [],
  });
  const [tagsInput, setTagsInput] = useState('');
  const [frequencyInput, setFrequencyInput] = useState('');
  const [mounted, setMounted] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const lemmaInputRef = useRef<HTMLInputElement>(null);

  // SSR guard for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        lemma: '',
        translation: '',
        status: VocabularyStatus.NEWLY_SEEN,
        dictionaryFrequency: undefined,
        tags: [],
      });
      setTagsInput('');
      setFrequencyInput('');
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Auto-focus on lemma input when opened
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (lemmaInputRef.current) {
        lemmaInputRef.current.focus();
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

  // Escape key dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  // Backdrop click handler
  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Form validation
  const isFormValid = useMemo(() => {
    return (
      formData.lemma.trim() !== '' &&
      formData.lemma.trim().length <= 100 &&
      formData.translation.trim() !== '' &&
      formData.translation.trim().length <= 200
    );
  }, [formData]);

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
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!isFormValid) return;

      // Parse tags from comma-separated input
      const tags = parseTags(tagsInput);

      // Parse dictionary frequency (optional)
      const dictionaryFrequency =
        frequencyInput.trim() !== ''
          ? Math.min(100, Math.max(0, parseInt(frequencyInput, 10)))
          : undefined;

      onAdd({
        lemma: formData.lemma.trim(),
        translation: formData.translation.trim(),
        status: formData.status,
        dictionaryFrequency:
          dictionaryFrequency !== undefined && !isNaN(dictionaryFrequency)
            ? dictionaryFrequency
            : undefined,
        tags,
      });
    },
    [formData, tagsInput, frequencyInput, isFormValid, onAdd]
  );

  // Character counts for validation feedback
  const lemmaLength = formData.lemma.trim().length;
  const translationLength = formData.translation.trim().length;

  // Status options with user-friendly labels
  const statusOptions = [
    { value: VocabularyStatus.NEWLY_SEEN, label: 'Newly Seen' },
    { value: VocabularyStatus.FAMILIAR, label: 'Familiar' },
    { value: VocabularyStatus.KNOWN, label: 'Known' },
    { value: VocabularyStatus.WELL_KNOWN, label: 'Well Known' },
    { value: VocabularyStatus.IGNORE, label: 'Ignore' },
  ];

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
          aria-labelledby="add-vocabulary-dialog-title"
          className="w-full max-w-lg bg-paper rounded-card shadow-modal animate-modal-enter p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <h2
            id="add-vocabulary-dialog-title"
            className="font-sans text-ui-lg font-semibold text-ink"
          >
            Add Vocabulary Item
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Lemma */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Lemma (Root Word) <span className="text-red-600">*</span>
              </label>
              <input
                ref={lemmaInputRef}
                type="text"
                placeholder="e.g., hablar, courir, бежать"
                value={formData.lemma}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lemma: e.target.value }))
                }
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                maxLength={100}
              />
              <p className="font-sans text-ui-xs text-muted mt-1">
                {lemmaLength}/100 characters
              </p>
            </div>

            {/* Translation */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Translation <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., to speak, to run"
                value={formData.translation}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, translation: e.target.value }))
                }
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                maxLength={200}
              />
              <p className="font-sans text-ui-xs text-muted mt-1">
                {translationLength}/200 characters
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as VocabularyStatus,
                  }))
                }
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dictionary Frequency (Optional) */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Dictionary Frequency (Optional)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="0-100"
                value={frequencyInput}
                onChange={(e) => setFrequencyInput(e.target.value)}
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
              <p className="font-sans text-ui-xs text-muted mt-1">
                How common this word is in the language (0-100 scale)
              </p>
            </div>

            {/* Tags (Optional) */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Tags (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., verb, common, daily-use"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
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
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!isFormValid}
              >
                Add Vocabulary
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}
