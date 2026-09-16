'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { VocabularyStatus } from '@/lib/types/vocabulary';

// ============================================================================
// ColumnMappingSection
// Inline block rendered inside ImportVocabularyModal itself (not a separate
// popup) after parsing a non-LWT-shaped CSV/TSV/TXT/JSON file — lets the
// user confirm or correct which column (or JSON key) is which, and what
// learning status rows without one should get, instead of trusting
// ImportVocabularyModal's alias/positional guess silently. For JSON,
// "header" is the union of object keys and each "row" is one object's
// values in that same key order.
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
  // Guard against an index the caller guessed that's outside the actual
  // column count (e.g. a fallback mapping assumed 5 columns but the real
  // file only has 2) — writing past the array's length wouldn't throw, but
  // it would silently produce a role no <select> ever renders, making the
  // mapping look valid while a required field is invisibly unset.
  const setRole = (index: number, role: ColumnRole) => {
    if (index >= 0 && index < columnCount) roles[index] = role;
  };
  setRole(mapping.lemmaIndex, 'lemma');
  setRole(mapping.translationIndex, 'translation');
  setRole(mapping.statusIndex, 'status');
  setRole(mapping.frequencyIndex, 'frequency');
  setRole(mapping.tagsIndex, 'tags');
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

interface ColumnMappingSectionProps {
  onConfirm: (mapping: ColumnMapping, defaultStatus: VocabularyStatus) => void;
  onCancel: () => void;
  /** Column labels — actual header cells if a header row was recognized, else synthetic "Column N". */
  header: string[];
  /** First few raw data rows (already split into columns) for an inline preview. */
  sampleRows: string[][];
  initialMapping: ColumnMapping;
}

export function ColumnMappingSection({
  onConfirm,
  onCancel,
  header,
  sampleRows,
  initialMapping,
}: ColumnMappingSectionProps) {
  // Lazy initializers only, deliberately — this component is remounted via a
  // `key` (see ImportVocabularyModal's mappingVersion) whenever a new file's
  // mapping needs confirming, so a fresh mount is what re-derives roles from
  // the new guess. No effect syncing initialMapping into state on every
  // render is needed, and one would just mirror a prop into state anyway.
  const [roles, setRoles] = useState<ColumnRole[]>(() => mappingToRoles(initialMapping, header.length));
  const [defaultStatus, setDefaultStatus] = useState<VocabularyStatus>(VocabularyStatus.NEWLY_SEEN);

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

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(mapping, defaultStatus);
  };

  return (
    <div className="mt-4 p-4 bg-desk border border-border rounded-card">
      <h3 className="font-sans text-ui-base font-semibold text-ink">Confirm Fields</h3>
      <p className="mt-1 font-sans text-ui-sm text-muted">
        Check that each column (or JSON key) below is mapped correctly before importing.
      </p>

      <div className="mt-3 border border-border rounded overflow-x-auto bg-paper">
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

      <p className="mt-2 font-sans text-ui-xs text-muted">
        Dictionary Frequency is 0-100. Tags are semicolon-separated. A lemma
        ending in &ldquo;?&rdquo; imports with the mark removed and status
        forced to Ignore.
      </p>

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
          className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <Button variant="secondary" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="md" onClick={handleConfirm} disabled={!isValid}>
          Confirm
        </Button>
      </div>
    </div>
  );
}
