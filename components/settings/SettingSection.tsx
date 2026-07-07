// ============================================================================
// SettingSection Component
// Card wrapper for grouping related settings
// ============================================================================

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

interface SettingSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  variant?: 'default' | 'danger';
}

export function SettingSection({
  title,
  description,
  children,
  variant = 'default',
}: SettingSectionProps) {
  return (
    <Card
      variant="default"
      padding="lg"
      className={variant === 'danger' ? 'border-danger/30 bg-danger/10' : ''}
    >
      <CardHeader>
        <h2
          className={`font-sans text-ui-lg font-semibold ${
            variant === 'danger' ? 'text-danger' : 'text-ink'
          }`}
        >
          {title}
        </h2>
        {description && (
          <p className="font-sans text-ui-sm text-muted mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
}
