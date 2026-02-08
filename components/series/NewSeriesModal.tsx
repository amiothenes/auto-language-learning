'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Upload, FileText, Trash2 } from 'lucide-react';
import type { NewSeriesData, ImportedTextData } from '@/lib/types/forms';

// ============================================================================
// NewSeriesModal Component
// Multi-step modal for creating a series with optional text import
// ============================================================================

interface NewSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (seriesData: NewSeriesData) => void;
}

type Step = 1 | 2;

export function NewSeriesModal({
  isOpen,
  onClose,
  onAdd,
}: NewSeriesModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [importTexts, setImportTexts] = useState(false);
  const [bulkPasteContent, setBulkPasteContent] = useState('');
  const [importedTexts, setImportedTexts] = useState<ImportedTextData[]>([]);
  const [mounted, setMounted] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SSR guard for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData({
        name: '',
        description: '',
      });
      setImportTexts(false);
      setBulkPasteContent('');
      setImportedTexts([]);
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Auto-focus on name input when opened
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (nameInputRef.current && currentStep === 1) {
        nameInputRef.current.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen, currentStep]);

  // Restore focus on close
  useEffect(() => {
    if (isOpen) return;
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Escape key dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusableElements = dialogEl.querySelectorAll(focusableSelector);
      if (focusableElements.length === 0) return;

      const first = focusableElements[0] as HTMLElement;
      const last = focusableElements[focusableElements.length - 1] as HTMLElement;

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

  // Backdrop click handler
  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Step 1 validation
  const isStep1Valid = useMemo(() => {
    return (
      formData.name.trim() !== '' &&
      formData.name.trim().length <= 100 &&
      formData.description.trim() !== '' &&
      formData.description.trim().length <= 500
    );
  }, [formData]);

  // Parse bulk paste content (texts separated by ---)
  const parseBulkPaste = (content: string): ImportedTextData[] => {
    const texts = content
      .split('---')
      .map((text) => text.trim())
      .filter((text) => text.length >= 10);

    return texts.map((text, index) => {
      // Try to extract title from first line
      const lines = text.split('\n').filter((line) => line.trim() !== '');
      const title =
        lines.length > 0 && lines[0].length <= 200
          ? lines[0].trim()
          : `Text ${index + 1}`;

      return {
        title,
        content: text,
      };
    });
  };

  // Handle bulk paste processing
  const handleProcessBulkPaste = () => {
    if (bulkPasteContent.trim() === '') return;
    const parsed = parseBulkPaste(bulkPasteContent);
    setImportedTexts(parsed);
    setBulkPasteContent(''); // Clear textarea after processing
  };

  // Handle file upload (simplified for now - just .txt files)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileReaders: Promise<ImportedTextData>[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) return; // Skip files > 10MB

      const reader = new FileReader();
      const promise = new Promise<ImportedTextData>((resolve) => {
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content && content.trim().length >= 10) {
            resolve({
              title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
              content: content.trim(),
            });
          }
        };
        reader.readAsText(file);
      });

      fileReaders.push(promise);
    });

    Promise.all(fileReaders).then((texts) => {
      setImportedTexts((prev) => [...prev, ...texts]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove imported text from list
  const handleRemoveText = (index: number) => {
    setImportedTexts((prev) => prev.filter((_, i) => i !== index));
  };

  // Update text title
  const handleUpdateTextTitle = (index: number, newTitle: string) => {
    setImportedTexts((prev) =>
      prev.map((text, i) => (i === index ? { ...text, title: newTitle } : text))
    );
  };

  // Handle Step 1 -> Step 2
  const handleContinueToStep2 = () => {
    if (!isStep1Valid) return;
    setCurrentStep(2);
  };

  // Handle Step 2 -> Step 1 (back button)
  const handleBackToStep1 = () => {
    setCurrentStep(1);
  };

  // Final submission
  const handleSubmit = useCallback(() => {
    if (!isStep1Valid) return;

    const seriesData: NewSeriesData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      texts: importedTexts.length > 0 ? importedTexts : undefined,
    };

    onAdd(seriesData);
  }, [formData, importedTexts, isStep1Valid, onAdd]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-ink/40 animate-modal-backdrop-enter"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Dialog Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-series-dialog-title"
          className="w-full max-w-2xl bg-paper rounded-card shadow-modal animate-modal-enter p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with back button on Step 2 */}
          <div className="flex items-center gap-3 mb-4">
            {currentStep === 2 && (
              <button
                onClick={handleBackToStep1}
                className="text-muted hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded p-1"
                aria-label="Go back to series details"
              >
                <ChevronLeft size={20} strokeWidth={2} />
              </button>
            )}
            <h2
              id="new-series-dialog-title"
              className="font-sans text-ui-lg font-semibold text-ink"
            >
              {currentStep === 1 ? 'Create New Series' : 'Import Texts (Optional)'}
            </h2>
            <span className="ml-auto font-sans text-ui-xs text-muted">
              Step {currentStep} of 2
            </span>
          </div>

          {/* Step 1: Series Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Series Name */}
              <div>
                <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                  Series Name <span className="text-red-600">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="e.g., Russian News Articles"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  maxLength={100}
                />
                <p className="font-sans text-ui-xs text-muted mt-1">
                  {formData.name.trim().length}/100 characters
                </p>
              </div>

              {/* Series Description */}
              <div>
                <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  placeholder="Describe the series content and purpose..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-vertical"
                  rows={4}
                  maxLength={500}
                />
                <p className="font-sans text-ui-xs text-muted mt-1">
                  {formData.description.trim().length}/500 characters
                </p>
              </div>

              {/* Import Texts Checkbox */}
              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="import-texts-checkbox"
                  checked={importTexts}
                  onChange={(e) => setImportTexts(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-primary bg-paper border-border rounded focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
                <label
                  htmlFor="import-texts-checkbox"
                  className="font-sans text-ui-sm text-ink cursor-pointer"
                >
                  Import texts now (optional)
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" size="md" onClick={onClose}>
                  Cancel
                </Button>
                {importTexts ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleContinueToStep2}
                    disabled={!isStep1Valid}
                  >
                    Continue to Import
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleSubmit}
                    disabled={!isStep1Valid}
                  >
                    Create Series
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Import Texts */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Bulk Paste Section */}
              <div>
                <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                  Paste Multiple Texts
                </label>
                <textarea
                  placeholder="Paste texts here, separated by --- (three dashes)"
                  value={bulkPasteContent}
                  onChange={(e) => setBulkPasteContent(e.target.value)}
                  className="w-full px-3 py-2 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-vertical"
                  rows={6}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="font-sans text-ui-xs text-muted">
                    Separate texts with <span className="font-mono">---</span>
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleProcessBulkPaste}
                    disabled={bulkPasteContent.trim() === ''}
                  >
                    Process Texts
                  </Button>
                </div>
              </div>

              {/* OR Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-border" />
                <span className="font-sans text-ui-xs text-muted">OR</span>
                <div className="flex-1 border-t border-border" />
              </div>

              {/* File Upload Section */}
              <div>
                <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                  Upload Text Files
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload-input"
                />
                <label htmlFor="file-upload-input">
                  <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded cursor-pointer hover:border-primary transition-colors">
                    <Upload size={18} strokeWidth={1.5} className="text-muted" />
                    <span className="font-sans text-ui-sm text-muted">
                      Choose .txt files (max 10MB each)
                    </span>
                  </div>
                </label>
              </div>

              {/* Imported Texts Preview */}
              {importedTexts.length > 0 && (
                <div>
                  <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
                    Imported Texts ({importedTexts.length})
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {importedTexts.map((text, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-desk border border-border rounded"
                      >
                        <FileText size={16} className="text-muted flex-shrink-0" />
                        <input
                          type="text"
                          value={text.title}
                          onChange={(e) =>
                            handleUpdateTextTitle(index, e.target.value)
                          }
                          className="flex-1 px-2 py-1 font-sans text-ui-sm text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          onClick={() => handleRemoveText(index)}
                          className="text-muted hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded p-1"
                          aria-label={`Remove ${text.title}`}
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={handleBackToStep1}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleSubmit}
                  disabled={!isStep1Valid}
                >
                  {importedTexts.length > 0
                    ? `Create Series with ${importedTexts.length} Text${
                        importedTexts.length > 1 ? 's' : ''
                      }`
                    : 'Create Empty Series'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
