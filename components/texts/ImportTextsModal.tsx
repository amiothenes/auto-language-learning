'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Upload, FileText, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImportedTextData } from '@/lib/types/forms';

// ============================================================================
// ImportTextsModal Component
// Bulk import multiple texts into a series from files
// ============================================================================

type TitleMode = 'filename' | 'series-increment' | 'custom';
type EnrichedTextData = ImportedTextData & { sourceTitle: string };

function computeTitle(
  mode: TitleMode,
  sourceTitle: string,
  index: number,
  seriesName: string,
  textCount: number
): string {
  if (mode === 'filename') return sourceTitle;
  if (mode === 'series-increment') return `${seriesName} #${textCount + index + 1}`;
  return '';
}

interface ImportTextsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (texts: ImportedTextData[]) => Promise<void>;
  seriesId: string;
  seriesName: string;
  textCount: number;
}

export function ImportTextsModal({
  isOpen,
  onClose,
  onImport,
  seriesId: _seriesId,
  seriesName,
  textCount,
}: ImportTextsModalProps) {
  const [enrichedTexts, setEnrichedTexts] = useState<EnrichedTextData[]>([]);
  const [titleMode, setTitleMode] = useState<TitleMode>('filename');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setEnrichedTexts([]);
      setTitleMode('filename');
      setError(null);
      setIsProcessing(false);
      setIsSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      if (e.key === 'Escape' && !isProcessing && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, isSubmitting, onClose]);

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
    if (!isProcessing && !isSubmitting) {
      onClose();
    }
  }, [isProcessing, isSubmitting, onClose]);

  // Recompute titles when mode changes
  useEffect(() => {
    if (enrichedTexts.length === 0) return;
    setEnrichedTexts((prev) =>
      prev.map((t, i) => ({
        ...t,
        title: computeTitle(titleMode, t.sourceTitle, i, seriesName, textCount),
      }))
    );
  // seriesName and textCount are stable for the modal's open lifetime
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleMode]);

  // Parse CSV content
  const parseCSV = (content: string): ImportedTextData[] => {
    const lines = content.split('\n').filter((line) => line.trim() !== '');
    if (lines.length < 2) return [];

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const titleIndex = header.indexOf('title');
    const contentIndex = header.indexOf('content');
    const tagsIndex = header.indexOf('tags');

    if (titleIndex === -1 || contentIndex === -1) {
      throw new Error('CSV must have "title" and "content" columns');
    }

    const texts: ImportedTextData[] = [];
    for (let i = 1; i < lines.length && i < 51; i++) {
      const cols = lines[i].split(',');
      if (cols.length < Math.max(titleIndex, contentIndex) + 1) continue;

      const content = cols[contentIndex]?.trim() || '';
      if (content.length < 10) continue;

      texts.push({
        title: cols[titleIndex]?.trim() || `Text ${i}`,
        content,
        tags:
          tagsIndex !== -1 && cols[tagsIndex]
            ? cols[tagsIndex].split(';').map((t) => t.trim())
            : undefined,
      });
    }

    return texts;
  };

  // Parse JSON content
  const parseJSON = (content: string): ImportedTextData[] => {
    const data = JSON.parse(content);
    if (!Array.isArray(data)) {
      throw new Error('JSON must be an array of text objects');
    }

    const texts: ImportedTextData[] = [];
    for (let i = 0; i < data.length && i < 50; i++) {
      const item = data[i];
      if (!item.title || !item.content) continue;
      if (item.content.trim().length < 10) continue;

      texts.push({
        title: item.title.trim(),
        content: item.content.trim(),
        tags: Array.isArray(item.tags) ? item.tags : undefined,
      });
    }

    return texts;
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const fileReaders: Promise<ImportedTextData | ImportedTextData[]>[] = [];

      Array.from(files).forEach((file) => {
        if (file.size > 10 * 1024 * 1024) {
          setError(`File ${file.name} exceeds 10MB limit`);
          return;
        }

        const reader = new FileReader();
        const promise = new Promise<ImportedTextData | ImportedTextData[]>(
          (resolve, reject) => {
            reader.onload = (event) => {
              try {
                const content = event.target?.result as string;
                if (!content || content.trim() === '') {
                  reject(new Error(`File ${file.name} is empty`));
                  return;
                }

                const ext = file.name.split('.').pop()?.toLowerCase();

                if (ext === 'csv') {
                  resolve(parseCSV(content));
                } else if (ext === 'json') {
                  resolve(parseJSON(content));
                } else if (ext === 'txt') {
                  if (content.trim().length >= 10) {
                    resolve({
                      title: file.name.replace(/\.[^/.]+$/, ''),
                      content: content.trim(),
                    });
                  }
                } else {
                  reject(new Error(`Unsupported file type: ${ext}`));
                }
              } catch (err) {
                reject(err);
              }
            };
            reader.onerror = () =>
              reject(new Error(`Failed to read file ${file.name}`));
            reader.readAsText(file);
          }
        );

        fileReaders.push(promise);
      });

      const results = await Promise.allSettled(fileReaders);
      const texts: ImportedTextData[] = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (Array.isArray(result.value)) {
            texts.push(...result.value);
          } else {
            texts.push(result.value);
          }
        } else {
          setError(result.reason.message);
        }
      });

      const trimmed = texts.slice(0, 50);
      if (texts.length > 50) {
        setError('Maximum 50 texts per import. Only first 50 will be imported.');
      }

      // Capture current titleMode for closure consistency
      const currentMode = titleMode;
      setEnrichedTexts(
        trimmed.map((t, i) => ({
          ...t,
          sourceTitle: t.title,
          title: computeTitle(currentMode, t.title, i, seriesName, textCount),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove imported text from list
  const handleRemoveText = (index: number) => {
    setEnrichedTexts((prev) => prev.filter((_, i) => i !== index));
  };

  // Update text title
  const handleUpdateTextTitle = (index: number, newTitle: string) => {
    setEnrichedTexts((prev) =>
      prev.map((text, i) => (i === index ? { ...text, title: newTitle } : text))
    );
  };

  // Final submission
  const handleSubmit = useCallback(async () => {
    if (enrichedTexts.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const textsToImport: ImportedTextData[] = enrichedTexts.map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ sourceTitle: _s, ...rest }) => rest
      );
      await onImport(textsToImport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setIsSubmitting(false);
    }
  }, [enrichedTexts, onImport, isSubmitting]);

  // Calculate total word count estimate
  const totalWordCount = enrichedTexts.reduce(
    (sum, text) => sum + text.content.split(/\s+/).length,
    0
  );

  const titleModeOptions = [
    { value: 'filename' as const, label: 'From filename' },
    { value: 'series-increment' as const, label: 'Series #N' },
    { value: 'custom' as const, label: 'Custom' },
  ];

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
          aria-labelledby="import-texts-dialog-title"
          className="w-full max-w-3xl bg-paper rounded-card shadow-modal animate-modal-enter p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <h2
            id="import-texts-dialog-title"
            className="font-sans text-ui-lg font-semibold text-ink"
          >
            Import Texts
          </h2>

          {/* Series Info */}
          <p className="mt-2 font-sans text-ui-sm text-muted">
            Importing into series: <span className="font-medium text-ink">{seriesName}</span>
          </p>

          {/* Title Format Selector */}
          <div className="mt-4">
            <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
              Title Format
            </label>
            <div className="flex border border-border rounded overflow-hidden w-fit">
              {titleModeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTitleMode(opt.value)}
                  className={cn(
                    'px-3 py-1.5 font-sans text-ui-xs font-medium transition-colors cursor-pointer',
                    titleMode === opt.value
                      ? 'bg-primary text-white'
                      : 'text-muted hover:text-ink'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {titleMode === 'series-increment' && (
              <p className="font-sans text-ui-xs text-muted mt-1">
                Titles: {seriesName} #{textCount + 1}, #{textCount + 2}, ...
              </p>
            )}
            {titleMode === 'custom' && (
              <p className="font-sans text-ui-xs text-muted mt-1">
                Edit each title manually in the preview below
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <p className="font-sans text-ui-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Upload Section */}
          <div className="mt-6">
            <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
              Upload Files
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.json"
              multiple
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
              id="import-file-input"
            />
            <label htmlFor="import-file-input">
              <div
                className={`flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-border rounded cursor-pointer hover:border-primary transition-colors ${
                  isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload size={20} strokeWidth={1.5} className="text-muted" />
                <div className="text-center">
                  <p className="font-sans text-ui-sm text-ink font-medium">
                    {isProcessing ? 'Processing files...' : 'Choose files to import'}
                  </p>
                  <p className="font-sans text-ui-xs text-muted mt-1">
                    Supports .txt, .csv, .json (max 10MB per file, 50 texts max)
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* Format Guide */}
          <div className="mt-4 p-3 bg-desk border border-border rounded">
            <p className="font-sans text-ui-xs font-medium text-ink mb-1">
              Supported Formats:
            </p>
            <ul className="font-sans text-ui-xs text-muted space-y-0.5 ml-4 list-disc">
              <li>
                <strong>.txt</strong> - Each file becomes one text (may split if long)
              </li>
              <li>
                <strong>.csv</strong> - Must have &quot;title&quot; and &quot;content&quot; columns
              </li>
              <li>
                <strong>.json</strong> - Array of objects with &quot;title&quot; and &quot;content&quot; fields
              </li>
              <li>
                Texts over <strong>750 words</strong> are automatically split into ordered parts
              </li>
            </ul>
          </div>

          {/* Imported Texts Preview */}
          {enrichedTexts.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="font-sans text-ui-sm font-medium text-ink">
                  Imported Texts ({enrichedTexts.length})
                </label>
                <p className="font-sans text-ui-xs text-muted">
                  ~{totalWordCount.toLocaleString()} total words
                </p>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto border border-border rounded p-3">
                {enrichedTexts.map((text, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 bg-desk rounded"
                  >
                    <FileText
                      size={16}
                      className="text-muted shrink-0 mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={text.title}
                        onChange={(e) =>
                          handleUpdateTextTitle(index, e.target.value)
                        }
                        placeholder={titleMode === 'custom' ? 'Enter title...' : undefined}
                        className="w-full px-2 py-1 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary mb-1"
                      />
                      <p className="font-sans text-ui-xs text-muted truncate">
                        {text.content.slice(0, 100)}...
                      </p>
                      {(() => {
                        const wc = text.content.split(/\s+/).filter(Boolean).length;
                        const parts = wc > 750 ? Math.ceil(wc / 750) : 1;
                        return (
                          <p className="font-sans text-ui-xs text-muted mt-1">
                            {wc.toLocaleString()} words
                            {parts > 1 && (
                              <span className="ml-1 text-amber-600 font-medium">· ~{parts} parts after split</span>
                            )}
                          </p>
                        );
                      })()}
                    </div>
                    <button
                      onClick={() => handleRemoveText(index)}
                      className="text-muted hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded p-1 shrink-0"
                      aria-label={`Remove ${text.title}`}
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
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
              disabled={isProcessing || isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={enrichedTexts.length === 0 || isProcessing || isSubmitting}
            >
              {isSubmitting
                ? 'Importing...'
                : `Import${enrichedTexts.length > 0 ? ` ${enrichedTexts.length} Text${enrichedTexts.length > 1 ? 's' : ''}` : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
