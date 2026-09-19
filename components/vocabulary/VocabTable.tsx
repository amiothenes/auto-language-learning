'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { VocabularyStatus } from '@/lib/types';
import type { VocabularyItem } from '@/lib/types';
import { Muted } from '@/components/ui/Typography';
import { FrequencyBadge } from '@/components/ui/FrequencyBadge';
import { cn } from '@/lib/utils';

// Re-export for backward compatibility
export type { VocabularyItem };

interface VocabTableProps {
  items: VocabularyItem[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAll: () => void;
  onEdit?: (item: VocabularyItem) => void;
  onDelete?: (item: VocabularyItem) => void;
}

// ============================================================================
// Status Badge Configuration
// ============================================================================

const STATUS_CONFIG = {
  [VocabularyStatus.UNKNOWN]:    { label: 'Unknown',    bgColor: 'hsla(205,80%,58%,.18)', textColor: 'hsl(205,80%,28%)' },
  [VocabularyStatus.NEWLY_SEEN]: { label: 'Newly Seen', bgColor: 'hsla(2,75%,60%,.18)',   textColor: 'hsl(2,75%,30%)' },
  [VocabularyStatus.FAMILIAR]:   { label: 'Familiar',   bgColor: 'hsla(32,90%,56%,.18)',  textColor: 'hsl(32,90%,28%)' },
  [VocabularyStatus.KNOWN]:      { label: 'Known',      bgColor: 'hsla(78,60%,48%,.20)',  textColor: 'hsl(78,60%,20%)' },
  [VocabularyStatus.WELL_KNOWN]: { label: 'Well Known', bgColor: 'hsla(145,60%,40%,.15)', textColor: 'hsl(145,60%,22%)' },
  [VocabularyStatus.IGNORE]:     { label: 'Ignored',    bgColor: 'hsla(0,0%,50%,.12)',    textColor: '#6E6D6A' },
};

// ============================================================================
// Status Badge Component
// ============================================================================

function StatusBadge({ status }: { status: VocabularyStatus }) {
  const config = STATUS_CONFIG[status];
  
  return (
    <span
      className="inline-flex px-2 py-1 rounded-full font-sans text-ui-xs font-medium"
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
      }}
    >
      {config.label}
    </span>
  );
}

// ============================================================================
// Table Row Component
// ============================================================================

