'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ============================================================================
// ConfirmDialog Component
// Reusable confirmation dialog with danger variant and optional typed confirmation
// ============================================================================

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  confirmationText?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  confirmationText,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [mounted, setMounted] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // SSR guard for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setIsLoading(false);
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

  // Auto-focus on open
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (confirmationText && inputRef.current) {
        inputRef.current.focus();
      } else if (dialogRef.current) {
        // Focus the first button (cancel) inside the dialog
        const firstButton = dialogRef.current.querySelector('button') as HTMLElement;
        firstButton?.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen, confirmationText]);

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
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

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

  // Confirm handler with async support
  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  }, [onConfirm]);

  // Backdrop click
  const handleBackdropClick = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [isLoading, onClose]);

  const isConfirmDisabled =
    isLoading ||
    (confirmationText !== undefined && inputValue !== confirmationText);

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
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
          className="w-full max-w-md bg-paper rounded-card shadow-modal animate-modal-enter p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <h2
            id="confirm-dialog-title"
            className="font-sans text-ui-lg font-semibold text-ink"
          >
            {title}
          </h2>

          {/* Message */}
          <p
            id="confirm-dialog-desc"
            className="mt-2 font-sans text-ui-base text-muted"
          >
            {message}
          </p>

          {/* Optional confirmation input */}
          {confirmationText !== undefined && (
            <div className="mt-4">
              <label className="block font-sans text-ui-sm text-ink mb-1.5">
                Type <span className="font-semibold">&quot;{confirmationText}&quot;</span> to confirm
              </label>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-desk border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder={confirmationText}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              leftIcon={
                isLoading ? (
                  <Loader2 size={16} className="animate-spin" strokeWidth={2} />
                ) : undefined
              }
              className={
                variant === 'danger'
                  ? 'bg-red-600! hover:bg-red-700!'
                  : ''
              }
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
