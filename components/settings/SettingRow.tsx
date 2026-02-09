// ============================================================================
// SettingRow Component
// Consistent row layout for settings with label/description and control
// ============================================================================

import { ReactNode } from 'react';

interface SettingRowProps {
  label: string;
  description?: string;
  value?: string;
  children: ReactNode;
}

export function SettingRow({
  label,
  description,
  value,
  children,
}: SettingRowProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 last:pb-0">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-sans text-ui-base font-medium text-ink">
            {label}
          </h3>
          {value && (
            <span className="font-sans text-ui-sm text-muted">{value}</span>
          )}
        </div>
        {description && (
          <p className="font-sans text-ui-sm text-muted">{description}</p>
        )}
      </div>
      <div className="md:w-1/2">{children}</div>
    </div>
  );
}
