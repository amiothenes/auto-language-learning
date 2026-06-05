'use client';

import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';

// ============================================================================
// ContinueReadingCard — shown on Series Detail when there's reading progress
// ============================================================================

interface ContinueReadingCardProps {
  textId: string;
  textTitle: string;
  paragraphIndex: number;
  totalParagraphs: number;
  knownPercentage: number;
  lastReadAt: string;
  onResume: () => void;
}

export function ContinueReadingCard({
  textTitle,
  paragraphIndex,
  totalParagraphs,
  knownPercentage,
  lastReadAt,
  onResume,
}: ContinueReadingCardProps) {
  const paragraphProgress =
    totalParagraphs > 0
      ? Math.round((paragraphIndex / totalParagraphs) * 100)
      : 0;

  return (
    <div className="bg-desk border border-border rounded-card p-3 mb-4">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-1 font-sans text-ui-xs font-bold text-primary">
        <BookOpen size={14} strokeWidth={1.5} />
        Continue Reading
      </div>

      {/* Text title */}
      <p className="font-sans font-semibold text-content-base text-ink mb-0.5 truncate">
        {textTitle}
      </p>

      {/* Meta */}
      <p className="font-sans text-ui-xs text-muted mb-2">
        {knownPercentage}% known · last read {lastReadAt}
      </p>

      {/* Paragraph progress */}
      <div className="flex justify-between mb-1">
        <span className="font-sans text-ui-xs text-muted">
          Paragraph {paragraphIndex + 1} of {totalParagraphs}
        </span>
        <span className="font-sans text-ui-xs text-muted">{paragraphProgress}%</span>
      </div>
      <ProgressBar value={paragraphProgress} className="opacity-60 mb-3 h-2" />

      {/* Resume button */}
      <Button variant="primary" size="lg" className="w-full" onClick={onResume}>
        Resume Reading →
      </Button>
    </div>
  );
}
