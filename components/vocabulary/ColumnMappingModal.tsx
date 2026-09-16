'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';

// ============================================================================
// ColumnMappingModal
// Shown after parsing a (non-LWT-shaped) CSV/TSV/TXT file, before the final
// import preview — lets the user confirm or correct which column is which,
// and what learning status rows without one should get, instead of trusting
// ImportVocabularyModal's header-alias/positional guess silently.
// ============================================================================

export type ColumnRole = 'lemma' | 'translation' | 'status' | 'frequency' | 'tags' | 'ignore';

export interface ColumnMapping {
  lemmaIndex: number;
  translationIndex: number;
  statusIndex: number;
  frequencyIndex: number;
  tagsIndex: number;
}

const ROLE_OPTIONS: { value: ColumnRole; label: string }[] = [
  { value: 'lemma', label: 'Lemma' },
  { value: 'translation', label: 'Translation' },
  { value: 'status', label: 'Status' },
  { value: 'frequency', label: 'Dictionary Frequency' },
  { value: 'tags', label: 'Tags' },
  { value: 'ignore', label: 'Ignore this column' },
];

const STATUS_OPTIONS: VocabularyStatus[] = [
  VocabularyStatus.NEWLY_SEEN,
  VocabularyStatus.FAMILIAR,
  VocabularyStatus.KNOWN,
  VocabularyStatus.WELL_KNOWN,
  VocabularyStatus.IGNORE,
];

function mappingToRoles(mapping: ColumnMapping, columnCount: number): ColumnRole[] {
  const roles: ColumnRole[] = new Array(columnCount).fill('ignore');
  if (mapping.lemmaIndex >= 0) roles[mapping.lemmaIndex] = 'lemma';
  if (mapping.translationIndex >= 0) roles[mapping.translationIndex] = 'translation';
  if (mapping.statusIndex >= 0) roles[mapping.statusIndex] = 'status';
  if (mapping.frequencyIndex >= 0) roles[mapping.frequencyIndex] = 'frequency';
  if (mapping.tagsIndex >= 0) roles[mapping.tagsIndex] = 'tags';
  return roles;
}

function rolesToMapping(roles: ColumnRole[]): ColumnMapping {
  return {
    lemmaIndex: roles.indexOf('lemma'),
    translationIndex: roles.indexOf('translation'),
    statusIndex: roles.indexOf('status'),
    frequencyIndex: roles.indexOf('frequency'),
    tagsIndex: roles.indexOf('tags'),
  };
}

interface ColumnMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mapping: ColumnMapping, defaultStatus: VocabularyStatus) => void;
  /** Column labels — actual header cells if a header row was recognized, else synthetic "Column N". */
  header: string[];
  /** First few raw data rows (already split into columns) for an inline preview. */
  sampleRows: string[][];
  initialMapping: ColumnMapping;
}

export function ColumnMappingModal({
  isOpen,
  onClose,
  onConfirm,
  header,
  sampleRows,
  initialMapping,
}: ColumnMappingModalProps) {
  const [mounted, setMounted] = useState(false);
  const [roles, setRoles] = useState<ColumnRole[]>(() => mappingToRoles(initialMapping, header.length));
  const [defaultStatus, setDefaultStatus] = useState<VocabularyStatus>(VocabularyStatus.NEWLY_SEEN);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset to the freshly-guessed mapping whenever a new file's mapping is opened
  useEffect(() => {
    if (isOpen) {
      setRoles(mappingToRoles(initialMapping, header.length));
      setDefaultStatus(VocabularyStatus.NEWLY_SEEN);
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen, initialMapping, header.length]);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) return;
    previousFocusRef.current?.focus();
    previousFocusRef.current = null;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    const selector = 'button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
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

  const handleBackdropClick = useCallback(() => onClose(), [onClose]);

  // A role picked for one column bumps any other column currently holding
  // that same role back to "ignore" — lemma/translation/status/frequency/tags
  // must each point at zero or one column. Multiple "ignore" columns are fine.
  const handleRoleChange = (columnIndex: number, role: ColumnRole) => {
    setRoles((prev) =>
      prev.map((r, i) => {
        if (i === columnIndex) return role;
        if (role !== 'ignore' && r === role) return 'ignore';
        return r;
      })
    );
  };

  const mapping = rolesToMapping(roles);
  const isValid = mapping.lemmaIndex !== -1 && mapping.translationIndex !== -1;

  const handleConfirm = useCallback(() => {
    if (!isValid) return;
    onConfirm(mapping, defaultStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mapping/isValid derive from roles each render; including them would just restate that dependency
  }, [isValid, defaultStatus, onConfirm]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50 bg-ink/40 animate-modal-backdrop-enter"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="column-mapping-title"
          className="w-full max-w-2xl bg-paper rounded-card shadow-modal animate-modal-enter p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="column-mapping-title" className="font-sans text-ui-lg font-semibold text-ink">
            Confirm Columns
          </h2>
          <p className="mt-2 font-sans text-ui-sm text-muted">
            Check that each column below is mapped correctly before importing.
          </p>

          <div className="mt-4 border border-border rounded overflow-x-auto">
            <table className="w-full">
              <thead className="bg-desk border-b border-border">
                <tr>
                  {header.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-sans text-ui-xs font-semibold text-ink whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border bg-desk/50">
                  {header.map((_, i) => (
                    <td key={i} className="px-3 py-2">
                      <select
                        value={roles[i]}
                        onChange={(e) => handleRoleChange(i, e.target.value as ColumnRole)}
                        className="w-full px-2 py-1 font-sans text-ui-xs text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
                {sampleRows.slice(0, 3).map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-border last:border-0">
                    {header.map((_, i) => (
                      <td key={i} className="px-3 py-2 font-sans text-ui-sm text-muted whitespace-nowrap">
                        {row[i] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isValid && (
            <p className="mt-2 font-sans text-ui-xs text-danger">
              Pick one column as Lemma and one as Translation to continue.
            </p>
          )}

          <div className="mt-4">
            <label
              htmlFor="default-status-select"
              className="block font-sans text-ui-sm font-medium text-ink mb-1.5"
            >
              Learning status for rows with no Status column, or an unrecognized value
            </label>
            <select
              id="default-status-select"
              value={defaultStatus}
              onChange={(e) => setDefaultStatus(e.target.value as VocabularyStatus)}
              className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-desk border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleConfirm} disabled={!isValid}>
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
