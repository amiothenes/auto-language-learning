import { EmptyState } from '@/components/ui/EmptyState';
import { Plus } from 'lucide-react';

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
      illustration="books"
      title="No Series Yet"
      description="Create your first series to organize your texts and track your progress"
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
