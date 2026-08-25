'use client';

import { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { AudioSettingsSection } from './AudioSettingsSection';
import { cn } from '@/lib/utils';

// ============================================================================
// ReaderSettingsPanel — popover from the ⚙ button in the reader top bar.
//
// Exposes font size, highlight intensity, highlight mode, well-known toggle,
// and color scheme. Closes on outside click, Escape, or the ✕ button.
//
// Position: fixed, anchored to the ⚙ button via anchorEl.
// Width: 272px. Arrow indicator points up to the ⚙ button.
// ============================================================================

interface ReaderSettingsPanelProps {
  anchorEl: HTMLButtonElement;
  onClose: () => void;
  /** Which tab to open on. The mini-player's gear passes 'audio' so it lands
   * directly on the narration/Tutor controls instead of the reading ones. */
  initialTab?: SettingsTab;
}

export type SettingsTab = 'reading' | 'audio';

const PANEL_W = 296;
const GAP = 8;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5 last:mb-0">
      <p className="font-sans text-ui-xs text-muted mb-1.5">{label}</p>
      {children}
    </div>
  );
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
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 h-8 rounded font-sans text-ui-xs transition-all active:scale-95',
            value === opt.value
              ? 'bg-primary/10 border-2 border-primary/40 text-primary font-semibold'
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

export function ReaderSettingsPanel({
  anchorEl,
  onClose,
  initialTab = 'reading',
}: ReaderSettingsPanelProps) {
  const {
    settings,
    updateFontSize,
    updateHighlightIntensity,
    updateHighlightMode,
    updateShowWellKnownWords,
    updateColorScheme,
  } = useReaderSettings();
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Position below ⚙ button ──────────────────────────────────────────────
  const rect = anchorEl.getBoundingClientRect();
  const left = Math.max(8, Math.min(rect.right - PANEL_W, window.innerWidth - PANEL_W - 8));
  const top  = rect.bottom + GAP;

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      const handler = (e: MouseEvent) => {
        if (
          panelRef.current &&
          !panelRef.current.contains(e.target as Node) &&
          !anchorEl.contains(e.target as Node)
        ) onClose();
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, 10);
    return () => clearTimeout(t);
  }, [onClose, anchorEl]);

  // ── Escape key ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Click-away backdrop */}
      <div className="fixed inset-0 z-[50]" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-label="Reader settings"
        className="fixed z-[51] bg-paper border border-border rounded-card shadow-modal p-4"
        style={{ top, left, width: PANEL_W }}
      >
        {/* Arrow caret */}
        <div
          className="absolute -top-[5px] right-3 w-2.5 h-2.5 bg-paper border-l border-t border-border rotate-45"
          aria-hidden="true"
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="font-sans text-ui-sm font-semibold text-ink">Reader Settings</p>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors -mr-1 p-0.5">
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        {/* Tabs — keeps the panel compact as the audio/Tutor options grow */}
        <div className="flex gap-1 mb-4 p-0.5 bg-desk rounded" role="tablist">
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
                'flex-1 h-7 rounded font-sans text-ui-xs transition-all cursor-pointer',
                tab === t.value
                  ? 'bg-paper text-ink font-semibold shadow-raised'
                  : 'text-muted hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'audio' ? (
          <AudioSettingsSection />
        ) : (
        <>
        {/* Font Size */}
        <Row label="Font Size">
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
        </Row>

        {/* Highlight Intensity */}
        <Row label={`Highlight Intensity — ${settings.highlightIntensity}%`}>
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
        </Row>

        {/* Highlight Mode */}
        <Row label="Highlight Mode">
          <SegmentedControl
            options={[
              { label: 'Highlight', value: 'highlight' },
              { label: 'Underline', value: 'underline' },
            ]}
            value={settings.highlightMode}
            onChange={(v) => updateHighlightMode(v as 'highlight' | 'underline')}
          />
        </Row>

        {/* Show Well-Known */}
        <div className="mb-3.5 flex items-center justify-between">
          <p className="font-sans text-ui-xs text-muted">Show Well-Known Words</p>
          <button
            role="switch"
            aria-checked={settings.showWellKnownWords}
            aria-label="Show well-known words"
            onClick={() => updateShowWellKnownWords(!settings.showWellKnownWords)}
            className={cn(
              'relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0',
              settings.showWellKnownWords ? 'bg-primary' : 'bg-border',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-raised transition-transform duration-200',
                settings.showWellKnownWords ? 'translate-x-4' : 'translate-x-0',
              )}
            />
          </button>
        </div>

        {/* Color Scheme */}
        <Row label="Color Scheme">
          <SegmentedControl
            options={[
              { label: 'Light', value: 'light' },
              { label: 'Dark',  value: 'dark'  },
            ]}
            value={settings.colorScheme}
            onChange={(v) => updateColorScheme(v as 'light' | 'dark')}
          />
        </Row>

        </>
        )}

        {/* Footer links */}
        <div className="border-t border-border mt-4 pt-3 flex items-center justify-between">
          <button className="font-sans text-ui-xs text-primary hover:text-primary/80 transition-colors">
            Reader Guide
          </button>
          <button className="font-sans text-ui-xs text-primary hover:text-primary/80 transition-colors">
            Keyboard Shortcuts
          </button>
        </div>
      </div>
    </>
  );
}
