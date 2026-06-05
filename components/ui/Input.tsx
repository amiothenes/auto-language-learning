import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Input Component
// Text input with error state styling
// TODO: Integrate with backend validation when API is implemented
// ============================================================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ hasError = false, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full px-3 py-2 font-sans text-ui-base text-ink',
          'bg-paper border rounded',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'transition-all duration-200',
          hasError
            ? 'border-danger focus:ring-danger'
            : 'border-border focus:ring-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'placeholder:text-muted',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
