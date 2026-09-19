'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ChevronsUpDown, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import { cn } from '@/lib/utils';

// ============================================================================
// BulkActionsBar Component
// Shows bulk action buttons when items are selected
// ============================================================================

// Local label set, same duplication pattern as GradingSection's STEP_LABELS
// and VocabFilterBar's STATUS_CONFIG — each surface owns its own copy.
const STATUS_LABELS: Record<VocabularyStatus, string> = {
  [VocabularyStatus.UNKNOWN]:    'Unknown',
  [VocabularyStatus.NEWLY_SEEN]: 'Newly Seen',
  [VocabularyStatus.FAMILIAR]:   'Familiar',
  [VocabularyStatus.KNOWN]:      'Known',
  [VocabularyStatus.WELL_KNOWN]: 'Well Known',
  [VocabularyStatus.IGNORE]:     'Ignore',
};

interface BulkActionsBarProps {
  selectedCount: number;
  /** Total words matching the active filters — used for the "select all" upsell. */
  totalCount: number;
  canSelectAllMatching: boolean;
  isSelectingAllMatching: boolean;
  onSelectAllMatching: () => void;
  onSetStatus: (status: VocabularyStatus) => void;
  onStepUp: () => void;
  onStepDown: () => void;
  canStepUp: boolean;
  canStepDown: boolean;
  onDelete: () => void;
  onClearSelection: () => void;
}

// Shared segment styles for the "Set Status | Up | Down" grouped control —
// hand-rolled buttons rather than the shared <Button/> since they need to
// visually fuse into one pill (no gap, no divider) instead of standing alone.
const segmentBase =
  'flex items-center justify-center gap-1.5 h-11 font-sans text-ui-sm font-medium text-primary bg-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-white/90';

