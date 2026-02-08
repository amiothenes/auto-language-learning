'use client';

// ============================================================================
// Languages Settings Page
// Manage learning languages and their settings
// ============================================================================

import { useState } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { SettingSection } from '@/components/settings/SettingSection';
import { Select, SelectOption } from '@/components/settings/Select';
import { Toggle } from '@/components/settings/Toggle';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AddLanguageModal, NewLanguageData } from '@/components/settings/AddLanguageModal';

interface Language {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  dictUri?: string;
  ttsCode?: string;
  rtl?: boolean;
}

const INITIAL_LANGUAGES: Language[] = [
  { id: '1', name: 'Spanish', code: 'es', isActive: true },
  { id: '2', name: 'French', code: 'fr', isActive: false },
  { id: '3', name: 'Russian', code: 'ru', isActive: false },
];

export default function LanguagesSettingsPage() {
  const [languages, setLanguages] = useState<Language[]>(INITIAL_LANGUAGES);
  const [expandedLanguageId, setExpandedLanguageId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Language | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Get current active language
  const activeLanguage = languages.find((lang) => lang.isActive);
  const activeLanguageId = activeLanguage?.id || '';

  // Language options for selector
  const languageOptions: SelectOption[] = languages.map((lang) => ({
    value: lang.id,
    label: `${lang.name} (${lang.code})`,
  }));

  const handleChangeActiveLanguage = (languageId: string) => {
    setLanguages((prev) =>
      prev.map((lang) => ({
        ...lang,
        isActive: lang.id === languageId,
      }))
    );
  };

  const handleSwitchLanguage = (languageId: string) => {
    handleChangeActiveLanguage(languageId);
    console.log('Switched to language:', languageId);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      setLanguages((prev) => prev.filter((lang) => lang.id !== deleteTarget.id));
      console.log('Deleted language:', deleteTarget.id);
      setDeleteTarget(null);
      setExpandedLanguageId(null);
    }
  };

  const handleToggleExpand = (languageId: string) => {
    setExpandedLanguageId((prev) => (prev === languageId ? null : languageId));
  };

  const handleSaveLanguageSettings = (languageId: string) => {
    console.log('Saving settings for language:', languageId);
    // In a real app, this would save to the backend
  };

  const handleAddLanguage = (newLanguageData: NewLanguageData) => {
    const newLang: Language = {
      id: Date.now().toString(),
      ...newLanguageData,
      isActive: false,
    };

    setLanguages((prev) => [...prev, newLang]);
    setIsAddModalOpen(false);
    console.log('Added new language:', newLang);
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
          onChange={handleChangeActiveLanguage}
          label="Active Language"
        />
      </SettingSection>

      {/* Language List */}
      <SettingSection
        title="My Languages"
        description="Manage your learning languages"
      >
        <div className="space-y-3">
          {languages.map((language) => {
            const isExpanded = expandedLanguageId === language.id;

            return (
              <div
                key={language.id}
                className="border border-border rounded-card overflow-hidden"
              >
                {/* Language Card Header - Stays Fixed */}
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
                        {language.isActive && (
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
                      onClick={() => handleSwitchLanguage(language.id)}
                      disabled={language.isActive}
                      className={language.isActive ? 'invisible' : ''}
                    >
                      Switch
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      onClick={() => setDeleteTarget(language)}
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </Button>
                  </div>
                </div>

                {/* Language Settings Form - Expands Downward */}
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-4 border-t border-border bg-desk space-y-4">
                  <div>
                    <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                      Dictionary URI
                    </label>
                    <input
                      type="text"
                      placeholder="https://dictionary.example.com/{word}"
                      defaultValue={language.dictUri || ''}
                      className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                    <p className="font-sans text-ui-xs text-muted mt-1">
                      Use {'{word}'} as a placeholder for the word to look up
                    </p>
                  </div>

                  <div>
                    <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                      TTS Code
                    </label>
                    <input
                      type="text"
                      placeholder="es-ES"
                      defaultValue={language.ttsCode || ''}
                      className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                    <p className="font-sans text-ui-xs text-muted mt-1">
                      Text-to-speech language code (e.g., es-ES, fr-FR)
                    </p>
                  </div>

                  <div>
                    <Toggle
                      checked={language.rtl || false}
                      onChange={(checked) => {
                        setLanguages((prev) =>
                          prev.map((lang) =>
                            lang.id === language.id ? { ...lang, rtl: checked } : lang
                          )
                        );
                      }}
                      label="Right-to-Left (RTL)"
                      description="Enable for Arabic, Hebrew, and other RTL languages"
                    />
                  </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSaveLanguageSettings(language.id)}
                        >
                          Save Changes
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
            );
          })}
        </div>

        {/* Add New Language Button */}
        <div className="mt-4">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Plus size={18} strokeWidth={2} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add New Language
          </Button>
        </div>
      </SettingSection>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Language?"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Add Language Modal */}
      <AddLanguageModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddLanguage}
      />
    </div>
  );
}
