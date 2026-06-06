'use client';

import { cn } from '@/lib/utils';
import { VocabularyStatus } from '@/lib/types';
import type { WordData } from '@/lib/types';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';

// Re-export for backward compatibility
export { VocabularyStatus };
export type { WordData };

// ============================================================================
// Word Component
// Interactive word span with status-based styling
// ============================================================================

interface WordProps {
  data: WordData;
  onClick: (data: WordData, anchorRect: DOMRect) => void;
  isSelected?: boolean;
  highlightIntensity?: number; // 0-100, default 100
  showWellKnownWords?: boolean; // default true
}

export function Word({
  data,
  onClick,
  isSelected = false,
  highlightIntensity = 100,
  showWellKnownWords = true,
}: WordProps) {
  const { settings } = useReaderSettings();
  const isUnderline = settings.highlightMode === 'underline';

  const getStatusColor = (status: VocabularyStatus, isHover: boolean): string | undefined => {
    const baseOpacity = isHover ? 0.25 : (isSelected ? 0.2 : 0.15);
    // Apply highlight intensity (0-100 -> 0.0-1.0 multiplier)
    const opacity = baseOpacity * (highlightIntensity / 100);
    
    switch (status) {
      case VocabularyStatus.UNKNOWN:
        return `hsl(var(--color-status-unknown) / ${opacity})`;
      case VocabularyStatus.NEWLY_SEEN:
        return `hsl(var(--color-status-new) / ${opacity})`;
      case VocabularyStatus.FAMILIAR:
        return `hsl(var(--color-status-familiar) / ${opacity})`;
      case VocabularyStatus.KNOWN:
        return `hsl(var(--color-status-known) / ${opacity > 0.1 ? opacity : 0.05})`;
      case VocabularyStatus.WELL_KNOWN:
        return undefined; // No styling
      case VocabularyStatus.IGNORE:
        return undefined; // Special styling via classes
      default:
        return undefined;
    }
  };

  // Special styling for IGNORE and WELL_KNOWN statuses
  const isIgnored = data.status === VocabularyStatus.IGNORE;
  const isWellKnown = data.status === VocabularyStatus.WELL_KNOWN;

  // Build native title tooltip text — surface form + lemma + POS
  const posLabel = data.pos && data.pos !== 'UNKNOWN' ? ` (${data.pos})` : '';
  const titleText = !isSelected
    ? data.surface !== data.lemma
      ? `${data.surface} → ${data.lemma}${posLabel}`
      : `${data.lemma}${posLabel}`
    : undefined;

  return (
    <button
      type="button"
      onClick={(e) => onClick(data, e.currentTarget.getBoundingClientRect())}
      title={titleText}
      className={cn(
        // Reset button styles to inline appearance
        "inline appearance-none border-0 bg-transparent p-0 text-inherit align-baseline",
        // Base styles
        "font-serif cursor-pointer transition-all duration-150 rounded-sm px-0.5 -mx-0.5",
        // Focus visible state
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
        // Hover state / underline mode
        !isWellKnown && !isIgnored && (
          isUnderline
            ? "underline decoration-2 underline-offset-2"
            : "hover:underline decoration-1 underline-offset-2"
        ),
        // Ignore styling - dashed underline only
        isIgnored && "underline decoration-dashed decoration-1 underline-offset-2 opacity-70",
        // Well-known words - dimmed if showWellKnownWords is false
        isWellKnown && !showWellKnownWords && "opacity-50",
        // Selected state
        isSelected && "ring-1 ring-primary ring-offset-1"
      )}
      style={{
        backgroundColor: isUnderline ? undefined : getStatusColor(data.status, false),
        textDecorationColor: isUnderline ? getStatusColor(data.status, true) : undefined,
      }}
      onMouseEnter={(e) => {
        if (!isWellKnown && !isIgnored && !isUnderline) {
          e.currentTarget.style.backgroundColor = getStatusColor(data.status, true) || '';
        }
      }}
      onMouseLeave={(e) => {
        if (!isWellKnown && !isIgnored && !isUnderline) {
          e.currentTarget.style.backgroundColor = getStatusColor(data.status, false) || '';
        }
      }}
      aria-label={`${data.surface}, status: ${data.status}`}
    >
      {data.surface}
    </button>
  );
}
