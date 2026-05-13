'use client';

// ============================================================================
// Data Settings Page
// Export data and manage data deletion
// ============================================================================

import { useState } from 'react';
import { Download, AlertTriangle, Upload } from 'lucide-react';
import { SettingSection } from '@/components/settings/SettingSection';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function DataSettingsPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const [lwtFile, setLwtFile] = useState<File | null>(null);
  const [lwtStatus, setLwtStatus] = useState<string | null>(null);
  const [lwtLoading, setLwtLoading] = useState(false);

  const handleDeleteAllData = async () => {
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
    if (!lwtFile) return;
    setLwtLoading(true);
    setLwtStatus(null);
    const form = new FormData();
    form.append('file', lwtFile);
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

  return (
    <div className="space-y-6">
      {/* Export Data Section */}
      <SettingSection
        title="Export Your Data"
        description="Download your vocabulary and progress data"
      >
        <div className="space-y-3">
          <div>
            <Button
              variant="secondary"
              size="md"
              disabled
              leftIcon={<Download size={18} strokeWidth={2} />}
              className="w-full justify-start"
            >
              <span className="flex-1 text-left">Export as CSV</span>
            </Button>
            <p className="font-sans text-ui-xs text-muted mt-1 ml-1">Coming soon</p>
          </div>

          <div>
            <Button
              variant="secondary"
              size="md"
              disabled
              leftIcon={<Download size={18} strokeWidth={2} />}
              className="w-full justify-start"
            >
              <span className="flex-1 text-left">Export as JSON</span>
            </Button>
            <p className="font-sans text-ui-xs text-muted mt-1 ml-1">Coming soon</p>
          </div>

          <div>
            <Button
              variant="secondary"
              size="md"
              disabled
              leftIcon={<Download size={18} strokeWidth={2} />}
              className="w-full justify-start"
            >
              <span className="flex-1 text-left">Export as ZIP</span>
            </Button>
            <p className="font-sans text-ui-xs text-muted mt-1 ml-1">
              Coming soon — complete backup including vocabulary, progress, and settings
            </p>
          </div>
        </div>
      </SettingSection>

      {/* LWT Import Section */}
      <SettingSection
        title="Import LWT Vocabulary"
        description="Bulk-import vocabulary from a Learning With Texts .tsv export"
      >
        <div className="space-y-3">
          <input
            type="file"
            accept=".tsv"
            onChange={(e) => {
              setLwtFile(e.target.files?.[0] ?? null);
              setLwtStatus(null);
            }}
            className="block w-full font-sans text-ui-sm text-ink file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:font-sans file:text-ui-sm file:font-medium file:bg-surface file:text-ink hover:file:bg-surface/80 cursor-pointer"
          />
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Upload size={18} strokeWidth={2} />}
            onClick={handleLwtImport}
            disabled={!lwtFile || lwtLoading}
            className="w-full justify-start"
          >
            <span className="flex-1 text-left">
              {lwtLoading ? 'Importing…' : 'Import from LWT (.tsv)'}
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

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={!isDeleteEnabled}
                  className={`${
                    isDeleteEnabled
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-red-300 cursor-not-allowed'
                  }`}
                >
                  Delete All Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SettingSection>

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
