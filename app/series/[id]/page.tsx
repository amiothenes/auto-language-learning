'use client';

import { useState, useMemo, useEffect, useRef, use, useCallback } from 'react';
import { notFound } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { KeyboardSensor } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/Button';
import { SeriesHeader } from '@/components/series/SeriesHeader';
import { SeriesHeaderSkeleton } from '@/components/series/SeriesHeaderSkeleton';
import { TextCard } from '@/components/series/TextCard';
import { TextCardSkeleton } from '@/components/series/TextCardSkeleton';
import { ReadingMap } from '@/components/series/ReadingMap';
import { TextListRow } from '@/components/series/TextListRow';
import { ContinueReadingCard } from '@/components/series/ContinueReadingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { NewTextModal } from '@/components/texts/NewTextModal';
import { ImportTextsModal } from '@/components/texts/ImportTextsModal';
import { EditTextModal } from '@/components/texts/EditTextModal';
import { Toast, useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { Plus, Upload, ChevronDown, ArrowUpDown } from 'lucide-react';
import type { ImportedTextData } from '@/lib/types/forms';
import type { ImportTextResponse } from '@/lib/types/api';
import { useSeries } from '@/lib/hooks/useSeries';
import { useImportText } from '@/lib/hooks/useImportText';
import { useLanguage } from '@/lib/contexts/LanguageContext';

const isDemo = !process.env.NEXT_PUBLIC_ADMIN_API_KEY;

type SortOption = 'title-asc' | 'progress-desc' | 'progress-asc' | 'recent';

// ============================================================================
// SortableTextListRow — thin DnD wrapper around TextListRow
// ============================================================================

interface SortableTextListRowProps {
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
}

function SortableTextListRow(props: SortableTextListRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TextListRow
        {...props}
        dragListeners={listeners}
        dragAttributes={attributes}
      />
    </div>
  );
}

// ============================================================================
// Series Detail Page Component
// ============================================================================

