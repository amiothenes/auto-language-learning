'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select, SelectOption } from '@/components/settings/Select';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';
import { PRESET_LANGUAGES } from '@/lib/languages/presets';

// ============================================================================
// AddLanguageModal Component
// Modal dialog for adding a new language with form validation
// ============================================================================

export interface NewLanguageData {
  name: string;
  code: string;
  dictUri?: string;
  ttsCode?: string;
  rtl: boolean;
}

interface AddLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (language: NewLanguageData) => void;
  /** Codes of languages the user already has — excluded from the picker to avoid duplicates. */
  existingCodes: string[];
}

export function AddLanguageModal({
  isOpen,
  onClose,
  onAdd,
  existingCodes,
}: AddLanguageModalProps) {
  const [selectedCode, setSelectedCode] = useState('');
  const [dictUri, setDictUri] = useState('');
  const [mounted, setMounted] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const availablePresets = useMemo(
    () => PRESET_LANGUAGES.filter((preset) => !existingCodes.includes(preset.code)),
    [existingCodes]
  );
  const languageOptions: SelectOption[] = availablePresets.map((preset) => ({
    value: preset.code,
    label: `${preset.flag} ${preset.name}`,
  }));
  const selectedPreset = availablePresets.find((preset) => preset.code === selectedCode);

  // SSR guard for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCode('');
      setDictUri('');
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  useBodyScrollLock(isOpen);

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

  // Form submission handler
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedPreset) return;

      onAdd({
        name: selectedPreset.name,
        code: selectedPreset.code,
        dictUri: dictUri.trim() || undefined,
        ttsCode: selectedPreset.ttsCode,
        rtl: selectedPreset.rtl,
      });
    },
    [selectedPreset, dictUri, onAdd]
  );

  // Check if form is valid
  const isFormValid = !!selectedPreset;

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
          aria-labelledby="add-language-dialog-title"
          className="w-full max-w-md bg-paper rounded-card shadow-modal animate-modal-enter p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title row */}
          <div className="flex items-center justify-between gap-2">
            <h2
              id="add-language-dialog-title"
              className="font-sans text-ui-lg font-semibold text-ink"
            >
              Add New Language
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              <img
                src="/illustrations/sprout.svg"
                width={40}
                height={40}
                alt=""
                aria-hidden="true"
                className="opacity-80 shrink-0"
              />
              <button
                type="button"
                onClick={onClose}
                className="text-muted hover:text-ink transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {availablePresets.length === 0 ? (
              <p className="font-sans text-ui-sm text-muted">
                You&apos;ve already added every available language.
              </p>
            ) : (
              <>
                {/* Language picker */}
                <Select
                  label="Language"
                  options={languageOptions}
                  value={selectedCode}
                  onChange={setSelectedCode}
                  placeholder="Select a language"
                />

                {/* Autofilled details (read-only) */}
                {selectedPreset && (
                  <p className="font-sans text-ui-xs text-muted -mt-2">
                    Code: {selectedPreset.code} · TTS: {selectedPreset.ttsCode} · RTL:{' '}
                    {selectedPreset.rtl ? 'Yes' : 'No'}
                  </p>
                )}

                {/* Dictionary URI */}
                <div>
                  <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                    Dictionary URI
                  </label>
                  <input
                    type="text"
                    placeholder="https://dictionary.example.com/{word}"
                    value={dictUri}
                    onChange={(e) => setDictUri(e.target.value)}
                    className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                  <p className="font-sans text-ui-xs text-muted mt-1">
                    Use {'{word}'} as a placeholder for the word to look up
                  </p>
                </div>
              </>
            )}

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
                Add Language
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}
