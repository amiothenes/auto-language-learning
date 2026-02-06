'use client';

// ============================================================================
// Select Component
// Dropdown select with click-outside-to-close functionality
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

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
        <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
          {label}
        </label>
      )}
      <div ref={selectRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 bg-paper border border-border rounded font-sans text-ui-base text-ink hover:bg-desk focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all flex items-center justify-between"
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
          <div className="absolute top-full left-0 right-0 mt-1 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left font-sans text-ui-base transition-colors ${
                  value === option.value
                    ? 'bg-primary text-white font-medium'
                    : 'text-ink hover:bg-desk'
                }`}
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
