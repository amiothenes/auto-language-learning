'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heading, Muted } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { VocabularyStatus } from '@/lib/types';
import type { VocabularyItem } from '@/lib/types';
import { VocabFilterBar, SortOption } from '@/components/vocabulary/VocabFilterBar';
import { VocabDistribution } from '@/components/vocabulary/VocabDistribution';
import { VocabTable } from '@/components/vocabulary/VocabTable';
import { VocabCardList } from '@/components/vocabulary/VocabCard';
import { VocabCardSkeleton } from '@/components/vocabulary/VocabCardSkeleton';
import { VocabTableRowSkeleton } from '@/components/vocabulary/VocabTableRowSkeleton';
import { BulkActionsBar } from '@/components/vocabulary/BulkActionsBar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AddVocabularyModal } from '@/components/vocabulary/AddVocabularyModal';
import { ImportVocabularyModal } from '@/components/vocabulary/ImportVocabularyModal';
import { EditVocabularyModal } from '@/components/vocabulary/EditVocabularyModal';
import { Toast, useToast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChevronLeft, ChevronRight, Library, Plus, Upload } from 'lucide-react';
import type { NewVocabularyData, ImportedVocabularyData, MergeStrategy } from '@/lib/types/forms';
import { useVocabulary } from '@/lib/hooks/useVocabulary';
import { useStats } from '@/lib/hooks/useStats';

const isDemo = !process.env.NEXT_PUBLIC_ADMIN_API_KEY;

// ============================================================================
// Vocabulary Page Component
// ============================================================================

