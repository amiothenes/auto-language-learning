'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Heading, Muted } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { SeriesCard } from '@/components/series/SeriesCard';
import { SeriesCardSkeleton } from '@/components/series/SeriesCardSkeleton';
import { EmptySeriesState } from '@/components/series/EmptySeriesState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Search, Plus, ChevronDown } from 'lucide-react';
import type { Series, SeriesSortOption } from '@/lib/types';

// ============================================================================
// Hardcoded Data
// ============================================================================

// TODO: Replace with API call
const TEMP_SERIES: Series[] = [
  {
    id: '1',
    name: 'Russian News Articles',
    description: 'A collection of current events and breaking news from Russian sources',
    textCount: 12,
    progress: 72,
    lastUpdated: '2 days ago',
  },
  {
    id: '2',
    name: 'Spanish Short Stories',
    description: 'Classic and contemporary short fiction from Spanish-speaking authors',
    textCount: 8,
    progress: 45,
    lastUpdated: '5 days ago',
  },
  {
    id: '3',
    name: 'French Poetry Collection',
    description: 'Selected poems from French literary tradition',
    textCount: 15,
    progress: 89,
    lastUpdated: '1 week ago',
  },
  {
    id: '4',
    name: 'German Technical Articles',
    description: 'Technical documentation and articles about software development',
    textCount: 6,
    progress: 34,
    lastUpdated: '3 days ago',
  },
  {
    id: '5',
    name: 'Italian Cooking Recipes',
    description: 'Traditional Italian recipes and culinary guides',
    textCount: 10,
    progress: 56,
    lastUpdated: '1 day ago',
  },
  {
    id: '6',
    name: 'Japanese Business Writing',
    description: 'Professional business communication examples and templates',
    textCount: 4,
    progress: 12,
    lastUpdated: '2 weeks ago',
  },
];

// ============================================================================
// Series Page Component
// ============================================================================

export default function SeriesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SeriesSortOption>('name-asc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Simulate data loading with 2-second delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

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

  // Filter and sort series
  const filteredAndSortedSeries = useMemo(() => {
    let result = [...TEMP_SERIES];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (series) =>
          series.name.toLowerCase().includes(query) ||
          series.description.toLowerCase().includes(query)
      );
    }

    // Sort by selected option
    switch (sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'progress-desc':
        result.sort((a, b) => b.progress - a.progress);
        break;
      case 'progress-asc':
        result.sort((a, b) => a.progress - b.progress);
        break;
      case 'updated-recent':
        // Simple sorting by lastUpdated string (in real app, would use dates)
        result.sort((a, b) => {
          const getOrder = (str: string) => {
            if (str.includes('day ago')) return 1;
            if (str.includes('days ago')) return parseInt(str) || 2;
            if (str.includes('week ago')) return 7;
            if (str.includes('weeks ago')) return parseInt(str) * 7 || 14;
            return 999;
          };
          return getOrder(a.lastUpdated) - getOrder(b.lastUpdated);
        });
        break;
    }

    return result;
  }, [searchQuery, sortBy]);

  const handleNewSeries = () => {
    console.log('Create new series');
    // TODO: Implement new series modal/page
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      console.log('Deleted series:', deleteTarget.id);
      // TODO: Implement actual delete via API
      setDeleteTarget(null);
    }
  };

  const sortOptions = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'progress-desc', label: 'Progress (High-Low)' },
    { value: 'progress-asc', label: 'Progress (Low-High)' },
    { value: 'updated-recent', label: 'Recently Updated' },
  ] as const;

  const currentSortLabel = sortOptions.find((opt) => opt.value === sortBy)?.label;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Heading size="2xl" as="h1">
              Series
            </Heading>
            <Muted>Organize your texts into collections</Muted>
          </div>

          {/* New Series Button */}
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Plus size={18} strokeWidth={2} />}
            onClick={handleNewSeries}
          >
            New Series
          </Button>
        </header>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="Search series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-paper border border-border rounded font-sans text-ui-base text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Sort Dropdown */}
          <div ref={sortRef} className="relative">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="h-10 min-w-[200px] justify-between rounded"
            >
              <span className="text-muted text-ui-sm">Sort:</span>
              <span className="flex-1 text-left">{currentSortLabel}</span>
              <ChevronDown size={16} className="text-muted" strokeWidth={2} />
            </Button>

            {isSortOpen && (
              <div className="absolute top-full right-0 mt-1 w-full bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setIsSortOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left font-sans text-ui-base transition-colors ${
                      sortBy === option.value
                        ? 'bg-primary text-white font-medium'
                        : 'text-ink hover:bg-desk'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Series Grid, Loading State, or Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SeriesCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredAndSortedSeries.length === 0 ? (
          searchQuery ? (
            <EmptyState
              illustration="none"
              title="No series found"
              description="Try adjusting your search query to find what you're looking for"
            />
          ) : (
            <EmptySeriesState onCreateClick={handleNewSeries} />
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedSeries.map((series) => (
              <SeriesCard
                key={series.id}
                {...series}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Series"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All texts in this series will also be deleted. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
