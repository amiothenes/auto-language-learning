'use client';

// ============================================================================
// Select Component
// Dropdown select with full keyboard navigation and accessibility
// Keyboard: Arrow Up/Down, Home/End, Enter, ESC
// ============================================================================

import { useState, useRef, useEffect } from 'react';
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

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectId = useRef(`select-${Math.random().toString(36).slice(2, 9)}`).current;

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

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
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={label ? `${selectId}-label` : undefined}
          aria-controls={`${selectId}-listbox`}
          className="w-full px-4 py-2 bg-paper border border-border rounded font-sans text-ui-base text-ink hover:bg-desk focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all flex items-center justify-between"
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

        {isOpen && (
          <div
            ref={dropdownRef}
            id={`${selectId}-listbox`}
            role="listbox"
            className="absolute top-full left-0 right-0 mt-1 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10 max-h-60 overflow-y-auto"
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
                  'w-full px-4 py-3 text-left font-sans text-ui-base transition-colors',
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
          </div>
        )}
      </div>
    </div>
  );
}
