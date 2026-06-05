'use client';

import { useState, useEffect, useRef } from 'react';
import { GripVertical, MoreVertical, Edit, Trash2, CheckCircle2, Circle, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';

interface TextListRowProps {
  id: string;
  position: number;
  title: string;
  wordCount: number;
  knownPercentage: number;
  isCurrentlyReading: boolean;
  reorderMode: boolean;
  onRead: () => void;
  onEdit: () => void;
  onDelete: () => void;
  /** Passed from useSortable().listeners — attached to the drag handle */
  dragListeners?: DraggableSyntheticListeners;
  /** Passed from useSortable().attributes — ARIA props for a11y */
  dragAttributes?: DraggableAttributes;
}

function TierIcon({ pct }: { pct: number }) {
  if (pct >= 80) return <CheckCircle2 size={14} className="text-primary shrink-0"    strokeWidth={1.5} />;
  if (pct >= 65) return <Circle       size={14} className="text-muted shrink-0"      strokeWidth={1.5} />;
  if (pct >= 50) return <AlertTriangle size={14} className="text-amber-500 shrink-0" strokeWidth={1.5} />;
  return               <XCircle       size={14} className="text-red-400 shrink-0"    strokeWidth={1.5} />;
}

export function TextListRow({
  id,
  position,
  title,
  wordCount,
  knownPercentage,
  isCurrentlyReading,
  reorderMode,
  onRead,
  onEdit,
  onDelete,
  dragListeners,
  dragAttributes,
}: TextListRowProps) {
  void id; // used by parent SortableTextListRow
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2.5 border border-border rounded-md mb-2 bg-paper transition-colors',
        isCurrentlyReading && 'border-primary/30 bg-primary/3'
      )}
    >
      {/* Drag handle — listeners from useSortable allow DnD when reorderMode is active */}
      <span
        {...(dragListeners as React.HTMLAttributes<HTMLSpanElement>)}
        {...(dragAttributes as React.HTMLAttributes<HTMLSpanElement>)}
        className={cn(
          'shrink-0 cursor-grab touch-none',
          reorderMode ? 'block' : 'hidden'
        )}
        aria-label="Drag to reorder"
      >
        <GripVertical size={14} className="text-border-strong" strokeWidth={2} />
      </span>

      {/* Sequence number */}
      <span className="text-ui-xs text-muted w-7 text-right shrink-0 font-sans">
        #{position}
      </span>

      {/* Title — min-w-0 lets truncate actually fire in a flex container */}
      <span
        className={cn(
          'flex-1 min-w-0 text-ui-sm font-sans truncate',
          isCurrentlyReading ? 'font-semibold' : 'font-medium'
        )}
      >
        {title}
      </span>

      {/* Word count */}
      <span className="text-ui-xs text-muted whitespace-nowrap font-sans hidden sm:block shrink-0">
        {wordCount.toLocaleString()} words
      </span>

      {/* Tier icon */}
      <TierIcon pct={knownPercentage} />

      {/* Known % — w-10 comfortably holds "100%" at text-ui-sm */}
      <span className="text-ui-sm font-semibold w-10 text-right font-sans shrink-0">
        {Math.round(knownPercentage)}%
      </span>

      {/* Read / Resume action */}
      {isCurrentlyReading ? (
        <Button variant="primary" size="sm" onClick={onRead}>Resume</Button>
      ) : (
        <Button variant="secondary" size="sm" onClick={onRead}>Read</Button>
      )}

      {/* Options menu */}
      <div ref={menuRef} className="relative shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
          className="p-1.5 rounded hover:bg-desk transition-colors cursor-pointer"
          aria-label="Options"
        >
          <MoreVertical size={14} className="text-muted" strokeWidth={2} />
        </button>

        {isMenuOpen && (
          <div className="absolute top-full right-0 mt-1 w-36 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10">
            <button
              onClick={() => { setIsMenuOpen(false); onEdit(); }}
              className="w-full px-3 py-2 text-left font-sans text-ui-sm text-ink hover:bg-desk transition-colors flex items-center gap-2"
            >
              <Edit size={13} className="text-muted" strokeWidth={1.5} />
              Edit
            </button>
            <button
              onClick={() => { setIsMenuOpen(false); onDelete(); }}
              className="w-full px-3 py-2 text-left font-sans text-ui-sm text-ink hover:bg-desk transition-colors flex items-center gap-2"
            >
              <Trash2 size={13} className="text-muted" strokeWidth={1.5} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
