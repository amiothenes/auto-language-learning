'use client';

import { Heading, Muted } from '@/components/ui/Typography';
import { TextListItem } from './TextListItem';
import { Plus } from 'lucide-react';
import { SkeletonText } from '@/components/ui/Skeleton';

const recentTexts = [
  {
    id: '1',
    title: 'El gato en la casa',
    series: 'Spanish Short Stories',
    wordCount: 234,
    knownPercentage: 72,
    lastViewed: '2 hours ago',
  },
  {
    id: '2',
    title: 'El gato en la casa',
    series: 'Spanish Short Stories',
    wordCount: 234,
    knownPercentage: 72,
    lastViewed: '2 hours ago',
  },
  {
    id: '3',
    title: 'El gato en la casa',
    series: 'Spanish Short Stories',
    wordCount: 234,
    knownPercentage: 72,
    lastViewed: '2 hours ago',
  },
];

interface RecentTextsListProps {
  isLoading?: boolean;
}

function TextListItemSkeleton() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 bg-desk rounded-lg gap-2">
      <div className="flex-1 min-w-0 space-y-2">
        <SkeletonText width="w-3/5" className="h-5" />
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          <SkeletonText width="w-24" className="h-3" />
          <SkeletonText width="w-16" className="h-3" />
          <SkeletonText width="w-16" className="h-3" />
        </div>
      </div>
      <div className="text-left md:text-right shrink-0 space-y-1">
        <SkeletonText width="w-16" className="h-3" />
        <SkeletonText width="w-20" className="h-4" />
      </div>
    </div>
  );
}

export function RecentTextsList({ isLoading = false }: RecentTextsListProps) {
  return (
    <section className="bg-paper rounded-card border border-border shadow-raised p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Heading size="lg" as="h2" className="mb-1 md:mb-2 md:text-ui-xl">
            Recent Texts
          </Heading>
          <Muted size="xs" className="hidden md:block md:text-ui-sm">
            Continue reading where you left off
          </Muted>
        </div>
        <button className="px-3 md:px-4 py-2 bg-primary text-white font-sans font-medium text-ui-base rounded hover:opacity-90 active:translate-y-px transition-all shrink-0 cursor-pointer">
          <span className="hidden md:inline">Add New Text</span>
          <Plus size={20} className="md:hidden" strokeWidth={2} />
        </button>
      </div>

      {/* Text Items or Skeleton */}
      <div className="space-y-2 md:space-y-3">
        {isLoading ? (
          <>
            <TextListItemSkeleton />
            <TextListItemSkeleton />
            <TextListItemSkeleton />
          </>
        ) : (
          recentTexts.map((text) => (
            <TextListItem
              key={text.id}
              title={text.title}
              series={text.series}
              wordCount={text.wordCount}
              knownPercentage={text.knownPercentage}
              lastViewed={text.lastViewed}
              onClick={() => {}}
            />
          ))
        )}
      </div>

      <div className="pt-4 border-t border-border text-center">
        <button className="text-primary font-sans font-medium text-ui-base hover:underline cursor-pointer">
          View All Texts →
        </button>
      </div>
    </section>
  );
}
