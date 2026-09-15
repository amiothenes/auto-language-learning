'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { AudioSettingsSection } from './AudioSettingsSection';
import { cn } from '@/lib/utils';

// ============================================================================
// MobileSettingsSheet — bottom-sheet reader settings for mobile/tablet (<1280px).
//
// Mirrors all controls from ReaderSettingsPanel (font size, highlight intensity,
// highlight mode, show well-known, color scheme) but rendered as a full bottom
// sheet rather than a popover anchored to a button.
//
// Slides in with animate-slide-up. Closes (with a slide-down) on backdrop
// click, Escape, the ✕, or a downward drag on the handle/header.
//
// z-index sits above the shell's mobile bottom nav (components/Sidebar.tsx,
// z-50) — at z-48 it used to render *behind* that nav, clipping everything
// past "Color Scheme" the same way the mini-player once did (see
// MiniPlayerMobile's bottom-16 comment for that earlier instance).
//
// Height is a fixed h-[76dvh] rather than max-h so switching the Reading/Audio
// tab (whose content heights differ) never shifts the sheet's top edge.
// ============================================================================

interface MobileSettingsSheetProps {
  onClose: () => void;
  /** Which tab to open on — 'audio' when reached via the player's gear. */
  initialTab?: 'reading' | 'audio';
}

