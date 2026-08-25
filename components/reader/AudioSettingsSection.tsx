'use client';

import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getVoiceOptions, resolveVoiceForLanguage } from '@/lib/tts/voiceMap';
import { cn } from '@/lib/utils';
import type { TutorModeTiming, TutorModeThreshold, TutorModeResume } from '@/lib/types';

// ============================================================================
// AudioSettingsSection — the "Audio" tab body, shared verbatim by the desktop
// settings popover and the mobile settings sheet so these controls (and the
// wording that explains them) can never drift apart between the two.
// ============================================================================

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5 last:mb-0">
      <p className="font-sans text-ui-xs text-muted mb-1.5">{label}</p>
      {children}
      {hint && <p className="font-sans text-[10px] text-muted/80 mt-1 leading-snug">{hint}</p>}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 h-8 px-1 rounded font-sans text-[11px] transition-all active:scale-95 cursor-pointer',
            value === opt.value
              ? 'bg-primary/10 border-2 border-primary/40 text-primary font-semibold'
              : 'border border-border text-muted hover:bg-desk',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between">
      <p className="font-sans text-ui-xs text-ink font-medium">{label}</p>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 cursor-pointer',
          checked ? 'bg-primary' : 'bg-border',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-raised transition-transform duration-200',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
}

export function AudioSettingsSection() {
  const {
    settings,
    updatePlaybackSpeed,
    updatePreferredVoice,
    toggleTutorMode,
    updateTutorModeTiming,
    updateTutorModeThreshold,
    updateTutorModeMaxPerSentence,
    updateTutorModeMaxInterrupts,
    updateTutorModeResume,
  } = useReaderSettings();

  const { selectedLanguage } = useLanguage();
  const voiceOptions = getVoiceOptions(selectedLanguage);
  const activeVoice = resolveVoiceForLanguage(
    selectedLanguage,
    settings.preferredVoices[selectedLanguage]
  );

  return (
    <div>
      {voiceOptions.length > 0 && (
        <Row label="Voice" hint="Changing voice re-synthesizes as you listen; each voice is cached separately.">
          <select
            value={activeVoice ?? ''}
            onChange={(e) => updatePreferredVoice(selectedLanguage, e.target.value)}
            className="w-full h-8 px-2 rounded border border-border bg-paper font-sans text-[11px] text-ink cursor-pointer"
            aria-label="Narration voice"
          >
            {voiceOptions.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.label} · {voice.gender === 'female' ? 'F' : 'M'}
              </option>
            ))}
          </select>
        </Row>
      )}

      <Row label={`Playback Speed — ${settings.playbackSpeed.toFixed(2)}×`}>
        <input
          type="range"
          min={0.5}
          max={1.25}
          step={0.05}
          value={settings.playbackSpeed}
          onChange={(e) => updatePlaybackSpeed(Number(e.target.value))}
          className="w-full accent-primary h-1.5 rounded-full appearance-none bg-border cursor-pointer"
          aria-label="TTS playback speed"
        />
      </Row>

      <div className="border-t border-border my-3.5" />

      <Toggle
        label="Tutor Mode"
        checked={settings.tutorModeEnabled}
        onChange={toggleTutorMode}
      />
      <p className="font-sans text-[10px] text-muted/80 -mt-2 mb-3.5 leading-snug">
        Pauses narration to check you on words you haven&apos;t learned yet.
      </p>

      {/* The rest only matters once Tutor Mode is on — dimmed rather than
          hidden so its options stay discoverable before you enable it. */}
      <div className={cn(!settings.tutorModeEnabled && 'opacity-40 pointer-events-none')}>
        <Row
          label="Interrupt"
          hint={
            settings.tutorModeTiming === 'atWord'
              ? 'Stops right after the word is spoken — heard in context, then asked.'
              : settings.tutorModeTiming === 'before'
                ? 'Checks the words first, then plays the sentence uninterrupted.'
                : 'Plays the whole sentence, then reviews its words.'
          }
        >
          <Segmented<TutorModeTiming>
            options={[
              { label: 'Before', value: 'before' },
              { label: 'At word', value: 'atWord' },
              { label: 'After', value: 'after' },
            ]}
            value={settings.tutorModeTiming}
            onChange={updateTutorModeTiming}
          />
        </Row>

        <Row label="Stop on words up to" hint="Ignored words are never checked.">
          <Segmented<TutorModeThreshold>
            options={[
              { label: 'Unknown', value: 'UNKNOWN' },
              { label: 'New', value: 'NEWLY_SEEN' },
              { label: 'Familiar', value: 'FAMILIAR' },
              { label: 'Known', value: 'KNOWN' },
            ]}
            value={settings.tutorModeThreshold}
            onChange={updateTutorModeThreshold}
          />
        </Row>

        <Row label="Max per sentence">
          <Segmented<string>
            options={[
              { label: '1', value: '1' },
              { label: '2', value: '2' },
              { label: '3', value: '3' },
              { label: 'All', value: '0' },
            ]}
            value={String(settings.tutorModeMaxPerSentence)}
            onChange={(v) => updateTutorModeMaxPerSentence(Number(v))}
          />
        </Row>

        <Row
          label={`Max per text — ${settings.tutorModeMaxInterrupts}`}
          hint="After this many checks, narration plays straight through."
        >
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={settings.tutorModeMaxInterrupts}
            onChange={(e) => updateTutorModeMaxInterrupts(Number(e.target.value))}
            className="w-full accent-primary h-1.5 rounded-full appearance-none bg-border cursor-pointer"
            aria-label="Maximum Tutor Mode checks per text"
          />
        </Row>

        <Row
          label="Resume playback"
          hint={
            settings.tutorModeResume === 'onDismiss'
              ? 'The card stays open after grading so you can read it; closing it continues.'
              : 'Grading the word continues playback straight away.'
          }
        >
          <Segmented<TutorModeResume>
            options={[
              { label: 'On grade', value: 'onGrade' },
              { label: 'When I close', value: 'onDismiss' },
            ]}
            value={settings.tutorModeResume}
            onChange={updateTutorModeResume}
          />
        </Row>
      </div>
    </div>
  );
}
