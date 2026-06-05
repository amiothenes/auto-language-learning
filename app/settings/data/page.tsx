'use client';

import { useState, useRef } from 'react';

const isDemo = !process.env.NEXT_PUBLIC_ADMIN_API_KEY;
import { Download, AlertTriangle, Upload } from 'lucide-react';
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
    if (isDemo) return;
    try {
      const res = await fetch('/api/data', {
        method: 'DELETE',
        headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '' },
      });
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
    if (isDemo || !lwtFile) return;
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
      const res = await fetch('/api/vocabulary/import-lwt', {
        method: 'POST',
        headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '' },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setLwtStatus(`Error: ${data.error}${data.details ? ` — ${data.details}` : ''}`);
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
      {/* Export Data Section */}
      <SettingSection
        title="Export Your Data"
        description="Download your vocabulary and progress data"
      >
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            size="md"
            disabled
            leftIcon={<Download size={16} strokeWidth={2} />}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="md"
            disabled
            leftIcon={<Download size={16} strokeWidth={2} />}
          >
            Export JSON
          </Button>
          <Button
            variant="secondary"
            size="md"
            disabled
            leftIcon={<Download size={16} strokeWidth={2} />}
          >
            Export ZIP
          </Button>
        </div>
        <p className="font-sans text-ui-xs text-muted mt-2">
          Coming soon — CSV vocab list · JSON full export · ZIP complete backup
        </p>
      </SettingSection>

      {/* LWT Import Section */}
      <SettingSection
        title="Import LWT Vocabulary"
        description="Bulk-import vocabulary from a Learning With Texts .tsv/.txt export"
      >
        <div className="space-y-3">
          {/* Drag-and-drop zone */}
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

          <span title={isDemo ? 'Not available in demo mode' : undefined}>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Upload size={18} strokeWidth={2} />}
              onClick={handleLwtImport}
              disabled={isDemo || !lwtFile || lwtLoading}
              className="w-full justify-start"
            >
              <span className="flex-1 text-left">
                {lwtLoading ? 'Importing…' : 'Import from LWT (.tsv / .txt)'}
              </span>
            </Button>
          </span>
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
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" strokeWidth={2} />
            <div className="flex-1">
              <h3 className="font-sans text-ui-base font-semibold text-red-900 mb-1">
                Delete All Data
              </h3>
              <p className="font-sans text-ui-sm text-red-700 mb-3">
                Permanently delete all your vocabulary, progress, and settings. This action
                cannot be undone.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block font-sans text-ui-sm font-medium text-red-900 mb-2">
                    Type <span className="font-mono font-bold">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-white border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  />
                </div>

                <span title={isDemo ? 'Not available in demo mode' : undefined}>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDemo || !isDeleteEnabled}
                    className={`${
                      isDeleteEnabled && !isDemo
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-red-300 cursor-not-allowed'
                    }`}
                  >
                    Delete All Data
                  </Button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </SettingSection>

      {/* LWT Language Confirmation Modal */}
      <LwtLanguageModal
        isOpen={showLwtLangModal}
        onClose={() => setShowLwtLangModal(false)}
        onConfirm={handleLwtModalConfirm}
        detectedLanguageName={detectedLangName}
      />

      {/* Delete Confirmation Dialog */}
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
