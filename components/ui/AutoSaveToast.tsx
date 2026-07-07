'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error';

interface AutoSaveToastProps {
  variant?: ToastVariant;
  errorMessage?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

// Mount this component fresh each time (use key prop to re-trigger)
export function AutoSaveToast({
  variant = 'success',
  errorMessage,
  onRetry,
  onDismiss,
}: AutoSaveToastProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    // Double rAF: first frame paints the element at opacity-0, second triggers the transition
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setVisible(true))
    );

    if (variant === 'success') {
      const exitT = setTimeout(() => setVisible(false), 1500);
      const hideT = setTimeout(() => setMounted(false), 1650);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(exitT);
        clearTimeout(hideT);
      };
    }

    return () => cancelAnimationFrame(raf);
  }, [variant]); // variant is fixed per-instance (component remounts via key on each trigger)

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed top-4 right-4 z-100 flex items-center gap-2 px-3.5 py-2',
        'bg-paper rounded-card shadow-modal border',
        'transition-[opacity,transform] duration-150',
        variant === 'success' ? 'border-primary/30' : 'border-danger/30',
        visible ? 'opacity-100 translate-y-0 ease-out' : 'opacity-0 -translate-y-1 ease-in'
      )}
    >
      {variant === 'success' ? (
        <CheckCircle2 size={16} className="text-primary shrink-0" strokeWidth={2} />
      ) : (
        <AlertCircle size={16} className="text-danger shrink-0" strokeWidth={2} />
      )}
      <span className="font-sans text-ui-sm font-medium text-ink">
        {variant === 'success' ? 'Saved' : (errorMessage ?? 'Failed to save. Tap to retry.')}
      </span>
      {variant === 'error' && (
        <button
          onClick={onRetry ?? onDismiss}
          className="font-sans text-ui-xs text-muted underline ml-1 hover:text-ink transition-colors"
        >
          {onRetry ? 'Retry' : 'Dismiss'}
        </button>
      )}
    </div>
  );
}

export function useAutoSaveToast() {
  const [savedKey, setSavedKey] = useState(0);
  const [errorState, setErrorState] = useState<{
    visible: boolean;
    message?: string;
    onRetry?: () => void;
  }>({ visible: false });

  const showSaved = useCallback(() => {
    setSavedKey((k) => k + 1);
  }, []);

  const showError = useCallback((message?: string, onRetry?: () => void) => {
    setErrorState({ visible: true, message, onRetry });
  }, []);

  const dismissError = useCallback(() => {
    setErrorState({ visible: false });
  }, []);

  const ToastComponent = (
    <>
      {savedKey > 0 && <AutoSaveToast key={savedKey} variant="success" />}
      {errorState.visible && (
        <AutoSaveToast
          variant="error"
          errorMessage={errorState.message}
          onRetry={errorState.onRetry}
          onDismiss={dismissError}
        />
      )}
    </>
  );

  return { showSaved, showError, ToastComponent };
}
