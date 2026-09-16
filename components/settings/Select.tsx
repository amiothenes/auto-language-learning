'use client';

// ============================================================================
// Select Component
// Dropdown select with full keyboard navigation and accessibility
// Keyboard: Arrow Up/Down, Home/End, Enter, ESC
// ============================================================================

import { useState, useRef, useEffect, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { useDropdownNavigation } from '@/lib/hooks/useDropdownNavigation';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

interface MenuRect {
  top: number;
  left: number;
  width: number;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<MenuRect | null>(null);
  const [portalMounted, setPortalMounted] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectId = useId();

  // Portal target only exists client-side
  useEffect(() => {
    setPortalMounted(true);
  }, []);

  // Position the portaled menu against the trigger button's current viewport position
  const updateMenuRect = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setMenuRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  const handleToggle = () => {
    if (!isOpen) updateMenuRect();
    setIsOpen((prev) => !prev);
  };

  // Keyboard navigation
  const { highlightedIndex } = useDropdownNavigation(
    isOpen,
    options,
    options.find((opt) => opt.value === value),
    (option) => {
      onChange(option.value);
      setIsOpen(false);
    },
    () => setIsOpen(false),
    dropdownRef
  );

  // Close dropdown when clicking outside the trigger or the portaled menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const insideTrigger = selectRef.current?.contains(target);
      const insideMenu = dropdownRef.current?.contains(target);
      if (!insideTrigger && !insideMenu) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on scroll of any ancestor (e.g. a scrollable modal) so the menu never
  // drifts from its trigger; ignore scrolling inside the menu's own option list.
  // Reposition (rather than close) on resize.
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (event: Event) => {
      if (dropdownRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    const handleResize = () => updateMenuRect();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updateMenuRect]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={className}>
      {label && (
        <label
          id={`${selectId}-label`}
          className="block font-sans text-ui-sm font-medium text-ink mb-2"
        >
          {label}
        </label>
      )}
      <div ref={selectRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggle}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={label ? `${selectId}-label` : undefined}
          aria-controls={`${selectId}-listbox`}
          className="w-full px-4 py-2 bg-paper border border-border rounded font-sans text-ui-base text-ink hover:bg-desk focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all flex items-center justify-between cursor-pointer"
        >
          <span className={selectedOption ? 'text-ink' : 'text-muted'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            className={`text-muted transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            strokeWidth={2}
          />
        </button>

        {isOpen && portalMounted && menuRect &&
          createPortal(
            <div
              ref={dropdownRef}
              id={`${selectId}-listbox`}
              role="listbox"
              style={{ position: 'fixed', top: menuRect.top, left: menuRect.left, width: menuRect.width }}
              className="z-[9999] bg-paper border border-border rounded-card shadow-modal overflow-hidden max-h-60 overflow-y-auto"
            >
              {options.map((option, index) => (
                <button
                  key={option.value}
                  role="option"
                  aria-selected={value === option.value}
                  data-index={index}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full px-4 py-3 text-left font-sans text-ui-base transition-colors cursor-pointer',
                    value === option.value
                      ? 'bg-primary text-white font-medium'
                      : highlightedIndex === index
                      ? 'bg-desk text-ink'
                      : 'text-ink hover:bg-desk'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}
