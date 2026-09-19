import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

// ============================================================================
// ReviewSettingsSkeleton Component
// Loading skeleton matching the Review settings page's SettingSection/
// SettingRow structure (Daily Limits, Card Selection, Audio)
// ============================================================================

function SettingRowSkeleton({ control }: { control: 'select' | 'toggle' }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 last:pb-0">
      <div className="flex-1 space-y-2">
        <SkeletonText width="w-28" className="h-4" />
        <SkeletonText width="w-56" className="h-3" />
      </div>
      <div className="md:w-1/2">
        {control === 'select' ? (
          <Skeleton className="w-full h-10 rounded" />
        ) : (
          <Skeleton className="w-11 h-6 rounded-full" />
        )}
      </div>
    </div>
  );
}

function SettingSectionSkeleton({ controls }: { controls: Array<'select' | 'toggle'> }) {
  return (
    <Card variant="default" padding="lg">
      <CardHeader>
        <SkeletonText width="w-32" className="h-5 mb-2" />
        <SkeletonText width="w-72" className="h-3" />
      </CardHeader>
      <CardContent className="space-y-6">
        {controls.map((control, i) => (
          <SettingRowSkeleton key={i} control={control} />
        ))}
      </CardContent>
    </Card>
  );
}

export function ReviewSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <SettingSectionSkeleton controls={['select', 'select', 'select']} />
      <SettingSectionSkeleton controls={['select', 'select', 'select']} />
      <SettingSectionSkeleton controls={['toggle', 'toggle']} />
    </div>
  );
}
