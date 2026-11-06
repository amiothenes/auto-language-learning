'use client';

import Link from 'next/link';
import { X, ArrowRight } from 'lucide-react';
import { EmptyStateIllustration, type IllustrationType } from '@/components/ui/EmptyStateIllustration';
import { useHints, type HintKey } from '@/lib/hooks/useHints';

/**
 * A field note: a one-time, two-line explanation of what a feature is and
 * why it moves your Fluency, the first time you meet it. Inline at the top of
 * the page (never a modal, so it can't block the feature it explains), with an
 * optional "Try it" and a link to the matching Field Guide chapter.
 *
 * Shown once per account (Supabase user_metadata.hintsSeen). Put at most one
 * on a screen. It renders nothing until the account's hint list has loaded,
 * so it never flashes for people who have already dismissed it.
 */
export function FieldNote({
  hint,
  title,
  children,
  illustration = 'compass',
  guideAnchor,
  tryIt,
  when = true,
}: {
  hint: HintKey;
  title: string;
  children: React.ReactNode;
  illustration?: IllustrationType;
  /** Field Guide chapter id, e.g. "review" → /guide#review */
  guideAnchor?: string;
  tryIt?: { label: string; href?: string; onClick?: () => void };
  /** Extra condition, e.g. "only once the user has a due card". */
  when?: boolean;
}) {
  const { ready, hasSeen, markSeen } = useHints();
  if (!when || !ready || hasSeen(hint)) return null;

  const dismiss = () => markSeen(hint);

  return (
    <aside
      aria-label={`Field note: ${title}`}
      className="relative flex gap-4 items-start bg-paper border border-border rounded-card shadow-raised p-4 pr-10 md:p-5 md:pr-12 overflow-hidden animate-fade-slide-up"
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-riso-coral/70" aria-hidden="true" />
      <div className="hidden sm:block shrink-0 -my-1" aria-hidden="true">
        <EmptyStateIllustration type={illustration} size={64} />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="font-sans text-ui-xs uppercase tracking-wide text-riso-coral font-semibold">Field note</p>
        <h2 className="font-sans text-ui-lg font-semibold text-ink">{title}</h2>
        <p className="font-sans text-ui-sm text-muted max-w-prose leading-relaxed">{children}</p>
        {(tryIt || guideAnchor) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5">
            {tryIt &&
              (tryIt.href ? (
                <Link
                  href={tryIt.href}
                  onClick={dismiss}
                  className="inline-flex items-center gap-1 min-h-[36px] font-sans text-ui-sm font-medium text-primary hover:underline"
                >
                  {tryIt.label} <ArrowRight size={14} strokeWidth={2} />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    tryIt.onClick?.();
                    dismiss();
                  }}
                  className="inline-flex items-center gap-1 min-h-[36px] font-sans text-ui-sm font-medium text-primary hover:underline cursor-pointer"
                >
                  {tryIt.label} <ArrowRight size={14} strokeWidth={2} />
                </button>
              ))}
            {guideAnchor && (
              <Link href={`/guide#${guideAnchor}`} className="min-h-[36px] inline-flex items-center font-sans text-ui-sm text-muted hover:text-ink hover:underline">
                More in the Field Guide
              </Link>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2.5 right-2.5 p-1.5 rounded text-muted hover:text-ink hover:bg-desk cursor-pointer"
        aria-label="Got it, hide this note"
      >
        <X size={16} strokeWidth={1.75} />
      </button>
    </aside>
  );
}
