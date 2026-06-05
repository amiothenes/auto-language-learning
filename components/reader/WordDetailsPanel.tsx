'use client';

import { useState } from 'react';
import { Heading, Muted, Content } from '@/components/ui/Typography';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusDots } from './StatusDots';
import { GradingSection } from './GradingSection';
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
    onStatusChange?.(wordData.wordId, newStatus);
  };

  /**
   * Handle translation blur (auto-save)
   */
  const handleTranslationBlur = () => {
    if (!wordData) return;
    console.log(`Translation saved: ${wordData.surface} -> ${translation}`);
    onTranslationChange?.(wordData.id, translation);
  };


  // Large Desktop: render on right side with slide animation and reserved space
  // Mobile/Tablet/Small Desktop: render on right side overlapping content
  const panelClasses = isDesktop
    ? "fixed top-0 right-0 h-screen w-full max-w-[25rem] bg-paper border-l border-border overflow-y-auto animate-slide-in-right z-auto"
    : "fixed top-0 right-0 h-screen w-full max-w-[25rem] sm:w-[400px] bg-paper border-l border-border overflow-y-auto animate-slide-in-right z-50 xl:hidden";

  // If no word is selected, show placeholder
  if (!wordData) {
    return (
      <aside className={`${panelClasses} flex flex-col`}>
        <div className="p-5 shrink-0">
          {/* Panel Header */}
          <div className="flex items-center justify-between">
            <Heading size="lg" as="h2">
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
        </div>

        {/* Quill idle state */}
        <div className="flex flex-col items-center justify-center flex-1 gap-4 px-4 py-8">
          <img
            src="/illustrations/quill.svg"
            width={88}
            height={88}
            alt=""
            className="opacity-70"
          />
          <p className="font-sans text-ui-sm text-muted text-center max-w-45 leading-relaxed">
            Select a word in the text to view its details
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className={panelClasses}>
      <div className="p-5 space-y-4 h-full flex flex-col">
        {/* Panel Header */}
        <div className="flex items-center justify-between sticky top-0 bg-paper pb-3 border-b border-border z-10 shrink-0">
          <Heading size="lg" as="h2">
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
            <Content size="lg" weight="semibold" className="mb-3">
              {wordData.surface.replace(/[.,!?;:«»„"]/g, '')}
            </Content>
            <Muted className="text-ui-xs mb-1.5">Lemma</Muted>
            <Content size="lg">
              {wordData.lemma}
            </Content>
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
            <Input
              type="text"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              onBlur={handleTranslationBlur}
              placeholder="Add translation..."
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
            <div className="flex items-center justify-between mb-2.5">
              <Muted className="text-ui-xs">Learning Status</Muted>
              <StatusDots status={wordData.status} />
            </div>
            <GradingSection
              status={wordData.status}
              onStatusChange={handleStatusChange}
              size="default"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
