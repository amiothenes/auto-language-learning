import { Skeleton, SkeletonText, SkeletonCircle } from '@/components/ui/Skeleton';

// ============================================================================
// VocabTableRowSkeleton Component
// Loading skeleton matching VocabTable row structure (desktop/tablet view)
// ============================================================================

export function VocabTableRowSkeleton() {
  return (
    <tr className="border-b border-border">
      {/* Checkbox */}
      <td className="w-10 md:w-12 px-2 md:px-4 py-2 md:py-3">
        <Skeleton className="w-4 h-4 rounded" />
      </td>

      {/* Lemma */}
      <td className="px-2 md:px-4 py-2 md:py-3">
        <SkeletonText width="w-20" className="h-4" />
      </td>

      {/* Status */}
      <td className="px-2 md:px-4 py-2 md:py-3">
        <Skeleton className="w-20 h-6 rounded-full" />
      </td>

      {/* Dictionary Frequency */}
      <td className="px-2 md:px-3 py-2 md:py-3">
        <div className="flex items-center gap-1 md:gap-2">
          <SkeletonText width="w-6" className="h-3" />
          <Skeleton className="flex-1 min-w-[40px] h-2 hidden md:block" />
        </div>
      </td>

      {/* Translation (hidden on mobile) */}
      <td className="px-2 md:px-4 py-2 md:py-3 hidden lg:table-cell">
        <SkeletonText width="w-32" className="h-4" />
      </td>

      {/* Tags (hidden on mobile) */}
      <td className="px-2 md:px-4 py-2 md:py-3 hidden lg:table-cell">
        <div className="flex gap-1">
          <Skeleton className="w-16 h-5 rounded-full" />
          <Skeleton className="w-12 h-5 rounded-full" />
        </div>
      </td>

      {/* Actions */}
      <td className="w-8 md:w-12 px-2 md:px-4 py-2 md:py-3">
        <SkeletonCircle size={16} />
      </td>
    </tr>
  );
}
