// ============================================================================
// RadioGroup Component
// Radio button group using Button styling for consistency
// ============================================================================

import { Button } from '@/components/ui/Button';

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
      <div className={`flex gap-2 ${className || ''}`}>
        {options.map((option) => (
          <Button
            key={option.value}
            variant={value === option.value ? 'primary' : 'secondary'}
            size="md"
            onClick={() => onChange(option.value)}
            className="flex-1"
            type="button"
          >
            {option.label}
          </Button>
        ))}
      </div>
      {options.find((opt) => opt.value === value)?.description && (
        <p className="font-sans text-ui-xs text-muted mt-2">
          {options.find((opt) => opt.value === value)?.description}
        </p>
      )}
    </div>
  );
}
