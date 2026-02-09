import { Skeleton, SkeletonText, SkeletonCircle } from '@/components/ui/Skeleton';

// ============================================================================
// Reader Skeleton Components
// Loading skeletons for TextInfo, ReaderContent, and WordDetailsPanel
// ============================================================================

/**
 * TextInfo Skeleton - Left panel
 */
export function TextInfoSkeleton() {
  return (
    <div className="p-6 pt-24 xl:pt-6 pb-24 xl:pb-6 space-y-6 h-full">
      {/* Back Navigation */}
      <div className="flex items-center gap-2">
        <SkeletonCircle size={18} />
        <SkeletonText width="w-28" className="h-4" />
      </div>

      {/* Title Section */}
      <div className="space-y-2">
        <SkeletonText width="w-16" className="h-3" />
        <SkeletonText width="w-4/5" className="h-6" />
      </div>

      {/* Series Info */}
      <div className="pt-4 border-t border-border">
        <SkeletonText width="w-12" className="h-3 mb-2" />
        <SkeletonText width="w-32" className="h-4" />
      </div>

      {/* Progress */}
      <div className="pt-4 border-t border-border space-y-3">
        <SkeletonText width="w-24" className="h-3 mb-1" />
        <SkeletonText width="w-20" className="h-5 mb-2" />
        <Skeleton className="w-full h-2" />
      </div>

      {/* Statistics */}
      <div className="pt-4 border-t border-border space-y-2">
        <SkeletonText width="w-20" className="h-3 mb-2" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center">
            <SkeletonText width="w-24" className="h-3" />
            <SkeletonText width="w-16" className="h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ReaderContent Skeleton - Main reading area
 */
export function ReaderContentSkeleton() {
  return (
    <div className="w-full max-w-3xl space-y-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-3">
          <SkeletonText width="w-full" className="h-4" />
          <SkeletonText width="w-11/12" className="h-4" />
          <SkeletonText width="w-full" className="h-4" />
          <SkeletonText width="w-5/6" className="h-4" />
        </div>
      ))}
    </div>
  );
}

/**
 * WordDetailsPanel Skeleton - Right panel
 */
export function WordDetailsPanelSkeleton() {
  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <SkeletonText width="w-24" className="h-5" />
        <SkeletonCircle size={20} />
      </div>

      {/* Surface Form */}
      <div className="pt-1">
        <SkeletonText width="w-20" className="h-3 mb-1.5" />
        <SkeletonText width="w-32" className="h-6 mb-3" />
        <SkeletonText width="w-16" className="h-3 mb-1.5" />
        <SkeletonText width="w-28" className="h-6" />
      </div>

      {/* POS & Inflection */}
      <div className="pt-2 border-t border-border">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SkeletonText width="w-20" className="h-3 mb-1.5" />
            <SkeletonText width="w-16" className="h-4" />
          </div>
          <div>
            <SkeletonText width="w-12" className="h-3 mb-1.5" />
            <SkeletonText width="w-16" className="h-4" />
          </div>
        </div>
      </div>

      {/* Translation */}
      <div className="pt-2 border-t border-border">
        <SkeletonText width="w-20" className="h-3 mb-1.5" />
        <Skeleton className="w-full h-9 rounded" />
      </div>

      {/* Frequencies */}
      <div className="pt-2 border-t border-border space-y-3">
        <div>
          <div className="flex justify-between mb-1.5">
            <SkeletonText width="w-32" className="h-3" />
            <SkeletonText width="w-12" className="h-3" />
          </div>
          <Skeleton className="w-full h-2" />
        </div>
        <div className="flex justify-between">
          <SkeletonText width="w-24" className="h-3" />
          <SkeletonText width="w-16" className="h-3" />
        </div>
      </div>

      {/* Status Buttons */}
      <div className="pt-2 border-t border-border">
        <SkeletonText width="w-24" className="h-3 mb-2.5" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="w-full h-9 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
