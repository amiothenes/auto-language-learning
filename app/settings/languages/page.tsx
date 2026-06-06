'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { SettingSection } from '@/components/settings/SettingSection';
import { Select, SelectOption } from '@/components/settings/Select';
import { Toggle } from '@/components/settings/Toggle';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { AddLanguageModal, NewLanguageData } from '@/components/settings/AddLanguageModal';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useCreateLanguage } from '@/lib/hooks/useCreateLanguage';
import { useDeleteLanguage } from '@/lib/hooks/useDeleteLanguage';
import { useUpdateLanguage } from '@/lib/hooks/useUpdateLanguage';
import { useAutoSaveToast } from '@/components/ui/AutoSaveToast';
import type { LanguageItem } from '@/lib/types/api';

interface LanguageSettingsDraft {
  dictURI: string;
  googleTTSCode: string;
  isRTL: boolean;
  includeForeignScript: boolean;
}

export default function LanguagesSettingsPage() {
  const { languages, selectedLanguage, setSelectedLanguage } = useLanguage();
  const createLanguage = useCreateLanguage();
  const deleteLanguage = useDeleteLanguage();
  const updateLanguage = useUpdateLanguage();
  const { showSaved, ToastComponent } = useAutoSaveToast();

  // Derived: match active language ID from LanguageContext code
  const activeLanguageId = languages.find((l) => l.code === selectedLanguage)?.id ?? '';

  const [expandedLanguageId, setExpandedLanguageId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LanguageItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Per-language settings drafts — populated from DB data
  const [settingsDraft, setSettingsDraft] = useState<Record<string, LanguageSettingsDraft>>({});

  // Populate drafts from DB when languages load (only for unseen languages)
  useEffect(() => {
    setSettingsDraft((prev) => {
      const next = { ...prev };
      for (const lang of languages) {
        if (!next[lang.id]) {
          next[lang.id] = {
            dictURI: lang.dictURI ?? '',
            googleTTSCode: lang.googleTTSCode ?? '',
            isRTL: lang.isRTL,
            includeForeignScript: lang.includeForeignScript,
          };
        }
      }
      return next;
    });
  }, [languages]);

  const languageOptions: SelectOption[] = languages.map((lang) => ({
    value: lang.id,
    label: `${lang.name} (${lang.code})`,
  }));

  const handleLanguageSwitch = (languageId: string) => {
    const lang = languages.find((l) => l.id === languageId);
    if (lang) setSelectedLanguage(lang.code);
  };

  const handleToggleExpand = (languageId: string) => {
    setExpandedLanguageId((prev) => (prev === languageId ? null : languageId));
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    deleteLanguage.mutate(deleteTarget.id, {
      onSuccess: () => {
        // If deleted language was active, switch to first remaining
        if (deleteTarget.code === selectedLanguage) {
          const remaining = languages.find((l) => l.id !== deleteTarget.id);
          if (remaining) setSelectedLanguage(remaining.code);
        }
        setDeleteTarget(null);
        setExpandedLanguageId(null);
      },
      onError: (err) => {
        setDeleteError(err.message);
      },
    });
  };

  const handleAddLanguage = (newLanguageData: NewLanguageData) => {
    createLanguage.mutate(newLanguageData, {
      onSuccess: (newLang) => {
        setIsAddModalOpen(false);
        setExpandedLanguageId(newLang.id);
      },
    });
  };

  const handleSaveSettings = (languageId: string) => {
    const draft = settingsDraft[languageId];
    if (!draft) return;
    updateLanguage.mutate(
      { id: languageId, ...draft, dictURI: draft.dictURI || null, googleTTSCode: draft.googleTTSCode || null },
      { onSuccess: () => showSaved() }
    );
  };

  const patchDraft = (languageId: string, patch: Partial<LanguageSettingsDraft>) => {
    setSettingsDraft((prev) => ({
      ...prev,
      [languageId]: { ...prev[languageId], ...patch },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Current Language Selector */}
      <SettingSection
        title="Current Language"
        description="Select the language you're currently learning"
      >
        <Select
          options={languageOptions}
          value={activeLanguageId}
          onChange={handleLanguageSwitch}
          label="Active Language"
        />
      </SettingSection>

      {/* Language List */}
      <SettingSection
        title="My Languages"
        description="Manage your learning languages"
      >
        <div className="space-y-3">
          {languages.length === 0 && (
            <EmptyState
              illustration="globe"
              illustrationSize={96}
              title="No languages yet"
              description="Add a language to start tracking your vocabulary."
              primaryAction={{
                label: 'Add Your First Language',
                onClick: () => setIsAddModalOpen(true),
                icon: <Plus size={18} strokeWidth={2} />,
              }}
            />
          )}

          {languages.map((language) => {
            const isExpanded = expandedLanguageId === language.id;
            const isActive = language.id === activeLanguageId;
            const draft = settingsDraft[language.id];
            const isOnlyLanguage = languages.length === 1;

            return (
              <div
                key={language.id}
                className="border border-border rounded-card overflow-hidden"
              >
                {/* Language Card Header */}
                <div
                  onClick={() => handleToggleExpand(language.id)}
                  className="relative p-4 bg-paper flex items-center justify-between cursor-pointer hover:bg-desk/50 transition-colors"
                >
                  <div className="flex-1 flex items-center gap-3">
                    <ChevronDown
                      className={`w-5 h-5 text-muted transition-transform duration-300 shrink-0 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      strokeWidth={2}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-sans text-ui-base font-medium text-ink">
                          {language.name}
                        </h3>
                        <span className="font-sans text-ui-sm text-muted">
                          ({language.code})
                        </span>
                        {isActive && (
                          <span className="px-2 py-0.5 bg-primary text-white rounded text-ui-xs font-medium">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleLanguageSwitch(language.id)}
                      disabled={isActive}
                      className={isActive ? 'invisible' : ''}
                    >
                      Switch
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      ariaLabel={`Delete ${language.name}`}
                      disabled={isOnlyLanguage}
                      title={isOnlyLanguage ? 'Cannot delete the only language' : undefined}
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(language);
                      }}
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </Button>
                  </div>
                </div>

                {/* Language Settings Form */}
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-4 border-t border-border bg-desk">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Dictionary URI */}
                        <div>
                          <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                            Dictionary URI
                          </label>
                          <input
                            type="text"
                            placeholder="https://dictionary.example.com/{word}"
                            value={draft?.dictURI ?? ''}
                            onChange={(e) => patchDraft(language.id, { dictURI: e.target.value })}
                            className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                          <p className="font-sans text-ui-xs text-muted mt-1">
                            Use {'{word}'} as placeholder
                          </p>
                        </div>

                        {/* TTS Code */}
                        <div>
                          <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                            TTS Code
                          </label>
                          <input
                            type="text"
                            placeholder="es-ES"
                            value={draft?.googleTTSCode ?? ''}
                            onChange={(e) => patchDraft(language.id, { googleTTSCode: e.target.value })}
                            className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                          <p className="font-sans text-ui-xs text-muted mt-1">
                            e.g., es-ES, fr-FR, zh-CN
                          </p>
                        </div>

                        {/* RTL Toggle */}
                        <div className="md:col-span-2">
                          <Toggle
                            checked={draft?.isRTL ?? language.isRTL}
                            onChange={(checked) => patchDraft(language.id, { isRTL: checked })}
                            label="Right-to-Left (RTL)"
                            description="Enable for Arabic, Hebrew, Farsi…"
                          />
                        </div>

                        {/* Foreign Script Toggle */}
                        <div className="md:col-span-2">
                          <Toggle
                            checked={draft?.includeForeignScript ?? language.includeForeignScript}
                            onChange={(checked) => patchDraft(language.id, { includeForeignScript: checked })}
                            label="Include foreign-script words in parsing"
                            description="When off, words in other scripts (e.g. Latin in Russian) are skipped at import time."
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="md:col-span-2 flex gap-2 pt-1">
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={updateLanguage.isPending}
                            onClick={() => handleSaveSettings(language.id)}
                          >
                            {updateLanguage.isPending ? 'Saving…' : 'Save Changes'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedLanguageId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Language Button */}
        {languages.length > 0 && (
          <div className="mt-4">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Plus size={18} strokeWidth={2} />}
              onClick={() => setIsAddModalOpen(true)}
              disabled={createLanguage.isPending}
            >
              Add New Language
            </Button>
          </div>
        )}
      </SettingSection>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Language?"
        message={
          deleteError
            ? deleteError
            : `Deleting ${deleteTarget?.name} will permanently remove all associated vocabulary and texts. This action cannot be undone.`
        }
        confirmLabel={deleteLanguage.isPending ? 'Deleting…' : 'Delete'}
        variant="danger"
      />

      {/* Add Language Modal */}
      <AddLanguageModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddLanguage}
      />

      {ToastComponent}
    </div>
  );
}
