'use client';

import { Content, Body, Muted } from '@/components/ui/Typography';

interface TextListItemProps {
  title: string;
  series: string;
  wordCount: number;
  knownPercentage: number;
  lastViewed: string;
  onClick?: () => void;
  isResume?: boolean;
  paragraphIndex?: number;
  totalParagraphs?: number;
}

export function TextListItem({
  title,
  series,
  wordCount,
  knownPercentage,
  lastViewed,
  onClick,
  isResume = false,
  paragraphIndex,
  totalParagraphs,
}: TextListItemProps) {
  if (isResume) {
    return (
      <div
        className="flex flex-col md:flex-row md:items-center md:justify-between p-4 md:p-5 bg-primary rounded-lg cursor-pointer gap-3"
        onClick={onClick}
      >
        <div className="flex-1 min-w-0">
          <Content size="base" weight="semibold" className="mb-1 text-white md:text-content-lg">
            {title}
          </Content>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <span className="text-ui-xs text-white/60 font-sans">{series}</span>
            <span className="text-ui-xs text-white/40 hidden md:inline">•</span>
            <span className="text-ui-xs text-white/60 font-sans">{wordCount} words</span>
            {paragraphIndex !== undefined && totalParagraphs !== undefined && (
              <>
                <span className="text-ui-xs text-white/40 hidden md:inline">•</span>
                <span className="text-ui-xs text-white/70 font-sans">
                  ¶ {paragraphIndex}/{totalParagraphs} · {Math.round(knownPercentage)}% complete
                </span>
              </>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <button
            className="px-4 py-1.5 bg-white text-primary text-ui-sm font-medium font-sans rounded hover:brightness-90 transition-all cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          >
            Resume →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 bg-desk rounded-lg hover:bg-border transition-colors cursor-pointer gap-2"
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <Content size="base" weight="semibold" className="mb-1 md:text-content-lg">
          {title}
        </Content>
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          <Muted size="xs">{series}</Muted>
          <Muted size="xs" className="hidden md:inline">•</Muted>
          <Muted size="xs">{wordCount} words</Muted>
          <Muted size="xs" className="hidden md:inline">•</Muted>
          <Muted size="xs">{Math.round(knownPercentage)}% complete</Muted>
        </div>
      </div>
      <div className="text-left md:text-right shrink-0">
        <Muted size="xs">Last read</Muted>
        <Body size="sm" weight="medium">
          {lastViewed}
        </Body>
      </div>
    </div>
  );
}
