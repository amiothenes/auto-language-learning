import { cn } from '@/lib/utils';

// ============================================================================
// ProgressBar Component
// Reusable progress indicator for tracking completion percentages
// ============================================================================

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  className?: string;
}

export function ProgressBar({ value, max = 100, className }: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div 
      className={cn(
        'h-3 w-full rounded-full bg-border overflow-hidden',
        className
      )}
    >
      <div
        className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
