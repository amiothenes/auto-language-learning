'use client';

import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ============================================================================
// ContinueReadingCard — compact resume-reading strip on Series Detail.
// Paragraph-level progress lives in the Reader itself; this only needs to get
// the user back into the text they were last on, not re-show that detail.
// ============================================================================

interface ContinueReadingCardProps {
  textId: string;
  textTitle: string;
  knownPercentage: number;
  lastReadAt: string;
  onResume: () => void;
}

export function ContinueReadingCard({
  textTitle,
  knownPercentage,
  lastReadAt,
  onResume,
}: ContinueReadingCardProps) {
  return (
    <div className="flex items-center gap-3 bg-desk border border-border rounded-card px-3 py-2.5 mb-4">
      <BookOpen size={16} className="text-primary shrink-0" strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        <span className="font-sans text-ui-sm font-semibold text-ink truncate">
          {textTitle}
        </span>
        <span className="font-sans text-ui-xs text-muted ml-2">
          {knownPercentage}% complete · last read {lastReadAt}
        </span>
      </div>
      <Button variant="primary" size="sm" className="shrink-0" onClick={onResume}>
        Resume →
      </Button>
    </div>
  );
}
