import { Skeleton, SkeletonText, SkeletonCircle } from '@/components/ui/Skeleton';

// ============================================================================
// TextListRowSkeleton Component
// Loading skeleton matching TextListRow structure
// ============================================================================

export function TextListRowSkeleton() {
  return (
    <div className="flex items-center gap-2 p-2.5 border border-border rounded-md mb-2 bg-paper">
      <SkeletonText width="w-7" className="h-3 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <SkeletonText width="w-3/5" className="h-4" />
        <SkeletonText width="w-1/4" className="h-3" />
      </div>
      <SkeletonText width="w-16" className="h-3 hidden sm:block shrink-0" />
      <SkeletonCircle size={14} className="rounded-full" />
      <SkeletonText width="w-10" className="h-4 shrink-0" />
      <Skeleton className="w-16 h-8 shrink-0" />
      <SkeletonCircle size={24} className="rounded" />
    </div>
  );
}
