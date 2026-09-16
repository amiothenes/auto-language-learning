'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Upload } from 'lucide-react';
import { SettingSection } from '@/components/settings/SettingSection';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function DataSettingsPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

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

  const isDeleteEnabled = deleteInput === 'DELETE';

  return (
    <div className="space-y-6">
      {/* Vocabulary import now lives on the Vocabulary page itself, which
          also auto-detects LWT-format files — no separate importer here. */}
      <SettingSection
        title="Import Vocabulary"
        description="Bulk-import vocabulary, including raw LWT (Learning With Texts) exports"
      >
        <Link href="/vocabulary">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Upload size={18} strokeWidth={2} />}
            className="w-full justify-start"
          >
            <span className="flex-1 text-left">Go to Vocabulary &rarr; Import</span>
          </Button>
        </Link>
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
