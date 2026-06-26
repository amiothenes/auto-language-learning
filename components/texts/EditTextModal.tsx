'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';

const isDemo = !process.env.NEXT_PUBLIC_ADMIN_API_KEY;

const REPROCESS_STAGES = [
  'Sending to NLP service…',
  'Lemmatizing words…',
  'Romanizing script…',
  'Updating database…',
] as const;

// ============================================================================
// EditTextModal Component
// Modal for editing text title, tags, and content. Content edits trigger a
// full NLP reprocess via POST /api/texts/[id]/reprocess. Unchanged leading
// paragraphs are skipped (paragraph-level caching).
// ============================================================================

interface EditTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  textId: string;
  onSaved: () => void;
}

export function EditTextModal({ isOpen, onClose, textId, onSaved }: EditTextModalProps) {
  const [title, setTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [stageIndex, setStageIndex] = useState(0);
  const [changedParaCount, setChangedParaCount] = useState<number | null>(null);
  const [totalParaCount, setTotalParaCount] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Derived — placed early so effects and callbacks can reference it
  const hasContentChanged = contentInput !== originalContent;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch current text data when modal opens
  useEffect(() => {
    if (!isOpen || !textId) return;

    setFetchError(null);
    setSaveError(null);
    setIsFetching(true);
    previousFocusRef.current = document.activeElement as HTMLElement;

    fetch(`/api/texts/${textId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load text');
        return res.json() as Promise<{ text: { title: string; tags: string[]; content: string } }>;
      })
      .then(({ text }) => {
        setTitle(text.title);
        setTagsInput(text.tags.join(', '));
        setContentInput(text.content ?? '');
        setOriginalContent(text.content ?? '');
      })
      .catch(() => {
        setFetchError('Could not load text data. Please close and try again.');
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, [isOpen, textId]);

  // Auto-focus title after fetch completes
  useEffect(() => {
    if (isFetching || !isOpen) return;
    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isFetching, isOpen]);

  // Restore focus on close
  useEffect(() => {
    if (isOpen) return;
    previousFocusRef.current?.focus();
    previousFocusRef.current = null;
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    const selector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const els = dialogEl.querySelectorAll(selector);
      if (els.length === 0) return;
      const first = els[0] as HTMLElement;
      const last = els[els.length - 1] as HTMLElement;
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

  // Cycle shimmer stage labels while NLP reprocess is running
  useEffect(() => {
    if (!isSaving || !hasContentChanged) { setStageIndex(0); return; }
    if (stageIndex >= REPROCESS_STAGES.length - 1) return;
    const t = setTimeout(() => setStageIndex((p) => p + 1), 3000);
    return () => clearTimeout(t);
  }, [isSaving, hasContentChanged, stageIndex]);

  const handleBackdropClick = useCallback(() => {
    if (!isSaving) onClose();
  }, [isSaving, onClose]);

  const parseTags = (input: string): string[] =>
    input
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t.length <= 30)
      .slice(0, 10);

  const isFormValid = useMemo(
    () =>
      title.trim().length > 0 &&
      title.trim().length <= 200 &&
      (!hasContentChanged || contentInput.trim().length >= 10),
    [title, hasContentChanged, contentInput]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isDemo || !isFormValid) return;

      setSaveError(null);
      setIsSaving(true);

      try {
        if (hasContentChanged) {
          // Paragraph-level diff: find the first paragraph that changed so the
          // server can skip sending unchanged leading paragraphs to spaCy.
          const oldParas = originalContent.split('\n\n');
          const newParas = contentInput.trim().split('\n\n');
          const firstChangedIdx = newParas.findIndex((p, i) => p !== (oldParas[i] ?? ''));

          if (firstChangedIdx === -1) {
            // Content is identical after normalisation — skip reprocess entirely
          } else {
            setChangedParaCount(newParas.length - firstChangedIdx);
            setTotalParaCount(newParas.length);

            const reprocessRes = await fetch(`/api/texts/${textId}/reprocess`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '',
              },
              body: JSON.stringify({
                content: contentInput.trim(),
                firstChangedParagraphIndex: firstChangedIdx,
              }),
            });

            if (!reprocessRes.ok) {
              const data = await reprocessRes.json() as { error?: string };
              throw new Error(data.error ?? 'NLP reprocessing failed');
            }
          }
        }

        setSaveStatus('Saving metadata…');
        const patchRes = await fetch(`/api/texts/${textId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '',
          },
          body: JSON.stringify({ title: title.trim(), newTags: parseTags(tagsInput) }),
        });

        if (!patchRes.ok) {
          const data = await patchRes.json() as { error?: string };
          throw new Error(data.error ?? 'Failed to save changes');
        }

        onSaved();
        onClose();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
      } finally {
        setIsSaving(false);
        setSaveStatus('');
      }
    },
    [isFormValid, hasContentChanged, textId, title, tagsInput, contentInput, originalContent, onSaved, onClose]
  );

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-ink/40 animate-modal-backdrop-enter"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-text-dialog-title"
          className="relative w-full max-w-2xl bg-paper rounded-card shadow-modal animate-modal-enter p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* NLP Reprocess Shimmer Overlay */}
          {isSaving && hasContentChanged && (
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
                <p className="font-sans text-ui-sm font-medium text-ink">Re-processing text…</p>
                <p className="font-sans text-ui-xs text-muted mt-1">
                  {REPROCESS_STAGES[stageIndex]}
                </p>
                {changedParaCount !== null && totalParaCount !== null && (
                  <p className="font-sans text-ui-xs text-muted mt-2">
                    {changedParaCount} of {totalParaCount} paragraph{totalParaCount !== 1 ? 's' : ''} changed
                  </p>
                )}
              </div>
            </div>
          )}

          <h2
            id="edit-text-dialog-title"
            className="font-sans text-ui-lg font-semibold text-ink"
          >
            Edit Text
          </h2>

          {fetchError ? (
            <div className="mt-4 px-3 py-2 bg-red-50 border border-red-200 rounded">
              <p className="font-sans text-ui-sm text-red-800">{fetchError}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {saveError && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded">
                  <p className="font-sans text-ui-sm text-red-800">{saveError}</p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                  Title <span className="text-red-600">*</span>
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isFetching || isSaving}
                  placeholder={isFetching ? 'Loading…' : 'Text title'}
                  className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
                  maxLength={200}
                />
                <p className="font-sans text-ui-xs text-muted mt-1">
                  {title.trim().length}/200 characters
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                  Tags (Optional)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  disabled={isFetching || isSaving}
                  placeholder="e.g., news, politics, current-events"
                  className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
                />
                <p className="font-sans text-ui-xs text-muted mt-1">
                  Separate tags with commas. Max 10 tags, each max 30 characters.
                </p>
              </div>

              {/* Content */}
              <div>
                <label className="block font-sans text-ui-sm font-medium text-ink mb-1">
                  Text Content
                </label>
                <p className="font-sans text-ui-xs text-muted mb-2">
                  {hasContentChanged
                    ? 'Content changed — NLP will re-run on save (~10–30s)'
                    : 'Edit to re-parse with NLP and rebuild word highlights'}
                </p>
                <textarea
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  disabled={isFetching || isSaving}
                  rows={12}
                  className="w-full px-3 py-2 font-serif text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 resize-y"
                />
                {hasContentChanged && contentInput.trim().length < 10 && (
                  <p className="font-sans text-ui-xs text-red-600 mt-1">
                    Content must be at least 10 characters.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                {isSaving && saveStatus && (
                  <span className="self-center font-sans text-ui-sm text-muted">{saveStatus}</span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <span title={isDemo ? 'Not available in demo mode' : undefined}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isDemo || !isFormValid || isFetching || isSaving}
                  >
                    {isSaving
                      ? hasContentChanged
                        ? 'Processing…'
                        : 'Saving…'
                      : 'Save Changes'}
                  </Button>
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
