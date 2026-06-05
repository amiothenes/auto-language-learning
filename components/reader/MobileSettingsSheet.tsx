'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { cn } from '@/lib/utils';

// ============================================================================
// MobileSettingsSheet — bottom-sheet reader settings for mobile/tablet (<1280px).
//
// Mirrors all controls from ReaderSettingsPanel (font size, highlight intensity,
// highlight mode, show well-known, color scheme) but rendered as a full bottom
// sheet rather than a popover anchored to a button.
//
// Slides in with animate-slide-up. Closes on backdrop click or Escape.
// ============================================================================

interface MobileSettingsSheetProps {
  onClose: () => void;
}

function SegmentedControl({
  options,
  value,
  onChange,
  serif = false,
}: {
  options: { label: string; value: string; size?: number }[];
  value: string;
  onChange: (v: string) => void;
  serif?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 h-11 rounded font-sans text-ui-xs transition-all active:scale-95',
            value === opt.value
              ? 'bg-primary-10 border-2 border-primary/40 text-primary font-semibold'
              : 'border border-border text-muted hover:bg-desk',
            serif && 'font-serif',
          )}
          style={opt.size ? { fontSize: opt.size } : undefined}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function MobileSettingsSheet({ onClose }: MobileSettingsSheetProps) {
  const {
    settings,
    updateFontSize,
    updateHighlightIntensity,
    updateHighlightMode,
    updateShowWellKnownWords,
    updateColorScheme,
  } = useReaderSettings();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-45 bg-ink/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 inset-x-0 z-48 bg-paper rounded-t-2xl shadow-modal max-h-[76dvh] flex flex-col xl:hidden animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-label="Reader settings"
      >
        {/* Handle */}
        <div className="shrink-0 pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-sans text-ui-sm font-semibold text-ink">Reader Settings</p>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors p-1 -mr-1"
            aria-label="Close settings"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Controls — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
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
                'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0',
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

          {/* Color Scheme */}
          <div className="pb-4">
            <p className="font-sans text-ui-xs text-muted mb-2">Color Scheme</p>
            <SegmentedControl
              options={[
                { label: 'Light', value: 'light' },
                { label: 'Dark',  value: 'dark'  },
              ]}
              value={settings.colorScheme}
              onChange={(v) => updateColorScheme(v as 'light' | 'dark')}
            />
          </div>
        </div>
      </div>
    </>
  );
}