export default function VocabularyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();

  // Filter state (passed to API as query params)
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatuses, setActiveStatuses] = useState<Set<VocabularyStatus>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiSelectActive, setIsMultiSelectActive] = useState(false);

  // Modal state
  const [isAddVocabModalOpen, setIsAddVocabModalOpen] = useState(false);
  const [isImportVocabModalOpen, setIsImportVocabModalOpen] = useState(false);

  // Edit state
  const [editTarget, setEditTarget] = useState<VocabularyItem | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<VocabularyItem | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Only pass a status filter when exactly one status is active
  const activeStatus = activeStatuses.size === 1 ? [...activeStatuses][0] : undefined;

  // Real data
  const vocabularyQuery = useVocabulary({
    search: searchQuery || undefined,
    status: activeStatus,
    sort: sortBy,
    page: currentPage,
    limit: itemsPerPage,
  });
  const { data: stats } = useStats();

  const isLoading = vocabularyQuery.isLoading;
  const words = vocabularyQuery.data?.words ?? [];
  const total = vocabularyQuery.data?.total ?? 0;
  const totalPages = vocabularyQuery.data?.totalPages ?? 1;

  // Status counts from the stats API (total per-status, language-wide)
  const statusCounts: Record<VocabularyStatus, number> = {
    [VocabularyStatus.UNKNOWN]:    stats?.vocabulary.unknown    ?? 0,
    [VocabularyStatus.NEWLY_SEEN]: stats?.vocabulary.newlySeen ?? 0,
    [VocabularyStatus.FAMILIAR]:   stats?.vocabulary.familiar   ?? 0,
    [VocabularyStatus.KNOWN]:      stats?.vocabulary.known      ?? 0,
    [VocabularyStatus.WELL_KNOWN]: stats?.vocabulary.wellKnown  ?? 0,
    [VocabularyStatus.IGNORE]:     stats?.vocabulary.ignored    ?? 0,
  };

  useEffect(() => {
    document.title = 'Verbista — Vocabulary';
    return () => { document.title = 'Verbista'; };
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeStatuses, sortBy]);

  // Bulk update mutation (mark as known, etc.)
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ wordIds, status }: { wordIds: string[]; status: VocabularyStatus }) => {
      if (isDemo) return {} as { updated: number };
      const res = await fetch('/api/vocabulary/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '',
        },
        body: JSON.stringify({ wordIds, status }),
      });
      if (!res.ok) throw new Error('Failed to update words');
      return res.json() as Promise<{ updated: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['word-instances'] });
      queryClient.invalidateQueries({ queryKey: ['text'] });
      setSelectedIds(new Set());
    },
    onError: () => {
      showToast('Failed to update words');
    },
  });

  // Single-word delete mutation (soft delete — resets status to UNKNOWN)
  const deleteMutation = useMutation({
    mutationFn: async (wordId: string) => {
      if (isDemo) return;
      const res = await fetch(`/api/words/${wordId}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '' },
      });
      if (!res.ok) throw new Error('Failed to reset word');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['word-instances'] });
      queryClient.invalidateQueries({ queryKey: ['text'] });
      setDeleteTarget(null);
      showToast('Word reset to unknown');
    },
    onError: () => {
      showToast('Failed to delete word');
    },
  });

  // Bulk delete mutation (soft deletes all selected words in parallel)
  const bulkDeleteMutation = useMutation({
    mutationFn: async (wordIds: string[]) => {
      if (isDemo) return;
      await Promise.all(
        wordIds.map((id) =>
          fetch(`/api/words/${id}`, {
            method: 'DELETE',
            headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '' },
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['word-instances'] });
      queryClient.invalidateQueries({ queryKey: ['text'] });
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      showToast('Words reset to unknown');
    },
    onError: () => {
      showToast('Failed to delete words');
    },
  });

  // Selection handlers
  const handleToggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    if (newSelected.size === 0) setIsMultiSelectActive(false);
  };

  const handleToggleAll = () => {
    if (selectedIds.size === words.length) {
      setSelectedIds(new Set());
      setIsMultiSelectActive(false);
    } else {
      setSelectedIds(new Set(words.map((item) => item.id)));
      setIsMultiSelectActive(true);
    }
  };

  const handleEnableMultiSelect = () => setIsMultiSelectActive(true);
  const handleClearSelection = () => setSelectedIds(new Set());

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
    if (isDemo) return;
    bulkUpdateMutation.mutate({
      wordIds: Array.from(selectedIds),
      status: VocabularyStatus.KNOWN,
    });
  };

  const handleAddTag = () => {
    showToast('Tag editing coming soon');
    setSelectedIds(new Set());
  };

  const handleDelete = () => setShowBulkDeleteConfirm(true);

  const handleConfirmBulkDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selectedIds));
  };

  const handleConfirmSingleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  const handleEdit = (item: VocabularyItem) => setEditTarget(item);

  const handleEditSave = () => {
    queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    queryClient.invalidateQueries({ queryKey: ['word-instances'] });
    queryClient.invalidateQueries({ queryKey: ['text'] });
    setEditTarget(null);
    showToast('Word updated');
  };

  const handleAddVocabulary = (vocabData: NewVocabularyData) => {
    showToast(`"${vocabData.lemma}" added to vocabulary!`);
    setIsAddVocabModalOpen(false);
  };

  const handleImportVocabulary = (items: ImportedVocabularyData[], _strategy: MergeStrategy) => {
    showToast(`${items.length} vocabulary item${items.length > 1 ? 's' : ''} imported successfully!`);
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
            <Muted>Manage your learned words and track your progress</Muted>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <span title={isDemo ? 'Not available in demo mode' : undefined}>
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<Upload size={18} strokeWidth={1.5} />}
                onClick={() => setIsImportVocabModalOpen(true)}
                disabled={isDemo}
              >
                Import
              </Button>
            </span>
            <span title={isDemo ? 'Not available in demo mode' : undefined}>
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Plus size={18} strokeWidth={2} />}
                onClick={() => setIsAddVocabModalOpen(true)}
                disabled={isDemo}
              >
                Add Vocabulary
              </Button>
            </span>
          </div>
        </header>

        {/* Vocabulary Distribution + Fluency */}
        {stats && (
          <VocabDistribution
            unknown={stats.vocabulary.unknown}
            newlySeen={stats.vocabulary.newlySeen}
            familiar={stats.vocabulary.familiar}
            known={stats.vocabulary.known}
            wellKnown={stats.vocabulary.wellKnown}
            total={stats.vocabulary.total}
          />
        )}

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
                        <span className="font-sans font-semibold text-ui-sm md:text-ui-base text-ink">Rarity</span>
                      </th>
                      <th className="px-2 md:px-3 py-2 md:py-3 text-left">
                        <span className="font-sans font-semibold text-ui-sm md:text-ui-base text-ink">User Freq</span>
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left hidden lg:table-cell">
                        <span className="font-sans font-semibold text-ui-sm md:text-ui-base text-ink">Translation</span>
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left hidden lg:table-cell">
                        <span className="font-sans font-semibold text-ui-sm md:text-ui-base text-ink">Seen in</span>
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
        ) : words.length === 0 ? (
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
                items={words}
                selectedIds={selectedIds}
                onToggleSelection={handleToggleSelection}
                onToggleAll={handleToggleAll}
                onEdit={handleEdit}
                onDelete={(item) => setDeleteTarget(item)}
              />
            </div>

            {/* Mobile: Card View */}
            <div className="md:hidden">
              <VocabCardList
                items={words}
                selectedIds={selectedIds}
                onToggleSelection={handleToggleSelection}
                onEdit={handleEdit}
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

      {/* Edit Vocabulary Modal */}
      <EditVocabularyModal
        isOpen={editTarget !== null}
        item={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleEditSave}
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
