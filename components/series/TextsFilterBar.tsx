'use client';

import { useRef, useEffect, useState } from 'react';
import { ChevronDown, Check, SlidersHorizontal, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TextSortOption } from '@/lib/types/ui';

const SORT_LABELS: Record<TextSortOption, string> = {
  'date-added': 'Date Added (Newest)',
  recent: 'Last Read (Recent)',
  'title-asc': 'Title (A-Z)',
  'progress-desc': 'Progress (High to Low)',
  'progress-asc': 'Progress (Low to High)',
};

/** Completion-% band, same bands used for the per-text tier icon (Ready/OK/Hard). */
export type TierFilter = 'all' | 'ready' | 'ok' | 'hard';

const TIER_LABELS: Record<TierFilter, string> = {
  all: 'All Levels',
  ready: 'Ready ≥80%',
  ok: 'OK 65–79%',
  hard: 'Hard <65%',
};

interface TextsFilterBarProps {
  /** 'custom' is only ever passed by the series-detail page (via showCustomOrder) — the
   * cross-series Texts view has no per-series manual order, so it never sets this. */
  sortBy: TextSortOption | 'custom';
  onSortChange: (sort: TextSortOption) => void;
  selectedTags: string[];
  availableTags: string[];
  onTagsChange: (tags: string[]) => void;
  /** Title search — omit to hide the search input entirely. */
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  /** Completion-% tier filter — omit to hide it entirely. */
  tierFilter?: TierFilter;
  onTierFilterChange?: (tier: TierFilter) => void;
  /** Series-detail only: appends "Custom Order" as a 6th sort option reflecting the
   * page's drag-reorder state. Highlighted whenever sortBy === 'custom'. */
  showCustomOrder?: boolean;
  onSelectCustomOrder?: () => void;
}

export function TextsFilterBar({
  sortBy,
  onSortChange,
  selectedTags,
  availableTags,
  onTagsChange,
  searchQuery,
  onSearchChange,
  tierFilter = 'all',
  onTierFilterChange,
  showCustomOrder = false,
  onSelectCustomOrder,
}: TextsFilterBarProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isTierOpen, setIsTierOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const tierRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (tierRef.current && !tierRef.current.contains(event.target as Node)) {
        setIsTierOpen(false);
      }
    }
    if (isSortOpen || isTierOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSortOpen, isTierOpen]);

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  }

  const currentSortLabel = sortBy === 'custom' ? 'Custom Order' : SORT_LABELS[sortBy];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search input */}
      {onSearchChange && (
        <div className="relative shrink-0 w-full sm:w-48">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Search titles..."
            value={searchQuery ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-7.5 pl-7 pr-3 bg-paper border border-border rounded font-sans text-ui-xs text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      )}

      {/* Tag chips */}
      {availableTags.map((tag) => {
        const active = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={cn(
              'px-3 py-1.5 font-sans text-ui-xs rounded transition-all cursor-pointer',
              active
                ? 'bg-primary text-white'
                : 'bg-paper border border-border text-ink hover:bg-desk'
            )}
          >
            {tag}
          </button>
        );
      })}

      {/* Spacer pushes tier/sort to the right when tags are present */}
      {availableTags.length > 0 && <div className="flex-1" />}

      {/* Tier filter */}
      {onTierFilterChange && (
        <div ref={tierRef} className="relative shrink-0">
          <button
            onClick={() => setIsTierOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 font-sans text-ui-xs text-ink bg-paper border border-border rounded hover:bg-desk transition-all cursor-pointer"
            aria-label="Filter by completion level"
          >
            {TIER_LABELS[tierFilter]}
            <ChevronDown
              size={13}
              className={cn('text-muted transition-transform', isTierOpen && 'rotate-180')}
              strokeWidth={1.5}
            />
          </button>

          {isTierOpen && (
            <div className="absolute top-full right-0 mt-1 w-40 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10">
              {(Object.keys(TIER_LABELS) as TierFilter[]).map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onTierFilterChange(option);
                    setIsTierOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2.5 font-sans text-ui-sm text-left hover:bg-desk transition-colors cursor-pointer',
                    tierFilter === option ? 'text-primary font-medium' : 'text-ink'
                  )}
                >
                  {TIER_LABELS[option]}
                  {tierFilter === option && <Check size={14} strokeWidth={2} />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sort dropdown */}
      <div ref={sortRef} className="relative shrink-0">
        <button
          onClick={() => setIsSortOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 font-sans text-ui-xs text-ink bg-paper border border-border rounded hover:bg-desk transition-all cursor-pointer"
          aria-label="Sort texts"
        >
          <SlidersHorizontal size={13} className="text-muted" strokeWidth={1.5} />
          {currentSortLabel}
          <ChevronDown
            size={13}
            className={cn('text-muted transition-transform', isSortOpen && 'rotate-180')}
            strokeWidth={1.5}
          />
        </button>

        {isSortOpen && (
          <div className="absolute top-full right-0 mt-1 w-52 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10">
            {(Object.keys(SORT_LABELS) as TextSortOption[]).map((option) => (
              <button
                key={option}
                onClick={() => {
                  onSortChange(option);
                  setIsSortOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2.5 font-sans text-ui-sm text-left hover:bg-desk transition-colors cursor-pointer',
                  sortBy === option ? 'text-primary font-medium' : 'text-ink'
                )}
              >
                {SORT_LABELS[option]}
                {sortBy === option && <Check size={14} strokeWidth={2} />}
              </button>
            ))}
            {showCustomOrder && (
              <button
                onClick={() => {
                  onSelectCustomOrder?.();
                  setIsSortOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2.5 font-sans text-ui-sm text-left hover:bg-desk transition-colors cursor-pointer border-t border-border',
                  sortBy === 'custom' ? 'text-primary font-medium' : 'text-ink'
                )}
              >
                Custom Order
                {sortBy === 'custom' && <Check size={14} strokeWidth={2} />}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
