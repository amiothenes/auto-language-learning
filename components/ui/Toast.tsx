'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

// ============================================================================
// Toast Component
// Notification with auto-dismiss — supports success, error, and info variants
// ============================================================================

type ToastType = 'success' | 'error' | 'info';

const toastVariants: Record<ToastType, {
  icon: typeof CheckCircle;
  iconClass: string;
  borderClass: string;
}> = {
  success: {
    icon: CheckCircle,
    iconClass: 'text-primary',
    borderClass: 'border-l-4 border-primary',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-danger',
    borderClass: 'border-l-4 border-danger',
  },
  info: {
    icon: Info,
    iconClass: 'text-muted',
    borderClass: 'border-l-4 border-border',
  },
};

interface ToastProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  type?: ToastType;
  duration?: number;
}

export function Toast({
  message,
  isOpen,
  onClose,
  type = 'success',
  duration = 3000,
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [isOpen, duration]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      onClose();
    }, 200);
  }, [onClose]);

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

  const variant = toastVariants[type];
  const Icon = variant.icon;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed top-4 right-4 z-50 max-w-md ${
        isExiting ? 'animate-fade-out' : 'animate-slide-in-right'
      }`}
    >
      <div className={`flex items-start gap-3 bg-paper border border-border rounded-card shadow-raised p-4 ${variant.borderClass}`}>
        <Icon
          size={20}
          strokeWidth={2}
          className={`${variant.iconClass} shrink-0 mt-0.5`}
          aria-hidden="true"
        />

        <p className="flex-1 font-sans text-ui-sm text-ink font-medium">
          {message}
        </p>

        <button
          onClick={handleClose}
          className="shrink-0 text-muted hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
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
// Toast Hook
// ============================================================================

export interface ToastState {
  message: string;
  isOpen: boolean;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    isOpen: false,
    type: 'success',
  });

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, isOpen: true, type });
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
