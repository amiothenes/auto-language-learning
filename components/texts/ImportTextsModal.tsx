'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Toast, useToast } from '@/components/ui/Toast';
import { Upload, FileText, Trash2, AlertCircle, Link, Pencil, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImportedTextData } from '@/lib/types/forms';
import { useFetchUrl } from '@/lib/hooks/useFetchUrl';

// ============================================================================
// ImportTextsModal Component
// Bulk import multiple texts into a series from files
// ============================================================================

const IMPORT_STAGES = [
  'Tokenizing text…',
  'Lemmatizing words…',
  'Romanizing script…',
  'Saving to database…',
] as const;

type TitleMode = 'filename' | 'series-increment' | 'custom';
type ImportTab = 'file' | 'url';
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
  currentLanguageCode?: string;
  currentLanguageName?: string;
}

export function ImportTextsModal({
  isOpen,
  onClose,
  onImport,
  seriesId: _seriesId,
  seriesName,
  textCount,
  currentLanguageCode,
  currentLanguageName,
}: ImportTextsModalProps) {
  const [enrichedTexts, setEnrichedTexts] = useState<EnrichedTextData[]>([]);
  const [titleMode, setTitleMode] = useState<TitleMode>('filename');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ImportTab>('file');
  const [urlInput, setUrlInput] = useState('');
  const [langMismatch, setLangMismatch] = useState<{ detected: string; importing: string } | null>(null);
  const [langWarningDismissed, setLangWarningDismissed] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<{ title: string; content: string }>({ title: '', content: '' });

  const fetchUrlMutation = useFetchUrl();
  const { toast, showToast, hideToast } = useToast();

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
      setActiveTab('file');
      setUrlInput('');
      setLangMismatch(null);
      setLangWarningDismissed(false);
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

  // Cycle through NLP stage labels while submitting
  useEffect(() => {
    if (!isSubmitting) {
      setStageIndex(0);
      return;
    }
    if (stageIndex >= IMPORT_STAGES.length - 1) return;
    const timer = setTimeout(() => setStageIndex((prev) => prev + 1), 3000);
    return () => clearTimeout(timer);
  }, [isSubmitting, stageIndex]);

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

      // Capture current titleMode for closure consistency; append to any
      // existing texts so the user can pick files from multiple directories
      const currentMode = titleMode;
      setEnrichedTexts((prev) => [
        ...prev,
        ...trimmed.map((t, i) => ({
          ...t,
          sourceTitle: t.title,
          title: computeTitle(currentMode, t.title, prev.length + i, seriesName, textCount),
        })),
      ]);
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

  // Open the content editor for a preview card
  const handleEditOpen = (index: number) => {
    setEditDraft({ title: enrichedTexts[index].title, content: enrichedTexts[index].content });
    setEditingIndex(index);
  };

  // Save edits and close the overlay
  const handleEditSave = () => {
    if (editingIndex === null) return;
    setEnrichedTexts((prev) =>
      prev.map((t, i) =>
        i === editingIndex
          ? { ...t, title: editDraft.title, content: editDraft.content }
          : t
      )
    );
    setEditingIndex(null);
  };

  // Fetch a URL server-side and inject the extracted text into the preview list
  const handleFetchUrl = async () => {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) return;

    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setError('Please enter a URL starting with http:// or https://');
      return;
    }

    setError(null);
    setLangMismatch(null);
    setLangWarningDismissed(false);

    try {
      const data = await fetchUrlMutation.mutateAsync({ url: trimmedUrl });

      // Warn if the page language differs from the active learning language
      if (
        data.detectedLang &&
        currentLanguageCode &&
        data.detectedLang.split('-')[0].toLowerCase() !== currentLanguageCode.split('-')[0].toLowerCase()
      ) {
        setLangMismatch({ detected: data.detectedLang, importing: currentLanguageName ?? currentLanguageCode });
      }

      const currentMode = titleMode;
      const newIndex = enrichedTexts.length;
      const newItem: EnrichedTextData = {
        title: computeTitle(currentMode, data.title, newIndex, seriesName, textCount),
        sourceTitle: data.title,
        content: data.content,
        sourceURI: data.resolvedUrl,
      };

      setEnrichedTexts((prev) => [...prev, newItem]);
      setUrlInput('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch URL';
      if (err instanceof Error && (err as Error & { status?: number }).status === 429) {
        showToast(message, 'error');
      } else {
        setError(message);
      }
    }
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
    { value: 'filename' as const, label: activeTab === 'url' ? 'Page title' : 'From filename' },
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
          className="relative w-full max-w-3xl bg-paper rounded-card shadow-modal animate-modal-enter p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* NLP Processing Overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-card overflow-hidden">
              <div className="absolute inset-0 animate-shimmer" />
              <div className="relative text-center px-6">
                <img
                  src="/illustrations/quill.svg"
                  width={72}
                  height={72}
                  alt=""
                  className="mx-auto mb-4 opacity-90"
                />
                <p className="font-sans text-ui-sm font-medium text-ink">
                  {enrichedTexts.length > 1
                    ? `Importing ${enrichedTexts.length} texts…`
                    : 'Importing text…'}
                </p>
                <p className="font-sans text-ui-xs text-muted mt-1">
                  {IMPORT_STAGES[stageIndex]}
                </p>
              </div>
            </div>
          )}

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

          {/* Import Method Tabs */}
          <div className="mt-4 flex border-b border-border">
            <button
              type="button"
              onClick={() => { setActiveTab('file'); setError(null); }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 font-sans text-ui-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === 'file' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'
              )}
            >
              <Upload size={14} strokeWidth={1.5} />
              From File
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('url'); setError(null); }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 font-sans text-ui-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === 'url' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'
              )}
            >
              <Link size={14} strokeWidth={1.5} />
              From URL
            </button>
          </div>

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
            {titleMode === 'filename' && activeTab === 'url' && (
              <p className="font-sans text-ui-xs text-muted mt-1">
                Title auto-filled from the page &lt;title&gt; tag — editable in the preview below
              </p>
            )}
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
            <div className="mt-4 flex items-start gap-2 p-3 bg-danger/10 border border-danger/30 rounded">
              <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
              <p className="font-sans text-ui-sm text-danger">{error}</p>
            </div>
          )}

          {/* Tab panels — grid stack keeps modal height stable regardless of active tab */}
          <div className="mt-6 grid">

            {/* File Upload Panel */}
            <div className={cn('col-start-1 row-start-1', activeTab !== 'file' && 'invisible pointer-events-none')}>
              <div>
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
            </div>

            {/* URL Import Panel */}
            <div className={cn('col-start-1 row-start-1 space-y-4', activeTab !== 'url' && 'invisible pointer-events-none')}>
              {/* Language mismatch warning */}
              {langMismatch && !langWarningDismissed && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-sans text-ui-sm text-amber-800">
                      This page appears to be in <strong>{langMismatch.detected}</strong>, but you are importing into{' '}
                      <strong>{langMismatch.importing}</strong>. Continue anyway?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLangWarningDismissed(true)}
                    className="font-sans text-ui-xs font-medium text-amber-700 hover:text-amber-900 shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* URL input */}
              <div>
                <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                  Article URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !fetchUrlMutation.isPending) void handleFetchUrl();
                    }}
                    placeholder="https://example.com/article"
                    disabled={fetchUrlMutation.isPending}
                    className="flex-1 px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => void handleFetchUrl()}
                    disabled={fetchUrlMutation.isPending || !urlInput.trim()}
                  >
                    {fetchUrlMutation.isPending ? 'Fetching…' : 'Fetch'}
                  </Button>
                </div>
                <p className="font-sans text-ui-xs text-muted mt-1">
                  Works on most articles and blogs. Paywalled and JavaScript-only pages cannot be extracted.
                </p>
              </div>
            </div>

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
                      type="button"
                      onClick={() => handleEditOpen(index)}
                      className="text-muted hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded p-1 shrink-0"
                      aria-label={`Edit content of ${text.title}`}
                    >
                      <Pencil size={16} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => handleRemoveText(index)}
                      className="text-muted hover:text-danger transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded p-1 shrink-0"
                      aria-label={`Remove ${text.title}`}
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content editor overlay */}
          {editingIndex !== null && (
            <ContentEditOverlay
              draft={editDraft}
              onChange={setEditDraft}
              onSave={handleEditSave}
              onCancel={() => setEditingIndex(null)}
            />
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

      <Toast message={toast.message} isOpen={toast.isOpen} onClose={hideToast} type={toast.type} />
    </>,
    document.body
  );
}

