import { Card } from '@/components/ui/Card';
import { Skeleton, SkeletonText, SkeletonCircle } from '@/components/ui/Skeleton';

// ============================================================================
// SeriesCardSkeleton Component
// Loading skeleton matching SeriesCard structure
// ============================================================================

export function SeriesCardSkeleton() {
  return (
    <Card variant="default" padding="md">
      {/* Header: Title + Menu */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <SkeletonText width="w-3/5" className="h-5" />
        <SkeletonCircle size={32} />
      </div>

      {/* Description (2 lines) */}
      <div className="mb-4 space-y-2 h-[2.4rem]">
        <SkeletonText width="w-full" className="h-3" />
        <SkeletonText width="w-4/5" className="h-3" />
      </div>

      {/* Metadata Row */}
      <div className="flex items-center gap-4 mb-3">
        <SkeletonText width="w-16" className="h-3" />
        <SkeletonText width="w-20" className="h-3" />
      </div>

      {/* Progress Bar */}
      <Skeleton className="w-full h-2 mb-3" />

      {/* Last Updated */}
      <SkeletonText width="w-24" className="h-3" />
    </Card>
  );
}
