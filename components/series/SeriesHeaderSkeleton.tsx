import { Skeleton } from '@/components/ui/Skeleton';

// ============================================================================
// SeriesHeaderSkeleton Component
// Loading skeleton that mirrors the SeriesHeader layout
// ============================================================================

export function SeriesHeaderSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back Button Skeleton */}
      <Skeleton className="w-32 h-10 rounded" />

      {/* Title Section */}
      <div className="space-y-3">
        {/* Title */}
        <Skeleton className="w-2/3 md:w-1/2 h-9 rounded" />

        {/* Description */}
        <Skeleton className="w-full md:w-3/4 h-5 rounded" />
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-4 md:gap-6">
        <Skeleton className="w-20 h-5 rounded" />
        <Skeleton className="w-28 h-5 rounded" />
        <Skeleton className="w-32 h-5 rounded" />
      </div>

      {/* Progress Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="w-32 h-6 rounded" />
          <Skeleton className="w-12 h-6 rounded" />
        </div>
        <Skeleton className="w-full h-2 rounded-full" />
      </div>
    </div>
  );
}
