'use client';

import { useState, useEffect, useRef } from 'react';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { VocabularyStatus } from '@/lib/types';
import type { VocabularyItem } from '@/lib/types';
import { Content, Muted } from '@/components/ui/Typography';
import { ProgressBar } from '@/components/ui/ProgressBar';

// Re-export for backward compatibility
export type { VocabularyItem };

interface VocabTableProps {
  items: VocabularyItem[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAll: () => void;
  onDelete?: (item: VocabularyItem) => void;
}

// ============================================================================
// Status Badge Configuration
// ============================================================================

const STATUS_CONFIG = {
  [VocabularyStatus.UNKNOWN]: {
    label: 'Unknown',
    bgColor: 'hsla(0, 0%, 60%, 0.25)',
    textColor: '#6E6D6A',
  },
  [VocabularyStatus.NEWLY_SEEN]: {
    label: 'Newly Seen',
    bgColor: 'hsla(0, 70%, 55%, 0.6)',
    textColor: '#8B2020',
  },
  [VocabularyStatus.FAMILIAR]: {
    label: 'Familiar',
    bgColor: 'hsla(45, 85%, 55%, 0.6)',
    textColor: '#8B6914',
  },
  [VocabularyStatus.KNOWN]: {
    label: 'Known',
    bgColor: 'hsla(145, 60%, 40%, 0.5)',
    textColor: '#1E6B3E',
  },
  [VocabularyStatus.WELL_KNOWN]: {
    label: 'Well Known',
    bgColor: 'hsla(145, 60%, 40%, 0.3)',
    textColor: '#1E6B3E',
  },
  [VocabularyStatus.IGNORE]: {
    label: 'Ignored',
    bgColor: 'hsla(0, 0%, 50%, 0.2)',
    textColor: '#6E6D6A',
  },
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
  onDelete,
}: {
  item: VocabularyItem;
  isSelected: boolean;
  onToggle: () => void;
  onDelete?: (item: VocabularyItem) => void;
}) {
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

  const handleMenuAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (action === 'delete') {
      onDelete?.(item);
    } else {
      console.log(`${action} vocabulary:`, item.id);
    }
  };

  return (
    <tr className="border-b border-border hover:bg-desk transition-colors group">
      {/* Checkbox */}
      <td className="w-10 md:w-12 px-2 md:px-4 py-2 md:py-3">
        <label className="inline-flex items-center justify-center p-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            aria-label={`Select ${item.lemma}`}
          />
        </label>
      </td>

      {/* Lemma */}
      <td className="px-2 md:px-4 py-2 md:py-3">
        <Content size="base" weight="semibold" className="line-clamp-1 text-ui-sm md:text-content-base">
          {item.lemma}
        </Content>
      </td>

      {/* Status */}
      <td className="px-2 md:px-4 py-2 md:py-3">
        <StatusBadge status={item.status} />
      </td>

      {/* Dictionary Frequency */}
      <td className="px-2 md:px-3 py-2 md:py-3">
        <div className="flex items-center gap-1 md:gap-2">
          <Muted size="xs" className="w-6 md:w-8 text-left text-ui-xs">
            {item.dictionaryFrequency}
          </Muted>
          <div className="flex-1 min-w-[40px] md:min-w-[60px] hidden md:block">
            <ProgressBar value={item.dictionaryFrequency} max={100} className="h-2" />
          </div>
        </div>
      </td>

      {/* User Frequency */}
      <td className="px-2 md:px-3 py-2 md:py-3">
        <Muted size="xs" className="font-sans font-medium text-ui-xs md:text-ui-sm">
          {item.userFrequency}
        </Muted>
      </td>

      {/* Translation */}
      <td className="px-2 md:px-4 py-2 md:py-3 hidden lg:table-cell">
        <Content size="base" className="text-ink opacity-80 line-clamp-1">
          {item.translation}
        </Content>
      </td>

      {/* Tags */}
      <td className="px-2 md:px-4 py-2 md:py-3 hidden lg:table-cell">
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-desk border border-border rounded-full font-sans text-ui-xs text-muted"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 2 && (
            <span className="px-2 py-0.5 font-sans text-ui-xs text-muted">
              +{item.tags.length - 2}
            </span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="w-8 md:w-12 px-2 md:px-4 py-2 md:py-3">
        <div ref={menuRef} className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1 md:p-1.5 rounded hover:bg-paper transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
            aria-label="Options"
          >
            <MoreVertical size={16} className="text-ink md:w-[18px] md:h-[18px]" strokeWidth={2} />
          </button>

          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-40 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10">
              <button
                onClick={(e) => handleMenuAction(e, 'edit')}
                className="w-full px-4 py-2.5 text-left font-sans text-ui-sm text-ink hover:bg-desk transition-colors flex items-center gap-2"
              >
                <Edit size={14} className="text-muted" strokeWidth={1.5} />
                Edit
              </button>
              <button
                onClick={(e) => handleMenuAction(e, 'delete')}
                className="w-full px-4 py-2.5 text-left font-sans text-ui-sm text-ink hover:bg-desk transition-colors flex items-center gap-2"
              >
                <Trash2 size={14} className="text-muted" strokeWidth={1.5} />
                Delete
              </button>
            </div>
          )}
        </div>
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
              <th className="w-10 md:w-12 px-2 md:px-4 py-2 md:py-3">
                <label className="inline-flex items-center justify-center p-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={onToggleAll}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    aria-label="Select all"
                  />
                </label>
              </th>
              <th className="px-2 md:px-4 py-2 md:py-3 text-left font-sans text-ui-xs md:text-ui-sm font-semibold text-ink">
                Lemma
              </th>
              <th className="px-2 md:px-4 py-2 md:py-3 text-left font-sans text-ui-xs md:text-ui-sm font-semibold text-ink">
                Status
              </th>
              <th className="px-2 md:px-3 py-2 md:py-3 text-left font-sans text-ui-xs md:text-ui-sm font-semibold text-ink">
                Dict
              </th>
              <th className="px-2 md:px-3 py-2 md:py-3 text-left font-sans text-ui-xs md:text-ui-sm font-semibold text-ink">
                User
              </th>
              <th className="px-2 md:px-4 py-2 md:py-3 text-left font-sans text-ui-xs md:text-ui-sm font-semibold text-ink hidden lg:table-cell">
                Translation
              </th>
              <th className="px-2 md:px-4 py-2 md:py-3 text-left font-sans text-ui-xs md:text-ui-sm font-semibold text-ink hidden lg:table-cell">
                Tags
              </th>
              <th className="w-8 md:w-12 px-2 md:px-4 py-2 md:py-3"></th>
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
