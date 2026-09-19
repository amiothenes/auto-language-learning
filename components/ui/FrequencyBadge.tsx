'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { FREQUENCY_TIER_CONFIG, formatFrequencyDetail, tierForFrequencyScore } from '@/lib/utils/frequencyTier';

// ============================================================================
// FrequencyBadge — CEFR-style A/B1/B2/C tier for dictionaryFrequency.
//
// The single shared representation of word commonality across the app
// (vocab table, vocab cards, reader tooltip, reader detail panel) — replaces
// the raw "62/100" numbers and the one-off `rarityLabel()` text that used to
// vary by surface. Hovering (desktop) or tapping (touch) the letter reveals
// the underlying percentile + a disclaimer that this is an estimate, not
// real CEFR.
//
// The detail popup is rendered via a portal into document.body and
// positioned from the letter's own getBoundingClientRect(), the same
// pattern MoreMenu.tsx and WordDetailsPanel.tsx use — a plain absolutely-
// positioned child would get silently clipped by any ancestor with
// `overflow: hidden`/`auto` (the reader panel, the vocab table's scroll
// wrapper), regardless of z-index.
// ============================================================================

interface FrequencyBadgeProps {
  score: number | null | undefined;
  percentile?: number | null;
  size?: 'sm' | 'md';
}

export function FrequencyBadge({ score, percentile, size = 'sm' }: FrequencyBadgeProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  // Two-phase position: render off-screen first so we know the tooltip's
  // real (wrapped) width/height, then place it against the letter.
  useLayoutEffect(() => {
    if (!open) return;
    const button = buttonRef.current;
    const tooltip = tooltipRef.current;
    if (!button || !tooltip) return;

    const anchor = button.getBoundingClientRect();
    const margin = 8;
    const gap = 6;

    let left = anchor.left + anchor.width / 2 - tooltip.offsetWidth / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltip.offsetWidth - margin));

    const placeAbove = anchor.top >= tooltip.offsetHeight + gap + margin;
    const top = placeAbove ? anchor.top - tooltip.offsetHeight - gap : anchor.bottom + gap;

    setPosition({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || tooltipRef.current?.contains(target)) return;
      setOpen(false);
    }
    function close() {
      setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const tier = tierForFrequencyScore(score);
  const config = FREQUENCY_TIER_CONFIG[tier];
  const detail = formatFrequencyDetail(score, percentile);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-sans font-semibold text-center cursor-help',
          size === 'sm' ? 'w-7 py-0.5 text-ui-xs' : 'w-9 py-1 text-ui-sm'
        )}
        style={{ backgroundColor: config.bgColor, color: config.textColor }}
      >
        {config.label}
      </button>

      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className={cn(
              'fixed z-50 w-max max-w-64 rounded-md bg-ink text-paper font-sans text-ui-xs px-2.5 py-1.5 shadow-modal',
              position === null && 'opacity-0'
            )}
            style={position ? { top: position.top, left: position.left } : { top: 0, left: 0 }}
          >
            {detail}
          </div>,
          document.body
        )}
    </>
  );
}
