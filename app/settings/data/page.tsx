'use client';

// ============================================================================
// Data Settings Page
// Export data and manage data deletion
// ============================================================================

import { useState } from 'react';
import { Download, AlertTriangle } from 'lucide-react';
import { SettingSection } from '@/components/settings/SettingSection';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function DataSettingsPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const handleExportCSV = () => {
    console.log('Exporting as CSV...');
    // TODO: Implement actual CSV export
  };

  const handleExportJSON = () => {
    console.log('Exporting as JSON...');
    // TODO: Implement actual JSON export
  };

  const handleExportZIP = () => {
    console.log('Exporting as ZIP...');
    // TODO: Implement actual ZIP export with all data
  };

  const handleDeleteAllData = () => {
    console.log('Deleting all data...');
    // Clear localStorage
    try {
      localStorage.clear();
      console.log('All data deleted successfully');
      // Reset delete input and close dialog
      setDeleteInput('');
      setShowDeleteConfirm(false);
      // Refresh the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete data:', error);
    }
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
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Download size={18} strokeWidth={2} />}
            onClick={handleExportCSV}
            className="w-full justify-start"
          >
            <span className="flex-1 text-left">Export as CSV</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            leftIcon={<Download size={18} strokeWidth={2} />}
            onClick={handleExportJSON}
            className="w-full justify-start"
          >
            <span className="flex-1 text-left">Export as JSON</span>
          </Button>

          <div>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Download size={18} strokeWidth={2} />}
              onClick={handleExportZIP}
              className="w-full justify-start"
            >
              <span className="flex-1 text-left">Export as ZIP</span>
            </Button>
            <p className="font-sans text-ui-xs text-muted mt-2 ml-1">
              Complete backup of all data including vocabulary, progress, and settings
            </p>
          </div>
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
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
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
