'use client';

// ============================================================================
// ReviewSettingsFields — the shared field list behind the Review page's gear
// icon (desktop popover: ReviewSettingsPanel, mobile: MobileReviewSettingsSheet).
//
// Surfaces only the settings worth tweaking mid-session (session order, audio,
// daily limits). Deeper/rarely-touched config (eligible status range, max
// downgrades, type-switch threshold) stays on the full /settings/review page,
// linked from the footer below.
// ============================================================================

import { SettingRow } from '@/components/settings/SettingRow';
import { Select, SelectOption } from '@/components/settings/Select';
import { Toggle } from '@/components/settings/Toggle';
import type { SrsSettingsPayload } from '@/lib/types/api';

const NEW_CARDS_OPTIONS: SelectOption[] = ['5', '10', '20', '30', '50'].map((v) => ({ value: v, label: `${v} / day` }));

const REVIEWS_OPTIONS: SelectOption[] = [
  { value: '20', label: '20 / day' },
  { value: '50', label: '50 / day' },
  { value: '100', label: '100 / day' },
  { value: '200', label: '200 / day' },
  { value: 'unlimited', label: 'Unlimited' },
];

const NEW_CARDS_POSITION_OPTIONS: SelectOption[] = [
  { value: 'end', label: 'After all reviews' },
  { value: 'interleaved', label: 'Interleaved with reviews' },
];

interface ReviewSettingsFieldsProps {
  settings: SrsSettingsPayload;
  onChange: (patch: Partial<SrsSettingsPayload>) => void;
  onMoreSettings: () => void;
}

export function ReviewSettingsFields({ settings, onChange, onMoreSettings }: ReviewSettingsFieldsProps) {
  return (
    <div className="space-y-4">
      <SettingRow label="Session Order" description="Where new cards fall relative to due reviews">
        <Select
          options={NEW_CARDS_POSITION_OPTIONS}
          value={settings.newCardsPosition}
          onChange={(v) => onChange({ newCardsPosition: v as SrsSettingsPayload['newCardsPosition'] })}
        />
      </SettingRow>

      <SettingRow label="New Cards" description="Introduced into review per day">
        <Select
          options={NEW_CARDS_OPTIONS}
          value={String(settings.newCardsPerDay)}
          onChange={(v) => onChange({ newCardsPerDay: Number(v) })}
        />
      </SettingRow>

      <SettingRow label="Reviews" description="Due cards reviewed per day">
        <Select
          options={REVIEWS_OPTIONS}
          value={settings.reviewsPerDay === null ? 'unlimited' : String(settings.reviewsPerDay)}
          onChange={(v) => onChange({ reviewsPerDay: v === 'unlimited' ? null : Number(v) })}
        />
      </SettingRow>

      <SettingRow label="Sentence Audio" description="Play the example sentence's audio">
        <Toggle checked={settings.sentenceAudioEnabled} onChange={(v) => onChange({ sentenceAudioEnabled: v })} />
      </SettingRow>

      <SettingRow label="Word Audio" description="Play the root word's pronunciation">
        <Toggle checked={settings.wordAudioEnabled} onChange={(v) => onChange({ wordAudioEnabled: v })} />
      </SettingRow>

      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={onMoreSettings}
          className="font-sans text-ui-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
        >
          More review settings
        </button>
      </div>
    </div>
  );
}