// ============================================================================
// Content Edit Overlay — rendered as a separate portal above the import modal
// ============================================================================

interface ContentEditOverlayProps {
  draft: { title: string; content: string };
  onChange: (draft: { title: string; content: string }) => void;
  onSave: () => void;
  onCancel: () => void;
}

function ContentEditOverlay({ draft, onChange, onSave, onCancel }: ContentEditOverlayProps) {
  const wordCount = draft.content.split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-60 bg-ink/60"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-2xl bg-paper rounded-card shadow-modal p-6 flex flex-col gap-4 pointer-events-auto max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Edit text content"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-ui-md font-semibold text-ink">Edit Text</h3>
            <button
              type="button"
              onClick={onCancel}
              className="text-muted hover:text-ink transition-colors rounded p-1 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Close editor"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          <div>
            <label className="block font-sans text-ui-sm font-medium text-ink mb-1">Title</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => onChange({ ...draft, title: e.target.value })}
              className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-1">
              <label className="font-sans text-ui-sm font-medium text-ink">Content</label>
              <span className="font-sans text-ui-xs text-muted">
                {wordCount.toLocaleString()} words
                {wordCount > 750 && (
                  <span className="ml-1 text-amber-600 font-medium">
                    · ~{Math.ceil(wordCount / 750)} parts after split
                  </span>
                )}
              </span>
            </div>
            <textarea
              value={draft.content}
              onChange={(e) => onChange({ ...draft, content: e.target.value })}
              className="w-full h-72 resize-y px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
              spellCheck={false}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="ghost" size="md" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onSave}
              disabled={draft.content.trim().length < 10 || draft.title.trim().length === 0}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
