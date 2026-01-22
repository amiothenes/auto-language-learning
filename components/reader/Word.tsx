'use client';

import { cn } from '@/lib/utils';

// ============================================================================
// VocabularyStatus Enum
// ============================================================================

export enum VocabularyStatus {
  NEWLY_SEEN = 'NEWLY_SEEN',
  FAMILIAR = 'FAMILIAR',
  KNOWN = 'KNOWN',
  WELL_KNOWN = 'WELL_KNOWN',
  IGNORE = 'IGNORE'
}

// ============================================================================
// Word Data Interface
// ============================================================================

export interface WordData {
  id: string;
  surface: string;
  lemma: string;
  pos: string;
  inflection: string;
  translation: string;
  dictionaryFrequency: number;
  userFrequency: number;
  status: VocabularyStatus;
}

// ============================================================================
// Word Component
// Interactive word span with status-based styling
// ============================================================================

interface WordProps {
  data: WordData;
  onClick: (data: WordData) => void;
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
  
  /**
   * Get status-based background color with opacity
   * Applies highlight intensity multiplier to opacity
   * @param status Vocabulary learning status
   * @param isHover Whether the word is being hovered
   * @returns HSLA color string
   */
  const getStatusColor = (status: VocabularyStatus, isHover: boolean): string | undefined => {
    const baseOpacity = isHover ? 0.25 : (isSelected ? 0.2 : 0.15);
    // Apply highlight intensity (0-100 -> 0.0-1.0 multiplier)
    const opacity = baseOpacity * (highlightIntensity / 100);
    
    switch (status) {
      case VocabularyStatus.NEWLY_SEEN:
        return `hsla(0, 70%, 55%, ${opacity})`;
      case VocabularyStatus.FAMILIAR:
        return `hsla(45, 85%, 55%, ${opacity})`;
      case VocabularyStatus.KNOWN:
        return `hsla(145, 60%, 40%, ${opacity > 0.1 ? opacity : 0.05})`;
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

  return (
    <span
      onClick={() => onClick(data)}
      className={cn(
        // Base styles
        "font-serif cursor-pointer transition-all duration-150 rounded-sm px-0.5 -mx-0.5",
        // Hover state (for words with highlights)
        !isWellKnown && !isIgnored && "hover:underline decoration-1 underline-offset-2",
        // Ignore styling - dashed underline only
        isIgnored && "underline decoration-dashed decoration-1 underline-offset-2 opacity-70",
        // Well-known words - dimmed if showWellKnownWords is false
        isWellKnown && !showWellKnownWords && "opacity-50",
        // Selected state
        isSelected && "ring-1 ring-primary ring-offset-1"
      )}
      style={{
        backgroundColor: getStatusColor(data.status, false),
      }}
      onMouseEnter={(e) => {
        if (!isWellKnown && !isIgnored) {
          e.currentTarget.style.backgroundColor = getStatusColor(data.status, true) || '';
        }
      }}
      onMouseLeave={(e) => {
        if (!isWellKnown && !isIgnored) {
          e.currentTarget.style.backgroundColor = getStatusColor(data.status, false) || '';
        }
      }}
      aria-label={`${data.surface}, status: ${data.status}`}
    >
      {data.surface}
    </span>
  );
}
