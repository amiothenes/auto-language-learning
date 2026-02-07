'use client';

import { useRef, useState, useEffect, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

// ============================================================================
// Tooltip Component
// Generic positioned tooltip container with backdrop, positioning, animations
// Includes focus trap for keyboard accessibility
// ============================================================================

type Placement = 'above' | 'below';

interface TooltipProps {
  anchorRect: DOMRect;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  isExiting?: boolean;
  preferredPlacement?: Placement;
  gap?: number;
}

export function Tooltip({
  anchorRect,
  isOpen,
  onClose,
  children,
  isExiting = false,
  preferredPlacement = 'above',
  gap = 8,
}: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<Placement>(preferredPlacement);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const scrollYRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);

  // Two-phase render: measure then position
  const updatePosition = useCallback(() => {
    const el = tooltipRef.current;
    if (!el) return;

    const tooltipWidth = el.offsetWidth;
    const tooltipHeight = el.offsetHeight;
    const viewportWidth = window.innerWidth;
    const margin = 12;

    // Determine placement
    const spaceAbove = anchorRect.top;
    const resolvedPlacement =
      preferredPlacement === 'above' && spaceAbove < tooltipHeight + gap + 40
        ? 'below'
        : preferredPlacement;

    setPlacement(resolvedPlacement);

    // Vertical position
    const top =
      resolvedPlacement === 'above'
        ? anchorRect.top - tooltipHeight - gap
        : anchorRect.bottom + gap;

    // Horizontal position: centered on anchor, clamped to viewport
    const anchorCenter = anchorRect.left + anchorRect.width / 2;
    let left = anchorCenter - tooltipWidth / 2;
    left = Math.max(margin, Math.min(left, viewportWidth - tooltipWidth - margin));

    setPosition({ top, left });
  }, [anchorRect, gap, preferredPlacement]);

  // Measure and position on mount and when anchorRect changes
  useEffect(() => {
    if (!isOpen) return;
    // Use requestAnimationFrame to wait for paint
    const raf = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(raf);
  }, [isOpen, updatePosition]);

  // Focus trap for keyboard navigation
  useFocusTrap(isOpen, tooltipRef);

  // Auto-focus first focusable element on open
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const firstFocusable = tooltipRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Escape key dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Scroll dismiss (with small threshold)
  useEffect(() => {
    if (!isOpen) return;
    scrollYRef.current = window.scrollY;

    const handleScroll = () => {
      if (Math.abs(window.scrollY - scrollYRef.current) > 10) {
        onClose();
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen, onClose]);

  // Resize dismiss
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', onClose);
    return () => window.removeEventListener('resize', onClose);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Arrow caret: calculate horizontal position relative to tooltip
  const arrowLeft = position
    ? anchorRect.left + anchorRect.width / 2 - position.left
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-ink/10"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        role="dialog"
        className={cn(
          'fixed z-50 shadow-modal rounded-card bg-paper border border-border',
          isExiting ? 'animate-tooltip-exit' : 'animate-tooltip-enter',
          // Hidden until positioned
          position === null && 'opacity-0'
        )}
        style={
          position
            ? { top: position.top, left: position.left }
            : { top: anchorRect.top, left: anchorRect.left, visibility: 'hidden' as const }
        }
      >
        {children}

        {/* Arrow caret */}
        {position && (
          <div
            className="absolute w-0 h-0"
            style={{
              left: Math.max(12, Math.min(arrowLeft, (tooltipRef.current?.offsetWidth ?? 320) - 12)),
              transform: 'translateX(-50%)',
              ...(placement === 'above'
                ? {
                    bottom: -6,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid #E5E2DA',
                  }
                : {
                    top: -6,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: '6px solid #E5E2DA',
                  }),
            }}
          >
            {/* Inner arrow (paper color fill) */}
            <div
              className="absolute"
              style={{
                left: -5,
                ...(placement === 'above'
                  ? {
                      bottom: 1,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: '5px solid #FAF9F5',
                    }
                  : {
                      top: 1,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderBottom: '5px solid #FAF9F5',
                    }),
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
