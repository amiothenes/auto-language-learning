import { useEffect, useRef } from 'react';

// ============================================================================
// useFocusRestore Hook
// Saves and restores focus when a component opens/closes
// Extracted from ConfirmDialog.tsx pattern (lines 50-90)
// ============================================================================

/**
 * Saves the currently focused element when isOpen becomes true,
 * then restores focus to that element when isOpen becomes false.
 *
 * This ensures keyboard users return to their previous position in the page
 * after closing a modal, dialog, or dropdown.
 *
 * @param isOpen - Whether the component is currently open
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   useFocusRestore(isOpen);
 *
 *   if (!isOpen) return null;
 *   return (
 *     <dialog>
 *       <button onClick={onClose}>Close</button>
 *     </dialog>
 *   );
 * }
 * ```
 */
export function useFocusRestore(isOpen: boolean): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Capture focus on open
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Restore focus on close
  useEffect(() => {
    if (isOpen) return;

    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);
}
