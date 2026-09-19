import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

// ============================================================================
// VocabDistributionSkeleton Component
// Loading skeleton matching VocabDistribution's layout, shown while stats load
// ============================================================================

export function VocabDistributionSkeleton() {
  return (
    <div className="space-y-3">
      {/* Distribution strip */}
      <div>
        <Skeleton className="h-2.5 rounded-full mb-3" />

        {/* Stat row */}
        <div className="grid grid-cols-5 gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <SkeletonText width="w-8" className="h-5" />
              <SkeletonText width="w-12" className="h-3" />
            </div>
          ))}
        </div>
      </div>

      {/* Reading coverage card */}
      <div className="bg-desk border border-border rounded-md p-2">
        <div className="flex items-baseline gap-2 mb-1.5">
          <SkeletonText width="w-16" className="h-6" />
          <SkeletonText width="w-28" className="h-4" />
        </div>
        <Skeleton className="h-2 rounded-full" />
      </div>
    </div>
  );
}
