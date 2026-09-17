'use client';

import { useState, useMemo, useEffect, useRef, use, useCallback } from 'react';
import { notFound } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { KeyboardSensor } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/Button';
import { SeriesHeader } from '@/components/series/SeriesHeader';
import { SeriesHeaderSkeleton } from '@/components/series/SeriesHeaderSkeleton';
import { TextCard } from '@/components/series/TextCard';
import { TextCardSkeleton } from '@/components/series/TextCardSkeleton';
import { TextListRow } from '@/components/series/TextListRow';
import { ContinueReadingCard } from '@/components/series/ContinueReadingCard';
import { TextsFilterBar, type TierFilter } from '@/components/series/TextsFilterBar';
import { BulkActionsBar } from '@/components/series/BulkActionsBar';
import { BulkTagModal } from '@/components/series/BulkTagModal';
import { MoveToSeriesModal } from '@/components/series/MoveToSeriesModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { NewTextModal } from '@/components/texts/NewTextModal';
import { ImportTextsModal } from '@/components/texts/ImportTextsModal';
import { EditTextModal } from '@/components/texts/EditTextModal';
import { Toast, useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { Plus, Upload, Download, MoreVertical, List, LayoutGrid, CheckSquare, Check } from 'lucide-react';
import type { ImportedTextData } from '@/lib/types/forms';
import type { ImportTextRequest, ImportTextResponse, WordInstanceItem, SentenceListItem } from '@/lib/types/api';
import { useSeries } from '@/lib/hooks/useSeries';
import { useSeriesList } from '@/lib/hooks/useSeriesList';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { SeriesDetailSortOption } from '@/lib/types/ui';
import { compareByRecentlyRead } from '@/lib/utils/textSort';
import { buildOneTCards, buildOneTCsv, buildOneTCsvWithSource, type OneTCardWithSource } from '@/lib/utils/oneTSentences';

// Fetches one text's word instances + sentences and derives its qualifying 1T
// cards — shared by the per-row export and the whole-series export below,
// since the series page (unlike the Reader) never has this data preloaded.
async function fetchOneTCardsForText(textId: string) {
  const [instancesRes, sentencesRes] = await Promise.all([
    fetch(`/api/texts/${textId}/word-instances`),
    fetch(`/api/texts/${textId}/sentences`),
  ]);
  if (!instancesRes.ok || !sentencesRes.ok) throw new Error('Failed to fetch text data');
  const { instances } = await instancesRes.json() as { instances: WordInstanceItem[] };
  const { sentences } = await sentencesRes.json() as { sentences: SentenceListItem[] };
  return buildOneTCards(sentences, instances);
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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
  onRead: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExportOneT: () => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
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
// SortableTextCard — thin DnD wrapper around TextCard
// ============================================================================

interface SortableTextCardProps {
  id: string;
  title: string;
  wordCount: number;
  knownPercentage: number;
  lastRead: string;
  hasBeenRead: boolean;
  preview: string;
  onDelete?: (text: { id: string; title: string }) => void;
  onEdit?: (text: { id: string; title: string }) => void;
  onExportOneT?: (text: { id: string; title: string }) => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

function SortableTextCard(props: SortableTextCardProps) {
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
      <TextCard
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
  const { selectedLanguage, currentLanguage } = useLanguage();
  const { toast, showToast, hideToast } = useToast();
  const [seriesName, setSeriesName] = useState('');
  const seriesNameInitialized = useRef(false);
  const [sortBy, setSortBy] = useState<SeriesDetailSortOption>('recent');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  // Holds the locally-reordered ID sequence while a drag is in flight / being
  // persisted. null means "not overriding — use sort order from sortedTexts".
  const [reorderIds, setReorderIds] = useState<string[] | null>(null);
  // A sort the user picked while sortBy === 'custom' — held until they
  // confirm they want to leave their custom arrangement (see ConfirmDialog
  // near the sort dropdown below).
  const [pendingSort, setPendingSort] = useState<SeriesDetailSortOption | null>(null);

  // Browse & organize: search / tag / tier filtering over the texts list.
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');

  // Multi-select for bulk delete/tag/move.
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // Mobile toolbar overflow (Import / Export tucked behind ⋮ below md:)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const seriesListQuery = useSeriesList();
  const moveTargetSeries = useMemo(
    () =>
      (seriesListQuery.data ?? [])
        .filter((s) => s.id !== id)
        .map((s) => ({ id: s.id, name: s.name, textCount: s.textCount })),
    [seriesListQuery.data, id]
  );

  const sensors = useSensors(
    // Small movement threshold so a plain click (Read button, options menu,
    // navigating into the reader) doesn't get mistaken for a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    // Touch: press-and-hold before a drag starts, so a quick tap still reads
    // the text instead of picking it up.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const saved = localStorage.getItem(`series-sort-${id}`) as SeriesDetailSortOption | null;
    const valid: SeriesDetailSortOption[] = ['title-asc', 'progress-desc', 'progress-asc', 'recent', 'custom'];
    if (saved && valid.includes(saved)) setSortBy(saved);
  }, [id]);

  const commitSort = useCallback((value: SeriesDetailSortOption) => {
    setSortBy(value);
    localStorage.setItem(`series-sort-${id}`, value);
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

  useEffect(() => {
    if (seriesData?.name) {
      document.title = `${seriesData.name} | Verbista`;
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

  // Close mobile toolbar overflow menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  // Unique tags across this series' texts, for the filter bar's tag chips
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const t of seriesData?.texts ?? []) {
      for (const tag of t.tags) set.add(tag);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [seriesData]);

  const isFiltering = searchQuery.trim() !== '' || selectedTags.length > 0 || tierFilter !== 'all';

  // Search / tag / tier filtering, applied before sort
  const filteredTexts = useMemo(() => {
    if (!seriesData) return [];
    let result = seriesData.texts;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (selectedTags.length > 0) {
      result = result.filter((t) => selectedTags.every((tag) => t.tags.includes(tag)));
    }
    if (tierFilter !== 'all') {
      result = result.filter((t) => {
        if (tierFilter === 'ready') return t.knownPercentage >= 80;
        if (tierFilter === 'ok') return t.knownPercentage >= 65 && t.knownPercentage < 80;
        return t.knownPercentage < 65;
      });
    }

    return result;
  }, [seriesData, searchQuery, selectedTags, tierFilter]);

  // Sort the filtered texts based on selected option
  const sortedTexts = useMemo(() => {
    const texts = [...filteredTexts];

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
        texts.sort(compareByRecentlyRead);
        break;
      case 'custom':
        texts.sort((a, b) => a.order - b.order);
        break;
    }

    return texts;
  }, [filteredTexts, sortBy]);

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

      // Surface the reorder immediately as "Custom Order" so it isn't
      // clobbered by whatever sort was active when the drag happened.
      if (sortBy !== 'custom') commitSort('custom');

      try {
        await fetch(`/api/series/${id}/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ textIds: newIds }),
        });
        await queryClient.invalidateQueries({ queryKey: ['series', id] });
      } catch {
        // Silent — positions are cosmetic until next full refetch
      } finally {
        // Once the server data is refetched, the 'custom' sort case reads
        // the same order straight from it — drop the optimistic override so
        // a concurrently added/removed text isn't hidden by a stale list.
        setReorderIds(null);
      }
    },
    [id, reorderIds, sortedTexts, sortBy, commitSort, queryClient]
  );

  // Leaving Custom Order for a fixed sort needs confirmation (see ConfirmDialog
  // below); picking Custom Order itself never does — nothing is being lost.
  const handleSortChange = useCallback(
    (option: Exclude<SeriesDetailSortOption, 'custom'>) => {
      if (sortBy === 'custom') {
        setPendingSort(option);
      } else {
        commitSort(option);
      }
    },
    [sortBy, commitSort]
  );

  const toggleSelectMode = useCallback(() => {
    setIsSelectMode((v) => !v);
    setSelectedIds(new Set());
  }, []);

  const toggleSelectId = useCallback((textId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(textId)) next.delete(textId);
      else next.add(textId);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    const textIds = Array.from(selectedIds);
    try {
      const res = await fetch('/api/texts/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', textIds }),
      });
      if (!res.ok) throw new Error('Failed to delete texts');
      showToast(`${textIds.length} text${textIds.length === 1 ? '' : 's'} deleted`);
      setSelectedIds(new Set());
      setIsSelectMode(false);
      setIsBulkDeleteConfirmOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['series', id] });
      queryClient.invalidateQueries({ queryKey: ['series-list'] });
      queryClient.invalidateQueries({ queryKey: ['texts'] });
    } catch {
      showToast('Failed to delete texts');
    }
  }, [selectedIds, id, queryClient, showToast]);

  const handleBulkTag = useCallback(async (tagNames: string[]) => {
    const textIds = Array.from(selectedIds);
    try {
      const res = await fetch('/api/texts/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tag', textIds, tagNames }),
      });
      if (!res.ok) throw new Error('Failed to tag texts');
      showToast(`Tagged ${textIds.length} text${textIds.length === 1 ? '' : 's'}`);
      setSelectedIds(new Set());
      setIsSelectMode(false);
      setIsBulkTagModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['series', id] });
      queryClient.invalidateQueries({ queryKey: ['texts'] });
    } catch {
      showToast('Failed to tag texts');
    }
  }, [selectedIds, id, queryClient, showToast]);

  const handleBulkMove = useCallback(async (targetSeriesId: string) => {
    const textIds = Array.from(selectedIds);
    try {
      const res = await fetch('/api/texts/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move', textIds, targetSeriesId }),
      });
      if (!res.ok) throw new Error('Failed to move texts');
      showToast(`Moved ${textIds.length} text${textIds.length === 1 ? '' : 's'}`);
      setSelectedIds(new Set());
      setIsSelectMode(false);
      setIsMoveModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['series', id] });
      queryClient.invalidateQueries({ queryKey: ['series', targetSeriesId] });
      queryClient.invalidateQueries({ queryKey: ['series-list'] });
      queryClient.invalidateQueries({ queryKey: ['texts'] });
    } catch {
      showToast('Failed to move texts');
    }
  }, [selectedIds, id, queryClient, showToast]);

  const [isExportingSeriesOneT, setIsExportingSeriesOneT] = useState(false);

  const handleExportOneTForText = useCallback(async (text: { id: string; title: string }) => {
    try {
      const cards = await fetchOneTCardsForText(text.id);
      if (cards.length === 0) {
        showToast('No 1T sentences found', 'info');
        return;
      }
      const safeTitle = text.title.replace(/[^\w\s-]/g, '').trim();
      triggerDownload(buildOneTCsv(cards), `${safeTitle}-1t-sentences.csv`, 'text/csv;charset=utf-8');
    } catch {
      showToast('Failed to export 1T sentences', 'error');
    }
  }, [showToast]);

  const handleExportSeriesOneT = useCallback(async () => {
    if (!seriesData || isExportingSeriesOneT) return;
    setIsExportingSeriesOneT(true);
    try {
      const perText = await Promise.all(
        seriesData.texts.map(async (text): Promise<OneTCardWithSource[]> => {
          const cards = await fetchOneTCardsForText(text.id);
          return cards.map((card) => ({ ...card, sourceTitle: text.title }));
        })
      );
      const allCards = perText.flat();
      if (allCards.length === 0) {
        showToast('No 1T sentences found in this series', 'info');
        return;
      }
      const safeName = seriesName.replace(/[^\w\s-]/g, '').trim();
      triggerDownload(buildOneTCsvWithSource(allCards), `${safeName}-1t-sentences.csv`, 'text/csv;charset=utf-8');
    } catch {
      showToast('Failed to export series 1T sentences', 'error');
    } finally {
      setIsExportingSeriesOneT(false);
    }
  }, [seriesData, seriesName, isExportingSeriesOneT, showToast]);

  const handleTitleUpdate = async (newTitle: string) => {
    setSeriesName(newTitle);
    try {
      const res = await fetch(`/api/series/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTitle }),
      });
      if (!res.ok) throw new Error('Failed to update series name');
    } catch {
      showToast('Failed to save series name');
    }
  };

  const handleAddText = () => {
    setIsNewTextModalOpen(true);
  };

  const handleCreateText = (result: ImportTextResponse) => {
    const partCount = result.texts.length;
    const totalWords = result.texts.reduce((s, t) => s + t.wordCount, 0);
    const msg = partCount > 1
      ? `Imported as ${partCount} parts · ${totalWords.toLocaleString('en-US')} words total`
      : `"${result.texts[0]?.title}" imported · ${totalWords.toLocaleString('en-US')} words`;
    showToast(msg);
    queryClient.invalidateQueries({ queryKey: ['series', id] });
    queryClient.invalidateQueries({ queryKey: ['series-list'] });
  };

  const handleImport = () => {
    setIsImportModalOpen(true);
  };

  const handleImportTexts = async (texts: ImportedTextData[]) => {
    const results: ImportTextResponse[] = [];
    const failed: string[] = [];

    for (const text of texts) {
      try {
        const payload: ImportTextRequest = {
          title: text.title,
          content: text.content,
          tags: text.tags ?? [],
          languageCode: selectedLanguage,
          seriesId: id,
          sourceURI: text.sourceURI,
        };
        const response = await fetch('/api/texts/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const err = (await response.json()) as { error?: string };
          throw new Error(err.error ?? 'Import failed');
        }
        const result = (await response.json()) as ImportTextResponse;
        results.push(result);
      } catch (err) {
        failed.push(text.title || 'Untitled');
      }
    }

    if (results.length > 0) {
      await queryClient.refetchQueries({ queryKey: ['series', id], exact: true });
      queryClient.invalidateQueries({ queryKey: ['series-list'] });
      const totalParts = results.reduce((s, r) => s + r.texts.length, 0);
      const successMsg =
        totalParts > results.length
          ? `${results.length} file${results.length > 1 ? 's' : ''} imported as ${totalParts} parts`
          : `${results.length} text${results.length > 1 ? 's' : ''} imported successfully`;
      const msg = failed.length > 0 ? `${successMsg} · ${failed.length} failed` : successMsg;
      showToast(msg);
      setIsImportModalOpen(false);
    } else {
      throw new Error(`Failed to import ${failed.length} text${failed.length > 1 ? 's' : ''}`);
    }
  };

  const handleConfirmDeleteSeries = async () => {
    if (!deleteSeriesTarget) return;
    try {
      const res = await fetch(`/api/series/${deleteSeriesTarget.id}`, {
        method: 'DELETE',
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
    if (!deleteTextTarget) return;
    try {
      const res = await fetch(`/api/texts/${deleteTextTarget.id}`, {
        method: 'DELETE',
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

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className={cn('max-w-5xl mx-auto space-y-8', isSelectMode && 'pb-24')}>
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
            onDelete={setDeleteSeriesTarget}
          />
        ) : null}

        {/* SD2: Series completion banner */}
        {!isLoading && seriesData && (() => {
          const allComplete =
            seriesData.texts.length >= 2 &&
            seriesData.texts.every((t) => t.knownPercentage >= 80);
          return allComplete ? (
            <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-card px-5 py-4 mb-2">
              <div>
                <p className="font-sans text-ui-base font-semibold text-primary">
                  Series Complete
                </p>
                <p className="font-sans text-ui-sm text-muted mt-0.5">
                  All texts are at comfortable reading level.
                </p>
              </div>
              <img src="/illustrations/laurel.svg" width={52} height={52} alt="" />
            </div>
          ) : null;
        })()}

        {/* SD3: Continue Reading Card or nothing-to-resume hint */}
        {!isLoading && seriesData && (() => {
          if (seriesData.lastReadTextId) {
            const lastText = seriesData.texts.find((t) => t.id === seriesData.lastReadTextId);
            if (!lastText) return null;
            return (
              <ContinueReadingCard
                textId={seriesData.lastReadTextId}
                textTitle={lastText.title}
                knownPercentage={Math.round(lastText.knownPercentage)}
                lastReadAt={lastText.lastRead}
                onResume={() => router.push(`/reader/${seriesData.lastReadTextId}`)}
              />
            );
          }
          if (seriesData.texts.length > 0) {
            return (
              <div className="flex items-center gap-4 bg-paper border border-border rounded-card p-4 mb-4">
                <img src="/illustrations/bookmark.svg" width={40} height={40} alt="" />
                <p className="font-sans text-ui-sm text-muted">
                  Pick a text below to begin reading
                </p>
              </div>
            );
          }
          return null;
        })()}

        {/* Texts Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <TextCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div>
            {/* Texts toolbar — pinned so it stays reachable while scrolling a long list.
                Sized off the toolbar's OWN rendered width via a container query
                (`@container` + `@xl:`/`@3xl:` below), not the viewport (`sm:`/`lg:`). The
                page column is capped at max-w-5xl (1024px), so a viewport breakpoint fires
                whenever the *window* is wide enough even if the toolbar itself never gets
                that much room (e.g. a maximized desktop window vs. two windows snapped
                side-by-side both count as ">=lg" viewport-wise, but only one actually has
                that much toolbar width) — a container query reads the space this element
                actually has, which is the thing the layout truly depends on.
                Every secondary control (view toggle, Select, Import, Export) is icon-only
                with a tooltip at every size — there was an earlier version of this toolbar
                that revealed text labels on those buttons past a size threshold, but the
                math doesn't work: labels on all 5 controls PLUS the filter bar (search +
                tags + tier + sort) never fit in a 1024px-capped column at the same time, so
                that threshold was firing without actually producing a one-line layout.
                Icon-only is what actually stays on one line. Only Add (the primary,
                highest-frequency action) keeps a text label, at every size.
                Below @xl: even the icon-only cluster doesn't fit next to the title, so it
                collapses behind a single ⋮ overflow menu and only Add stays inline. From
                @xl: the full icon-only cluster is shown. From @3xl: there's also room for
                the filter bar to sit on the same line as the cluster, so the two become
                flex siblings instead of stacked rows (flex-wrap as a fallback, not
                horizontal scroll, if an unusually long tag list ever overflows it anyway).
                Selecting overrides all of this: Add/Import/Export disappear regardless of
                width, since BulkActionsBar (mounted below once something's selected) owns
                the actions that matter now, and leaving them visible would just be noise
                competing with it for attention. Only the view toggle (still useful while
                selecting) and a Cancel button remain. */}
            <div className="@container sticky top-0 z-20 bg-desk border-b border-border py-3 mb-4">
              <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:flex-wrap">
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <h2 className="font-sans font-semibold text-content-base shrink-0">
                  Texts ({displayTexts.length})
                </h2>

                {isSelectMode ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex border border-border rounded overflow-hidden shrink-0">
                      <button
                        onClick={() => { setViewMode('list'); localStorage.setItem(`series-view-${id}`, 'list'); }}
                        aria-label="List view"
                        className={cn(
                          'flex items-center px-2.5 py-1.5 font-sans text-ui-xs font-medium transition-colors cursor-pointer',
                          viewMode === 'list' ? 'bg-primary text-white' : 'text-muted hover:text-ink'
                        )}
                      >
                        <List size={14} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => { setViewMode('cards'); localStorage.setItem(`series-view-${id}`, 'cards'); }}
                        aria-label="Card view"
                        className={cn(
                          'flex items-center px-2.5 py-1.5 font-sans text-ui-xs font-medium transition-colors cursor-pointer',
                          viewMode === 'cards' ? 'bg-primary text-white' : 'text-muted hover:text-ink'
                        )}
                      >
                        <LayoutGrid size={14} strokeWidth={2} />
                      </button>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckSquare size={14} strokeWidth={2} />}
                      onClick={toggleSelectMode}
                      aria-label="Cancel selection"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* @xl and up: full cluster, left-aligned right after the title.
                        Icon-only + native title tooltip at every size — see the toolbar
                        comment above for why text labels here were a dead end. */}
                    <div className="hidden @xl:flex items-center gap-1.5 flex-wrap">
                      {/* List / Cards toggle */}
                      <div className="flex border border-border rounded overflow-hidden shrink-0">
                        <button
                          onClick={() => { setViewMode('list'); localStorage.setItem(`series-view-${id}`, 'list'); }}
                          aria-label="List view"
                          title="List view"
                          className={cn(
                            'flex items-center px-2.5 py-1.5 font-sans text-ui-xs font-medium transition-colors cursor-pointer',
                            viewMode === 'list' ? 'bg-primary text-white' : 'text-muted hover:text-ink'
                          )}
                        >
                          <List size={14} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => { setViewMode('cards'); localStorage.setItem(`series-view-${id}`, 'cards'); }}
                          aria-label="Card view"
                          title="Card view"
                          className={cn(
                            'flex items-center px-2.5 py-1.5 font-sans text-ui-xs font-medium transition-colors cursor-pointer',
                            viewMode === 'cards' ? 'bg-primary text-white' : 'text-muted hover:text-ink'
                          )}
                        >
                          <LayoutGrid size={14} strokeWidth={2} />
                        </button>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<CheckSquare size={14} strokeWidth={2} />}
                        onClick={toggleSelectMode}
                        aria-label="Select texts"
                        title="Select texts"
                      />

                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus size={14} strokeWidth={2} />}
                        onClick={handleAddText}
                      >
                        Add
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Upload size={14} strokeWidth={1.5} />}
                        onClick={handleImport}
                        aria-label="Import texts"
                        title="Import texts"
                      />

                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Download size={14} strokeWidth={1.5} />}
                        onClick={handleExportSeriesOneT}
                        disabled={isExportingSeriesOneT}
                        aria-label={isExportingSeriesOneT ? 'Exporting…' : 'Export 1T sentences'}
                        title={isExportingSeriesOneT ? 'Exporting…' : 'Export 1T sentences'}
                      />
                    </div>

                    {/* Below @xl: just Add stays inline, everything else behind ⋮ */}
                    <div className="flex @xl:hidden items-center gap-2 ml-auto">
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus size={14} strokeWidth={2} />}
                        onClick={handleAddText}
                      >
                        Add
                      </Button>

                      <div ref={mobileMenuRef} className="relative shrink-0">
                        <button
                          onClick={() => setIsMobileMenuOpen((v) => !v)}
                          className="p-2 border border-border rounded hover:bg-desk transition-colors cursor-pointer"
                          aria-label="More actions"
                        >
                          <MoreVertical size={16} className="text-muted" strokeWidth={2} />
                        </button>
                        {isMobileMenuOpen && (
                          <div className="absolute top-full right-0 mt-1 w-48 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10">
                            <button
                              onClick={() => { setViewMode('list'); localStorage.setItem(`series-view-${id}`, 'list'); setIsMobileMenuOpen(false); }}
                              className="w-full px-3 py-2.5 text-left font-sans text-ui-sm text-ink hover:bg-desk transition-colors flex items-center justify-between gap-2 cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <List size={14} className="text-muted" strokeWidth={1.5} />
                                List View
                              </span>
                              {viewMode === 'list' && <Check size={14} strokeWidth={2} />}
                            </button>
                            <button
                              onClick={() => { setViewMode('cards'); localStorage.setItem(`series-view-${id}`, 'cards'); setIsMobileMenuOpen(false); }}
                              className="w-full px-3 py-2.5 text-left font-sans text-ui-sm text-ink hover:bg-desk transition-colors flex items-center justify-between gap-2 cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <LayoutGrid size={14} className="text-muted" strokeWidth={1.5} />
                                Card View
                              </span>
                              {viewMode === 'cards' && <Check size={14} strokeWidth={2} />}
                            </button>
                            <div className="border-t border-border" />
                            <button
                              onClick={() => { toggleSelectMode(); setIsMobileMenuOpen(false); }}
                              className="w-full px-3 py-2.5 text-left font-sans text-ui-sm text-ink hover:bg-desk transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <CheckSquare size={14} className="text-muted" strokeWidth={1.5} />
                              Select
                            </button>
                            <div className="border-t border-border" />
                            <button
                              onClick={() => { setIsMobileMenuOpen(false); handleImport(); }}
                              className="w-full px-3 py-2.5 text-left font-sans text-ui-sm text-ink hover:bg-desk transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <Upload size={14} className="text-muted" strokeWidth={1.5} />
                              Import
                            </button>
                            <button
                              onClick={() => { setIsMobileMenuOpen(false); handleExportSeriesOneT(); }}
                              disabled={isExportingSeriesOneT}
                              className="w-full px-3 py-2.5 text-left font-sans text-ui-sm text-ink hover:bg-desk transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              <Download size={14} className="text-muted" strokeWidth={1.5} />
                              {isExportingSeriesOneT ? 'Exporting…' : 'Export 1T'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Row 2 below @3xl / inline sibling at @3xl+: the filter bar. @3xl:flex-1
                  lets it fill the rest of the one-line toolbar instead of hugging its own
                  content width, so its internal tag-chips-then-spacer layout has room to
                  push the tier/sort dropdowns to the right edge the same way it did before. */}
              <div className="@3xl:flex-1 @3xl:min-w-0">
                <TextsFilterBar
                  sortBy={sortBy}
                  onSortChange={handleSortChange}
                  selectedTags={selectedTags}
                  availableTags={availableTags}
                  onTagsChange={setSelectedTags}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  tierFilter={tierFilter}
                  onTierFilterChange={setTierFilter}
                  showCustomOrder
                  onSelectCustomOrder={() => commitSort('custom')}
                />
              </div>
              </div>
            </div>

            {/* Texts content */}
            {displayTexts.length === 0 ? (
              isFiltering ? (
                <EmptyState
                  illustration="search"
                  title="No texts match your filters"
                  description="Try a different search term, or clear the tag and level filters."
                />
              ) : (
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
              )
            ) : viewMode === 'list' ? (
              isFiltering || isSelectMode ? (
                <div>
                  {displayTexts.map((text, index) => (
                    <TextListRow
                      key={text.id}
                      id={text.id}
                      position={index + 1}
                      title={text.title}
                      wordCount={text.wordCount}
                      knownPercentage={text.knownPercentage}
                      isCurrentlyReading={text.id === seriesData?.lastReadTextId}
                      onRead={() => router.push(`/reader/${text.id}`)}
                      onEdit={() => setEditTextTarget({ id: text.id, title: text.title })}
                      onDelete={() => setDeleteTextTarget({ id: text.id, title: text.title })}
                      onExportOneT={() => handleExportOneTForText({ id: text.id, title: text.title })}
                      selectMode={isSelectMode}
                      selected={selectedIds.has(text.id)}
                      onToggleSelect={() => toggleSelectId(text.id)}
                    />
                  ))}
                </div>
              ) : (
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
                          onRead={() => router.push(`/reader/${text.id}`)}
                          onEdit={() => setEditTextTarget({ id: text.id, title: text.title })}
                          onDelete={() => setDeleteTextTarget({ id: text.id, title: text.title })}
                          onExportOneT={() => handleExportOneTForText({ id: text.id, title: text.title })}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )
            ) : (
              isFiltering || isSelectMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {displayTexts.map((text) => (
                    <TextCard
                      key={text.id}
                      id={text.id}
                      title={text.title}
                      wordCount={text.wordCount}
                      knownPercentage={text.knownPercentage}
                      lastRead={text.lastRead}
                      hasBeenRead={text.hasBeenRead}
                      preview={text.preview}
                      onDelete={setDeleteTextTarget}
                      onEdit={setEditTextTarget}
                      onExportOneT={handleExportOneTForText}
                      selectMode={isSelectMode}
                      selected={selectedIds.has(text.id)}
                      onToggleSelect={() => toggleSelectId(text.id)}
                    />
                  ))}
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={displayTexts.map((t) => t.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {displayTexts.map((text) => (
                        <SortableTextCard
                          key={text.id}
                          id={text.id}
                          title={text.title}
                          wordCount={text.wordCount}
                          knownPercentage={text.knownPercentage}
                          lastRead={text.lastRead}
                          hasBeenRead={text.hasBeenRead}
                          preview={text.preview}
                          onDelete={setDeleteTextTarget}
                          onEdit={setEditTextTarget}
                          onExportOneT={handleExportOneTForText}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )
            )}
          </div>
        )}
      </div>

      {/* Bulk actions bar — mounted only while selecting */}
      {isSelectMode && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onMove={() => setIsMoveModalOpen(true)}
          onTag={() => setIsBulkTagModalOpen(true)}
          onDelete={() => setIsBulkDeleteConfirmOpen(true)}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

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

      {/* Leaving Custom Order confirmation dialog */}
      <ConfirmDialog
        isOpen={pendingSort !== null}
        onClose={() => setPendingSort(null)}
        onConfirm={() => {
          if (pendingSort) commitSort(pendingSort);
          setPendingSort(null);
        }}
        title="Switch Sort Order?"
        message="This will change the display order away from your custom arrangement. Your custom order is saved and you can come back to it anytime by selecting Custom Order again."
        confirmLabel="Switch"
      />

      {/* Bulk delete confirmation dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Texts"
        message={`Are you sure you want to delete ${selectedIds.size} text${selectedIds.size === 1 ? '' : 's'}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Bulk tag modal */}
      <BulkTagModal
        isOpen={isBulkTagModalOpen}
        onClose={() => setIsBulkTagModalOpen(false)}
        count={selectedIds.size}
        onConfirm={handleBulkTag}
      />

      {/* Move to series modal */}
      <MoveToSeriesModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        count={selectedIds.size}
        availableSeries={moveTargetSeries}
        onConfirm={handleBulkMove}
      />

      {/* New Text Modal */}
      <NewTextModal
        isOpen={isNewTextModalOpen}
        onClose={() => setIsNewTextModalOpen(false)}
        onAdd={handleCreateText}
        prefilledSeriesId={id}
        availableSeries={seriesData ? [{ id: seriesData.id, name: seriesData.name, textCount: seriesData.textCount }] : []}
      />

      {/* Import Texts Modal */}
      <ImportTextsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportTexts}
        seriesId={id}
        seriesName={seriesName}
        textCount={seriesData?.textCount ?? 0}
        currentLanguageCode={selectedLanguage}
        currentLanguageName={currentLanguage?.name}
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
