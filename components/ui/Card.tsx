import { cn } from '@/lib/utils';
import { ReactNode, HTMLAttributes, ElementType } from 'react';

// ============================================================================
// Card Component System
// Academic-Naturalist Design System
// ============================================================================

type CardVariant = 'default' | 'hover' | 'interactive';
type CardPadding = 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

interface CardSubComponentProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: ReactNode;
}

// ============================================================================
// Main Card Component
// ============================================================================

export function Card({
  variant = 'default',
  padding = 'md',
  as: Component = 'div',
  className,
  children,
  ...props
}: CardProps) {
  // Base styles
  const baseStyles = 'bg-paper border border-border rounded-card shadow-raised';
  
  // Variant styles
  const variantStyles = {
    default: '',
    hover: 'hover:shadow-raised-hover hover:bg-desk transition-all',
    interactive: 'hover:shadow-raised-hover hover:bg-desk transition-all cursor-pointer active:translate-y-px group',
  };
  
  // Padding styles
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  return (
    <Component
      className={cn(
        baseStyles,
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

// ============================================================================
// CardHeader Sub-component
// ============================================================================

export function CardHeader({
  className,
  children,
  ...props
}: CardSubComponentProps) {
  return (
    <div className={cn('mb-3', className)} {...props}>
      {children}
    </div>
  );
}

// ============================================================================
// CardContent Sub-component
// ============================================================================

export function CardContent({
  className,
  children,
  ...props
}: CardSubComponentProps) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

// ============================================================================
// CardFooter Sub-component
// ============================================================================

export function CardFooter({
  className,
  children,
  ...props
}: CardSubComponentProps) {
  return (
    <div className={cn('mt-3', className)} {...props}>
      {children}
    </div>
  );
}
