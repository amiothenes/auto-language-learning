import { useState, useEffect, RefObject, useCallback } from 'react';

// ============================================================================
// useDropdownNavigation Hook
// Provides keyboard navigation for dropdown menus and select components
// ============================================================================

/**
 * Provides comprehensive keyboard navigation for dropdowns
 *
 * Handles:
 * - Arrow Up/Down: Navigate options
 * - Enter: Select highlighted option
 * - Home/End: Jump to first/last option
 * - ESC: Close dropdown
 * - Auto-scroll highlighted option into view
 *
 * @param isOpen - Whether the dropdown is currently open
 * @param options - Array of option values
 * @param selectedValue - Currently selected value
 * @param onSelect - Callback when an option is selected
 * @param onClose - Callback to close the dropdown
 * @param containerRef - Ref to the dropdown container for scroll management
 * @returns Highlighted index and setter function
 *
 * @example
 * ```tsx
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * const { highlightedIndex } = useDropdownNavigation(
 *   isOpen,
 *   options,
 *   selectedValue,
 *   handleSelect,
 *   () => setIsOpen(false),
 *   dropdownRef
 * );
 *
 * return (
 *   <div ref={dropdownRef}>
 *     {options.map((option, index) => (
 *       <div data-highlighted={highlightedIndex === index}>
 *         {option.label}
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useDropdownNavigation<T>(
  isOpen: boolean,
  options: T[],
  selectedValue: T | undefined,
  onSelect: (value: T) => void,
  onClose: () => void,
  containerRef: RefObject<HTMLElement>
): {
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
} {
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Initialize highlighted index to selected value when opening
  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
      return;
    }

    // Find index of selected value
    const selectedIndex = options.findIndex((opt) => opt === selectedValue);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [isOpen, options, selectedValue]);

  // Auto-scroll highlighted option into view
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) return;

    const container = containerRef.current;
    if (!container) return;

    // Find the highlighted element
    const highlightedElement = container.querySelector(
      `[data-index="${highlightedIndex}"]`
    ) as HTMLElement;

    if (highlightedElement) {
      highlightedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [highlightedIndex, isOpen, containerRef]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;

        case 'Home':
          e.preventDefault();
          setHighlightedIndex(0);
          break;

        case 'End':
          e.preventDefault();
          setHighlightedIndex(options.length - 1);
          break;

        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            onSelect(options[highlightedIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          onClose();
          break;

        default:
          break;
      }
    },
    [isOpen, options, highlightedIndex, onSelect, onClose]
  );

  // Attach keyboard listener
  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  return {
    highlightedIndex,
    setHighlightedIndex,
  };
}
