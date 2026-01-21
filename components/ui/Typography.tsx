import { cn } from '@/lib/utils';

// ============================================================================
// Typography Component System
// Academic-Naturalist Design System
// ============================================================================

// Shared Types
type Size = 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold';
type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

// ============================================================================
// Heading Component (Inter Font - UI)
// ============================================================================

interface HeadingProps {
  size?: Exclude<Size, 'base' | 'md'>;
  weight?: Weight;
  as?: HeadingTag;
  className?: string;
  children: React.ReactNode;
}

export function Heading({
  size = 'lg',
  weight = 'semibold',
  as: Tag = 'h2',
  className,
  children,
}: HeadingProps) {
  const sizeClass = `text-ui-${size}`;
  const weightClass = `font-${weight}`;
  
  return (
    <Tag className={cn(sizeClass, weightClass, 'font-sans text-ink', className)}>
      {children}
    </Tag>
  );
}

// ============================================================================
// Body Component (Inter Font - UI Text)
// ============================================================================

interface BodyProps {
  size?: 'xs' | 'sm' | 'base' | 'lg';
  weight?: Weight;
  className?: string;
  children: React.ReactNode;
}

export function Body({
  size = 'base',
  weight = 'regular',
  className,
  children,
}: BodyProps) {
  const sizeClass = `text-ui-${size}`;
  const weightClass = `font-${weight === 'regular' ? 'normal' : weight}`;
  
  return (
    <p className={cn(sizeClass, weightClass, 'font-sans text-ink', className)}>
      {children}
    </p>
  );
}

// ============================================================================
// Content Component (EB Garamond Font - Language Content)
// ============================================================================

interface ContentProps {
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  weight?: 'regular' | 'semibold' | 'bold';
  className?: string;
  children: React.ReactNode;
}

export function Content({
  size = 'base',
  weight = 'regular',
  className,
  children,
}: ContentProps) {
  const sizeClass = `text-content-${size}`;
  const weightClass = `font-${weight === 'regular' ? 'normal' : weight}`;
  
  return (
    <p className={cn(sizeClass, weightClass, 'font-serif text-ink', className)}>
      {children}
    </p>
  );
}

// ============================================================================
// Label Component (Inter Font - Form Labels)
// ============================================================================

interface LabelProps {
  size?: 'xs' | 'sm' | 'base';
  weight?: Weight;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function Label({
  size = 'sm',
  weight = 'medium',
  htmlFor,
  className,
  children,
}: LabelProps) {
  const sizeClass = `text-ui-${size}`;
  const weightClass = `font-${weight}`;
  
  return (
    <label 
      htmlFor={htmlFor}
      className={cn(sizeClass, weightClass, 'font-sans text-ink', className)}
    >
      {children}
    </label>
  );
}

// ============================================================================
// Muted Component (Inter Font - Secondary Information)
// ============================================================================

interface MutedProps {
  size?: 'xs' | 'sm' | 'base';
  className?: string;
  children: React.ReactNode;
}

export function Muted({
  size = 'sm',
  className,
  children,
}: MutedProps) {
  const sizeClass = `text-ui-${size}`;
  
  return (
    <p className={cn(sizeClass, 'font-sans text-muted', className)}>
      {children}
    </p>
  );
}
