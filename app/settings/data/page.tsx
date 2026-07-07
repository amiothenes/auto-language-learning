'use client';

import { useState, useRef } from 'react';
import { AlertTriangle, Upload } from 'lucide-react';
import { SettingSection } from '@/components/settings/SettingSection';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LwtLanguageModal } from '@/components/ui/LwtLanguageModal';
import { cn } from '@/lib/utils';

export default function DataSettingsPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const [lwtFile, setLwtFile] = useState<File | null>(null);
  const [lwtStatus, setLwtStatus] = useState<string | null>(null);
  const [lwtLoading, setLwtLoading] = useState(false);
  const [showLwtLangModal, setShowLwtLangModal] = useState(false);
  const [detectedLangName, setDetectedLangName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteAllData = async () => {
    try {
      const res = await fetch('/api/data', { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Failed to delete data:', err);
        alert('Failed to delete data. Check the console for details.');
        return;
      }
      localStorage.clear();
      setDeleteInput('');
      setShowDeleteConfirm(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete data:', error);
      alert('Failed to delete data. Check the console for details.');
    }
  };

  const handleLwtImport = async () => {
    if (!lwtFile) return;
    setLwtStatus(null);

    const text = await lwtFile.text();
    const lines = text.split('\n').map((l) => l.trimEnd()).filter(Boolean);
    const firstValidRow = lines.find((line) => line.split('\t').length >= 6);
    const langName = firstValidRow ? firstValidRow.split('\t')[5].trim() : '';

    setDetectedLangName(langName || 'Unknown');
    setShowLwtLangModal(true);
  };

  const handleLwtModalConfirm = async (languageId: string) => {
    if (!lwtFile) return;
    setShowLwtLangModal(false);
    setLwtLoading(true);
    setLwtStatus(null);

    const form = new FormData();
    form.append('file', lwtFile);
    form.append('languageId', languageId);

    try {
      const res = await fetch('/api/vocabulary/import-lwt', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setLwtStatus(`Error: ${data.error}${data.details ? `. ${data.details}` : ''}`);
      } else {
        setLwtStatus(`Imported ${data.imported} words. Skipped ${data.skipped}.`);
      }
    } catch {
      setLwtStatus('Error: Request failed. Check console for details.');
    }
    setLwtLoading(false);
  };

  const isDeleteEnabled = deleteInput === 'DELETE';

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.tsv') || file.name.endsWith('.txt'))) {
      setLwtFile(file);
      setLwtStatus(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* LWT Import Section */}
      <SettingSection
        title="Import LWT Vocabulary"
        description="Bulk-import vocabulary from a Learning With Texts .tsv/.txt export"
      >
        <div className="space-y-3">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative flex flex-col items-center justify-center gap-2',
              'border-2 border-dashed rounded-card p-8 text-center cursor-pointer',
              'transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : lwtFile
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border hover:border-primary/40 hover:bg-desk'
            )}
          >
            <Upload className="w-6 h-6 text-muted" strokeWidth={1.5} />
            <p className="font-sans text-ui-sm text-ink font-medium">
              {lwtFile ? lwtFile.name : 'Drop .tsv or .txt here'}
            </p>
            <p className="font-sans text-ui-xs text-muted">
              {lwtFile ? 'Click to choose a different file' : 'or click to browse'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".tsv,.txt"
              className="sr-only"
              onChange={(e) => {
                setLwtFile(e.target.files?.[0] ?? null);
                setLwtStatus(null);
              }}
            />
          </div>

          <Button
            variant="secondary"
            size="md"
            leftIcon={<Upload size={18} strokeWidth={2} />}
            onClick={handleLwtImport}
            disabled={!lwtFile || lwtLoading}
            className="w-full justify-start"
          >
            <span className="flex-1 text-left">
              {lwtLoading ? 'Importing...' : 'Import from LWT (.tsv / .txt)'}
            </span>
          </Button>
          {lwtStatus && (
            <p className="font-sans text-ui-sm text-muted ml-1">{lwtStatus}</p>
          )}
        </div>
      </SettingSection>

      {/* Danger Zone */}
      <SettingSection
        title="Danger Zone"
        description="Irreversible actions that affect your data"
        variant="danger"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-danger/10 border border-danger/30 rounded">
            <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" strokeWidth={2} />
            <div className="flex-1">
              <h3 className="font-sans text-ui-base font-semibold text-ink mb-1">
                Delete All Data
              </h3>
              <p className="font-sans text-ui-sm text-muted mb-3">
                Permanently delete all your vocabulary, progress, and settings. This action
                cannot be undone.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                    Type <span className="font-mono font-bold">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-danger/40 rounded focus:outline-none focus:ring-2 focus:ring-danger focus:border-danger transition-all"
                  />
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={!isDeleteEnabled}
                  className={isDeleteEnabled ? 'bg-danger hover:brightness-90' : 'bg-danger/40 cursor-not-allowed'}
                >
                  Delete All Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SettingSection>

      <LwtLanguageModal
        isOpen={showLwtLangModal}
        onClose={() => setShowLwtLangModal(false)}
        onConfirm={handleLwtModalConfirm}
        detectedLanguageName={detectedLangName}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteInput('');
        }}
        onConfirm={handleDeleteAllData}
        title="Delete All Data?"
        message="This will permanently delete all your vocabulary, progress, and settings. This action cannot be undone and you will lose all your learning data."
        confirmLabel="Delete Everything"
        variant="danger"
        confirmationText="DELETE"
      />
    </div>
  );
}
