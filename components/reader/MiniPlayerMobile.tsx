'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  GraduationCap,
  LoaderCircle,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SentencePlaybackState } from '@/lib/hooks/useSentencePlayer';

interface MiniPlayerMobileProps {
  playbackState: SentencePlaybackState;
  currentSentenceIndex: number;
  totalSentences: number;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  /** Stops narration and clears the karaoke highlight. Mobile has no hover,
   * so the ■ that desktop reveals in the paragraph margin needs a home here. */
  onStop: () => void;
  tutorModeEnabled: boolean;
  onToggleTutorMode: () => void;
  playbackSpeed: number;
  onPlaybackSpeedChange: (rate: number) => void;
  /** Hidden whenever any bottom sheet is open (word sheet, settings sheet,
   * paragraph map), rather than threading a height offset through all three:
   * audio is either deliberately interrupted or already auto-paused
   * (Tutor Mode), so there's nothing to control in either case. */
  hidden?: boolean;
  disabled?: boolean;
}

/**
 * Collapsed by default to a single row (play + progress + Tutor toggle), so it
 * costs the reading area as little vertical space as possible. Expanding
 * reveals the controls that don't earn permanent space — sentence skip and
 * speed — keeping them one tap away instead of buried in the settings sheet.
 */
export function MiniPlayerMobile({
  playbackState,
  currentSentenceIndex,
  totalSentences,
  onPlayPause,
  onPrevious,
  onNext,
  onStop,
  tutorModeEnabled,
  onToggleTutorMode,
  playbackSpeed,
  onPlaybackSpeedChange,
  hidden = false,
  disabled = false,
}: MiniPlayerMobileProps) {
  const [expanded, setExpanded] = useState(false);

  if (hidden || totalSentences === 0) return null;

  const isLoading = playbackState === 'loading';
  const isPlaying = playbackState === 'playing';
  const started = currentSentenceIndex >= 0;
  const progress = started ? ((currentSentenceIndex + 1) / totalSentences) * 100 : 0;

  return (
    <div
      // Positioned around the app shell (components/Sidebar.tsx), not over it:
      //  - below md, the shell puts a 64px bottom nav at z-50, so anchoring at
      //    bottom-0 hid this bar behind it entirely (it looked like TTS was
      //    missing on mobile). It sits above that nav instead.
      //  - from md up, the shell has a fixed 64px left rail; a full-bleed
      //    inset-x-0 bar ran underneath it, clipping the rail's icons.
      //
      // Visibility is driven entirely by the `hidden` prop rather than a
      // breakpoint class: the gutter player it defers to can be absent at
      // large widths too (Immersion Mode hides the whole column), which left
      // no player on screen at all. One owner of the decision, no gap.
      className="fixed bottom-16 md:bottom-0 left-0 md:left-16 right-0 z-30 bg-paper/95 backdrop-blur-sm border-t border-border shadow-[0_-2px_8px_rgba(20,20,19,0.06)]"
      role="region"
      aria-label="Text-to-speech player"
    >
      {/* Progress hairline — always visible, doubles as the collapsed affordance */}
      <div className="h-0.5 bg-border">
        <div
          className="h-full bg-primary transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Collapsed row ── */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <button
          type="button"
          onClick={onPlayPause}
          disabled={disabled || isLoading}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-paper hover:bg-primary/90 transition-colors disabled:opacity-40 shrink-0"
          aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
        >
          {isLoading ? (
            <LoaderCircle size={16} strokeWidth={2} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={15} strokeWidth={2} fill="currentColor" />
          ) : (
            <Play size={15} strokeWidth={2} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <span className="font-sans text-ui-xs text-muted flex-1 tabular-nums">
          {started ? `${currentSentenceIndex + 1} / ${totalSentences}` : `${totalSentences} sentences`}
        </span>

        <button
          type="button"
          onClick={onToggleTutorMode}
          disabled={disabled}
          className={cn(
            'flex items-center justify-center gap-1.5 h-8 px-3 rounded-full font-sans text-ui-xs transition-colors disabled:opacity-40 shrink-0',
            tutorModeEnabled
              ? 'bg-primary/10 border border-primary/30 text-primary font-medium'
              : 'border border-border text-muted',
          )}
          aria-pressed={tutorModeEnabled}
        >
          <GraduationCap size={13} strokeWidth={1.5} />
          Tutor
        </button>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center justify-center w-8 h-8 rounded-full text-muted hover:text-ink transition-colors shrink-0"
          aria-expanded={expanded}
          aria-label={expanded ? 'Hide player controls' : 'Show player controls'}
        >
          {expanded ? <ChevronDown size={16} strokeWidth={2} /> : <ChevronUp size={16} strokeWidth={2} />}
        </button>
      </div>

      {/* ── Expanded controls ── */}
      {expanded && (
        <div className="px-4 pb-3 pt-1 border-t border-border/60 flex items-center gap-4">
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onPrevious}
              disabled={disabled || !started}
              className="flex items-center justify-center w-9 h-9 rounded-full text-muted hover:text-ink hover:bg-desk transition-colors disabled:opacity-30"
              aria-label="Previous sentence"
            >
              <SkipBack size={15} strokeWidth={2} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={disabled}
              className="flex items-center justify-center w-9 h-9 rounded-full text-muted hover:text-ink hover:bg-desk transition-colors disabled:opacity-30"
              aria-label="Next sentence"
            >
              <SkipForward size={15} strokeWidth={2} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={onStop}
              disabled={disabled || !started}
              className="flex items-center justify-center w-9 h-9 rounded-full text-muted hover:text-ink hover:bg-desk transition-colors disabled:opacity-30"
              aria-label="Stop narration and clear highlight"
            >
              <Square size={13} strokeWidth={2} fill="currentColor" />
            </button>
          </div>

          <label className="flex-1 min-w-0">
            <span className="font-sans text-[10px] text-muted block mb-0.5">
              Speed — {playbackSpeed.toFixed(2)}×
            </span>
            <input
              type="range"
              min={0.5}
              max={1.25}
              step={0.05}
              value={playbackSpeed}
              onChange={(e) => onPlaybackSpeedChange(Number(e.target.value))}
              className="w-full accent-primary h-1.5 rounded-full appearance-none bg-border cursor-pointer"
              aria-label="Playback speed"
            />
          </label>
        </div>
      )}
    </div>
  );
}