function SegmentedControl({
  options,
  value,
  onChange,
  serif = false,
}: {
  options: { label: string; value: string; size?: number; disabled?: boolean }[];
  value: string;
  onChange: (v: string) => void;
  serif?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={opt.disabled}
          title={opt.disabled ? 'Coming soon' : undefined}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 h-11 rounded font-sans text-ui-xs transition-all active:scale-95 cursor-pointer',
            value === opt.value
              ? 'bg-primary-10 border-2 border-primary/40 text-primary font-semibold'
              : 'border border-border text-muted hover:bg-desk',
            serif && 'font-serif',
            opt.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent active:scale-100',
          )}
          style={opt.size ? { fontSize: opt.size } : undefined}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function MobileSettingsSheet({ onClose, initialTab = 'reading' }: MobileSettingsSheetProps) {
  const {
    settings,
    updateFontSize,
    updateHighlightIntensity,
    updateHighlightMode,
    updateShowWellKnownWords,
    updateColorScheme,
  } = useReaderSettings();
  const [tab, setTab] = useState<'reading' | 'audio'>(initialTab);
  const [dismissing, setDismissing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const draggingRef = useRef(false);
  const touchStartY = useRef(0);

  const dismiss = () => {
    if (dismissing) return;
    setDismissing(true);
    setTimeout(onClose, 220);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    draggingRef.current = true;
  };
  const handleDragMove = (e: React.TouchEvent) => {
    if (!draggingRef.current) return;
    setDragY(Math.max(0, e.touches[0].clientY - touchStartY.current));
  };
  const handleDragEnd = () => {
    draggingRef.current = false;
    if (dragY > 80) dismiss();
    else setDragY(0);
  };

  const sheetStyle: React.CSSProperties = dismissing
    ? { transform: 'translateY(100%)', transition: 'transform 0.22s ease-in' }
    : {
        transform: dragY ? `translateY(${dragY}px)` : undefined,
        transition: dragY ? 'none' : 'transform 0.2s cubic-bezier(0,0,.2,1)',
      };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-55 bg-ink/30 backdrop-blur-[2px]"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 inset-x-0 z-56 bg-paper rounded-t-2xl shadow-modal h-[76dvh] flex flex-col overflow-hidden xl:hidden animate-slide-up"
        style={sheetStyle}
        role="dialog"
        aria-modal="true"
        aria-label="Reader settings"
      >
        {/* Handle + header — the draggable top zone; dragging it down past
            the threshold dismisses the sheet, same gesture as MobileWordSheet. */}
        <div
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          className="shrink-0 touch-none cursor-grab active:cursor-grabbing"
        >
          {/* Handle */}
          <div className="pt-3 pb-1 flex justify-center">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-sans text-ui-sm font-semibold text-ink">Reader Settings</p>
            <button
              onClick={dismiss}
              className="text-muted hover:text-ink transition-colors p-1 -mr-1 cursor-pointer"
              aria-label="Close settings"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Controls — scrollable */}
        {/* Tabs — matches ReaderSettingsPanel's desktop tab switcher exactly
            (bg-desk rounded track, floating bg-paper + shadow-raised pill for
            the active tab) so the two stay visually identical, just sized up
            (h-9 vs h-7) for a touch target. */}
        <div className="shrink-0 px-4 pb-3">
          <div className="flex gap-1 p-0.5 bg-desk rounded" role="tablist">
            {([
              { label: 'Reading', value: 'reading' },
              { label: 'Audio', value: 'audio' },
            ] as const).map((t) => (
              <button
                key={t.value}
                role="tab"
                aria-selected={tab === t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  'flex-1 h-9 rounded font-sans text-ui-xs transition-all cursor-pointer',
                  tab === t.value
                    ? 'bg-paper text-ink font-semibold shadow-raised'
                    : 'text-muted hover:text-ink',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
          {tab === 'audio' && <AudioSettingsSection />}
          {tab === 'reading' && (<>
          {/* Font Size */}
          <div>
            <p className="font-sans text-ui-xs text-muted mb-2">Font Size</p>
            <SegmentedControl
              serif
              options={[
                { label: 'A–', value: 'small',  size: 12 },
                { label: 'A',  value: 'medium', size: 15 },
                { label: 'A+', value: 'large',  size: 18 },
              ]}
              value={settings.fontSize}
              onChange={(v) => updateFontSize(v as 'small' | 'medium' | 'large')}
            />
          </div>

          {/* Highlight Intensity */}
          <div>
            <p className="font-sans text-ui-xs text-muted mb-2">
              Highlight Intensity — {settings.highlightIntensity}%
            </p>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={settings.highlightIntensity}
              onChange={(e) => updateHighlightIntensity(Number(e.target.value))}
              className="w-full accent-primary h-1.5 rounded-full appearance-none bg-border cursor-pointer"
              aria-label="Highlight intensity"
            />
          </div>

          {/* Highlight Mode */}
          <div>
            <p className="font-sans text-ui-xs text-muted mb-2">Highlight Mode</p>
            <SegmentedControl
              options={[
                { label: 'Highlight', value: 'highlight' },
                { label: 'Underline', value: 'underline' },
              ]}
              value={settings.highlightMode}
              onChange={(v) => updateHighlightMode(v as 'highlight' | 'underline')}
            />
          </div>

          {/* Show Well-Known */}
          <div className="flex items-center justify-between py-0.5">
            <p className="font-sans text-ui-xs text-muted">Show Well-Known Words</p>
            <button
              role="switch"
              aria-checked={settings.showWellKnownWords}
              aria-label="Show well-known words"
              onClick={() => updateShowWellKnownWords(!settings.showWellKnownWords)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 cursor-pointer',
                settings.showWellKnownWords ? 'bg-primary' : 'bg-border',
              )}
            >
              <span
                className={cn(
                  'absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-raised transition-transform duration-200',
                  settings.showWellKnownWords ? 'translate-x-5' : 'translate-x-0',
                )}
              />
            </button>
          </div>

          {/* Color Scheme — Dark is disabled: there's no dark theme in the
              app's CSS yet, so it would silently do nothing if selectable.
              Matches the "coming soon" treatment on Settings → Display. */}
          <div>
            <p className="font-sans text-ui-xs text-muted mb-2">Color Scheme</p>
            <SegmentedControl
              options={[
                { label: 'Light', value: 'light' },
                { label: 'Dark',  value: 'dark', disabled: true },
              ]}
              value={settings.colorScheme}
              onChange={(v) => updateColorScheme(v as 'light' | 'dark')}
            />
            <p className="font-sans text-[10px] text-muted/80 mt-1.5">Dark mode is coming soon.</p>
          </div>

          </>)}
        </div>
      </div>
    </>
  );
}
