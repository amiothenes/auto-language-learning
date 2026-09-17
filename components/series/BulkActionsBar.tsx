'use client';

import { useState, useEffect, useRef } from 'react';
import { X, FolderInput, Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// ============================================================================
// BulkActionsBar (Texts) — mirrors components/vocabulary/BulkActionsBar.tsx:
// mobile fixed-bottom sheet, desktop floating centered pill, same breakpoint
// (lg) and slide-up/down exit animation.
// ============================================================================

interface BulkActionsBarProps {
  selectedCount: number;
  onMove: () => void;
  onTag: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onMove,
  onTag,
  onDelete,
  onClearSelection,
}: BulkActionsBarProps) {
  const [isExiting, setIsExiting] = useState(false);
  const prevSelectedCountRef = useRef(selectedCount);

  useEffect(() => {
    if (prevSelectedCountRef.current > 0 && selectedCount === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsExiting(true);
      const timeout = setTimeout(() => setIsExiting(false), 200);
      return () => clearTimeout(timeout);
    }
    prevSelectedCountRef.current = selectedCount;
  }, [selectedCount]);

  if (selectedCount === 0 && !isExiting) return null;

  return (
    <>
      {/* Mobile: Fixed bottom, full width */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 lg:hidden z-50",
        isExiting ? "animate-slide-down" : "animate-slide-up"
      )}>
        <div className="bg-primary border-t border-border shadow-modal">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-sans text-ui-base font-medium text-white">
                {selectedCount} selected
              </span>
              <button
                onClick={onClearSelection}
                className="p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Clear selection"
              >
                <X size={18} className="text-white" strokeWidth={2} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={onMove}
                leftIcon={<FolderInput size={16} strokeWidth={2} />}
                className="bg-white text-primary hover:bg-white/90"
              >
                Move
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={onTag}
                leftIcon={<Tag size={16} strokeWidth={2} />}
                className="bg-white text-primary hover:bg-white/90"
              >
                Tag
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={onDelete}
                leftIcon={<Trash2 size={16} strokeWidth={2} />}
                className="bg-white text-primary hover:bg-white/90"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Floating centered */}
      <div className={cn(
        "hidden lg:block fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4",
        isExiting ? "animate-slide-down" : "animate-slide-up"
      )}>
        <div className="bg-primary border border-border rounded-card shadow-modal px-6 py-4 w-full max-w-[600px]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="font-sans text-ui-base font-medium text-white">
                {selectedCount} selected
              </span>
              <button
                onClick={onClearSelection}
                className="p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Clear selection"
              >
                <X size={18} className="text-white" strokeWidth={2} />
              </button>
            </div>

            <div className="h-8 w-px bg-white/20"></div>

            <div className="flex items-center gap-2 flex-1">
              <Button
                variant="secondary"
                size="md"
                onClick={onMove}
                leftIcon={<FolderInput size={16} strokeWidth={2} />}
                className="bg-white text-primary hover:bg-white/90"
              >
                Move
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={onTag}
                leftIcon={<Tag size={16} strokeWidth={2} />}
                className="bg-white text-primary hover:bg-white/90"
              >
                Tag
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={onDelete}
                leftIcon={<Trash2 size={16} strokeWidth={2} />}
                className="bg-white text-primary hover:bg-white/90"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
