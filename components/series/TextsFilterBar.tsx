'use client';

import { useRef, useEffect, useState } from 'react';
import { ChevronDown, Check, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TextsSortOption =
  | 'date-added'
  | 'recent'
  | 'title-asc'
  | 'progress-desc'
  | 'progress-asc';

const SORT_LABELS: Record<TextsSortOption, string> = {
  'date-added': 'Date Added (Newest)',
  recent: 'Last Read (Recent)',
  'title-asc': 'Title (A-Z)',
  'progress-desc': 'Progress (High to Low)',
  'progress-asc': 'Progress (Low to High)',
};

interface TextsFilterBarProps {
  sortBy: TextsSortOption;
  onSortChange: (sort: TextsSortOption) => void;
  selectedTags: string[];
  availableTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TextsFilterBar({
  sortBy,
  onSortChange,
  selectedTags,
  availableTags,
  onTagsChange,
}: TextsFilterBarProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSortOpen]);

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Tag chips */}
      {availableTags.map((tag) => {
        const active = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={cn(
              'px-3 py-1.5 font-sans text-ui-xs rounded transition-all',
              active
                ? 'bg-primary text-white'
                : 'bg-paper border border-border text-ink hover:bg-desk'
            )}
          >
            {tag}
          </button>
        );
      })}

      {/* Spacer pushes sort to the right when tags are present */}
      {availableTags.length > 0 && <div className="flex-1" />}

      {/* Sort dropdown */}
      <div ref={sortRef} className="relative shrink-0">
        <button
          onClick={() => setIsSortOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 font-sans text-ui-xs text-ink bg-paper border border-border rounded hover:bg-desk transition-all"
          aria-label="Sort texts"
        >
          <SlidersHorizontal size={13} className="text-muted" strokeWidth={1.5} />
          {SORT_LABELS[sortBy]}
          <ChevronDown
            size={13}
            className={cn('text-muted transition-transform', isSortOpen && 'rotate-180')}
            strokeWidth={1.5}
          />
        </button>

        {isSortOpen && (
          <div className="absolute top-full right-0 mt-1 w-52 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10">
            {(Object.keys(SORT_LABELS) as TextsSortOption[]).map((option) => (
              <button
                key={option}
                onClick={() => {
                  onSortChange(option);
                  setIsSortOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2.5 font-sans text-ui-sm text-left hover:bg-desk transition-colors',
                  sortBy === option ? 'text-primary font-medium' : 'text-ink'
                )}
              >
                {SORT_LABELS[option]}
                {sortBy === option && <Check size={14} strokeWidth={2} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
