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
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex items-center justify-center min-h-[400px]', className)}>
      <div className="bg-paper border border-border rounded-card shadow-raised p-12 max-w-md text-center">
        {/* Icon or Illustration */}
        {illustration !== 'none' ? (
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
  );
}
