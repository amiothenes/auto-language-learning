import { EmptyState } from '@/components/ui/EmptyState';
import { Plus } from 'lucide-react';
import { ShelvesScene } from '@/components/riso/scenes/Scenes';

// ============================================================================
// EmptySeriesState Component
// Displays when no series exist, prompting user to create their first one
// Migrated to use centralized EmptyState component with books illustration
// ============================================================================

interface EmptySeriesStateProps {
  onCreateClick?: () => void;
}

export function EmptySeriesState({ onCreateClick }: EmptySeriesStateProps) {
  return (
    <EmptyState
      scene={<ShelvesScene lit={0} />}
      title="The shelves are waiting"
      description="Start a series to keep related texts together, like the chapters of a book, and see how ready you are for each one."
      primaryAction={
        onCreateClick
          ? {
              label: 'New Series',
              onClick: onCreateClick,
              icon: <Plus size={18} strokeWidth={2} />,
            }
          : undefined
      }
    />
  );
}
