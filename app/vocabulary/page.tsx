'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heading, Muted } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { VocabularyStatus } from '@/lib/types';
import type { VocabularyItem } from '@/lib/types';
import { VocabFilterBar, SortOption } from '@/components/vocabulary/VocabFilterBar';
import { VocabTable } from '@/components/vocabulary/VocabTable';
import { VocabCardList } from '@/components/vocabulary/VocabCard';
import { VocabCardSkeleton } from '@/components/vocabulary/VocabCardSkeleton';
import { VocabTableRowSkeleton } from '@/components/vocabulary/VocabTableRowSkeleton';
import { BulkActionsBar } from '@/components/vocabulary/BulkActionsBar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AddVocabularyModal } from '@/components/vocabulary/AddVocabularyModal';
import { ImportVocabularyModal } from '@/components/vocabulary/ImportVocabularyModal';
import { Toast, useToast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChevronLeft, ChevronRight, Library, Plus, Upload } from 'lucide-react';
import type { NewVocabularyData, ImportedVocabularyData, MergeStrategy } from '@/lib/types/forms';

// ============================================================================
// Hardcoded Vocabulary Data
// ============================================================================

// TODO: Replace with API call
const TEMP_VOCABULARY: VocabularyItem[] = [
  {
    id: '1',
    lemma: 'abandonar',
    status: VocabularyStatus.KNOWN,
    dictionaryFrequency: 45,
    userFrequency: 12,
    translation: 'to abandon, to leave',
    tags: ['Verb', 'Common'],
  },
  {
    id: '2',
    lemma: 'casa',
    status: VocabularyStatus.WELL_KNOWN,
    dictionaryFrequency: 98,
    userFrequency: 156,
    translation: 'house, home',
    tags: ['Noun', 'Essential'],
  },
  {
    id: '3',
    lemma: 'libro',
    status: VocabularyStatus.WELL_KNOWN,
    dictionaryFrequency: 92,
    userFrequency: 89,
    translation: 'book',
    tags: ['Noun', 'Common'],
  },
  {
    id: '4',
    lemma: 'escribir',
    status: VocabularyStatus.KNOWN,
    dictionaryFrequency: 78,
    userFrequency: 34,
    translation: 'to write',
    tags: ['Verb', 'Common'],
  },
  {
    id: '5',
    lemma: 'amigo',
    status: VocabularyStatus.WELL_KNOWN,
    dictionaryFrequency: 85,
    userFrequency: 67,
    translation: 'friend',
    tags: ['Noun', 'Social'],
  },
  {
    id: '6',
    lemma: 'comprender',
    status: VocabularyStatus.FAMILIAR,
    dictionaryFrequency: 62,
    userFrequency: 18,
    translation: 'to understand, to comprehend',
    tags: ['Verb'],
  },
  {
    id: '7',
    lemma: 'ventana',
    status: VocabularyStatus.KNOWN,
    dictionaryFrequency: 54,
    userFrequency: 23,
    translation: 'window',
    tags: ['Noun'],
  },
  {
    id: '8',
    lemma: 'rápido',
    status: VocabularyStatus.KNOWN,
    dictionaryFrequency: 71,
    userFrequency: 28,
    translation: 'fast, quick',
    tags: ['Adjective', 'Common'],
  },
  {
    id: '9',
    lemma: 'trabajar',
    status: VocabularyStatus.WELL_KNOWN,
    dictionaryFrequency: 88,
    userFrequency: 102,
    translation: 'to work',
    tags: ['Verb', 'Essential'],
  },
  {
    id: '10',
    lemma: 'silencioso',
    status: VocabularyStatus.NEWLY_SEEN,
    dictionaryFrequency: 34,
    userFrequency: 3,
    translation: 'silent, quiet',
    tags: ['Adjective'],
  },
  {
    id: '11',
    lemma: 'caminar',
    status: VocabularyStatus.FAMILIAR,
    dictionaryFrequency: 68,
    userFrequency: 15,
    translation: 'to walk',
    tags: ['Verb', 'Movement'],
  },
  {
    id: '12',
    lemma: 'montaña',
    status: VocabularyStatus.KNOWN,
    dictionaryFrequency: 56,
    userFrequency: 21,
    translation: 'mountain',
    tags: ['Noun', 'Nature'],
  },
  {
    id: '13',
    lemma: 'alegre',
    status: VocabularyStatus.FAMILIAR,
    dictionaryFrequency: 49,
    userFrequency: 9,
    translation: 'happy, cheerful',
    tags: ['Adjective', 'Emotion'],
  },
  {
    id: '14',
    lemma: 'estudiar',
    status: VocabularyStatus.WELL_KNOWN,
    dictionaryFrequency: 81,
    userFrequency: 95,
    translation: 'to study',
    tags: ['Verb', 'Essential'],
  },
  {
    id: '15',
    lemma: 'difícil',
    status: VocabularyStatus.KNOWN,
    dictionaryFrequency: 73,
    userFrequency: 37,
    translation: 'difficult, hard',
    tags: ['Adjective', 'Common'],
  },
  {
    id: '16',
    lemma: 'sonreír',
    status: VocabularyStatus.FAMILIAR,
    dictionaryFrequency: 51,
    userFrequency: 14,
    translation: 'to smile',
    tags: ['Verb', 'Emotion'],
  },
  {
    id: '17',
    lemma: 'antiguo',
    status: VocabularyStatus.NEWLY_SEEN,
    dictionaryFrequency: 58,
    userFrequency: 5,
    translation: 'ancient, old',
    tags: ['Adjective'],
  },
  {
    id: '18',
    lemma: 'pensar',
    status: VocabularyStatus.KNOWN,
    dictionaryFrequency: 79,
    userFrequency: 42,
    translation: 'to think',
    tags: ['Verb', 'Common'],
  },
  {
    id: '19',
    lemma: 'hermoso',
    status: VocabularyStatus.FAMILIAR,
    dictionaryFrequency: 64,
    userFrequency: 19,
    translation: 'beautiful',
    tags: ['Adjective', 'Common'],
  },
  {
    id: '20',
    lemma: 'ciudad',
    status: VocabularyStatus.WELL_KNOWN,
    dictionaryFrequency: 94,
    userFrequency: 118,
    translation: 'city',
    tags: ['Noun', 'Essential'],
  },
  {
    id: '21',
    lemma: 'pequeño',
    status: VocabularyStatus.KNOWN,
    dictionaryFrequency: 76,
    userFrequency: 31,
    translation: 'small, little',
    tags: ['Adjective', 'Common'],
  },
  {
    id: '22',
    lemma: 'hablar',
    status: VocabularyStatus.WELL_KNOWN,
    dictionaryFrequency: 91,
    userFrequency: 134,
    translation: 'to speak, to talk',
    tags: ['Verb', 'Essential'],
  },
  {
    id: '23',
    lemma: 'tranquilo',
    status: VocabularyStatus.FAMILIAR,
    dictionaryFrequency: 53,
    userFrequency: 11,
    translation: 'calm, peaceful',
    tags: ['Adjective'],
  },
  {
    id: '24',
    lemma: 'descubrir',
    status: VocabularyStatus.NEWLY_SEEN,
    dictionaryFrequency: 67,
    userFrequency: 4,
    translation: 'to discover',
    tags: ['Verb'],
  },
  {
    id: '25',
    lemma: 'importante',
    status: VocabularyStatus.KNOWN,
    dictionaryFrequency: 87,
    userFrequency: 45,
    translation: 'important',
    tags: ['Adjective', 'Common'],
  },
  {
    id: '26',
    lemma: 'verde',
    status: VocabularyStatus.KNOWN,
    dictionaryFrequency: 69,
    userFrequency: 26,
    translation: 'green',
    tags: ['Adjective', 'Color'],
  },
  {
    id: '27',
    lemma: 'olvidar',
    status: VocabularyStatus.FAMILIAR,
    dictionaryFrequency: 55,
    userFrequency: 13,
    translation: 'to forget',
    tags: ['Verb'],
  },
  {
    id: '28',
    lemma: 'extraño',
    status: VocabularyStatus.NEWLY_SEEN,
    dictionaryFrequency: 42,
    userFrequency: 2,
    translation: 'strange, odd',
    tags: ['Adjective'],
  },
  {
    id: '29',
    lemma: 'nombre',
    status: VocabularyStatus.WELL_KNOWN,
    dictionaryFrequency: 89,
    userFrequency: 87,
    translation: 'name',
    tags: ['Noun', 'Essential'],
  },
  {
    id: '30',
    lemma: 'desconocido',
    status: VocabularyStatus.IGNORE,
    dictionaryFrequency: 38,
    userFrequency: 1,
    translation: 'unknown, stranger',
    tags: ['Adjective'],
  },
];

