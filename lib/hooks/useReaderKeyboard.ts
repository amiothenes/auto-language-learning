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
}

export function useReaderKeyboard({
  currentStatus,
  onStatusChange,
  isActive,
}: UseReaderKeyboardOptions) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (
        !isActive ||
        currentStatus === null ||
        (e.target instanceof HTMLElement &&
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName))
      ) return;

      const idx = PROGRESSION.indexOf(currentStatus as typeof PROGRESSION[number]);

      switch (e.key) {
        case '1': onStatusChange(VocabularyStatus.UNKNOWN);    e.preventDefault(); break;
        case '2': onStatusChange(VocabularyStatus.NEWLY_SEEN); e.preventDefault(); break;
        case '3': onStatusChange(VocabularyStatus.FAMILIAR);   e.preventDefault(); break;
        case '4': onStatusChange(VocabularyStatus.KNOWN);      e.preventDefault(); break;
        case '5': onStatusChange(VocabularyStatus.WELL_KNOWN); e.preventDefault(); break;

        case 'ArrowUp': {
          if (idx >= 0 && idx < PROGRESSION.length - 1) {
            onStatusChange(PROGRESSION[idx + 1]);
            e.preventDefault();
          }
          break;
        }

        case 'ArrowDown': {
          if (idx > 0) {
            onStatusChange(PROGRESSION[idx - 1]);
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
    [isActive, currentStatus, onStatusChange]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);
}