export function BulkActionsBar({
  selectedCount,
  totalCount,
  canSelectAllMatching,
  isSelectingAllMatching,
  onSelectAllMatching,
  onSetStatus,
  onStepUp,
  onStepDown,
  canStepUp,
  canStepDown,
  onDelete,
  onClearSelection,
}: BulkActionsBarProps) {
  const [isExiting, setIsExiting] = useState(false);
  const prevSelectedCountRef = useRef(selectedCount);

  const [isStatusMenuOpenMobile, setIsStatusMenuOpenMobile] = useState(false);
  const statusMenuRefMobile = useRef<HTMLDivElement>(null);
  const [isStatusMenuOpenDesktop, setIsStatusMenuOpenDesktop] = useState(false);
  const statusMenuRefDesktop = useRef<HTMLDivElement>(null);

  // Exit animation when deselecting all items
  useEffect(() => {
    // Detect when going from selected items to no items
    if (prevSelectedCountRef.current > 0 && selectedCount === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsExiting(true); // Intentional: trigger exit animation
      // Wait for animation to complete before hiding
      const timeout = setTimeout(() => {
        setIsExiting(false);
      }, 200); // Match slide-down animation duration
      return () => clearTimeout(timeout);
    }
    prevSelectedCountRef.current = selectedCount;
  }, [selectedCount]);

  // Close status menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusMenuRefMobile.current && !statusMenuRefMobile.current.contains(event.target as Node)) {
        setIsStatusMenuOpenMobile(false);
      }
      if (statusMenuRefDesktop.current && !statusMenuRefDesktop.current.contains(event.target as Node)) {
        setIsStatusMenuOpenDesktop(false);
      }
    }
    if (isStatusMenuOpenMobile || isStatusMenuOpenDesktop) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isStatusMenuOpenMobile, isStatusMenuOpenDesktop]);

  if (selectedCount === 0 && !isExiting) return null;

  const statusMenuItems = (onPick: (status: VocabularyStatus) => void) =>
    Object.values(VocabularyStatus).map((status) => (
      <button
        key={status}
        onClick={() => onPick(status)}
        className="w-full px-4 py-2.5 text-left font-sans text-ui-sm text-ink hover:bg-desk transition-colors cursor-pointer"
      >
        {STATUS_LABELS[status]}
      </button>
    ));

  return (
    <>
      {/* Mobile: Fixed bottom, full width */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 lg:hidden z-50",
        isExiting ? "animate-slide-down" : "animate-slide-up"
      )}>
        <div className="bg-primary border-t border-border shadow-modal">
          <div className="px-4 py-4">
            {/* Top row: Count + select-all-matching + Clear */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-sans text-ui-base font-medium text-white whitespace-nowrap">
                  {selectedCount} selected
                </span>
                {canSelectAllMatching && (
                  <button
                    onClick={onSelectAllMatching}
                    disabled={isSelectingAllMatching}
                    className="font-sans text-ui-sm font-medium text-white/80 hover:text-white underline underline-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-wait truncate"
                  >
                    {isSelectingAllMatching ? 'Selecting…' : `Select all ${totalCount}`}
                  </button>
                )}
              </div>
              <button
                onClick={onClearSelection}
                className="p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                aria-label="Clear selection"
              >
                <X size={18} className="text-white" strokeWidth={2} />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <div ref={statusMenuRefMobile} className="relative flex rounded overflow-hidden shadow-raised">
                <button
                  onClick={() => setIsStatusMenuOpenMobile((open) => !open)}
                  className={cn(segmentBase, 'flex-1 border-r border-primary/15')}
                  aria-expanded={isStatusMenuOpenMobile}
                  aria-haspopup="menu"
                >
                  <ChevronsUpDown size={16} strokeWidth={2} />
                  Set Status
                </button>
                <button
                  onClick={onStepUp}
                  disabled={!canStepUp}
                  aria-label="Level up"
                  className={cn(segmentBase, 'w-14 border-r border-primary/15')}
                >
                  <ChevronUp size={18} strokeWidth={2} />
                </button>
                <button
                  onClick={onStepDown}
                  disabled={!canStepDown}
                  aria-label="Level down"
                  className={cn(segmentBase, 'w-14')}
                >
                  <ChevronDown size={18} strokeWidth={2} />
                </button>
                {isStatusMenuOpenMobile && (
                  <div
                    role="menu"
                    className="absolute bottom-full left-0 right-0 mb-2 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10 py-1"
                  >
                    {statusMenuItems((status) => {
                      onSetStatus(status);
                      setIsStatusMenuOpenMobile(false);
                    })}
                  </div>
                )}
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={onDelete}
                leftIcon={<Trash2 size={16} strokeWidth={2} />}
                className="w-full bg-white text-primary hover:bg-white/90"
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
            {/* Selection count + select-all-matching */}
            <div className="flex items-center gap-3">
              <span className="font-sans text-ui-base font-medium text-white whitespace-nowrap">
                {selectedCount} selected
              </span>
              {canSelectAllMatching && (
                <button
                  onClick={onSelectAllMatching}
                  disabled={isSelectingAllMatching}
                  className="font-sans text-ui-sm font-medium text-white/80 hover:text-white underline underline-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-wait whitespace-nowrap"
                >
                  {isSelectingAllMatching ? 'Selecting…' : `Select all ${totalCount}`}
                </button>
              )}
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
              <div ref={statusMenuRefDesktop} className="relative flex rounded overflow-hidden shadow-raised">
                <button
                  onClick={() => setIsStatusMenuOpenDesktop((open) => !open)}
                  className={cn(segmentBase, 'px-4 border-r border-primary/15')}
                  aria-expanded={isStatusMenuOpenDesktop}
                  aria-haspopup="menu"
                >
                  <ChevronsUpDown size={16} strokeWidth={2} />
                  Set Status
                </button>
                <button
                  onClick={onStepUp}
                  disabled={!canStepUp}
                  aria-label="Level up"
                  className={cn(segmentBase, 'w-10 border-r border-primary/15')}
                >
                  <ChevronUp size={18} strokeWidth={2} />
                </button>
                <button
                  onClick={onStepDown}
                  disabled={!canStepDown}
                  aria-label="Level down"
                  className={cn(segmentBase, 'w-10')}
                >
                  <ChevronDown size={18} strokeWidth={2} />
                </button>
                {isStatusMenuOpenDesktop && (
                  <div
                    role="menu"
                    className="absolute bottom-full left-0 mb-2 w-48 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10 py-1"
                  >
                    {statusMenuItems((status) => {
                      onSetStatus(status);
                      setIsStatusMenuOpenDesktop(false);
                    })}
                  </div>
                )}
              </div>
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
