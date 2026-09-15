import { useEffect } from 'react';

/**
 * Locks page scroll while `isOpen` is true (for modals/dialogs/sheets).
 * Relies on `scrollbar-gutter: stable` (app/globals.css) to keep the
 * scrollbar's gutter reserved, so this never shifts page width.
 */
export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);
}
