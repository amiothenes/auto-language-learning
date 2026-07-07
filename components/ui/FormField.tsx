import { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// FormField Component
// Reusable form field wrapper with label, error state, and helper text
// TODO: Integrate with backend validation when API is implemented
// ============================================================================

interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  fieldId?: string;
}

export function FormField({
  label,
  error,
  helperText,
  required = false,
  children,
  className,
  fieldId,
}: FormFieldProps) {
  const hasError = !!error;

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={fieldId}
          className="block font-sans text-ui-sm font-medium text-ink"
        >
          {label}
          {required && <span className="text-danger ml-1" aria-label="required">*</span>}
        </label>
      )}

      {/* Input/Control (passed as children) */}
      {children}

      {/* Error Message */}
      {hasError && (
        <div className="flex items-start gap-1.5 text-danger" role="alert">
          <AlertCircle size={14} className="mt-0.5 shrink-0" strokeWidth={2} />
          <span className="font-sans text-ui-xs">{error}</span>
        </div>
      )}

      {/* Helper Text */}
      {!hasError && helperText && (
        <p className="font-sans text-ui-xs text-muted">{helperText}</p>
      )}
    </div>
  );
}

// Example usage:
// const [email, setEmail] = useState('');
// const [emailError, setEmailError] = useState('');
//
// <FormField
//   label="Email"
//   error={emailError}
//   helperText="We'll never share your email"
//   required
//   fieldId="email-input"
// >
//   <Input
//     id="email-input"
//     type="email"
//     value={email}
//     onChange={(e) => setEmail(e.target.value)}
//     hasError={!!emailError}
//     placeholder="your@email.com"
//   />
// </FormField>
