import { useEffect, useCallback } from 'react';
import { VocabularyStatus } from '@/lib/types';

const PROGRESSION = [
  VocabularyStatus.UNKNOWN,
  VocabularyStatus.NEWLY_SEEN,
  VocabularyStatus.FAMILIAR,
  VocabularyStatus.KNOWN,
  VocabularyStatus.WELL_KNOWN,
] as const;

interface UseReaderKeyboardOptions {
  currentStatus: VocabularyStatus | null;
  onStatusChange: (newStatus: VocabularyStatus) => void;
  isActive: boolean;
  /** Space toggles narration play/pause. */
  onTogglePlayback?: () => void;
}

export function useReaderKeyboard({
  currentStatus,
  onStatusChange,
  isActive,
  onTogglePlayback,
}: UseReaderKeyboardOptions) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
      ) return;

      // Space controls playback anywhere in the Reader, so it's handled ahead
      // of the guards below — pausing narration has nothing to do with having
      // a word selected or a panel being closed. preventDefault is what stops
      // the browser's default page-scroll (and stops Space from re-activating
      // a focused button, e.g. the word you just clicked).
      if (e.code === 'Space') {
        if (!onTogglePlayback) return;
        e.preventDefault();
        onTogglePlayback();
        return;
      }

      if (!isActive || currentStatus === null) return;

      const idx = PROGRESSION.indexOf(currentStatus as typeof PROGRESSION[number]);

      // Keys 1-4 map to the four user-facing statuses (UNKNOWN excluded — set at import only).
      // ArrowDown floors at NEWLY_SEEN; Backspace resets to NEWLY_SEEN.
      switch (e.key) {
        case '1': onStatusChange(VocabularyStatus.NEWLY_SEEN); e.preventDefault(); break;
        case '2': onStatusChange(VocabularyStatus.FAMILIAR);   e.preventDefault(); break;
        case '3': onStatusChange(VocabularyStatus.KNOWN);      e.preventDefault(); break;
        case '4': onStatusChange(VocabularyStatus.WELL_KNOWN); e.preventDefault(); break;

        case 'ArrowUp': {
          if (idx >= 0 && idx < PROGRESSION.length - 1) {
            onStatusChange(PROGRESSION[idx + 1]);
            e.preventDefault();
          }
          break;
        }

        case 'ArrowDown': {
          // Floor at NEWLY_SEEN (idx 1) — can't arrow down to UNKNOWN
          if (idx >= 1) {
            onStatusChange(PROGRESSION[Math.max(1, idx - 1)]);
            e.preventDefault();
          }
          break;
        }

        case 'i':
        case 'I':
          onStatusChange(VocabularyStatus.IGNORE);
          e.preventDefault();
          break;

        case 'Backspace':
          onStatusChange(VocabularyStatus.UNKNOWN);
          e.preventDefault();
          break;
      }
    },
    [isActive, currentStatus, onStatusChange, onTogglePlayback]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);
}
