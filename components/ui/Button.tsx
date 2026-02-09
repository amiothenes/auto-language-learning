import { cn } from '@/lib/utils';
import { ReactNode, ButtonHTMLAttributes } from 'react';

// ============================================================================
// Button Component System
// Academic-Naturalist Design System
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  iconOnly?: boolean;
  className?: string;
  children?: ReactNode;
  /** Accessible label for icon-only buttons (REQUIRED for iconOnly buttons) */
  ariaLabel?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  iconOnly = false,
  className,
  children,
  disabled = false,
  ariaLabel,
  ...props
}: ButtonProps) {
  // Base styles with focus visible state
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-sans font-medium rounded transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';
  
  // Variant styles
  const variantStyles = {
    primary: 'bg-primary text-white shadow-raised hover:opacity-90 hover:shadow-raised-hover active:translate-y-px',
    secondary: 'bg-paper border border-border text-ink hover:bg-desk transition-colors',
    ghost: 'bg-transparent text-ink hover:bg-desk hover:underline transition-colors',
  };
  
  // Size styles
  const sizeStyles = {
    // Icon-only buttons: Ensure 44×44px minimum touch target (WCAG 2.1 Level AAA)
    sm: iconOnly ? 'p-2.5 text-ui-sm min-w-[44px] min-h-[44px]' : 'px-3 py-1.5 text-ui-sm',
    md: iconOnly ? 'p-3 text-ui-base min-w-[44px] min-h-[44px]' : 'px-4 py-2 text-ui-base',
    lg: iconOnly ? 'p-3.5 text-ui-base min-w-[44px] min-h-[44px]' : 'px-5 py-2.5 text-ui-base',
  };
  
  // Disabled styles
  const disabledStyles = disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer';
  
  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        disabledStyles,
        className
      )}
      disabled={disabled}
      aria-label={iconOnly ? ariaLabel : undefined}
      {...props}
    >
      {leftIcon && <span className="flex items-center">{leftIcon}</span>}
      {!iconOnly && children}
      {rightIcon && <span className="flex items-center">{rightIcon}</span>}
    </button>
  );
}
