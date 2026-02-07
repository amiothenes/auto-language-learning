'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { VocabularyStatus } from '@/components/reader/Word';
import { cn } from '@/lib/utils';
import { useDropdownNavigation } from '@/lib/hooks/useDropdownNavigation';

// ============================================================================
// Types
// ============================================================================

export type SortOption = 'name-asc' | 'dict-freq-desc' | 'user-freq-desc' | 'status';

interface VocabFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeStatuses: Set<VocabularyStatus>;
  onStatusToggle: (status: VocabularyStatus) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  statusCounts: Record<VocabularyStatus, number>;
}

// ============================================================================
// Status Chip Configuration
// ============================================================================

const STATUS_CONFIG = {
  [VocabularyStatus.NEWLY_SEEN]: {
    label: 'Newly Seen',
    color: 'hsla(0, 70%, 55%, 0.6)',
    textColor: '#8B2020',
  },
  [VocabularyStatus.FAMILIAR]: {
    label: 'Familiar',
    color: 'hsla(45, 85%, 55%, 0.6)',
    textColor: '#8B6914',
  },
  [VocabularyStatus.KNOWN]: {
    label: 'Known',
    color: 'hsla(145, 60%, 40%, 0.5)',
    textColor: '#1E6B3E',
  },
  [VocabularyStatus.WELL_KNOWN]: {
    label: 'Well Known',
    color: 'hsla(145, 60%, 40%, 0.3)',
    textColor: '#1E6B3E',
  },
  [VocabularyStatus.IGNORE]: {
    label: 'Ignored',
    color: 'hsla(0, 0%, 50%, 0.2)',
    textColor: '#6E6D6A',
  },
};

// ============================================================================
// VocabFilterBar Component
// ============================================================================

export function VocabFilterBar({
  searchQuery,
  onSearchChange,
  activeStatuses,
  onStatusToggle,
  sortBy,
  onSortChange,
  statusCounts,
}: VocabFilterBarProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'dict-freq-desc', label: 'Dictionary Frequency (High-Low)' },
    { value: 'user-freq-desc', label: 'User Frequency (High-Low)' },
    { value: 'status', label: 'Status' },
  ];

  // Keyboard navigation for sort dropdown
  const { highlightedIndex } = useDropdownNavigation(
    isSortOpen,
    sortOptions,
    sortOptions.find((opt) => opt.value === sortBy),
    (option) => {
      onSortChange(option.value);
      setIsSortOpen(false);
    },
    () => setIsSortOpen(false),
    sortDropdownRef
  );

  // Close sort dropdown when clicking outside
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

  const currentSortLabel = sortOptions.find((opt) => opt.value === sortBy)?.label;

  return (
    <div className="bg-paper border border-border rounded-card shadow-raised p-4 md:p-6 space-y-4">
      {/* Top Row: Search + Sort */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            strokeWidth={1.5}
          />
          <input
            id="vocab-search"
            type="text"
            placeholder="Search by lemma or translation..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-desk border border-border rounded font-serif text-ui-base text-ink placeholder:text-muted placeholder:font-serif focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        {/* Sort Dropdown */}
        <div ref={sortRef} className="relative">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="h-10 w-full md:min-w-[200px] justify-between rounded"
            role="combobox"
            aria-expanded={isSortOpen}
            aria-haspopup="listbox"
            aria-label="Sort vocabulary"
          >
            <span className="text-muted text-ui-sm">Sort:</span>
            <span className="flex-1 text-left ml-2">{currentSortLabel}</span>
            <ChevronDown size={16} className="text-muted" strokeWidth={2} />
          </Button>

          {isSortOpen && (
            <div
              ref={sortDropdownRef}
              role="listbox"
              className="absolute top-full right-0 mt-1 w-full min-w-[260px] max-w-[320px] bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10"
            >
              {sortOptions.map((option, index) => (
                <button
                  key={option.value}
                  role="option"
                  aria-selected={sortBy === option.value}
                  data-index={index}
                  onClick={() => {
                    onSortChange(option.value);
                    setIsSortOpen(false);
                  }}
                  className={cn(
                    'w-full px-4 py-3 text-left font-sans text-ui-base transition-colors',
                    sortBy === option.value
                      ? 'bg-primary text-white font-medium'
                      : highlightedIndex === index
                      ? 'bg-desk text-ink'
                      : 'text-ink hover:bg-desk'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Status Filter Chips */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-ui-sm font-sans text-muted">Filter by status:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.values(VocabularyStatus).map((status) => {
            const config = STATUS_CONFIG[status];
            const isActive = activeStatuses.has(status);
            const count = statusCounts[status] || 0;

            return (
              <button
                key={status}
                onClick={() => onStatusToggle(status)}
                className={cn(
                  'px-4 py-2.5 rounded-full font-sans text-ui-sm font-medium transition-all border cursor-pointer min-h-[44px] inline-flex items-center justify-center',
                  isActive
                    ? 'border-transparent shadow-raised'
                    : 'border-border bg-paper hover:bg-desk'
                )}
                style={{
                  backgroundColor: isActive ? config.color : undefined,
                  color: isActive ? config.textColor : '#6E6D6A',
                }}
                aria-label={`Filter by ${config.label}`}
                aria-pressed={isActive}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
