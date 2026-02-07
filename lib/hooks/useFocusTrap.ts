import { useEffect, RefObject } from 'react';

// ============================================================================
// useFocusTrap Hook
// Traps focus within a container element (for modals, dropdowns, dialogs)
// Extracted from ConfirmDialog.tsx pattern (lines 104-132)
// ============================================================================

/**
 * Traps keyboard focus within a container element
 *
 * When active, Tab and Shift+Tab will cycle through focusable elements
 * within the container, preventing focus from escaping to the page behind.
 *
 * @param isActive - Whether the focus trap is currently active
 * @param containerRef - Ref to the container element to trap focus within
 *
 * @example
 * ```tsx
 * const dialogRef = useRef<HTMLDivElement>(null);
 * useFocusTrap(isOpen, dialogRef);
 *
 * return (
 *   <div ref={dialogRef} role="dialog">
 *     <button>First</button>
 *     <button>Last</button>
 *   </div>
 * );
 * ```
 */
export function useFocusTrap(
  isActive: boolean,
  containerRef: RefObject<HTMLElement>
): void {
  useEffect(() => {
    if (!isActive) return;

    const containerEl = containerRef.current;
    if (!containerEl) return;

    // Selector for all focusable elements
    // Matches buttons, links, inputs, selects, textareas, and elements with tabindex >= 0
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trap Tab key
      if (e.key !== 'Tab') return;

      const focusableElements = containerEl.querySelectorAll(focusableSelector);
      if (focusableElements.length === 0) return;

      const first = focusableElements[0] as HTMLElement;
      const last = focusableElements[focusableElements.length - 1] as HTMLElement;

      // Shift+Tab on first element -> focus last
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
      // Tab on last element -> focus first
      else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, containerRef]);
}
