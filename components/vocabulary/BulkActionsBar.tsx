'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Check, Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// ============================================================================
// BulkActionsBar Component
// Shows bulk action buttons when items are selected
// ============================================================================

interface BulkActionsBarProps {
  selectedCount: number;
  onMarkAsKnown: () => void;
  onAddTag: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onMarkAsKnown,
  onAddTag,
  onDelete,
  onClearSelection,
}: BulkActionsBarProps) {
  const [isExiting, setIsExiting] = useState(false);
  const prevSelectedCountRef = useRef(selectedCount);

  // Exit animation when deselecting all items
  useEffect(() => {
    // Detect when going from selected items to no items
    if (prevSelectedCountRef.current > 0 && selectedCount === 0) {
      setIsExiting(true);
      // Wait for animation to complete before hiding
      const timeout = setTimeout(() => {
        setIsExiting(false);
      }, 200); // Match slide-down animation duration
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
            {/* Top row: Count + Clear */}
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

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={onMarkAsKnown}
                leftIcon={<Check size={16} strokeWidth={2} />}
                className="w-full bg-white text-primary hover:bg-white/90"
              >
                Mark as Known
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={onAddTag}
                  leftIcon={<Tag size={16} strokeWidth={2} />}
                  className="bg-white text-primary hover:bg-white/90"
                >
                  Add Tag
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
      </div>

      {/* Desktop: Floating centered */}
      <div className={cn(
        "hidden lg:block fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4",
        isExiting ? "animate-slide-down" : "animate-slide-up"
      )}>
        <div className="bg-primary border border-border rounded-card shadow-modal px-6 py-4 w-full max-w-[600px]">
          <div className="flex items-center gap-4">
            {/* Selection count */}
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

            {/* Divider */}
            <div className="h-8 w-px bg-white/20"></div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-1">
              <Button
                variant="secondary"
                size="md"
                onClick={onMarkAsKnown}
                leftIcon={<Check size={16} strokeWidth={2} />}
                className="bg-white text-primary hover:bg-white/90"
              >
                Mark as Known
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={onAddTag}
                leftIcon={<Tag size={16} strokeWidth={2} />}
                className="bg-white text-primary hover:bg-white/90"
              >
                Add Tag
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
