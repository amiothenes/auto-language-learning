'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Layers, Compass, FilePlus } from 'lucide-react';
import type { NextStep } from '@/lib/onboarding/nextStep';

const ICONS = {
  guided: Compass,
  review: Layers,
  continue: BookOpen,
  chapter: BookOpen,
  library: BookOpen,
  import: FilePlus,
} as const;

/**
 * Today's single next action. One card and one button, so it's always obvious
 * what to do; everything else is secondary.
 */
export function NextStepCard({
  step,
  onImport,
  onSecondary,
}: {
  step: NextStep;
  onImport: () => void;
  onSecondary?: (action: NonNullable<NextStep['secondary']>['action']) => void;
}) {
  const Icon = ICONS[step.kind];
  const button = (
    <>
      {step.cta}
      <ArrowRight size={18} strokeWidth={2} />
    </>
  );
  const buttonClass =
    'inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded bg-primary text-white font-sans text-ui-base font-medium shadow-raised hover:brightness-90 hover:shadow-raised-hover active:translate-y-px transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';

  return (
    <section aria-labelledby="next-step-title" className="relative bg-paper border border-border rounded-card shadow-raised p-5 md:p-6 overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-1 bg-riso-coral/70" aria-hidden="true" />
      <div className="flex items-start gap-4">
        <span className="hidden sm:flex shrink-0 w-11 h-11 rounded-full bg-primary/5 border border-primary/15 items-center justify-center text-primary">
          <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="font-sans text-ui-xs uppercase tracking-wide text-riso-coral font-semibold">{step.eyebrow}</p>
          <h2 id="next-step-title" className="font-sans text-ui-xl md:text-2xl font-bold text-ink leading-snug break-words">
            {step.title}
          </h2>
          <p className="font-sans text-ui-base text-muted max-w-prose">{step.body}</p>
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            {step.href ? (
              <Link href={step.href} className={buttonClass}>
                {button}
              </Link>
            ) : (
              <button type="button" onClick={onImport} className={`${buttonClass} cursor-pointer`}>
                {button}
              </button>
            )}
            {step.secondary && onSecondary && (
              <button
                type="button"
                onClick={() => onSecondary(step.secondary!.action)}
                className="min-h-[44px] px-2 font-sans text-ui-sm text-muted hover:text-ink underline-offset-2 hover:underline cursor-pointer"
              >
                {step.secondary.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
