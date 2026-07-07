// ============================================================================
// RadioGroup Component
// Radio button group with native radio semantics and Button styling
// Uses hidden radio inputs for accessibility and keyboard navigation
// ============================================================================

import { cn } from '@/lib/utils';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  className?: string;
}

export function RadioGroup({
  options,
  value,
  onChange,
  name,
  className,
}: RadioGroupProps) {
  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-labelledby={`${name}-label`}
        className={`flex gap-2 ${className || ''}`}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                // Base button styles (matching Button component)
                'inline-flex items-center justify-center gap-2 font-sans font-medium rounded transition-all cursor-pointer flex-1',
                'px-4 py-2 text-ui-base',
                // Variant styles
                isSelected
                  ? 'bg-primary text-white shadow-raised hover:brightness-90 hover:shadow-raised-hover active:translate-y-px'
                  : 'bg-paper border border-border text-ink hover:bg-desk transition-colors',
                // Focus styles (applied when radio input is focused)
                'focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2'
              )}
            >
              {/* Hidden native radio input for accessibility */}
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only"
                aria-checked={isSelected}
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {options.find((opt) => opt.value === value)?.description && (
        <p className="font-sans text-ui-xs text-muted mt-2">
          {options.find((opt) => opt.value === value)?.description}
        </p>
      )}
    </div>
  );
}
