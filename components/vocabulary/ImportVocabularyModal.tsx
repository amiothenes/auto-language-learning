'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { ImportedVocabularyData, MergeStrategy } from '@/lib/types/forms';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';

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
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // .txt files are ambiguous — could be comma or tab delimited — so we keep
  // the raw content around to re-parse instantly when the user overrides our
  // guessed delimiter, instead of asking them to re-upload.
  const [txtFileContent, setTxtFileContent] = useState<string | null>(null);
  const [txtDelimiter, setTxtDelimiter] = useState<',' | '\t'>('\t');

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
      setIsDragging(false);
      setTxtFileContent(null);
      setTxtDelimiter('\t');
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  useBodyScrollLock(isOpen);

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

  // A lemma ending in one or more "?" marks a word LWT-style tools couldn't
  // resolve (the lemmatizer gave up). During import, strip the marker and
  // force IGNORE — regardless of any status column value — rather than
  // importing a garbled lemma or dropping the row outright.
  const TRAILING_QUESTION_MARKS = /\?+$/;

  const applyIgnoreMarker = (
    lemma: string,
    status: VocabularyStatus | undefined
  ): { lemma: string; status: VocabularyStatus | undefined } | null => {
    if (!TRAILING_QUESTION_MARKS.test(lemma)) return { lemma, status };
    const stripped = lemma.replace(TRAILING_QUESTION_MARKS, '').trim();
    if (!stripped) return null; // lemma was nothing but "?" marks
    return { lemma: stripped, status: VocabularyStatus.IGNORE };
  };

  // Header aliases — real-world exports label these columns all sorts of
  // ways ("Word", "Meaning", "Def"), so we try a small synonym list before
  // ever falling back to guessing by position.
  const HEADER_ALIASES = {
    lemma: ['lemma', 'word', 'term'],
    translation: ['translation', 'meaning', 'definition', 'translate'],
    status: ['status', 'learningstatus'],
    frequency: ['dictionaryfrequency', 'frequency', 'freq'],
    tags: ['tags', 'tag'],
  };

  const findColumn = (header: string[], aliases: string[]): number => {
    for (const alias of aliases) {
      const idx = header.indexOf(alias);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  // Parse CSV or TSV content — same header-named column layout either way,
  // just a different field delimiter (comma vs. tab). Note this is NOT the
  // LWT positional .tsv format used by the /settings/data importer.
  //
  // If no column names match any known alias, we don't give up: we assume
  // the file has no header at all and fall back to a fixed column order
  // (lemma, translation, status, dictionaryFrequency, tags) — matching the
  // order this app's own TSV export uses — so the first row is treated as
  // data instead of being silently discarded as an unrecognized header.
  const parseDelimited = (content: string, delimiter: ',' | '\t'): ImportedVocabularyData[] => {
    const lines = content.split('\n').filter((line) => line.trim() !== '');
    if (lines.length === 0) return [];

    const header = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());
    let lemmaIndex = findColumn(header, HEADER_ALIASES.lemma);
    let translationIndex = findColumn(header, HEADER_ALIASES.translation);
    let statusIndex = findColumn(header, HEADER_ALIASES.status);
    let frequencyIndex = findColumn(header, HEADER_ALIASES.frequency);
    let tagsIndex = findColumn(header, HEADER_ALIASES.tags);

    const hasRecognizedHeader =
      lemmaIndex !== -1 || translationIndex !== -1 || statusIndex !== -1 || frequencyIndex !== -1 || tagsIndex !== -1;

    let dataStartRow = 1;
    if (!hasRecognizedHeader) {
      // Nothing recognized at all — guess by position instead of erroring
      // out, and treat row 0 as data too, since there's no header to skip.
      lemmaIndex = 0;
      translationIndex = 1;
      statusIndex = 2;
      frequencyIndex = 3;
      tagsIndex = 4;
      dataStartRow = 0;
    } else {
      // A header row clearly exists (something matched), but one of the two
      // required columns used a name we don't recognize — fill it in from
      // the first column position the header row isn't already using.
      const used = new Set([lemmaIndex, translationIndex, statusIndex, frequencyIndex, tagsIndex]);
      const nextFreeColumn = () => {
        let col = 0;
        while (used.has(col)) col++;
        used.add(col);
        return col;
      };
      if (lemmaIndex === -1) lemmaIndex = nextFreeColumn();
      if (translationIndex === -1) translationIndex = nextFreeColumn();
    }

    const items: ImportedVocabularyData[] = [];
    for (let i = dataStartRow; i < lines.length && items.length < 10000; i++) {
      const cols = lines[i].split(delimiter);
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

      const resolved = applyIgnoreMarker(lemma, status);
      if (!resolved) continue;

      items.push({
        lemma: resolved.lemma,
        translation,
        status: resolved.status,
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

      const resolved = applyIgnoreMarker(item.lemma.trim(), status);
      if (!resolved) continue;

      items.push({
        lemma: resolved.lemma,
        translation: item.translation.trim(),
        status: resolved.status,
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

  // .txt could be either delimiter — count occurrences on the first
  // non-empty line and go with whichever is more common. Ties favor tab
  // since that's this app's own export convention and the LWT convention.
  const detectDelimiter = (content: string): ',' | '\t' => {
    const firstLine = content.split('\n').find((l) => l.trim() !== '') ?? '';
    const tabCount = (firstLine.match(/\t/g) ?? []).length;
    const commaCount = (firstLine.match(/,/g) ?? []).length;
    return commaCount > tabCount ? ',' : '\t';
  };

  // Applies importedItems/error state from a parse result, shared by the
  // initial parse and by re-parsing a .txt file under a different delimiter.
  const applyParsedItems = (items: ImportedVocabularyData[], emptyMessage: string) => {
    if (items.length === 0) {
      setError(emptyMessage);
      setImportedItems([]);
      return;
    }
    if (items.length > 10000) {
      setError('Maximum 10,000 items per import. Only first 10,000 will be imported.');
      setImportedItems(items.slice(0, 10000));
    } else {
      setError(null);
      setImportedItems(items);
    }
  };

  // Shared by both the click-to-browse file input and drag-and-drop —
  // drag-and-drop is the primary path per the Verbista design system's file
  // upload law (.claude/design-system.md), click-to-browse stays as a fallback.
  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setTxtFileContent(null);

    try {
      if (file.size > 25 * 1024 * 1024) {
        throw new Error('File exceeds 25MB limit');
      }

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'csv' && ext !== 'tsv' && ext !== 'txt' && ext !== 'json') {
        throw new Error('Only .csv, .tsv, .txt, and .json files are supported');
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

      if (ext === 'json') {
        applyParsedItems(parseJSON(content), 'No valid vocabulary items found in file');
        return;
      }

      if (ext === 'csv') {
        applyParsedItems(parseDelimited(content, ','), 'No valid vocabulary items found in file');
        return;
      }

      if (ext === 'tsv') {
        applyParsedItems(parseDelimited(content, '\t'), 'No valid vocabulary items found in file');
        return;
      }

      // .txt — ambiguous delimiter. Guess, parse, and keep the raw content
      // around so the delimiter toggle below can re-parse without a re-upload.
      const detected = detectDelimiter(content);
      setTxtFileContent(content);
      setTxtDelimiter(detected);
      applyParsedItems(parseDelimited(content, detected), 'No valid vocabulary items found in file');
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

  // Re-parses the already-read .txt content under the delimiter the user
  // picked, without touching the file input or re-reading anything.
  const handleTxtDelimiterChange = (delimiter: ',' | '\t') => {
    if (!txtFileContent) return;
    setTxtDelimiter(delimiter);
    applyParsedItems(
      parseDelimited(txtFileContent, delimiter),
      `No valid vocabulary items found with ${delimiter === '\t' ? 'tab' : 'comma'} delimiting`
    );
  };

  // Click-to-browse handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag-and-drop handlers — plain functions, not useCallback: they're only
  // ever attached to this one div, not passed down to a memoized child, so
  // memoizing them buys nothing.
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
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
            Drag and drop a CSV, TSV, TXT, or JSON file, or click to browse
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
              accept=".csv,.tsv,.txt,.json"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
              id="import-vocab-file-input"
            />
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Drop or choose a CSV, TSV, TXT, or JSON file to import"
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isProcessing) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload size={20} strokeWidth={1.5} className="text-muted" />
              <div className="text-center">
                <p className="font-sans text-ui-sm text-ink font-medium">
                  {isProcessing
                    ? 'Processing file...'
                    : isDragging
                      ? 'Drop file to import'
                      : 'Drop file here, or click to browse'}
                </p>
                <p className="font-sans text-ui-xs text-muted mt-1">
                  CSV, TSV, TXT, or JSON &middot; Max 25MB, 10,000 items max
                </p>
              </div>
            </div>
          </div>

          {/* TXT delimiter picker — shown once a .txt file has been read, since
              its delimiter is ambiguous and we've only guessed at it */}
          {txtFileContent && (
            <div className="mt-3 flex items-center gap-3 px-3 py-2 bg-desk border border-border rounded">
              <span className="font-sans text-ui-xs text-ink font-medium">
                .txt delimiter:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTxtDelimiterChange('\t')}
                  className={`px-2 py-1 rounded font-sans text-ui-xs transition-colors ${
                    txtDelimiter === '\t'
                      ? 'bg-primary text-white'
                      : 'bg-paper border border-border text-ink hover:border-primary'
                  }`}
                >
                  Tab
                </button>
                <button
                  type="button"
                  onClick={() => handleTxtDelimiterChange(',')}
                  className={`px-2 py-1 rounded font-sans text-ui-xs transition-colors ${
                    txtDelimiter === ','
                      ? 'bg-primary text-white'
                      : 'bg-paper border border-border text-ink hover:border-primary'
                  }`}
                >
                  Comma
                </button>
              </div>
              <span className="font-sans text-ui-xs text-muted">
                Detected automatically, switch it if the preview below looks wrong
              </span>
            </div>
          )}

          {/* Format Guide */}
          <div className="mt-4 p-3 bg-desk border border-border rounded">
            <p className="font-sans text-ui-xs text-muted mb-2">
              CSV files are comma-delimited, TSV files are tab-delimited, and
              TXT files can be either (we guess, then let you switch it below
              if we guessed wrong). A header row naming the columns below
              works best, matched case-insensitively; other common names like
              &ldquo;Word&rdquo; or &ldquo;Meaning&rdquo; are recognized too,
              and if none of that matches, the first two columns are assumed
              to be lemma and translation. This is a different format from
              the LWT-export importer in Settings &rarr; Data.
            </p>
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
              <li>
                A lemma ending in <strong>?</strong> (one or more) is imported
                with the <strong>?</strong> removed and status forced to IGNORE
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
              Import {importedItems.length > 0 && `${importedItems.length.toLocaleString('en-US')} Item${importedItems.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
