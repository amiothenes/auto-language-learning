'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Select, type SelectOption } from '@/components/settings/Select';
import { Upload, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { ImportedVocabularyData, MergeStrategy } from '@/lib/types/forms';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';

// ============================================================================
// ImportVocabularyModal Component
// Bulk import vocabulary items from CSV/JSON/TXT files, with a field-mapping
// "Confirm Fields" step shared by every supported format.
// ============================================================================

type ImportStep = 'upload' | 'mapping' | 'preview';
type SourceFormat = 'csv' | 'json' | 'txt';
type TxtDelimiter = 'comma' | 'tab';
type TargetField = 'lemma' | 'translation' | 'status';

const TARGET_FIELDS: { key: TargetField; label: string; required: boolean }[] = [
  { key: 'lemma', label: 'Lemma (word)', required: true },
  { key: 'translation', label: 'Translation', required: true },
  { key: 'status', label: 'Status', required: false },
];

const NO_MAPPING = '__none__';

interface ImportVocabularyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: ImportedVocabularyData[], strategy: MergeStrategy) => void;
}

// Detect which target field a source column/key most likely represents
function detectTargetField(header: string): TargetField | null {
  const norm = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (norm === 'lemma' || norm === 'word' || norm === 'term') return 'lemma';
  if (norm === 'translation' || norm === 'meaning' || norm === 'definition' || norm === 'def') return 'translation';
  if (norm === 'status') return 'status';
  return null;
}

function buildAutoMapping(headers: string[]): Partial<Record<TargetField, string>> {
  const mapping: Partial<Record<TargetField, string>> = {};
  for (const header of headers) {
    const target = detectTargetField(header);
    if (target && !mapping[target]) mapping[target] = header;
  }
  return mapping;
}

// Parse delimited text (CSV or TXT with a chosen delimiter) into headers + records.
// When hasHeaderRow is false, every line is data and columns are named positionally.
function parseDelimited(
  content: string,
  delimiter: string,
  hasHeaderRow: boolean
): { headers: string[]; records: Record<string, string>[] } {
  const lines = content.split('\n').filter((line) => line.trim() !== '');
  if (lines.length === 0 || (hasHeaderRow && lines.length < 2)) return { headers: [], records: [] };

  let headers: string[];
  let dataLines: string[];
  if (hasHeaderRow) {
    headers = lines[0].split(delimiter).map((h) => h.trim()).filter(Boolean);
    dataLines = lines.slice(1);
  } else {
    const colCount = lines[0].split(delimiter).length;
    headers = Array.from({ length: colCount }, (_, i) => `Column ${i + 1}`);
    dataLines = lines;
  }
  if (headers.length === 0) return { headers: [], records: [] };

  const records: Record<string, string>[] = [];
  for (let i = 0; i < dataLines.length && records.length < 10000; i++) {
    const cols = dataLines[i].split(delimiter);
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = cols[idx]?.trim() ?? '';
    });
    records.push(record);
  }

  return { headers, records };
}

