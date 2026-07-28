'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heading, Muted } from '@/components/ui/Typography';
import { TextListItem } from './TextListItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { FolderPlus, FilePlus, Library } from 'lucide-react';
import { SkeletonText } from '@/components/ui/Skeleton';
import { useTexts } from '@/lib/hooks/useTexts';
import { useSeriesList } from '@/lib/hooks/useSeriesList';
import { useLastPosition } from '@/lib/hooks/useLastPosition';
import { NewTextModal } from '@/components/texts/NewTextModal';

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
  const [showNewTextModal, setShowNewTextModal] = useState(false);
  const { data: texts, isLoading: isLoadingTexts } = useTexts(3, {
    sortBy: 'lastViewedAt',
    onlyRead: true,
    staleTime: 0,
  });
  const { data: seriesList, isLoading: isLoadingSeries } = useSeriesList();
  const { data: lastPosition } = useLastPosition();
  const isLoading = isLoadingProp || isLoadingTexts;
  const hasRecentTexts = (texts?.length ?? 0) > 0;
  const hasSeries = isLoadingSeries || (seriesList?.length ?? 0) > 0;

  const openNewTextModal = () => {
    setShowNewTextModal(true);
  };

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

        <div className="flex items-center gap-2 shrink-0">
          {/* New Series */}
          <button
            onClick={() => router.push('/series?new=true')}
            title="Create a new series"
            className="px-3 py-2 border border-border rounded font-sans font-medium text-ui-base hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            <span className="hidden md:inline">New Series</span>
            <FolderPlus size={20} className="md:hidden" strokeWidth={2} />
          </button>

          {/* Add Text to Series (only when a series exists to add to) */}
          {hasSeries && (
            <button
              onClick={openNewTextModal}
              title="Add a text to an existing series"
              className="px-3 md:px-4 py-2 bg-primary text-white font-sans font-medium text-ui-base rounded hover:brightness-90 active:translate-y-px transition-all cursor-pointer"
            >
              <span className="hidden md:inline">Add Text to Series</span>
              <FilePlus size={20} className="md:hidden" strokeWidth={2} />
            </button>
          )}
        </div>
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
          secondaryAction={
            hasSeries
              ? { label: "Add Text to Series", onClick: openNewTextModal }
              : undefined
          }
          className="min-h-75"
        />
      ) : (
        <div className="space-y-2 md:space-y-3">
          {texts!.map((text, index) => {
            const isResume = index === 0 && lastPosition?.textId === text.id;
            return (
              <TextListItem
                key={text.id}
                title={text.title}
                series={text.seriesName ?? '—'}
                wordCount={text.wordCount}
                knownPercentage={text.knownPercentage}
                lastViewed={text.lastRead}
                onClick={() => router.push(`/reader/${text.id}`)}
                isResume={isResume}
                paragraphIndex={isResume ? lastPosition!.paragraphIndex : undefined}
                totalParagraphs={isResume ? lastPosition!.totalParagraphs : undefined}
              />
            );
          })}
          {texts!.length < 3 && (
            <button
              onClick={openNewTextModal}
              className="w-full p-4 border-2 border-dashed border-border rounded-lg text-muted text-ui-sm font-medium hover:border-primary hover:text-primary transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <FilePlus size={16} strokeWidth={2} />
              Add another text
            </button>
          )}
        </div>
      )}

      {hasRecentTexts && !isLoading && (
        <div className="pt-4 border-t border-border text-center">
          <button
            className="text-primary font-sans font-medium text-ui-base hover:underline cursor-pointer"
            onClick={() => router.push('/series?view=texts')}
          >
            View All Texts →
          </button>
        </div>
      )}

      <NewTextModal
        isOpen={showNewTextModal}
        onClose={() => setShowNewTextModal(false)}
        availableSeries={seriesList ?? []}
      />
    </section>
  );
}
