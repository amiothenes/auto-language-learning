'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Layout for every onboarding step.
 *  - Mobile (<768px): full-height column. Scene on top (max 35vh), content
 *    scrolls, actions pinned to the bottom within thumb reach (safe-area aware).
 *  - Tablet (768-1279px): a centred paper card up to 640px wide, scene above.
 *  - Desktop (≥1280px): split layout, with the scene on the left and the step on the right.
 * The progress rail shows where you are (4 dots), so nobody feels stuck in a loop.
 */
export function OnboardingShell({
  scene,
  step,
  totalSteps = 4,
  children,
  actions,
  wide = false,
}: {
  scene?: ReactNode;
  /** 0-based index of the current dot; omit to hide the rail. */
  step?: number;
  totalSteps?: number;
  children: ReactNode;
  /** Primary/secondary buttons, pinned to the bottom on mobile. */
  actions?: ReactNode;
  /** Wider content column (the word picker). */
  wide?: boolean;
}) {
  return (
    <div className="min-h-[100dvh] bg-desk flex flex-col md:items-center md:justify-center md:p-8">
      <div
        className={cn(
          'flex flex-col flex-1 w-full md:flex-none md:bg-paper md:border md:border-border md:rounded-card md:shadow-modal md:overflow-hidden',
          wide ? 'md:max-w-3xl' : 'md:max-w-[640px]',
          'xl:max-w-5xl xl:grid xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:min-h-[600px]'
        )}
      >
        {scene && (
          <div className="shrink-0 bg-paper border-b border-border xl:border-b-0 xl:border-r flex items-center justify-center overflow-hidden">
            <div className="w-full max-w-md xl:max-w-none max-h-[35dvh] md:max-h-[300px] xl:max-h-none flex items-center justify-center [&_svg]:max-h-[35dvh] md:[&_svg]:max-h-[300px] xl:[&_svg]:max-h-none">
              {scene}
            </div>
          </div>
        )}

        <div className="flex flex-col flex-1 min-h-0">
          {step !== undefined && <ProgressRail step={step} total={totalSteps} />}

          <div className="flex-1 overflow-y-auto px-4 pt-5 pb-6 md:px-8 md:pt-6">{children}</div>

          {actions && (
            <div className="sticky bottom-0 bg-desk/95 md:bg-paper backdrop-blur-sm border-t border-border px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-8 md:pb-6 md:border-t-0">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{actions}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressRail({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-4 md:px-8 md:pt-6" aria-label={`Step ${step + 1} of ${total}`} role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            i < step ? 'w-6 bg-primary' : i === step ? 'w-10 bg-riso-coral' : 'w-6 bg-border'
          )}
        />
      ))}
    </div>
  );
}

/** Large step heading in the app's type scale, with an optional target-language line. */
export function StepHeading({ title, subtitle, lead }: { title: ReactNode; subtitle?: ReactNode; lead?: ReactNode }) {
  return (
    <div className="space-y-2 mb-6">
      <h1 className="font-sans text-2xl md:text-3xl font-bold text-ink leading-tight">{title}</h1>
      {subtitle && <p className="font-serif text-xl md:text-2xl text-primary italic">{subtitle}</p>}
      {lead && <p className="font-sans text-ui-base md:text-ui-lg text-muted max-w-prose">{lead}</p>}
    </div>
  );
}
