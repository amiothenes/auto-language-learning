'use client';

import { useRouter } from 'next/navigation';
import { Heading, Muted } from '@/components/ui/Typography';
import { TextListItem } from './TextListItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Library } from 'lucide-react';
import { SkeletonText } from '@/components/ui/Skeleton';
import { useTexts } from '@/lib/hooks/useTexts';

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

export function RecentTextsList({ isLoading: isLoadingProp = false }: RecentTextsListProps) {
  const router = useRouter();
  const { data: texts, isLoading: isLoadingTexts } = useTexts(5, {
    sortBy: 'lastViewedAt',
    onlyRead: true,
  });
  const isLoading = isLoadingProp || isLoadingTexts;
  const hasRecentTexts = (texts?.length ?? 0) > 0;

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
        <button
          onClick={() => router.push('/series')}
          className="px-3 md:px-4 py-2 bg-primary text-white font-sans font-medium text-ui-base rounded hover:opacity-90 active:translate-y-px transition-all shrink-0 cursor-pointer"
        >
          <span className="hidden md:inline">Add New Text</span>
          <Plus size={20} className="md:hidden" strokeWidth={2} />
        </button>
      </div>

      {/* Text Items, Loading State, or Empty State */}
      {isLoading ? (
        <div className="space-y-2 md:space-y-3">
          <TextListItemSkeleton />
          <TextListItemSkeleton />
          <TextListItemSkeleton />
        </div>
      ) : !hasRecentTexts ? (
        <EmptyState
          illustration="pages"
          title="No recent texts"
          description="Start reading to see your recent activity here"
          primaryAction={{
            label: "Browse Series",
            onClick: () => router.push('/series'),
            icon: <Library size={18} strokeWidth={2} />,
          }}
          secondaryAction={{
            label: "Add New Text",
            onClick: () => router.push('/series'),
          }}
          className="min-h-75"
        />
      ) : (
        <div className="space-y-2 md:space-y-3">
          {texts!.map((text) => (
            <TextListItem
              key={text.id}
              title={text.title}
              series={text.seriesName ?? '—'}
              wordCount={text.wordCount}
              knownPercentage={text.knownPercentage}
              lastViewed={text.lastRead}
              onClick={() => router.push(`/reader/${text.id}`)}
            />
          ))}
          {texts!.length < 3 && (
            <button
              onClick={() => router.push('/series')}
              className="w-full p-4 border-2 border-dashed border-border rounded-lg text-muted text-ui-sm font-medium hover:border-primary hover:text-primary transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus size={16} strokeWidth={2} />
              Add another text
            </button>
          )}
        </div>
      )}

      {hasRecentTexts && !isLoading && (
        <div className="pt-4 border-t border-border text-center">
          <button
            className="text-primary font-sans font-medium text-ui-base hover:underline cursor-pointer"
            onClick={() => router.push('/series')}
          >
            View All Texts →
          </button>
        </div>
      )}
    </section>
  );
}
