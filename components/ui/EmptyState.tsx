import { ReactNode } from 'react';
import { Heading, Muted } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { EmptyStateIllustration, IllustrationType } from '@/components/ui/EmptyStateIllustration';
import { cn } from '@/lib/utils';

// ============================================================================
// EmptyState Component
// Generic component for displaying empty states with illustrations and CTAs
// Based on EmptySeriesState pattern
// ============================================================================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: IllustrationType | 'none';
  illustrationSize?: number;
  /** A full-width riso story scene (components/riso/scenes), shown instead of the illustration. */
  scene?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  illustration = 'none',
  illustrationSize = 128,
  scene,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex items-center justify-center min-h-[400px]', className)}>
      <div className={cn('bg-paper border border-border rounded-card shadow-raised max-w-md text-center overflow-hidden', !!scene ? 'w-full pb-8 md:pb-10' : 'p-8 md:p-12')}>
        {/* Scene, icon or illustration */}
        {scene ? (
          <div className="mb-6 border-b border-border bg-desk">{scene}</div>
        ) : illustration !== 'none' ? (
          <div className="mb-6 flex justify-center">
            <EmptyStateIllustration type={illustration} size={illustrationSize} />
          </div>
        ) : icon ? (
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
          </div>
        ) : null}

        <div className={cn(!!scene && 'px-6 md:px-10')}>
        {/* Heading */}
        <Heading size="xl" as="h2" className="mb-3">
          {title}
        </Heading>

        {/* Description */}
        <Muted size="base" className="mb-6">
          {description}
        </Muted>

        {/* Actions */}
        {primaryAction && (
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              leftIcon={primaryAction.icon}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
            {secondaryAction && (
              <Button
                variant="secondary"
                size="md"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