function TableRow({
  item,
  isSelected,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: VocabularyItem;
  isSelected: boolean;
  onToggle: () => void;
  onEdit?: (item: VocabularyItem) => void;
  onDelete?: (item: VocabularyItem) => void;
}) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Menu is portaled to document.body (see below) so it isn't clipped by the
  // table's own scroll wrapper / rounded-card overflow-hidden — position it
  // from the trigger button's own rect once it opens.
  const MENU_WIDTH = 160;
  useLayoutEffect(() => {
    if (!isMenuOpen) return;
    const button = menuButtonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const margin = 8;
    const left = Math.max(margin, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - margin));
    setMenuPosition({ top: rect.bottom + 4, left });
  }, [isMenuOpen]);

  // Close dropdown when clicking outside (button or the portaled menu)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (menuButtonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsMenuOpen(false);
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  const handleMenuAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (action === 'edit') {
      onEdit?.(item);
    } else if (action === 'delete') {
      onDelete?.(item);
    }
  };

  return (
    <tr className="border-b border-border hover:bg-desk transition-colors group">
      {/* Checkbox */}
      <td className="w-9 md:w-11 px-2 md:px-3 py-1.5 md:py-2">
        <label className="inline-flex items-center justify-center p-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className="w-[18px] h-[18px] rounded border-border text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            aria-label={`Select ${item.lemma}`}
          />
        </label>
      </td>

      {/* Lemma */}
      <td className="px-2 md:px-3 py-1.5 md:py-2">
        <p className="font-serif text-ink font-semibold leading-normal line-clamp-1 text-ui-base md:text-base">
          {item.lemma}
        </p>
      </td>

      {/* Status */}
      <td className="px-2 md:px-3 py-1.5 md:py-2">
        <StatusBadge status={item.status} />
      </td>

      {/* Frequency tier */}
      <td className="px-2 md:px-3 py-1.5 md:py-2">
        <FrequencyBadge score={item.dictionaryFrequency} percentile={item.frequencyPercentile} />
      </td>

      {/* Translation */}
      <td className="px-2 md:px-3 py-1.5 md:py-2 hidden lg:table-cell">
        <p className="font-serif text-ink opacity-80 leading-normal line-clamp-1 text-base">
          {item.translation}
        </p>
      </td>

      {/* Seen In */}
      <td className="px-2 md:px-3 py-1.5 md:py-2 hidden lg:table-cell">
        {item.textCount > 0 ? (
          <button
            onClick={() => router.push(`/vocabulary/${item.id}/contexts`)}
            className="font-sans text-ui-sm font-semibold text-primary hover:underline cursor-pointer"
          >
            {item.textCount} text{item.textCount !== 1 ? 's' : ''} →
          </button>
        ) : (
          <Muted size="sm">—</Muted>
        )}
      </td>

      {/* Actions */}
      <td className="w-9 md:w-11 px-2 md:px-3 py-1.5 md:py-2">
        <button
          ref={menuButtonRef}
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="p-1 md:p-1.5 rounded hover:bg-paper transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          aria-label="Options"
        >
          <MoreVertical size={16} className="text-ink md:w-[18px] md:h-[18px]" strokeWidth={2} />
        </button>

        {isMenuOpen &&
          createPortal(
            <div
              ref={menuRef}
              className={cn(
                'fixed w-40 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-50',
                menuPosition === null && 'opacity-0'
              )}
              style={menuPosition ? { top: menuPosition.top, left: menuPosition.left } : { top: 0, left: 0 }}
            >
              <button
                onClick={(e) => handleMenuAction(e, 'edit')}
                className="w-full px-4 py-2.5 text-left font-sans text-ui-sm text-ink hover:bg-desk transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Edit size={14} className="text-muted" strokeWidth={1.5} />
                Edit
              </button>
              <button
                onClick={(e) => handleMenuAction(e, 'delete')}
                className="w-full px-4 py-2.5 text-left font-sans text-ui-sm text-ink hover:bg-desk transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Trash2 size={14} className="text-muted" strokeWidth={1.5} />
                Delete
              </button>
            </div>,
            document.body
          )}
      </td>
    </tr>
  );
}

// ============================================================================
// VocabTable Component
// ============================================================================

export function VocabTable({
  items,
  selectedIds,
  onToggleSelection,
  onToggleAll,
  onEdit,
  onDelete,
}: VocabTableProps) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));
  const someSelected = items.some((item) => selectedIds.has(item.id)) && !allSelected;

  return (
    <div className="bg-paper border border-border rounded-card shadow-raised overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead className="bg-desk border-b border-border sticky top-0">
            <tr>
              <th className="w-9 md:w-11 px-2 md:px-3 py-2 md:py-2.5">
                <label className="inline-flex items-center justify-center p-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={onToggleAll}
                    className="w-[18px] h-[18px] rounded border-border text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    aria-label="Select all"
                  />
                </label>
              </th>
              <th className="px-2 md:px-3 py-2 md:py-2.5 text-left font-sans text-ui-sm font-semibold text-ink">
                Lemma
              </th>
              <th className="px-2 md:px-3 py-2 md:py-2.5 text-left font-sans text-ui-sm font-semibold text-ink">
                Status
              </th>
              <th className="px-2 md:px-3 py-2 md:py-2.5 text-left font-sans text-ui-sm font-semibold text-ink">
                Frequency
              </th>
              <th className="px-2 md:px-3 py-2 md:py-2.5 text-left font-sans text-ui-sm font-semibold text-ink hidden lg:table-cell">
                Translation
              </th>
              <th className="px-2 md:px-3 py-2 md:py-2.5 text-left font-sans text-ui-sm font-semibold text-ink hidden lg:table-cell">
                Seen in
              </th>
              <th className="w-9 md:w-11 px-2 md:px-3 py-2 md:py-2.5"></th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {items.map((item) => (
              <TableRow
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                onToggle={() => onToggleSelection(item.id)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="py-12 text-center">
          <Muted>No vocabulary items found</Muted>
        </div>
      )}
    </div>
  );
}