// ============================================================================
// Vocabulary Page Component
// ============================================================================

export default function VocabularyPage() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatuses, setActiveStatuses] = useState<Set<VocabularyStatus>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiSelectActive, setIsMultiSelectActive] = useState(false);

  // Modal state
  const [isAddVocabModalOpen, setIsAddVocabModalOpen] = useState(false);
  const [isImportVocabModalOpen, setIsImportVocabModalOpen] = useState(false);

  // Simulate data loading with 2-second delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<VocabularyItem | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts: Record<VocabularyStatus, number> = {
      [VocabularyStatus.NEWLY_SEEN]: 0,
      [VocabularyStatus.FAMILIAR]: 0,
      [VocabularyStatus.KNOWN]: 0,
      [VocabularyStatus.WELL_KNOWN]: 0,
      [VocabularyStatus.IGNORE]: 0,
    };

    TEMP_VOCABULARY.forEach((item) => {
      counts[item.status]++;
    });

    return counts;
  }, []);

  // Filter and sort vocabulary
  const filteredAndSortedVocabulary = useMemo(() => {
    let result = [...TEMP_VOCABULARY];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.lemma.toLowerCase().includes(query) ||
          item.translation.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (activeStatuses.size > 0) {
      result = result.filter((item) => activeStatuses.has(item.status));
    }

    // Sort
    switch (sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.lemma.localeCompare(b.lemma));
        break;
      case 'dict-freq-desc':
        result.sort((a, b) => b.dictionaryFrequency - a.dictionaryFrequency);
        break;
      case 'user-freq-desc':
        result.sort((a, b) => b.userFrequency - a.userFrequency);
        break;
      case 'status':
        const statusOrder = {
          [VocabularyStatus.NEWLY_SEEN]: 0,
          [VocabularyStatus.FAMILIAR]: 1,
          [VocabularyStatus.KNOWN]: 2,
          [VocabularyStatus.WELL_KNOWN]: 3,
          [VocabularyStatus.IGNORE]: 4,
        };
        result.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
        break;
    }

    return result;
  }, [searchQuery, activeStatuses, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedVocabulary.length / itemsPerPage);
  const paginatedVocabulary = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedVocabulary.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedVocabulary, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchQuery, activeStatuses, sortBy]);

  // Selection handlers
  const handleToggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);

    // Exit multi-select mode when all items are deselected
    if (newSelected.size === 0) {
      setIsMultiSelectActive(false);
    }
  };

  const handleToggleAll = () => {
    if (selectedIds.size === paginatedVocabulary.length) {
      setSelectedIds(new Set());
      setIsMultiSelectActive(false);
    } else {
      setSelectedIds(new Set(paginatedVocabulary.map((item) => item.id)));
      setIsMultiSelectActive(true);
    }
  };

  // Enable multi-select mode (triggered by long-press on mobile)
  const handleEnableMultiSelect = () => {
    setIsMultiSelectActive(true);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Status filter handlers
  const handleStatusToggle = (status: VocabularyStatus) => {
    const newStatuses = new Set(activeStatuses);
    if (newStatuses.has(status)) {
      newStatuses.delete(status);
    } else {
      newStatuses.add(status);
    }
    setActiveStatuses(newStatuses);
  };

  // Bulk action handlers
  const handleMarkAsKnown = () => {
    console.log('Mark as known:', Array.from(selectedIds));
    // TODO: Implement actual action
    setSelectedIds(new Set());
  };

  const handleAddTag = () => {
    console.log('Add tag to:', Array.from(selectedIds));
    // TODO: Implement actual action
    setSelectedIds(new Set());
  };

  const handleDelete = () => {
    setShowBulkDeleteConfirm(true);
  };

  const handleConfirmBulkDelete = () => {
    console.log('Deleted:', Array.from(selectedIds));
    setSelectedIds(new Set());
    setShowBulkDeleteConfirm(false);
  };

  const handleConfirmSingleDelete = () => {
    if (deleteTarget) {
      console.log('Deleted:', deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleAddVocabulary = (vocabData: NewVocabularyData) => {
    // TODO: Replace with API call
    console.log('Adding vocabulary:', vocabData);

    // Show success feedback
    showToast(`"${vocabData.lemma}" added to vocabulary!`);

    // Close modal
    setIsAddVocabModalOpen(false);
  };

  const handleImportVocabulary = (items: ImportedVocabularyData[], strategy: MergeStrategy) => {
    // TODO: Replace with API call
    console.log('Importing vocabulary:', items, 'Strategy:', strategy);

    // Show success feedback
    showToast(`${items.length} vocabulary item${items.length > 1 ? 's' : ''} imported successfully!`);

    // Close modal
    setIsImportVocabModalOpen(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <Heading size="2xl" as="h1">
              Vocabulary
            </Heading>
            <div className="flex items-center gap-4 flex-wrap">
              <Muted>Manage your learned words and track your progress</Muted>
              <div className="flex items-center gap-3">
                <span className="font-sans text-ui-sm text-muted">
                  Total: {TEMP_VOCABULARY.length} words
                </span>
                <span className="text-muted">•</span>
                <span className="font-sans text-ui-sm text-muted">
                  Showing: {filteredAndSortedVocabulary.length} words
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              leftIcon={<Upload size={18} strokeWidth={1.5} />}
              onClick={() => setIsImportVocabModalOpen(true)}
            >
              Import
            </Button>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus size={18} strokeWidth={2} />}
              onClick={() => setIsAddVocabModalOpen(true)}
            >
              Add Vocabulary
            </Button>
          </div>
        </header>

        {/* Filter Bar */}
        <VocabFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeStatuses={activeStatuses}
          onStatusToggle={handleStatusToggle}
          sortBy={sortBy}
          onSortChange={setSortBy}
          statusCounts={statusCounts}
        />

        {/* Loading State */}
        {isLoading ? (
          <>
            {/* Tablet & Desktop: Table Skeleton */}
            <div className="hidden md:block">
              <div className="bg-paper border border-border rounded-card shadow-raised overflow-hidden">
                <table className="w-full">
                  <thead className="bg-desk border-b border-border">
                    <tr>
                      <th className="w-10 md:w-12 px-2 md:px-4 py-2 md:py-3"></th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left">
                        <span className="font-sans font-semibold text-ui-sm md:text-ui-base text-ink">Lemma</span>
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left">
                        <span className="font-sans font-semibold text-ui-sm md:text-ui-base text-ink">Status</span>
                      </th>
                      <th className="px-2 md:px-3 py-2 md:py-3 text-left">
                        <span className="font-sans font-semibold text-ui-sm md:text-ui-base text-ink">Dict. Freq</span>
                      </th>
                      <th className="px-2 md:px-3 py-2 md:py-3 text-left">
                        <span className="font-sans font-semibold text-ui-sm md:text-ui-base text-ink">User Freq</span>
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left hidden lg:table-cell">
                        <span className="font-sans font-semibold text-ui-sm md:text-ui-base text-ink">Translation</span>
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left hidden lg:table-cell">
                        <span className="font-sans font-semibold text-ui-sm md:text-ui-base text-ink">Tags</span>
                      </th>
                      <th className="w-8 md:w-12 px-2 md:px-4 py-2 md:py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <VocabTableRowSkeleton key={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile: Card Skeleton */}
            <div className="md:hidden">
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <VocabCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </>
        ) : filteredAndSortedVocabulary.length === 0 ? (
          /* Empty State */
          searchQuery || activeStatuses.size > 0 ? (
            <EmptyState
              illustration="none"
              title="No words found"
              description="Try adjusting your search query or filter criteria to find what you're looking for"
            />
          ) : (
            <EmptyState
              illustration="vocabulary"
              title="No vocabulary yet"
              description="Start reading texts to build your vocabulary and track your learning progress"
              primaryAction={{
                label: "Browse Series",
                onClick: () => router.push('/series'),
                icon: <Library size={18} strokeWidth={2} />,
              }}
            />
          )
        ) : (
          /* Content Views */
          <>
            {/* Tablet & Desktop: Table View */}
            <div className="hidden md:block">
              <VocabTable
                items={paginatedVocabulary}
                selectedIds={selectedIds}
                onToggleSelection={handleToggleSelection}
                onToggleAll={handleToggleAll}
                onDelete={(item) => setDeleteTarget(item)}
              />
            </div>

            {/* Mobile: Card View */}
            <div className="md:hidden">
              <VocabCardList
                items={paginatedVocabulary}
                selectedIds={selectedIds}
                onToggleSelection={handleToggleSelection}
                onDelete={(item) => setDeleteTarget(item)}
                isMultiSelectActive={isMultiSelectActive}
                onEnableMultiSelect={handleEnableMultiSelect}
              />
            </div>
          </>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              leftIcon={<ChevronLeft size={16} strokeWidth={2} />}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2 px-4">
              <span className="font-sans text-ui-base text-ink font-medium">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              rightIcon={<ChevronRight size={16} strokeWidth={2} />}
            >
              Next
            </Button>
          </div>
        )}

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onMarkAsKnown={handleMarkAsKnown}
          onAddTag={handleAddTag}
          onDelete={handleDelete}
          onClearSelection={handleClearSelection}
        />
      </div>

      {/* Single item delete confirmation */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmSingleDelete}
        title="Delete Word"
        message={`Are you sure you want to delete "${deleteTarget?.lemma}" from your vocabulary? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Bulk delete confirmation */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Delete Selected Words"
        message={`Are you sure you want to delete ${selectedIds.size} selected word${selectedIds.size === 1 ? '' : 's'} from your vocabulary? This action cannot be undone.`}
        confirmLabel="Delete All"
        variant="danger"
      />

      {/* Add Vocabulary Modal */}
      <AddVocabularyModal
        isOpen={isAddVocabModalOpen}
        onClose={() => setIsAddVocabModalOpen(false)}
        onAdd={handleAddVocabulary}
      />

      {/* Import Vocabulary Modal */}
      <ImportVocabularyModal
        isOpen={isImportVocabModalOpen}
        onClose={() => setIsImportVocabModalOpen(false)}
        onImport={handleImportVocabulary}
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
