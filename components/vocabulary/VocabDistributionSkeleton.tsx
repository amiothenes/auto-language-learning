import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

// ============================================================================
// VocabDistributionSkeleton Component
// Loading skeleton matching VocabDistribution's layout, shown while stats load
// ============================================================================

export function VocabDistributionSkeleton() {
  return (
    <div className="space-y-4">
      {/* Distribution strip */}
      <div>
        <Skeleton className="h-3 rounded-full mb-2.5" />

        {/* Figures row — count, label, share */}
        <div className="grid grid-cols-5 gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <SkeletonText width="w-8" className="h-4" />
              <SkeletonText width="w-12" className="h-3" />
              <SkeletonText width="w-8" className="h-2.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Reading coverage card — eyebrow, headline, meter, CEFR label row */}
      <div className="rounded-card border border-border bg-paper p-3 shadow-raised space-y-2">
        <SkeletonText width="w-32" className="h-3" />
        <SkeletonText width="w-28" className="h-6" />
        <Skeleton className="h-2.5 rounded-full" />
        <SkeletonText width="w-40" className="h-3" />
      </div>
    </div>
  );
}
