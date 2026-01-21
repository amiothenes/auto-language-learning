import { cn } from '@/lib/utils';

// ============================================================================
// Skeleton Loading Components
// Academic-Naturalist Design System
// ============================================================================

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton element with pulse animation
 * Uses bg-border (#E5E2DA) for subtle, organic loading states
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse bg-border rounded', className)} />
  );
}

interface SkeletonTextProps {
  width?: string;
  className?: string;
}

/**
 * Skeleton for text elements
 * Default width can be overridden with Tailwind width classes
 */
export function SkeletonText({ width = 'w-24', className }: SkeletonTextProps) {
  return (
    <Skeleton className={cn('h-4', width, className)} />
  );
}

interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

/**
 * Skeleton for circular elements (icons, avatars)
 * Size in pixels, defaults to 40px
 */
export function SkeletonCircle({ size = 40, className }: SkeletonCircleProps) {
  return (
    <Skeleton 
      className={cn('rounded-lg shrink-0', className)} 
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}
