import { Heading, Muted } from '@/components/ui/Typography';
import { Library, Plus } from 'lucide-react';

// ============================================================================
// EmptySeriesState Component
// Displays when no series exist, prompting user to create their first one
// ============================================================================

interface EmptySeriesStateProps {
  onCreateClick?: () => void;
}

export function EmptySeriesState({ onCreateClick }: EmptySeriesStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="bg-paper border border-border rounded-card shadow-raised p-12 max-w-md text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Library size={40} className="text-muted" strokeWidth={1.5} />
          </div>
        </div>

        {/* Heading */}
        <Heading size="xl" as="h2" className="mb-3">
          No Series Yet
        </Heading>

        {/* Description */}
        <Muted size="base" className="mb-6">
          Create your first series to organize your texts and track your progress
        </Muted>

        {/* CTA Button */}
        <button
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-sans font-medium text-ui-base rounded hover:brightness-95 hover:shadow-raised-hover active:translate-y-px transition-all shadow-raised"
        >
          <Plus size={18} strokeWidth={2} />
          New Series
        </button>
      </div>
    </div>
  );
}
