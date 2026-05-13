'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Heading, Muted } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { SeriesCard } from '@/components/series/SeriesCard';
import { SeriesCardSkeleton } from '@/components/series/SeriesCardSkeleton';
import { EmptySeriesState } from '@/components/series/EmptySeriesState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { NewSeriesModal } from '@/components/series/NewSeriesModal';
import { Toast, useToast } from '@/components/ui/Toast';
import { Search, Plus, ChevronDown } from 'lucide-react';
import type { SeriesSortOption } from '@/lib/types';
import type { NewSeriesData } from '@/lib/types/forms';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useSeriesList } from '@/lib/hooks/useSeriesList';

// ============================================================================
// Series Page Component
// ============================================================================

export default function SeriesPage() {
  const router = useRouter();
  const { selectedLanguage } = useLanguage();
  const { toast, showToast, hideToast } = useToast();
  const seriesQuery = useSeriesList();
  const isLoading = seriesQuery.isLoading;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SeriesSortOption>('name-asc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isNewSeriesModalOpen, setIsNewSeriesModalOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

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
    let result = [...(seriesQuery.data ?? [])];

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
  }, [searchQuery, sortBy, seriesQuery.data]);

  const handleNewSeries = () => {
    setIsNewSeriesModalOpen(true);
  };

  const handleCreateSeries = async (seriesData: NewSeriesData) => {
    try {
      const response = await fetch('/api/series', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '',
        },
        body: JSON.stringify({
          name: seriesData.name,
          description: seriesData.description,
          languageCode: selectedLanguage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast(error.error || 'Failed to create series');
        return;
      }

      const { series: created } = await response.json();

      showToast(`Series "${seriesData.name}" created successfully!`);
      setIsNewSeriesModalOpen(false);
      router.push(`/series/${created.id}`);
    } catch {
      showToast('Failed to create series');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/series/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '' },
      });
      if (!res.ok) throw new Error('Failed to delete series');
      showToast(`Series "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      await seriesQuery.refetch();
    } catch {
      showToast('Failed to delete series');
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

      {/* New Series Modal */}
      <NewSeriesModal
        isOpen={isNewSeriesModalOpen}
        onClose={() => setIsNewSeriesModalOpen(false)}
        onAdd={handleCreateSeries}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        isOpen={toast.isOpen}
        onClose={hideToast}
      />
    </div>
  );
}
