'use client';

import { useEffect, useRef } from 'react';
import { Ban, RotateCcw } from 'lucide-react';
import { VocabularyStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================================
// MoreMenu — full status control popup, triggered by the ··· button in
// AdaptiveStepper. Renders as a fixed-position overlay anchored to the
// triggering button element.
//
// Shows: "Set exact status" rows (1–5) + Ignore + Reset to Unknown
//        + keyboard shortcut footer.
// ============================================================================

interface MoreMenuProps {
  anchorEl: HTMLButtonElement;
  currentStatus: VocabularyStatus;
  onStatusChange: (status: VocabularyStatus) => void;
  onClose: () => void;
}

// UNKNOWN is excluded — it is only set at import time, not by user action.
const STATUS_ROWS: {
  status: VocabularyStatus;
  label: string;
  color: string;
  key: string;
}[] = [
  { status: VocabularyStatus.NEWLY_SEEN, label: 'Newly Seen', color: 'hsl(2,72%,58%)',   key: '1' },
  { status: VocabularyStatus.FAMILIAR,   label: 'Familiar',   color: 'hsl(32,88%,54%)',  key: '2' },
  { status: VocabularyStatus.KNOWN,      label: 'Known',      color: 'hsl(78,58%,46%)',  key: '3' },
  { status: VocabularyStatus.WELL_KNOWN, label: 'Well-Known', color: 'hsl(145,45%,40%)', key: '4' },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-sans text-[10px] text-muted border border-border border-b-2 rounded px-1 ml-auto shrink-0">
      {children}
    </span>
  );
}

export function MoreMenu({
  anchorEl,
  currentStatus,
  onStatusChange,
  onClose,
}: MoreMenuProps) {
  const menuRef    = useRef<HTMLDivElement>(null);
  const MENU_W     = 224;
  const MENU_H_EST = 290; // estimated height for flip logic
  const GAP        = 6;

  // ── Positioning ──────────────────────────────────────────────────────────
  const rect  = anchorEl.getBoundingClientRect();
  const left  = Math.max(8, Math.min(
    rect.left + rect.width / 2 - MENU_W / 2,
    window.innerWidth - MENU_W - 8,
  ));
  const above  = rect.top > MENU_H_EST + GAP;
  const top    = above ? rect.top - MENU_H_EST - GAP : rect.bottom + GAP;

  // ── Close on outside click / tap ─────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      const handler = (e: MouseEvent | TouchEvent) => {
        const target = (e as TouchEvent).touches?.[0]?.target ?? (e as MouseEvent).target;
        if (menuRef.current && !menuRef.current.contains(target as Node)) {
          onClose();
        }
      };
      document.addEventListener('mousedown', handler);
      document.addEventListener('touchstart', handler, { passive: true });
      return () => {
        document.removeEventListener('mousedown', handler);
        document.removeEventListener('touchstart', handler);
      };
    }, 10);
    return () => clearTimeout(t);
  }, [onClose]);

  // ── Escape key ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Click-away backdrop (transparent) */}
      <div className="fixed inset-0 z-[60]" onClick={onClose} aria-hidden="true" />

      <div
        ref={menuRef}
        role="menu"
        aria-label="Status options"
        className="fixed z-[61] bg-paper border border-border rounded-card shadow-modal py-1.5"
        style={{ top, left, width: MENU_W }}
      >
        {/* Header */}
        <p className="font-sans text-[10px] uppercase tracking-[0.07em] text-muted px-3 py-1.5">
          Set exact status
        </p>

        {/* Status rows */}
        {STATUS_ROWS.map(({ status, label, color, key }) => {
          const isActive = currentStatus === status;
          return (
            <button
              key={status}
              role="menuitem"
              onClick={() => { onStatusChange(status); onClose(); }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-[7px] text-left transition-colors hover:bg-desk',
                isActive && 'bg-primary-05',
              )}
            >
              {status === VocabularyStatus.WELL_KNOWN ? (
                <span className="w-2 h-2 rounded-full shrink-0 border border-ink/70" />
              ) : (
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              )}
              <span className={cn('font-sans text-ui-sm text-ink', isActive && 'font-semibold')}>
                {label}
              </span>
              <Kbd>{key}</Kbd>
            </button>
          );
        })}

        <hr className="border-border my-1 mx-1" />

        {/* Ignore */}
        <button
          role="menuitem"
          onClick={() => { onStatusChange(VocabularyStatus.IGNORE); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-[7px] text-left hover:bg-desk transition-colors"
        >
          <Ban size={14} strokeWidth={1.5} className="text-muted shrink-0" />
          <span className="font-sans text-ui-sm text-ink">Ignore word</span>
          <Kbd>I</Kbd>
        </button>

        {/* Reset — power-user escape hatch back to UNKNOWN (pre-review state) */}
        <button
          role="menuitem"
          onClick={() => { onStatusChange(VocabularyStatus.UNKNOWN); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-[7px] text-left hover:bg-desk transition-colors"
        >
          <RotateCcw size={14} strokeWidth={1.5} className="text-muted shrink-0" />
          <span className="font-sans text-ui-sm text-ink">Reset to Unknown</span>
          <Kbd>⌫</Kbd>
        </button>

        {/* Keyboard hint footer */}
        <div className="border-t border-border mt-1 px-3 py-2">
          <p className="font-sans text-[10px] text-muted leading-relaxed">
            <kbd className="border border-border border-b-2 rounded px-1">1</kbd>–<kbd className="border border-border border-b-2 rounded px-1">4</kbd>
            {' '}set exact{' · '}
            <kbd className="border border-border border-b-2 rounded px-1">↑↓</kbd>
            {' '}nudge{' · '}
            <kbd className="border border-border border-b-2 rounded px-1">I</kbd>
            {' '}ignore{' · '}
            <kbd className="border border-border border-b-2 rounded px-1">⌫</kbd>
            {' '}reset
          </p>
        </div>
      </div>
    </>
  );
}
