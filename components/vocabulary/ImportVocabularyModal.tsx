'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { ImportedVocabularyData, MergeStrategy } from '@/lib/types/forms';

// ============================================================================
// ImportVocabularyModal Component
// Bulk import vocabulary items from CSV/JSON files
// ============================================================================

interface ImportVocabularyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: ImportedVocabularyData[], strategy: MergeStrategy) => void;
}

export function ImportVocabularyModal({
  isOpen,
  onClose,
  onImport,
}: ImportVocabularyModalProps) {
  const [importedItems, setImportedItems] = useState<ImportedVocabularyData[]>([]);
  const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>('skip');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SSR guard for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setImportedItems([]);
      setMergeStrategy('skip');
      setError(null);
      setIsProcessing(false);
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Restore focus on close
  useEffect(() => {
    if (isOpen) return;
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Escape key dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusableElements = dialogEl.querySelectorAll(focusableSelector);
      if (focusableElements.length === 0) return;

      const first = focusableElements[0] as HTMLElement;
      const last = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Backdrop click handler
  const handleBackdropClick = useCallback(() => {
    if (!isProcessing) {
      onClose();
    }
  }, [isProcessing, onClose]);

  // Validate and parse status
  const parseStatus = (status?: string): VocabularyStatus | undefined => {
    if (!status) return undefined;
    const normalized = status.toUpperCase().replace(/[- ]/g, '_');
    if (Object.values(VocabularyStatus).includes(normalized as VocabularyStatus)) {
      return normalized as VocabularyStatus;
    }
    return undefined;
  };

  // Parse CSV content
  const parseCSV = (content: string): ImportedVocabularyData[] => {
    const lines = content.split('\n').filter((line) => line.trim() !== '');
    if (lines.length < 2) return []; // Need at least header + 1 row

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const lemmaIndex = header.indexOf('lemma');
    const translationIndex = header.indexOf('translation');
    const statusIndex = header.indexOf('status');
    const frequencyIndex = header.indexOf('dictionaryfrequency') !== -1
      ? header.indexOf('dictionaryfrequency')
      : header.indexOf('frequency');
    const tagsIndex = header.indexOf('tags');

    if (lemmaIndex === -1 || translationIndex === -1) {
      throw new Error('CSV must have "lemma" and "translation" columns');
    }

    const items: ImportedVocabularyData[] = [];
    for (let i = 1; i < lines.length && i < 10001; i++) {
      // Max 10,000 items
      const cols = lines[i].split(',');
      if (cols.length < Math.max(lemmaIndex, translationIndex) + 1) continue;

      const lemma = cols[lemmaIndex]?.trim();
      const translation = cols[translationIndex]?.trim();
      if (!lemma || !translation) continue;

      // Parse optional fields
      const status =
        statusIndex !== -1 ? parseStatus(cols[statusIndex]?.trim()) : undefined;
      const frequency =
        frequencyIndex !== -1 && cols[frequencyIndex]
          ? parseInt(cols[frequencyIndex].trim(), 10)
          : undefined;
      const tags =
        tagsIndex !== -1 && cols[tagsIndex]
          ? cols[tagsIndex].split(';').map((t) => t.trim()).filter(Boolean)
          : undefined;

      items.push({
        lemma,
        translation,
        status,
        dictionaryFrequency:
          frequency !== undefined && !isNaN(frequency) && frequency >= 0 && frequency <= 100
            ? frequency
            : undefined,
        tags,
      });
    }

    return items;
  };

  // Parse JSON content
  const parseJSON = (content: string): ImportedVocabularyData[] => {
    const data = JSON.parse(content);
    if (!Array.isArray(data)) {
      throw new Error('JSON must be an array of vocabulary objects');
    }

    const items: ImportedVocabularyData[] = [];
    for (let i = 0; i < data.length && i < 10000; i++) {
      const item = data[i];
      if (!item.lemma || !item.translation) continue;

      const status = item.status ? parseStatus(item.status) : undefined;
      const frequency = item.dictionaryFrequency || item.frequency;

      items.push({
        lemma: item.lemma.trim(),
        translation: item.translation.trim(),
        status,
        dictionaryFrequency:
          frequency !== undefined &&
          typeof frequency === 'number' &&
          frequency >= 0 &&
          frequency <= 100
            ? frequency
            : undefined,
        tags: Array.isArray(item.tags) ? item.tags : undefined,
      });
    }

    return items;
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const file = files[0]; // Only process first file
      if (file.size > 25 * 1024 * 1024) {
        throw new Error('File exceeds 25MB limit');
      }

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'csv' && ext !== 'json') {
        throw new Error('Only .csv and .json files are supported');
      }

      const reader = new FileReader();
      const content = await new Promise<string>((resolve, reject) => {
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (!result || result.trim() === '') {
            reject(new Error('File is empty'));
          } else {
            resolve(result);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });

      let items: ImportedVocabularyData[];
      if (ext === 'csv') {
        items = parseCSV(content);
      } else {
        items = parseJSON(content);
      }

      if (items.length === 0) {
        throw new Error('No valid vocabulary items found in file');
      }

      if (items.length > 10000) {
        setError('Maximum 10,000 items per import. Only first 10,000 will be imported.');
        setImportedItems(items.slice(0, 10000));
      } else {
        setImportedItems(items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
      setImportedItems([]);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Final submission
  const handleSubmit = useCallback(() => {
    if (importedItems.length === 0) return;
    onImport(importedItems, mergeStrategy);
  }, [importedItems, mergeStrategy, onImport]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-ink/40 animate-modal-backdrop-enter"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Dialog Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-vocabulary-dialog-title"
          className="w-full max-w-3xl bg-paper rounded-card shadow-modal animate-modal-enter p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <h2
            id="import-vocabulary-dialog-title"
            className="font-sans text-ui-lg font-semibold text-ink"
          >
            Import Vocabulary
          </h2>

          <p className="mt-2 font-sans text-ui-sm text-muted">
            Import vocabulary items from CSV or JSON files
          </p>

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-danger/10 border border-danger/30 rounded">
              <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
              <p className="font-sans text-ui-sm text-danger">{error}</p>
            </div>
          )}

          {/* Upload Section */}
          <div className="mt-6">
            <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
              Upload File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
              id="import-vocab-file-input"
            />
            <label htmlFor="import-vocab-file-input">
              <div
                className={`flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-border rounded cursor-pointer hover:border-primary transition-colors ${
                  isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload size={20} strokeWidth={1.5} className="text-muted" />
                <div className="text-center">
                  <p className="font-sans text-ui-sm text-ink font-medium">
                    {isProcessing ? 'Processing file...' : 'Choose CSV or JSON file'}
                  </p>
                  <p className="font-sans text-ui-xs text-muted mt-1">
                    Max 25MB, 10,000 items max
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* Format Guide */}
          <div className="mt-4 p-3 bg-desk border border-border rounded">
            <p className="font-sans text-ui-xs font-medium text-ink mb-1">
              Required Fields:
            </p>
            <ul className="font-sans text-ui-xs text-muted space-y-0.5 ml-4 list-disc">
              <li>
                <strong>lemma</strong> - Root word form (required)
              </li>
              <li>
                <strong>translation</strong> - Translation in your language (required)
              </li>
            </ul>
            <p className="font-sans text-ui-xs font-medium text-ink mb-1 mt-2">
              Optional Fields:
            </p>
            <ul className="font-sans text-ui-xs text-muted space-y-0.5 ml-4 list-disc">
              <li>
                <strong>status</strong> - Learning status (NEWLY_SEEN, FAMILIAR, KNOWN, WELL_KNOWN, IGNORE)
              </li>
              <li>
                <strong>dictionaryFrequency</strong> - Commonality score (0-100)
              </li>
              <li>
                <strong>tags</strong> - Semicolon-separated tags
              </li>
            </ul>
          </div>

          {/* Merge Strategy */}
          {importedItems.length > 0 && (
            <div className="mt-6">
              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Merge Strategy
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="merge-strategy"
                    value="skip"
                    checked={mergeStrategy === 'skip'}
                    onChange={() => setMergeStrategy('skip')}
                    className="mt-0.5 w-4 h-4 text-primary bg-paper border-border focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  />
                  <div>
                    <p className="font-sans text-ui-sm text-ink font-medium">
                      Skip Duplicates (Recommended)
                    </p>
                    <p className="font-sans text-ui-xs text-muted">
                      Keep existing items, only add new ones
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="merge-strategy"
                    value="update"
                    checked={mergeStrategy === 'update'}
                    onChange={() => setMergeStrategy('update')}
                    className="mt-0.5 w-4 h-4 text-primary bg-paper border-border focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  />
                  <div>
                    <p className="font-sans text-ui-sm text-ink font-medium">
                      Update Existing
                    </p>
                    <p className="font-sans text-ui-xs text-muted">
                      Update existing items with new data from import
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="merge-strategy"
                    value="replace"
                    checked={mergeStrategy === 'replace'}
                    onChange={() => setMergeStrategy('replace')}
                    className="mt-0.5 w-4 h-4 text-primary bg-paper border-border focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  />
                  <div>
                    <p className="font-sans text-ui-sm text-ink font-medium">
                      Replace All
                    </p>
                    <p className="font-sans text-ui-xs text-muted">
                      Delete all existing vocabulary and replace with imported data
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {importedItems.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="font-sans text-ui-sm font-medium text-ink">
                  Preview (showing first 10 of {importedItems.length})
                </label>
                <div className="flex items-center gap-1 text-primary">
                  <CheckCircle2 size={14} strokeWidth={2} />
                  <span className="font-sans text-ui-xs font-medium">
                    {importedItems.length} item{importedItems.length > 1 ? 's' : ''} ready
                  </span>
                </div>
              </div>
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full">
                  <thead className="bg-desk border-b border-border">
                    <tr>
                      <th className="px-3 py-2 text-left font-sans text-ui-xs font-semibold text-ink">
                        Lemma
                      </th>
                      <th className="px-3 py-2 text-left font-sans text-ui-xs font-semibold text-ink">
                        Translation
                      </th>
                      <th className="px-3 py-2 text-left font-sans text-ui-xs font-semibold text-ink">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left font-sans text-ui-xs font-semibold text-ink">
                        Freq
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedItems.slice(0, 10).map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-3 py-2 font-sans text-ui-sm text-ink">
                          {item.lemma}
                        </td>
                        <td className="px-3 py-2 font-sans text-ui-sm text-muted">
                          {item.translation}
                        </td>
                        <td className="px-3 py-2 font-sans text-ui-xs text-muted">
                          {item.status || 'NEWLY_SEEN'}
                        </td>
                        <td className="px-3 py-2 font-sans text-ui-xs text-muted">
                          {item.dictionaryFrequency ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={importedItems.length === 0 || isProcessing}
            >
              Import {importedItems.length > 0 && `${importedItems.length.toLocaleString()} Item${importedItems.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
