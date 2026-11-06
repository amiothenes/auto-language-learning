import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Wrapper for riso scenes: a 320×240 canvas with the shared grain pass laid
 * over the ink (filters come from RisoDefs, mounted once in the root layout).
 * Scenes scale to their container width; give the container a width and the
 * aspect ratio is kept.
 */
export function RisoScene({
  label,
  children,
  className,
  viewBox = '0 0 320 240',
}: {
  label: string;
  children: ReactNode;
  className?: string;
  viewBox?: string;
}) {
  const [, , w, h] = viewBox.split(' ').map(Number);
  return (
    <svg viewBox={viewBox} className={cn('block w-full h-auto', className)} role="img" aria-label={label}>
      {children}
      {/* Grain over everything: multiply keeps the paper showing through. */}
      <rect width={w} height={h} fill="#183A37" opacity="0.16" filter="url(#riso-grain-coarse)" style={{ mixBlendMode: 'multiply' }} />
    </svg>
  );
}

/** Second ink layer, offset slightly for the misregistration look. */
export function Misreg({ children, dx = -2, dy = 1.6 }: { children: ReactNode; dx?: number; dy?: number }) {
  return (
    <g transform={`translate(${dx},${dy})`} style={{ mixBlendMode: 'multiply' }}>
      {children}
    </g>
  );
}
