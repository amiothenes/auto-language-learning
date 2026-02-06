import { Card } from '@/components/ui/Card';
import { Skeleton, SkeletonText, SkeletonCircle } from '@/components/ui/Skeleton';

// ============================================================================
// VocabCardSkeleton Component
// Loading skeleton matching VocabCard structure (mobile view)
// ============================================================================

export function VocabCardSkeleton() {
  return (
    <Card variant="default" padding="sm" className="p-2.5! md:p-2!">
      <div className="flex gap-2 md:gap-2.5 items-center">
        {/* Checkbox */}
        <Skeleton className="w-4 h-4 rounded shrink-0" />

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-1.5 md:space-y-1">
          {/* Header Row: Lemma + Status + Menu */}
          <div className="flex items-start justify-between gap-2">
            <SkeletonText width="w-24" className="h-4" />
            <div className="flex items-center gap-1 shrink-0">
              <Skeleton className="w-16 h-5 rounded" />
              <SkeletonCircle size={14} />
            </div>
          </div>

          {/* Translation */}
          <SkeletonText width="w-32" className="h-3" />

          {/* Bottom Row: Frequencies */}
          <div className="flex items-center gap-3">
            <SkeletonText width="w-12" className="h-3" />
            <SkeletonText width="w-12" className="h-3" />
          </div>
        </div>
      </div>
    </Card>
  );
}
