'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Heading, Muted } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { SeriesCard } from '@/components/series/SeriesCard';
import { SeriesCardSkeleton } from '@/components/series/SeriesCardSkeleton';
import { ResumeBar } from '@/components/series/ResumeBar';
import { EmptySeriesState } from '@/components/series/EmptySeriesState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { NewSeriesModal } from '@/components/series/NewSeriesModal';
import { EditSeriesModal } from '@/components/series/EditSeriesModal';
import { NewTextModal } from '@/components/texts/NewTextModal';
import type { ImportTextResponse } from '@/lib/types/api';
import { Toast, useToast } from '@/components/ui/Toast';
import { SkeletonText } from '@/components/ui/Skeleton';
import { TextCard } from '@/components/series/TextCard';
import { TextsFilterBar } from '@/components/series/TextsFilterBar';
import type { TextSortOption } from '@/lib/types/ui';
import { compareByRecentlyRead } from '@/lib/utils/textSort';
import { Search, Plus, ChevronDown, ArrowLeft } from 'lucide-react';
import type { SeriesSortOption } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';
import type { NewSeriesData } from '@/lib/types/forms';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useSeriesList } from '@/lib/hooks/useSeriesList';
import { useTexts } from '@/lib/hooks/useTexts';

// ============================================================================
// Fetch helper — distinguishes network/server failures from API error responses
// ============================================================================

async function fetchJson<T>(
  url: string,
  options: RequestInit,
  fallbackMessage: string
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error(`${fallbackMessage}: could not reach the server. Check your connection and try again.`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error(`${fallbackMessage}: the server returned an unexpected response. Please try again.`);
  }

  if (!response.ok) {
    const message = (body as { error?: string } | null)?.error;
    throw new Error(message || fallbackMessage);
  }

  return body as T;
}

// ============================================================================
// Series Page Component
// ============================================================================

function SeriesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewMode = searchParams.get('view');
  const { selectedLanguage } = useLanguage();
  const { toast, showToast, hideToast } = useToast();
  const queryClient = useQueryClient();
  const seriesQuery = useSeriesList();
  const textsQuery = useTexts();
  const isLoading = seriesQuery.isPending;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SeriesSortOption>('read-recent');
  const [readinessFilter, setReadinessFilter] = useState<'all' | 'ready' | 'ok' | 'hard'>('all');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; description: string } | null>(null);
  const [addTextTarget, setAddTextTarget] = useState<{ id: string; name: string } | null>(null);
  const [isNewSeriesModalOpen, setIsNewSeriesModalOpen] = useState(false);
  const [textsSortBy, setTextsSortBy] = useState<TextSortOption>('date-added');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Series | Verbista';
    return () => { document.title = 'Verbista'; };
  }, []);

  // Auto-open NewSeriesModal when arriving from dashboard "Add New Text"
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsNewSeriesModalOpen(true);
    }
  }, [searchParams]);

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

    // Filter by readiness
    if (readinessFilter === 'ready') result = result.filter((s) => s.maxKnownPct >= 80);
    if (readinessFilter === 'ok')    result = result.filter((s) => s.maxKnownPct >= 65 && s.maxKnownPct < 80);
    if (readinessFilter === 'hard')  result = result.filter((s) => s.maxKnownPct < 65);

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
      case 'read-recent':
        result.sort(
          (a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
        );
        break;
    }

    return result;
  }, [searchQuery, sortBy, readinessFilter, seriesQuery.data]);

  const readinessCounts = useMemo(() => {
    const all = seriesQuery.data ?? [];
    return {
      all: all.length,
      ready: all.filter((s) => s.maxKnownPct >= 80).length,
      ok: all.filter((s) => s.maxKnownPct >= 65 && s.maxKnownPct < 80).length,
      hard: all.filter((s) => s.maxKnownPct < 65).length,
    };
  }, [seriesQuery.data]);

  const availableSeries = useMemo(
    () => (seriesQuery.data ?? []).map((s) => ({ id: s.id, name: s.name, textCount: s.textCount })),
    [seriesQuery.data]
  );

  // Unique tags across all texts, sorted alphabetically
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const text of textsQuery.data ?? []) {
      for (const tag of text.tags) tagSet.add(tag);
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [textsQuery.data]);

  // Filtered + sorted texts for the texts view
  const filteredSortedTexts = useMemo(() => {
    let result = [...(textsQuery.data ?? [])];

    if (selectedTags.length > 0) {
      result = result.filter((t) => selectedTags.every((tag) => t.tags.includes(tag)));
    }

    switch (textsSortBy) {
      case 'date-added':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'recent':
        result.sort(compareByRecentlyRead);
        break;
      case 'title-asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'progress-desc':
        result.sort((a, b) => b.knownPercentage - a.knownPercentage);
        break;
      case 'progress-asc':
        result.sort((a, b) => a.knownPercentage - b.knownPercentage);
        break;
    }

    return result;
  }, [textsQuery.data, selectedTags, textsSortBy]);

  const handleNewSeries = () => {
    setIsNewSeriesModalOpen(true);
  };

  const handleCreateSeries = async (seriesData: NewSeriesData) => {
    // Step 1: Create the series
    const { series: created } = await fetchJson<{ series: { id: string; name: string } }>(
      '/api/series',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: seriesData.name,
          description: seriesData.description ?? '',
          languageCode: selectedLanguage,
        }),
      },
      'Failed to create series'
    );

    // Step 2: Import texts if provided (NLP runs here — modal stays open with loading overlay)
    if (seriesData.texts && seriesData.texts.length > 0) {
      for (const text of seriesData.texts) {
        await fetchJson(
          '/api/texts/import',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: text.title,
              content: text.content,
              languageCode: selectedLanguage,
              seriesId: created.id,
            }),
          },
          'Series created but text import failed'
        );
      }

      showToast(`Series "${seriesData.name}" created with text`);
    } else {
      showToast(`Series "${seriesData.name}" created`);
    }

    queryClient.invalidateQueries({ queryKey: ['series-list'] });
    router.push(`/series/${created.id}`);
  };

  const handleSavedSeries = async () => {
    setEditTarget(null);
    showToast('Series updated');
    await seriesQuery.refetch();
  };

  const handleAddTextDone = (result: ImportTextResponse) => {
    setAddTextTarget(null);
    if (result.ignoredPropnCount > 0) {
      showToast(
        `Auto-ignored ${result.ignoredPropnCount} proper noun${result.ignoredPropnCount !== 1 ? 's' : ''}`,
        'info',
      );
    } else {
      showToast('Text added');
    }
    seriesQuery.refetch();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/series/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete series');
      showToast(`Series "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      await seriesQuery.refetch();
      await queryClient.invalidateQueries({ queryKey: ['texts'] });
    } catch {
      showToast('Failed to delete series');
    }
  };

  const sortOptions = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'progress-desc', label: 'Progress (High-Low)' },
    { value: 'progress-asc', label: 'Progress (Low-High)' },
    { value: 'read-recent', label: 'Recently Read' },
  ] as const;

  const currentSortLabel = sortOptions.find((opt) => opt.value === sortBy)?.label;

  if (viewMode === 'texts') {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <header className="space-y-2">
            <button
              onClick={() => router.push('/series')}
              className="flex items-center gap-1 text-muted text-ui-sm font-medium hover:text-primary transition-colors cursor-pointer mb-2"
            >
              <ArrowLeft size={16} strokeWidth={2} />
              Back to Series
            </button>
            <Heading size="2xl" as="h1">All Texts</Heading>
            <Muted>All texts in your library</Muted>
          </header>

          {textsQuery.isPending ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-paper border border-border rounded-card p-5 space-y-3">
                  <SkeletonText width="w-3/4" className="h-5" />
                  <SkeletonText width="w-1/3" className="h-3" />
                  <SkeletonText width="w-full" className="h-3 mt-2" />
                  <SkeletonText width="w-4/5" className="h-3" />
                  <div className="flex items-center gap-3 pt-1">
                    <SkeletonText width="w-20" className="h-3" />
                    <SkeletonText width="w-16" className="h-3" />
                  </div>
                  <SkeletonText width="w-full" className="h-1.5 rounded-full" />
                </div>
              ))}
            </div>
          ) : !textsQuery.data?.length ? (
            <EmptyState
              illustration="pages"
              title="No texts yet"
              description="Import texts into a series to start reading"
              primaryAction={{
                label: "Browse Series",
                onClick: () => router.push('/series'),
              }}
            />
          ) : (
            <div className="space-y-4">
              <TextsFilterBar
                sortBy={textsSortBy}
                onSortChange={setTextsSortBy}
                selectedTags={selectedTags}
                availableTags={availableTags}
                onTagsChange={setSelectedTags}
              />

              {filteredSortedTexts.length === 0 ? (
                <EmptyState
                  illustration="search"
                  title="No matching texts"
                  description="Try removing some filters"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSortedTexts.map((text) => (
                    <TextCard
                      key={text.id}
                      id={text.id}
                      title={text.title}
                      wordCount={text.wordCount}
                      knownPercentage={text.knownPercentage}
                      lastRead={text.lastRead}
                      preview={text.preview}
                      seriesName={text.seriesName ?? undefined}
                      dateAdded={formatRelativeTime(text.createdAt)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <Toast message={toast.message} isOpen={toast.isOpen} onClose={hideToast} />
      </div>
    );
  }

  const readinessPills = [
    { key: 'all'   as const, label: `All (${readinessCounts.all})` },
    { key: 'ready' as const, label: `Ready ≥80% (${readinessCounts.ready})` },
    { key: 'ok'    as const, label: `OK 65–79% (${readinessCounts.ok})` },
    { key: 'hard'  as const, label: `Hard <65% (${readinessCounts.hard})` },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Resume Band */}
        <ResumeBar />

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

        {/* Readiness Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {readinessPills.map((pill) => (
            <button
              key={pill.key}
              onClick={() => setReadinessFilter(pill.key)}
              className={
                readinessFilter === pill.key
                  ? 'border border-primary bg-primary/5 text-primary font-semibold rounded-full px-3 py-1.5 font-sans text-ui-xs cursor-pointer transition-colors'
                  : 'border border-border text-muted rounded-full px-3 py-1.5 font-sans text-ui-xs font-medium cursor-pointer hover:border-primary/50 transition-colors'
              }
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Series Grid, Loading State, or Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SeriesCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredAndSortedSeries.length === 0 ? (
          readinessFilter !== 'all' ? (
            <EmptyState
              illustration="telescope"
              illustrationSize={96}
              title="No series at this level yet"
              description="Keep reading to build coverage and unlock more series here"
            />
          ) : searchQuery ? (
            <EmptyState
              illustration="search"
              title="No series found"
              description="Try adjusting your search to find what you're looking for"
            />
          ) : (
            <EmptySeriesState onCreateClick={handleNewSeries} />
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAndSortedSeries.map((series) => (
              <SeriesCard
                key={series.id}
                {...series}
                onDelete={setDeleteTarget}
                onEdit={setEditTarget}
                onAddText={setAddTextTarget}
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

      {/* Edit Series Modal */}
      {editTarget && (
        <EditSeriesModal
          isOpen={true}
          onClose={() => setEditTarget(null)}
          seriesId={editTarget.id}
          initialName={editTarget.name}
          initialDescription={editTarget.description}
          onSaved={handleSavedSeries}
        />
      )}

      {/* Add Text Modal */}
      {addTextTarget && (
        <NewTextModal
          isOpen={true}
          onClose={() => setAddTextTarget(null)}
          prefilledSeriesId={addTextTarget.id}
          availableSeries={availableSeries}
          onAdd={handleAddTextDone}
        />
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        isOpen={toast.isOpen}
        onClose={hideToast}
      />
    </div>
  );
}

export default function SeriesPage() {
  return (
    <Suspense>
      <SeriesPageContent />
    </Suspense>
  );
}
