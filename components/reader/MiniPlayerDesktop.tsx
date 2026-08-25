'use client';

import { GraduationCap, LoaderCircle, Pause, Play, Settings2, SkipBack, SkipForward, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SentencePlaybackState } from '@/lib/hooks/useSentencePlayer';

interface MiniPlayerProps {
  playbackState: SentencePlaybackState;
  /** -1 = not started */
  currentSentenceIndex: number;
  totalSentences: number;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  /** Stops and clears the karaoke highlight — mirrors the ■ that replaces ▶
   * in the narrating paragraph's margin. */
  onStop: () => void;
  tutorModeEnabled: boolean;
  onToggleTutorMode: () => void;
  onOpenAudioSettings: () => void;
  playbackSpeed: number;
  disabled?: boolean;
}

// Lives in the reader's right-gutter column alongside ParagraphScrubber
// (see page.tsx) — both are "progress/meta" UI colocated in that column.
export function MiniPlayerDesktop({
  playbackState,
  currentSentenceIndex,
  totalSentences,
  onPlayPause,
  onPrevious,
  onNext,
  onStop,
  tutorModeEnabled,
  onToggleTutorMode,
  onOpenAudioSettings,
  playbackSpeed,
  disabled = false,
}: MiniPlayerProps) {
  const isLoading = playbackState === 'loading';
  const isPlaying = playbackState === 'playing';
  const started = currentSentenceIndex >= 0 && totalSentences > 0;
  const progress = started ? ((currentSentenceIndex + 1) / totalSentences) * 100 : 0;

  return (
    <div
      className="bg-paper border border-border rounded-lg shadow-raised p-3"
      aria-label="Text-to-speech player"
    >
      {/* Header: label + shortcut into the settings panel's Audio tab */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-sans text-[10.5px] uppercase tracking-wide text-muted">Narration</span>
        <button
          type="button"
          onClick={onOpenAudioSettings}
          className="text-muted hover:text-ink transition-colors p-0.5 -mr-0.5 rounded cursor-pointer"
          aria-label="Audio settings"
          title="Audio settings"
        >
          <Settings2 size={13} strokeWidth={1.5} />
        </button>
      </div>

      {/* Transport */}
      <div className="flex items-center justify-center gap-1.5 mb-2.5">
        <button
          type="button"
          onClick={onPrevious}
          disabled={disabled || !started}
          className="flex items-center justify-center w-7 h-7 rounded-full text-muted hover:text-ink hover:bg-desk transition-colors disabled:opacity-30 shrink-0 cursor-pointer"
          aria-label="Previous sentence"
        >
          <SkipBack size={13} strokeWidth={2} fill="currentColor" />
        </button>

        <button
          type="button"
          onClick={onPlayPause}
          disabled={disabled || isLoading}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-paper hover:bg-primary/90 transition-colors disabled:opacity-40 shrink-0 cursor-pointer"
          aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
        >
          {isLoading ? (
            <LoaderCircle size={16} strokeWidth={2} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={14} strokeWidth={2} fill="currentColor" />
          ) : (
            <Play size={14} strokeWidth={2} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={disabled || totalSentences === 0}
          className="flex items-center justify-center w-7 h-7 rounded-full text-muted hover:text-ink hover:bg-desk transition-colors disabled:opacity-30 shrink-0 cursor-pointer"
          aria-label="Next sentence"
        >
          <SkipForward size={13} strokeWidth={2} fill="currentColor" />
        </button>

        <button
          type="button"
          onClick={onStop}
          disabled={disabled || !started}
          className="flex items-center justify-center w-7 h-7 rounded-full text-muted hover:text-ink hover:bg-desk transition-colors disabled:opacity-30 shrink-0 cursor-pointer"
          aria-label="Stop narration and clear highlight"
          title="Stop"
        >
          <Square size={11} strokeWidth={2} fill="currentColor" />
        </button>
      </div>

      {/* Progress + position */}
      <div className="mb-2.5">
        <div className="h-1 rounded-full bg-border overflow-hidden mb-1">
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between font-sans text-[10px] text-muted">
          <span>
            {started ? `${currentSentenceIndex + 1} / ${totalSentences}` : `${totalSentences} sentences`}
          </span>
          <span>{playbackSpeed.toFixed(2)}×</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleTutorMode}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-center gap-1.5 h-7 rounded font-sans text-[10.5px] transition-colors disabled:opacity-40 cursor-pointer',
          tutorModeEnabled
            ? 'bg-primary/10 border border-primary/30 text-primary font-medium'
            : 'border border-border text-muted hover:bg-desk',
        )}
        aria-pressed={tutorModeEnabled}
      >
        <GraduationCap size={12} strokeWidth={1.5} />
        Tutor Mode
      </button>
    </div>
  );
}
