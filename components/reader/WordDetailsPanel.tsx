'use client';

import { useState } from 'react';
import { Heading, Muted } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { WordData, VocabularyStatus } from './Word';

// ============================================================================
// WordDetailsPanel Component
// Right sidebar panel showing detailed word information with slide-in animation
// ============================================================================

interface WordDetailsPanelProps {
  wordData: WordData | null;
  onClose: () => void;
  onStatusChange?: (wordId: string, newStatus: VocabularyStatus) => void;
  onTranslationChange?: (wordId: string, newTranslation: string) => void;
  isDesktop?: boolean;
}

export function WordDetailsPanel({ 
  wordData, 
  onClose, 
  onStatusChange,
  onTranslationChange,
  isDesktop = false
}: WordDetailsPanelProps) {
  
  const [translation, setTranslation] = useState(wordData?.translation || '');
  
  // Update translation state when wordData changes
  if (wordData && translation !== wordData.translation) {
    setTranslation(wordData.translation);
  }

  /**
   * Handle status button click
   */
  const handleStatusChange = (newStatus: VocabularyStatus) => {
    if (!wordData) return;
    console.log(`Status changed: ${wordData.surface} -> ${newStatus}`);
    onStatusChange?.(wordData.id, newStatus);
  };

  /**
   * Handle translation blur (auto-save)
   */
  const handleTranslationBlur = () => {
    if (!wordData) return;
    console.log(`Translation saved: ${wordData.surface} -> ${translation}`);
    onTranslationChange?.(wordData.id, translation);
  };

  /**
   * Get status button styling
   */
  const getStatusButtonStyle = (status: VocabularyStatus, isActive: boolean) => {
    const baseColors: Record<VocabularyStatus, string> = {
      [VocabularyStatus.NEWLY_SEEN]: 'hsla(0, 70%, 55%, 0.2)',
      [VocabularyStatus.FAMILIAR]: 'hsla(45, 85%, 55%, 0.2)',
      [VocabularyStatus.KNOWN]: 'hsla(145, 60%, 40%, 0.15)',
      [VocabularyStatus.WELL_KNOWN]: 'hsla(145, 60%, 40%, 0.08)',
      [VocabularyStatus.IGNORE]: 'hsla(0, 0%, 50%, 0.1)',
    };

    return {
      backgroundColor: baseColors[status],
      border: isActive ? '2px solid #183A37' : '1px solid #E5E2DA',
      fontWeight: isActive ? 600 : 400,
    };
  };

  /**
   * Status labels
   */
  const statusLabels: Record<VocabularyStatus, string> = {
    [VocabularyStatus.NEWLY_SEEN]: 'Newly Seen',
    [VocabularyStatus.FAMILIAR]: 'Familiar',
    [VocabularyStatus.KNOWN]: 'Known',
    [VocabularyStatus.WELL_KNOWN]: 'Well Known',
    [VocabularyStatus.IGNORE]: 'Ignore',
  };

  // Large Desktop: render on right side with slide animation and reserved space
  // Mobile/Tablet/Small Desktop: render on right side overlapping content
  const panelClasses = isDesktop
    ? "fixed top-0 right-0 h-screen w-full max-w-[25rem] bg-paper border-l border-border overflow-y-auto animate-slide-in-right z-auto"
    : "fixed top-0 right-0 h-screen w-full max-w-[25rem] sm:w-[400px] bg-paper border-l border-border overflow-y-auto animate-slide-in-right z-50 xl:hidden";

  // If no word is selected, show placeholder
  if (!wordData) {
    return (
      <aside className={panelClasses}>
        <div className="p-5 space-y-5">
          {/* Panel Header */}
          <div className="flex items-center justify-between">
            <Heading size="base" as="h2">
              Word Details
            </Heading>
            <button
              onClick={onClose}
              className="text-muted hover:text-ink transition-colors"
              aria-label="Close word details panel"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Placeholder Content */}
          <div className="space-y-4 pt-4 border-t border-border">
            <Muted className="text-ui-sm text-center italic">
              Select a word in the text to view its details, translation, and learning status.
            </Muted>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={panelClasses}>
      <div className="p-5 space-y-4 h-full flex flex-col">
        {/* Panel Header */}
        <div className="flex items-center justify-between sticky top-0 bg-paper pb-3 border-b border-border z-10 shrink-0">
          <Heading size="base" as="h2">
            Word Details
          </Heading>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors"
            aria-label="Close word details panel"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 space-y-4 overflow-y-auto">
          {/* Surface Form & Lemma - Combined */}
          <div className="pt-1">
            <Muted className="text-ui-xs mb-1.5">Surface Form</Muted>
            <p className="font-serif text-content-lg text-ink font-semibold mb-3">
              {wordData.surface.replace(/[.,!?;:«»„"]/g, '')}
            </p>
            <Muted className="text-ui-xs mb-1.5">Lemma</Muted>
            <p className="font-serif text-content-lg text-ink">
              {wordData.lemma}
            </p>
          </div>

          {/* POS & Inflection - Single Line */}
          <div className="pt-2 border-t border-border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Muted className="text-ui-xs mb-1.5">Part of Speech</Muted>
                <p className="font-sans text-ui-sm text-ink">
                  {wordData.pos}
                </p>
              </div>
              <div>
                <Muted className="text-ui-xs mb-1.5">Form</Muted>
                <p className="font-sans text-ui-sm text-ink">
                  {wordData.inflection}
                </p>
              </div>
            </div>
          </div>

          {/* Translation (Editable) */}
          <div className="pt-2 border-t border-border">
            <Muted className="text-ui-xs mb-1.5">Translation</Muted>
            <input
              type="text"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              onBlur={handleTranslationBlur}
              placeholder="Add translation..."
              className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-desk border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          {/* Frequencies */}
          <div className="pt-2 border-t border-border space-y-3">
            {/* Dictionary Frequency */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Muted className="text-ui-xs">Dictionary Frequency</Muted>
                <span className="font-sans text-ui-sm text-ink font-medium">
                  {wordData.dictionaryFrequency}/100
                </span>
              </div>
              <ProgressBar 
                value={wordData.dictionaryFrequency} 
                max={100}
              />
            </div>

            {/* User Frequency */}
            <div className="flex justify-between items-center">
              <Muted className="text-ui-xs">Your Encounters</Muted>
              <span className="font-sans text-ui-sm text-ink font-medium">
                {wordData.userFrequency} times
              </span>
            </div>
          </div>

          {/* Status Selector */}
          <div className="pt-2 border-t border-border pb-4">
            <Muted className="text-ui-xs mb-2.5">Learning Status</Muted>
            <div className="space-y-2">
              {Object.values(VocabularyStatus).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={cn(
                    "w-full px-4 py-2 rounded font-sans text-ui-sm text-ink transition-all hover:brightness-95",
                    wordData.status === status && "shadow-sm"
                  )}
                  style={getStatusButtonStyle(status, wordData.status === status)}
                >
                  {statusLabels[status]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
