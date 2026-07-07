'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/settings/Toggle';

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
}

export function AddLanguageModal({
  isOpen,
  onClose,
  onAdd,
}: AddLanguageModalProps) {
  const [formData, setFormData] = useState<NewLanguageData>({
    name: '',
    code: '',
    dictUri: '',
    ttsCode: '',
    rtl: false,
  });
  const [mounted, setMounted] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // SSR guard for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        code: '',
        dictUri: '',
        ttsCode: '',
        rtl: false,
      });
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

  // Auto-focus on name input when opened
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
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

  // Form submission handler
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Validation: name and code are required
      if (!formData.name.trim() || !formData.code.trim()) {
        return;
      }

      onAdd({
        name: formData.name.trim(),
        code: formData.code.trim(),
        dictUri: formData.dictUri?.trim() || undefined,
        ttsCode: formData.ttsCode?.trim() || undefined,
        rtl: formData.rtl,
      });
    },
    [formData, onAdd]
  );

  // Check if form is valid
  const isFormValid = formData.name.trim() !== '' && formData.code.trim() !== '';

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
                className="text-muted hover:text-ink transition-colors"
                aria-label="Close dialog"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Language Name */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Language Name <span className="text-danger">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                placeholder="e.g., Spanish"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {/* Language Code */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Language Code <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., es"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {/* Dictionary URI */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Dictionary URI
              </label>
              <input
                type="text"
                placeholder="https://dictionary.example.com/{word}"
                value={formData.dictUri}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dictUri: e.target.value }))
                }
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
              <p className="font-sans text-ui-xs text-muted mt-1">
                Use {'{word}'} as a placeholder for the word to look up
              </p>
            </div>

            {/* TTS Code */}
            <div>
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                TTS Code
              </label>
              <input
                type="text"
                placeholder="es-ES"
                value={formData.ttsCode}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, ttsCode: e.target.value }))
                }
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
              <p className="font-sans text-ui-xs text-muted mt-1">
                Text-to-speech language code (e.g., es-ES, fr-FR)
              </p>
            </div>

            {/* RTL Toggle */}
            <div>
              <Toggle
                checked={formData.rtl}
                onChange={(checked) =>
                  setFormData((prev) => ({ ...prev, rtl: checked }))
                }
                label="Right-to-Left (RTL)"
                description="Enable for Arabic, Hebrew, and other RTL languages"
              />
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
