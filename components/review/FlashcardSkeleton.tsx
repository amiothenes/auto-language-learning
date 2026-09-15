import { Card } from '@/components/ui/Card';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

export function FlashcardSkeleton() {
  return (
    <Card padding="lg" className="space-y-6">
      <div className="space-y-3">
        <SkeletonText width="w-4/5" className="h-7" />
        <SkeletonText width="w-1/2" className="h-7" />
      </div>
      <Skeleton className="h-11 w-full" />
    </Card>
  );
}
