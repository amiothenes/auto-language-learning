'use client';

import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { useLastPosition } from '@/lib/hooks/useLastPosition';

// ============================================================================
// ResumeBar — sticky "continue reading" band at the top of Series Library
// ============================================================================

export function ResumeBar() {
  const router = useRouter();
  const { data } = useLastPosition();

  if (!data) return null;

  const { textId, textTitle, seriesName, paragraphIndex, totalParagraphs, knownPercentage, lastReadAt } = data;

  return (
    <div
      className="flex items-center justify-between gap-3 px-3 py-2 md:px-4 md:py-2.5 rounded-card bg-primary text-white"
    >
      {/* Left: title + meta */}
      <div className="flex items-center gap-2 min-w-0">
        <BookOpen size={14} className="shrink-0 opacity-80" strokeWidth={1.5} />
        <div className="min-w-0">
          <span className="font-semibold font-sans text-ui-base truncate block">{textTitle}</span>
          <span className="font-sans text-ui-xs opacity-70 truncate block">
            {seriesName} · ¶ {paragraphIndex + 1}/{totalParagraphs} · {knownPercentage}% known · {lastReadAt}
          </span>
        </div>
      </div>

      {/* Right: resume button */}
      <button
        onClick={() => router.push(`/reader/${textId}`)}
        className="shrink-0 bg-white text-primary font-sans text-ui-xs font-bold px-3 py-1.5 rounded-sm cursor-pointer hover:opacity-90 transition-opacity"
      >
        Resume →
      </button>
    </div>
  );
}
