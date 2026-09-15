'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useSrsSettings, useUpdateSrsSettings } from '@/lib/hooks/useSrsSettings';
import { SettingSection } from '@/components/settings/SettingSection';
import { SettingRow } from '@/components/settings/SettingRow';
import { Select, SelectOption } from '@/components/settings/Select';
import { Toggle } from '@/components/settings/Toggle';
import { useAutoSaveToast } from '@/components/ui/AutoSaveToast';
import { Muted } from '@/components/ui/Typography';
import { VocabularyStatus } from '@/lib/types/vocabulary';
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

const STATUS_LABELS: Record<VocabularyStatus, string> = {
  [VocabularyStatus.UNKNOWN]: 'Unknown',
  [VocabularyStatus.NEWLY_SEEN]: 'Newly Seen',
  [VocabularyStatus.FAMILIAR]: 'Familiar',
  [VocabularyStatus.KNOWN]: 'Known',
  [VocabularyStatus.WELL_KNOWN]: 'Well Known',
  [VocabularyStatus.IGNORE]: 'Ignore',
};

const REVIEWABLE_STATUS_OPTIONS: SelectOption[] = [
  VocabularyStatus.NEWLY_SEEN,
  VocabularyStatus.FAMILIAR,
  VocabularyStatus.KNOWN,
  VocabularyStatus.WELL_KNOWN,
].map((s) => ({ value: s, label: STATUS_LABELS[s] }));

export default function ReviewSettingsPage() {
  const { currentLanguage } = useLanguage();
  const languageId = currentLanguage?.id;
  const { data: settings, isLoading } = useSrsSettings(languageId);
  const updateSettings = useUpdateSrsSettings(languageId);
  const { showSaved, showError, ToastComponent } = useAutoSaveToast();

  function patch(update: Partial<SrsSettingsPayload>) {
    updateSettings.mutate(update, {
      onSuccess: showSaved,
      onError: () => showError('Failed to save review settings'),
    });
  }

  if (!languageId || isLoading || !settings) {
    return <Muted>Loading review settings…</Muted>;
  }

  return (
    <div className="space-y-6">
      <SettingSection
        title="Daily Limits"
        description={`How many cards to introduce and review per day, for ${currentLanguage?.name}`}
      >
        <SettingRow label="New Cards" description="Words introduced into review for the first time each day">
          <Select
            options={NEW_CARDS_OPTIONS}
            value={String(settings.newCardsPerDay)}
            onChange={(v) => patch({ newCardsPerDay: Number(v) })}
          />
        </SettingRow>

        <SettingRow label="Reviews" description="Due cards reviewed each day">
          <Select
            options={REVIEWS_OPTIONS}
            value={settings.reviewsPerDay === null ? 'unlimited' : String(settings.reviewsPerDay)}
            onChange={(v) => patch({ reviewsPerDay: v === 'unlimited' ? null : Number(v) })}
          />
        </SettingRow>

        <SettingRow label="Session Order" description="Where new cards fall relative to due reviews in the queue">
          <Select
            options={NEW_CARDS_POSITION_OPTIONS}
            value={settings.newCardsPosition}
            onChange={(v) => patch({ newCardsPosition: v as SrsSettingsPayload['newCardsPosition'] })}
          />
        </SettingRow>
      </SettingSection>

      <SettingSection
        title="Card Selection"
        description="Which words are reviewed, and when a card switches from sentence to word-only"
      >
        <SettingRow label="Review From" description="Words below this status aren't reviewed yet">
          <Select
            options={REVIEWABLE_STATUS_OPTIONS}
            value={settings.minEligibleStatus}
            onChange={(v) => patch({ minEligibleStatus: v as VocabularyStatus })}
          />
        </SettingRow>

        <SettingRow label="Review Until" description="Words at or above this status are considered graduated">
          <Select
            options={REVIEWABLE_STATUS_OPTIONS}
            value={settings.maxEligibleStatus}
            onChange={(v) => patch({ maxEligibleStatus: v as VocabularyStatus })}
          />
        </SettingRow>

        <SettingRow label="Switch to Word Card At" description="Below this status, cards show a sentence; at or above, just the word">
          <Select
            options={REVIEWABLE_STATUS_OPTIONS}
            value={settings.typeSwitchStatus}
            onChange={(v) => patch({ typeSwitchStatus: v as VocabularyStatus })}
          />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Audio" description="Pronunciation during review">
        <SettingRow label="Sentence Audio" description="Play the example sentence's audio on sentence cards">
          <Toggle checked={settings.sentenceAudioEnabled} onChange={(v) => patch({ sentenceAudioEnabled: v })} />
        </SettingRow>
        <SettingRow label="Word Audio" description="Play the root word's pronunciation">
          <Toggle checked={settings.wordAudioEnabled} onChange={(v) => patch({ wordAudioEnabled: v })} />
        </SettingRow>
      </SettingSection>

      {ToastComponent}
    </div>
  );
}