// Parse a JSON array of objects into a union of keys ("headers") + records
function parseJSONRecords(content: string): { headers: string[]; records: Record<string, unknown>[] } {
  const data = JSON.parse(content);
  if (!Array.isArray(data)) {
    throw new Error('JSON must be an array of vocabulary objects');
  }

  const headers: string[] = [];
  const records: Record<string, unknown>[] = [];
  for (let i = 0; i < data.length && records.length < 10000; i++) {
    const item = data[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    records.push(item as Record<string, unknown>);
    for (const key of Object.keys(item)) {
      if (!headers.includes(key)) headers.push(key);
    }
  }

  return { headers, records };
}

export function ImportVocabularyModal({
  isOpen,
  onClose,
  onImport,
}: ImportVocabularyModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [sourceFormat, setSourceFormat] = useState<SourceFormat | null>(null);
  const [fileName, setFileName] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [txtDelimiter, setTxtDelimiter] = useState<TxtDelimiter>('comma');
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  const [sourceHeaders, setSourceHeaders] = useState<string[]>([]);
  const [sourceRecords, setSourceRecords] = useState<Record<string, unknown>[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Partial<Record<TargetField, string>>>({});
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
      setStep('upload');
      setSourceFormat(null);
      setFileName('');
      setRawContent('');
      setTxtDelimiter('comma');
      setHasHeaderRow(true);
      setSourceHeaders([]);
      setSourceRecords([]);
      setFieldMapping({});
      setImportedItems([]);
      setMergeStrategy('skip');
      setError(null);
      setIsProcessing(false);
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

  // Build final vocabulary items from raw records using the confirmed field mapping
  const buildImportedItems = useCallback(
    (records: Record<string, unknown>[], mapping: Partial<Record<TargetField, string>>): ImportedVocabularyData[] => {
      const lemmaKey = mapping.lemma;
      const translationKey = mapping.translation;
      if (!lemmaKey || !translationKey) return [];

      const statusKey = mapping.status;

      const toText = (value: unknown): string => {
        if (value === undefined || value === null) return '';
        return typeof value === 'string' ? value.trim() : String(value).trim();
      };

      const items: ImportedVocabularyData[] = [];
      for (let i = 0; i < records.length && items.length < 10000; i++) {
        const record = records[i];
        const lemma = toText(record[lemmaKey]);
        const translation = toText(record[translationKey]);
        if (!lemma || !translation) continue;

        const status = statusKey ? parseStatus(toText(record[statusKey]) || undefined) : undefined;

        items.push({ lemma, translation, status });
      }

      return items;
    },
    []
  );

  // Handle file upload — reads the file and moves to the Confirm Fields step
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
      if (ext !== 'csv' && ext !== 'json' && ext !== 'txt') {
        throw new Error('Only .csv, .json, and .txt files are supported');
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

      const format = ext as SourceFormat;
      const defaultDelimiter: TxtDelimiter = 'comma';
      const defaultHasHeaderRow = true;

      const { headers, records } =
        format === 'json'
          ? parseJSONRecords(content)
          : parseDelimited(content, ',', defaultHasHeaderRow);

      if (headers.length === 0 || records.length === 0) {
        throw new Error(
          format === 'json'
            ? 'No valid vocabulary objects found in file'
            : 'No data rows found in file'
        );
      }

      setFileName(file.name);
      setRawContent(content);
      setSourceFormat(format);
      setTxtDelimiter(defaultDelimiter);
      setHasHeaderRow(defaultHasHeaderRow);
      setSourceHeaders(headers);
      setSourceRecords(records);
      setFieldMapping(buildAutoMapping(headers));
      setStep('mapping');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Re-parse a delimited (CSV/TXT) source when the delimiter or header-row toggle changes
  const reparseDelimited = (delimiter: TxtDelimiter, headerRow: boolean) => {
    const { headers, records } = parseDelimited(rawContent, delimiter === 'tab' ? '\t' : ',', headerRow);
    setSourceHeaders(headers);
    setSourceRecords(records);
    setFieldMapping(buildAutoMapping(headers));
    setError(headers.length === 0 || records.length === 0 ? 'No data rows found with this setting' : null);
  };

  // Re-parse a .txt file when the delimiter toggle changes
  const handleDelimiterChange = (delimiter: TxtDelimiter) => {
    setTxtDelimiter(delimiter);
    reparseDelimited(delimiter, hasHeaderRow);
  };

  // Toggle whether the first row is treated as column headers
  const handleHeaderRowToggle = (headerRow: boolean) => {
    setHasHeaderRow(headerRow);
    reparseDelimited(txtDelimiter, headerRow);
  };

  // Update a single field's mapping
  const handleMappingChange = (target: TargetField, header: string) => {
    setFieldMapping((prev) => ({ ...prev, [target]: header === NO_MAPPING ? undefined : header }));
  };

  // Confirm the field mapping and build the preview
  const handleConfirmMapping = () => {
    if (!fieldMapping.lemma || !fieldMapping.translation) {
      setError('Please map both Lemma and Translation to continue.');
      return;
    }

    const items = buildImportedItems(sourceRecords, fieldMapping);
    if (items.length === 0) {
      setError('No valid vocabulary items found with the current field mapping.');
      return;
    }

    setError(null);
    if (sourceRecords.length > 10000 || items.length > 10000) {
      setError('Maximum 10,000 items per import. Only first 10,000 will be imported.');
      setImportedItems(items.slice(0, 10000));
    } else {
      setImportedItems(items);
    }
    setStep('preview');
  };

  // Go back to file upload, discarding the parsed source
  const handleBackToUpload = () => {
    setStep('upload');
    setSourceFormat(null);
    setFileName('');
    setRawContent('');
    setHasHeaderRow(true);
    setSourceHeaders([]);
    setSourceRecords([]);
    setFieldMapping({});
    setError(null);
  };

  // Final submission
  const handleSubmit = useCallback(() => {
    if (importedItems.length === 0) return;
    onImport(importedItems, mergeStrategy);
  }, [importedItems, mergeStrategy, onImport]);

  if (!mounted || !isOpen) return null;

  const sampleRecord = sourceRecords[0];
  const headerOptions: SelectOption[] = sourceHeaders.map((h) => {
    const sample = sampleRecord ? sampleRecord[h] : undefined;
    const sampleText =
      sample === undefined || sample === null || sample === ''
        ? null
        : Array.isArray(sample)
          ? sample.join('; ')
          : String(sample);
    return { value: h, label: sampleText ? `${h} (${sampleText})` : h };
  });
  const sourceFormatLabel = sourceFormat === 'csv' ? 'CSV' : sourceFormat === 'json' ? 'JSON' : sourceFormat === 'txt' ? 'TXT' : '';

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
            {step === 'upload' && 'Import vocabulary items from a CSV, JSON, or TXT file'}
            {step === 'mapping' && 'Confirm which columns map to each vocabulary field'}
            {step === 'preview' && 'Review the parsed items and choose a merge strategy'}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-danger/10 border border-danger/30 rounded">
              <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
              <p className="font-sans text-ui-sm text-danger">{error}</p>
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <>
              <div className="mt-6">
                <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                  Upload File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.txt"
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
                        {isProcessing ? 'Processing file...' : 'Choose CSV, JSON, or TXT file'}
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
                  How it works:
                </p>
                <ul className="font-sans text-ui-xs text-muted space-y-0.5 ml-4 list-disc">
                  <li>
                    <strong>CSV / TXT</strong> - First row is treated as column headers by default (any names), but you can turn that off if your file has no header row. TXT files let you choose comma or tab as the delimiter.
                  </li>
                  <li>
                    <strong>JSON</strong> - An array of objects (any key names).
                  </li>
                  <li>
                    After upload, you&apos;ll confirm which column/key maps to <strong>lemma</strong>, <strong>translation</strong>, and optionally <strong>status</strong>.
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* Step 2: Confirm Fields (mapping) */}
          {step === 'mapping' && (
            <div className="mt-6">
              {/* Summary: rows detected, file name, file type */}
              <div className="mb-4 flex items-center justify-between p-3 bg-desk border border-border rounded">
                <p className="font-sans text-ui-sm text-ink">
                  <span className="font-semibold">{sourceRecords.length.toLocaleString()}</span> row
                  {sourceRecords.length !== 1 ? 's' : ''} detected
                  {fileName && (
                    <>
                      {' '}from <span className="font-medium">{fileName}</span>
                    </>
                  )}
                </p>
                <span className="font-sans text-ui-xs font-semibold px-2 py-1 rounded bg-primary/10 text-primary">
                  {sourceFormatLabel}
                </span>
              </div>

              {(sourceFormat === 'csv' || sourceFormat === 'txt') && (
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  {sourceFormat === 'txt' && (
                    <div>
                      <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                        Delimiter
                      </label>
                      <div className="flex border border-border rounded overflow-hidden w-fit">
                        {(['comma', 'tab'] as TxtDelimiter[]).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => handleDelimiterChange(d)}
                            className={`px-3 py-1.5 font-sans text-ui-xs font-medium transition-colors cursor-pointer ${
                              txtDelimiter === d ? 'bg-primary text-white' : 'text-muted hover:text-ink'
                            }`}
                          >
                            {d === 'comma' ? 'Comma' : 'Tab'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer mt-auto mb-1.5">
                    <input
                      type="checkbox"
                      checked={hasHeaderRow}
                      onChange={(e) => handleHeaderRowToggle(e.target.checked)}
                      className="w-4 h-4 text-primary bg-paper border-border focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    />
                    <span className="font-sans text-ui-sm text-ink">First row is column headers</span>
                  </label>
                </div>
              )}

              <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                Confirm Fields
              </label>
              <div className="space-y-3">
                {TARGET_FIELDS.map(({ key, label, required }) => {
                  const mappedHeader = fieldMapping[key];

                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-44 shrink-0">
                        <span className="font-sans text-ui-sm text-ink">
                          {label}
                          {required && <span className="text-danger ml-0.5">*</span>}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Select
                          value={mappedHeader ?? NO_MAPPING}
                          onChange={(value) => handleMappingChange(key, value)}
                          options={[
                            ...(required ? [] : [{ value: NO_MAPPING, label: "Don't import" }]),
                            ...headerOptions,
                          ]}
                          placeholder="Select a column..."
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <>
              {/* Merge Strategy */}
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

              {/* Preview Table */}
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-border">
            <div>
              {step === 'mapping' && (
                <Button type="button" variant="ghost" size="md" onClick={handleBackToUpload}>
                  <ArrowLeft size={16} strokeWidth={1.5} className="mr-1" />
                  Back
                </Button>
              )}
              {step === 'preview' && (
                <Button type="button" variant="ghost" size="md" onClick={() => setStep('mapping')}>
                  <ArrowLeft size={16} strokeWidth={1.5} className="mr-1" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              {step === 'mapping' && (
                <Button type="button" variant="primary" size="md" onClick={handleConfirmMapping}>
                  Confirm Fields
                </Button>
              )}
              {step === 'preview' && (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleSubmit}
                  disabled={importedItems.length === 0}
                >
                  Import {importedItems.length > 0 && `${importedItems.length.toLocaleString()} Item${importedItems.length > 1 ? 's' : ''}`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
