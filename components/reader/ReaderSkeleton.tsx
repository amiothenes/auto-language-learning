import { Skeleton, SkeletonText, SkeletonCircle } from '@/components/ui/Skeleton';

// ============================================================================
// Reader Skeleton Components
// Loading skeletons for TextInfo and ReaderContent
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
 * Width matches ReaderContent's real `max-w-180` article so there's no
 * layout shift between this (shown while the text itself is loading) and
 * ReaderContent's own use of it below (shown once the text has loaded but
 * word-instance data is still pending).
 */
export function ReaderContentSkeleton({ hint }: { hint?: string } = {}) {
  return (
    <div className="w-full max-w-180 space-y-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-3">
          <SkeletonText width="w-full" className="h-4" />
          <SkeletonText width="w-11/12" className="h-4" />
          <SkeletonText width="w-full" className="h-4" />
          <SkeletonText width="w-5/6" className="h-4" />
        </div>
      ))}
      {hint && (
        <p className="font-sans text-ui-sm text-center text-muted">{hint}</p>
      )}
    </div>
  );
}
