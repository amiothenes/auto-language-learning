'use client';

import { Content, Body, Muted } from '@/components/ui/Typography';

interface TextListItemProps {
  title: string;
  series: string;
  wordCount: number;
  knownPercentage: number;
  lastViewed: string;
  onClick?: () => void;
}

export function TextListItem({
  title,
  series,
  wordCount,
  knownPercentage,
  lastViewed,
  onClick,
}: TextListItemProps) {
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
          <Muted size="xs">{Math.round(knownPercentage * 10) / 10}% known</Muted>
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
