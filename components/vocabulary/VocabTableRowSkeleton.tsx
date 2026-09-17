import { Skeleton, SkeletonText, SkeletonCircle } from '@/components/ui/Skeleton';

// ============================================================================
// VocabTableRowSkeleton Component
// Loading skeleton matching VocabTable row structure (desktop/tablet view)
// ============================================================================

export function VocabTableRowSkeleton() {
  return (
    <tr className="border-b border-border">
      {/* Checkbox */}
      <td className="w-9 md:w-11 px-2 md:px-3 py-1.5 md:py-2">
        <Skeleton className="w-[18px] h-[18px] rounded" />
      </td>

      {/* Lemma */}
      <td className="px-2 md:px-3 py-1.5 md:py-2">
        <SkeletonText width="w-20" className="h-5" />
      </td>

      {/* Status */}
      <td className="px-2 md:px-3 py-1.5 md:py-2">
        <Skeleton className="w-20 h-6 rounded-full" />
      </td>

      {/* Dictionary Frequency */}
      <td className="px-2 md:px-3 py-1.5 md:py-2">
        <div className="flex items-center gap-1 md:gap-2">
          <SkeletonText width="w-6" className="h-3" />
          <Skeleton className="flex-1 min-w-[40px] h-2 hidden md:block" />
        </div>
      </td>

      {/* Translation (hidden on mobile) */}
      <td className="px-2 md:px-3 py-1.5 md:py-2 hidden lg:table-cell">
        <SkeletonText width="w-32" className="h-5" />
      </td>

      {/* Tags (hidden on mobile) */}
      <td className="px-2 md:px-3 py-1.5 md:py-2 hidden lg:table-cell">
        <div className="flex gap-1">
          <Skeleton className="w-16 h-5 rounded-full" />
          <Skeleton className="w-12 h-5 rounded-full" />
        </div>
      </td>

      {/* Actions */}
      <td className="w-9 md:w-11 px-2 md:px-3 py-1.5 md:py-2">
        <SkeletonCircle size={18} />
      </td>
    </tr>
  );
}
