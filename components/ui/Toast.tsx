'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, X } from 'lucide-react';

// ============================================================================
// Toast Component
// Success notification with auto-dismiss
// ============================================================================

interface ToastProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number; // Auto-dismiss duration in milliseconds (default: 3000)
}

export function Toast({
  message,
  isOpen,
  onClose,
  duration = 3000,
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // SSR guard for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [isOpen, duration]);

  // Close handler with exit animation
  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      onClose();
    }, 200); // Match fade-out animation duration
  }, [onClose]);

  // Escape key dismiss
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed top-4 right-4 z-50 max-w-md ${
        isExiting ? 'animate-fade-out' : 'animate-slide-in-right'
      }`}
    >
      <div className="flex items-start gap-3 bg-paper border border-border rounded-card shadow-raised p-4">
        {/* Success Icon */}
        <CheckCircle
          size={20}
          strokeWidth={2}
          className="text-primary flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />

        {/* Message */}
        <p className="flex-1 font-sans text-ui-sm text-ink font-medium">
          {message}
        </p>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-muted hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          aria-label="Dismiss notification"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// Toast Hook for Easy Usage
// ============================================================================

export interface ToastState {
  message: string;
  isOpen: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    isOpen: false,
  });

  const showToast = useCallback((message: string) => {
    setToast({ message, isOpen: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
}