interface SeriesDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  // Unwrap the params Promise using React.use()
  const { id } = use(params);
  const seriesQuery = useSeries(id);
  const seriesData = seriesQuery.data;
  const isLoading = seriesQuery.isLoading;

  if (seriesQuery.isError) notFound();

  const router = useRouter();
  const queryClient = useQueryClient();
  const importMutation = useImportText();
  const { selectedLanguage } = useLanguage();
  const { toast, showToast, hideToast } = useToast();
  const [seriesName, setSeriesName] = useState('');
  const seriesNameInitialized = useRef(false);
  const [sortBy, setSortBy] = useState<SortOption>('title-asc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [reorderMode, setReorderMode] = useState(false);
  // Holds the locally-reordered ID sequence while reorder mode is active.
  // null means "not overriding — use sort order from sortedTexts".
  const [reorderIds, setReorderIds] = useState<string[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const saved = localStorage.getItem(`series-sort-${id}`) as SortOption | null;
    const valid: SortOption[] = ['title-asc', 'progress-desc', 'progress-asc', 'recent'];
    if (saved && valid.includes(saved)) setSortBy(saved);
  }, [id]);

  useEffect(() => {
    const saved = localStorage.getItem(`series-view-${id}`) as 'list' | 'cards' | null;
    if (saved === 'list' || saved === 'cards') setViewMode(saved);
  }, [id]);
  const [deleteSeriesTarget, setDeleteSeriesTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteTextTarget, setDeleteTextTarget] = useState<{ id: string; title: string } | null>(null);
  const [isNewTextModalOpen, setIsNewTextModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editTextTarget, setEditTextTarget] = useState<{ id: string; title: string } | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (seriesData?.name) {
      document.title = `Verbista — ${seriesData.name}`;
      return () => { document.title = 'Verbista'; };
    }
  }, [seriesData?.name]);

  // Initialize series name once from DB — preserves in-progress edits on refetch
  useEffect(() => {
    if (seriesData && !seriesNameInitialized.current) {
      seriesNameInitialized.current = true;
      setSeriesName(seriesData.name);
    }
  }, [seriesData]);

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

  // Sort texts based on selected option
  const sortedTexts = useMemo(() => {
    if (!seriesData) return [];
    const texts = [...seriesData.texts];

    switch (sortBy) {
      case 'title-asc':
        texts.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'progress-desc':
        texts.sort((a, b) => b.knownPercentage - a.knownPercentage);
        break;
      case 'progress-asc':
        texts.sort((a, b) => a.knownPercentage - b.knownPercentage);
        break;
      case 'recent':
        // Simple sorting by lastRead string (in real app, would use dates)
        texts.sort((a, b) => {
          const getOrder = (str: string) => {
            if (str.includes('day ago')) return parseInt(str) || 1;
            if (str.includes('days ago')) return parseInt(str) || 2;
            if (str.includes('week ago')) return 7;
            if (str.includes('weeks ago')) return parseInt(str) * 7 || 14;
            if (str.includes('month ago')) return 30;
            if (str.includes('months ago')) return parseInt(str) * 30 || 60;
            return 999;
          };
          return getOrder(a.lastRead) - getOrder(b.lastRead);
        });
        break;
    }

    return texts;
  }, [seriesData, sortBy]);

  // In reorder mode, display order follows reorderIds; otherwise use sortedTexts
  const displayTexts = useMemo(() => {
    if (!reorderIds) return sortedTexts;
    const map = new Map(sortedTexts.map((t) => [t.id, t]));
    return reorderIds.map((id) => map.get(id)).filter(Boolean) as typeof sortedTexts;
  }, [reorderIds, sortedTexts]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const currentIds = reorderIds ?? sortedTexts.map((t) => t.id);
      const oldIndex = currentIds.indexOf(active.id as string);
      const newIndex = currentIds.indexOf(over.id as string);
      const newIds = arrayMove(currentIds, oldIndex, newIndex);
      setReorderIds(newIds);

      // Persist to server — fire-and-forget; optimistic update already applied
      try {
        await fetch(`/api/series/${id}/reorder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '',
          },
          body: JSON.stringify({ textIds: newIds }),
        });
        queryClient.invalidateQueries({ queryKey: ['series', id] });
      } catch {
        // Silent — positions are cosmetic until next full refetch
      }
    },
    [id, reorderIds, sortedTexts, queryClient]
  );

  const handleToggleReorder = useCallback(() => {
    setReorderMode((r) => {
      const next = !r;
      if (!next) setReorderIds(null); // clear override when leaving reorder mode
      return next;
    });
  }, []);

  const handleTitleUpdate = async (newTitle: string) => {
    if (isDemo) return;
    setSeriesName(newTitle);
    try {
      const res = await fetch(`/api/series/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '',
        },
        body: JSON.stringify({ name: newTitle }),
      });
      if (!res.ok) throw new Error('Failed to update series name');
    } catch {
      showToast('Failed to save series name');
    }
  };

  const handleAddText = () => {
    if (isDemo) return;
    setIsNewTextModalOpen(true);
  };

  const handleCreateText = (result: ImportTextResponse) => {
    const partCount = result.texts.length;
    const totalWords = result.texts.reduce((s, t) => s + t.wordCount, 0);
    const msg = partCount > 1
      ? `Imported as ${partCount} parts · ${totalWords.toLocaleString()} words total`
      : `"${result.texts[0]?.title}" imported · ${totalWords.toLocaleString()} words`;
    showToast(msg);
    queryClient.invalidateQueries({ queryKey: ['series', id] });
    queryClient.invalidateQueries({ queryKey: ['series-list'] });
  };

  const handleImport = () => {
    if (isDemo) return;
    setIsImportModalOpen(true);
  };

  const handleImportTexts = async (texts: ImportedTextData[]) => {
    if (isDemo) return;
    const results: ImportTextResponse[] = [];
    for (const text of texts) {
      const result = await importMutation.mutateAsync({
        title: text.title,
        content: text.content,
        tags: text.tags ?? [],
        languageCode: selectedLanguage,
        seriesId: id,
      });
      results.push(result);
    }
    await queryClient.refetchQueries({ queryKey: ['series', id], exact: true });
    queryClient.invalidateQueries({ queryKey: ['series-list'] });
    const totalParts = results.reduce((s, r) => s + r.texts.length, 0);
    const msg = totalParts > texts.length
      ? `${texts.length} file${texts.length > 1 ? 's' : ''} imported as ${totalParts} parts`
      : `${texts.length} text${texts.length > 1 ? 's' : ''} imported successfully`;
    showToast(msg);
    setIsImportModalOpen(false);
  };

  const handleConfirmDeleteSeries = async () => {
    if (isDemo || !deleteSeriesTarget) return;
    try {
      const res = await fetch(`/api/series/${deleteSeriesTarget.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '' },
      });
      if (!res.ok) throw new Error('Failed to delete series');
      setDeleteSeriesTarget(null);
      queryClient.invalidateQueries({ queryKey: ['series-list'] });
      queryClient.invalidateQueries({ queryKey: ['texts'] });
      router.push('/series');
    } catch {
      showToast('Failed to delete series');
    }
  };

  const handleConfirmDeleteText = async () => {
    if (isDemo || !deleteTextTarget) return;
    try {
      const res = await fetch(`/api/texts/${deleteTextTarget.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '' },
      });
      if (!res.ok) throw new Error('Failed to delete text');
      setDeleteTextTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['series', id] });
      await queryClient.invalidateQueries({ queryKey: ['series-list'] });
      await queryClient.invalidateQueries({ queryKey: ['texts'] });
    } catch {
      showToast('Failed to delete text');
    }
  };

  const sortOptions = [
    { value: 'title-asc', label: 'Title (A-Z)' },
    { value: 'progress-desc', label: 'Progress (High-Low)' },
    { value: 'progress-asc', label: 'Progress (Low-High)' },
    { value: 'recent', label: 'Recently Read' },
  ] as const;

  const currentSortLabel = sortOptions.find((opt) => opt.value === sortBy)?.label;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Series Header */}
        {isLoading ? (
          <SeriesHeaderSkeleton />
        ) : seriesData ? (
          <SeriesHeader
            id={seriesData.id}
            name={seriesName}
            description={seriesData.description}
            textCount={seriesData.textCount}
            totalWords={seriesData.totalWords}
            overallProgress={seriesData.overallProgress}
            lastUpdated={seriesData.lastUpdated}
            onTitleUpdate={handleTitleUpdate}
            onDelete={isDemo ? () => {} : setDeleteSeriesTarget}
          />
        ) : null}

        {/* Reading Map */}
        {!isLoading && seriesData && sortedTexts.length > 0 && (
          <ReadingMap
            texts={sortedTexts.map((t) => ({
              id: t.id,
              title: t.title,
              knownPercentage: t.knownPercentage,
              isCurrentlyReading: t.id === seriesData.lastReadTextId,
            }))}
            onTextClick={(textId) => router.push(`/reader/${textId}`)}
          />
        )}

        {/* Continue Reading Card */}
        {!isLoading && seriesData?.lastReadTextId && (() => {
          const lastText = seriesData.texts.find((t) => t.id === seriesData.lastReadTextId);
          if (!lastText) return null;
          return (
            <ContinueReadingCard
              textId={seriesData.lastReadTextId}
              textTitle={lastText.title}
              paragraphIndex={seriesData.lastReadParagraphIndex ?? 0}
              totalParagraphs={seriesData.lastReadTotalParagraphs ?? 1}
              knownPercentage={Math.round(lastText.knownPercentage)}
              lastReadAt={lastText.lastRead}
              onResume={() => router.push(`/reader/${seriesData.lastReadTextId}`)}
            />
          );
        })()}

        {/* Texts Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <TextCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div>
            {/* Texts section header */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <h2 className="font-sans font-semibold text-content-base flex-1">
                Texts ({displayTexts.length})
              </h2>

              {/* List / Cards toggle */}
              <div className="flex border border-border rounded overflow-hidden">
                {(['list', 'cards'] as const).map((mode) => (
                  <button
                    key={mode}
                    className={cn(
                      'px-3 py-1.5 font-sans text-ui-xs font-medium transition-colors cursor-pointer',
                      viewMode === mode ? 'bg-primary text-white' : 'text-muted hover:text-ink'
                    )}
                    onClick={() => {
                      setViewMode(mode);
                      localStorage.setItem(`series-view-${id}`, mode);
                    }}
                  >
                    {mode === 'list' ? 'List' : 'Cards'}
                  </button>
                ))}
              </div>

              {/* Sort dropdown (compact) */}
              <div ref={sortRef} className="relative">
                <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded font-sans text-ui-xs font-medium text-ink hover:bg-desk transition-colors cursor-pointer"
                >
                  Sort: {currentSortLabel}
                  <ChevronDown size={12} className="text-muted" strokeWidth={2} />
                </button>
                {isSortOpen && (
                  <div className="absolute top-full right-0 mt-1 w-44 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          localStorage.setItem(`series-sort-${id}`, option.value);
                          setIsSortOpen(false);
                        }}
                        className={cn(
                          'w-full px-4 py-2.5 text-left font-sans text-ui-sm transition-colors cursor-pointer',
                          sortBy === option.value ? 'bg-primary text-white font-medium' : 'text-ink hover:bg-desk'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reorder toggle */}
              <span title={isDemo ? 'Not available in demo mode' : undefined}>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ArrowUpDown size={14} strokeWidth={2} />}
                  onClick={handleToggleReorder}
                  disabled={isDemo}
                  className={reorderMode ? 'border-primary text-primary' : ''}
                >
                  {reorderMode ? 'Done' : 'Reorder'}
                </Button>
              </span>

              <span title={isDemo ? 'Not available in demo mode' : undefined}>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={14} strokeWidth={2} />}
                  onClick={handleAddText}
                  disabled={isDemo}
                >
                  Add
                </Button>
              </span>

              <span title={isDemo ? 'Not available in demo mode' : undefined}>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Upload size={14} strokeWidth={1.5} />}
                  onClick={handleImport}
                  disabled={isDemo}
                >
                  Import
                </Button>
              </span>
            </div>

            {/* Texts content */}
            {displayTexts.length === 0 ? (
              <EmptyState
                illustration="books"
                title="No texts in this series"
                description="Add your first text to start building your collection and tracking your progress"
                primaryAction={{
                  label: "Add Text",
                  onClick: handleAddText,
                  icon: <Plus size={18} strokeWidth={2} />,
                }}
                secondaryAction={{
                  label: "Import Texts",
                  onClick: handleImport,
                }}
              />
            ) : viewMode === 'list' ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displayTexts.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div>
                    {displayTexts.map((text, index) => (
                      <SortableTextListRow
                        key={text.id}
                        id={text.id}
                        position={index + 1}
                        title={text.title}
                        wordCount={text.wordCount}
                        knownPercentage={text.knownPercentage}
                        isCurrentlyReading={text.id === seriesData?.lastReadTextId}
                        reorderMode={reorderMode}
                        onRead={() => router.push(`/reader/${text.id}`)}
                        onEdit={isDemo ? () => {} : () => setEditTextTarget({ id: text.id, title: text.title })}
                        onDelete={isDemo ? () => {} : () => setDeleteTextTarget({ id: text.id, title: text.title })}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayTexts.map((text) => (
                  <TextCard
                    key={text.id}
                    id={text.id}
                    title={text.title}
                    wordCount={text.wordCount}
                    knownPercentage={text.knownPercentage}
                    lastRead={text.lastRead}
                    preview={text.preview}
                    onDelete={isDemo ? () => {} : setDeleteTextTarget}
                    onEdit={isDemo ? () => {} : setEditTextTarget}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete series confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteSeriesTarget !== null}
        onClose={() => setDeleteSeriesTarget(null)}
        onConfirm={handleConfirmDeleteSeries}
        title="Delete Series"
        message={`Are you sure you want to delete "${deleteSeriesTarget?.name}"? All texts in this series will also be deleted. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Delete text confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteTextTarget !== null}
        onClose={() => setDeleteTextTarget(null)}
        onConfirm={handleConfirmDeleteText}
        title="Delete Text"
        message={`Are you sure you want to delete "${deleteTextTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* New Text Modal */}
      <NewTextModal
        isOpen={isNewTextModalOpen}
        onClose={() => setIsNewTextModalOpen(false)}
        onAdd={handleCreateText}
        prefilledSeriesId={id}
        availableSeries={seriesData ? [{ id: seriesData.id, name: seriesData.name }] : []}
      />

      {/* Import Texts Modal */}
      <ImportTextsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportTexts}
        seriesId={id}
        seriesName={seriesName}
      />

      {/* Edit Text Modal */}
      <EditTextModal
        isOpen={editTextTarget !== null}
        onClose={() => setEditTextTarget(null)}
        textId={editTextTarget?.id ?? ''}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['series', id] });
          queryClient.invalidateQueries({ queryKey: ['series-list'] });
          queryClient.invalidateQueries({ queryKey: ['text', editTextTarget!.id] });
          queryClient.invalidateQueries({ queryKey: ['texts'] });
          setEditTextTarget(null);
        }}
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
