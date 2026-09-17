'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Content, Muted } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MoreVertical, FileText, Edit, Trash2, Download, GripVertical } from 'lucide-react';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

// ============================================================================
// TextCard Component
// Displays an individual text card with title, stats, preview, and actions
// ============================================================================

interface TextCardProps {
  id: string;
  title: string;
  wordCount: number;
  knownPercentage: number;
  lastRead: string;
  hasBeenRead: boolean;
  preview: string;
  seriesName?: string;
  dateAdded?: string;
  onDelete?: (text: { id: string; title: string }) => void;
  onEdit?: (text: { id: string; title: string }) => void;
  onExportOneT?: (text: { id: string; title: string }) => void;
  /** Passed from useSortable().listeners — attached to the drag handle */
  dragListeners?: DraggableSyntheticListeners;
  /** Passed from useSortable().attributes — ARIA props for a11y */
  dragAttributes?: DraggableAttributes;
  /** When true, a checkbox replaces the drag handle and the card toggles selection instead of navigating. */
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export function TextCard({
  id,
  title,
  wordCount,
  knownPercentage,
  lastRead,
  hasBeenRead,
  preview,
  seriesName,
  dateAdded,
  onDelete,
  onEdit,
  onExportOneT,
  dragListeners,
  dragAttributes,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: TextCardProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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

  const handleCardClick = () => {
    if (selectMode) {
      onToggleSelect?.();
      return;
    }
    router.push(`/reader/${id}`);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    setIsMenuOpen(false);

    if (action === 'delete' && onDelete) {
      onDelete({ id, title });
    }
    if (action === 'edit' && onEdit) {
      onEdit({ id, title });
    }
    if (action === 'export-onet' && onExportOneT) {
      onExportOneT({ id, title });
    }
  };

  return (
    <Card
      variant="interactive"
      padding="md"
      onClick={handleCardClick}
      className={cn('relative', selected && 'border-primary/50 bg-primary/5')}
    >
      {/* Header: Checkbox/Drag Handle + Text Title + Menu Button */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {/* Checkbox (select mode) or drag handle — mutually exclusive */}
            {selectMode ? (
              <input
                type="checkbox"
                checked={selected}
                onChange={onToggleSelect}
                onClick={(e) => e.stopPropagation()}
                className="p-1 -ml-1 shrink-0 w-4 h-4 accent-primary cursor-pointer"
                aria-label={`Select ${title}`}
              />
            ) : (
              dragListeners && (
                <span
                  {...(dragListeners as React.HTMLAttributes<HTMLSpanElement>)}
                  {...(dragAttributes as React.HTMLAttributes<HTMLSpanElement>)}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 -ml-1 shrink-0 rounded hover:bg-desk transition-all cursor-grab touch-none"
                  aria-label="Drag to reorder"
                >
                  <GripVertical size={16} className="text-muted" strokeWidth={2} />
                </span>
              )
            )}

            <Content size="lg" weight="semibold" className="line-clamp-1 flex-1 min-w-0">
              {title}
            </Content>
          </div>
          {seriesName && (
            <Muted size="xs" className="mt-0.5 line-clamp-1">{seriesName}</Muted>
          )}
        </div>

        {/* Menu Button - Always visible on mobile, hover-only on desktop; hidden in select mode */}
        {!selectMode && (
        <div ref={menuRef} className="relative">
          <button
            onClick={handleMenuToggle}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-desk transition-all shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
            aria-label="Text options"
          >
            <MoreVertical size={18} className="text-ink" strokeWidth={2} />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Edit size={16} className="text-muted" strokeWidth={1.5} />}
                onClick={(e) => handleMenuAction(e, 'edit')}
                className="w-full px-4 py-3 text-left rounded-none justify-start"
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Download size={16} className="text-muted" strokeWidth={1.5} />}
                onClick={(e) => handleMenuAction(e, 'export-onet')}
                className="w-full px-4 py-3 text-left rounded-none justify-start"
              >
                Export 1T Sentences
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Trash2 size={16} className="text-muted" strokeWidth={1.5} />}
                onClick={(e) => handleMenuAction(e, 'delete')}
                className="w-full px-4 py-3 text-left rounded-none justify-start"
              >
                Delete
              </Button>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Preview Snippet */}
      <Content size="sm" className="mb-4 line-clamp-2 h-[2.8rem] text-muted">
        {preview}
      </Content>

      {/* Metadata Row */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <FileText size={14} className="text-muted" strokeWidth={1.5} />
          <Muted size="xs">{wordCount.toLocaleString('en-US')} words</Muted>
        </div>
        <Muted size="xs" className="text-primary font-medium">
          {Math.round(knownPercentage)}% complete
        </Muted>
      </div>

      {/* Progress Bar */}
      <ProgressBar value={knownPercentage} className="mb-3" />

      {/* Last Read / Date Added */}
      <div className="flex items-center justify-between gap-2">
        <Muted size="xs">{hasBeenRead ? `Last read ${lastRead}` : 'Never opened'}</Muted>
        {dateAdded && <Muted size="xs">Added {dateAdded}</Muted>}
      </div>
    </Card>
  );
}
