'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Heading, Muted } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { Type, Globe, Database, Info, ChevronLeft } from 'lucide-react';

// ============================================================================
// Settings Page
// Tab-based navigation: Display, Languages, Data, About
// ============================================================================

type SettingsTab = 'display' | 'languages' | 'data' | 'about';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('display');
  const router = useRouter();

  const tabs: Array<{ id: SettingsTab; label: string; icon: typeof Type }> = [
    { id: 'display', label: 'Display', icon: Type },
    { id: 'languages', label: 'Languages', icon: Globe },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'about', label: 'About', icon: Info },
  ];

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-sans text-ui-base font-medium mb-6"
        >
          <ChevronLeft size={18} strokeWidth={2} />
          <span>Back</span>
        </button>

        {/* Page Header */}
        <div className="mb-8">
          <Heading size="xl" as="h1" className="mb-2">
            Settings
          </Heading>
          <Muted>Customize your learning experience</Muted>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-border overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 font-sans text-ui-base font-medium transition-colors border-b-2 whitespace-nowrap',
                  isActive
                    ? 'text-primary border-primary'
                    : 'text-muted border-transparent hover:text-ink hover:border-border'
                )}
              >
                <Icon size={18} strokeWidth={1.5} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'display' && <DisplayTab />}
          {activeTab === 'languages' && <PlaceholderTab title="Languages" />}
          {activeTab === 'data' && <PlaceholderTab title="Data" />}
          {activeTab === 'about' && <PlaceholderTab title="About" />}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Display Tab - Reader Settings
// ============================================================================

function DisplayTab() {
  const {
    settings,
    updateFontSize,
    updateHighlightIntensity,
    updateShowWellKnownWords,
    updateColorScheme,
  } = useReaderSettings();

  return (
    <div className="space-y-8">
      {/* Reader Settings Section */}
      <section className="bg-paper border border-border rounded-card p-6 shadow-raised">
        <div className="mb-6">
          <Heading size="md" as="h2" className="mb-1">
            Reader Settings
          </Heading>
          <Muted className="text-ui-sm">
            Customize how text appears in the reader view
          </Muted>
        </div>

        <div className="space-y-6">
          {/* Font Size Controls */}
          <div>
            <label className="block font-sans text-ui-base font-medium text-ink mb-3">
              Font Size
            </label>
            <div className="flex gap-2">
              <Button
                variant={settings.fontSize === 'small' ? 'primary' : 'secondary'}
                size="md"
                onClick={() => updateFontSize('small')}
                className="flex-1"
              >
                A−
              </Button>
              <Button
                variant={settings.fontSize === 'medium' ? 'primary' : 'secondary'}
                size="md"
                onClick={() => updateFontSize('medium')}
                className="flex-1"
              >
                A
              </Button>
              <Button
                variant={settings.fontSize === 'large' ? 'primary' : 'secondary'}
                size="md"
                onClick={() => updateFontSize('large')}
                className="flex-1"
              >
                A+
              </Button>
            </div>
            <Muted className="text-ui-xs mt-2">
              {settings.fontSize === 'small' && '16px - Compact reading'}
              {settings.fontSize === 'medium' && '18px - Default (recommended)'}
              {settings.fontSize === 'large' && '20px - Comfortable reading'}
            </Muted>
          </div>

          {/* Highlight Intensity Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="font-sans text-ui-base font-medium text-ink">
                Highlight Intensity
              </label>
              <span className="font-sans text-ui-sm text-primary font-semibold">
                {settings.highlightIntensity}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.highlightIntensity}
              onChange={(e) => updateHighlightIntensity(Number(e.target.value))}
              className="w-full h-2 bg-border rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #183A37 0%, #183A37 ${settings.highlightIntensity}%, #E5E2DA ${settings.highlightIntensity}%, #E5E2DA 100%)`,
              }}
            />
            <Muted className="text-ui-xs mt-2">
              Controls the opacity of word highlighting (0% = no highlights, 100% = full intensity)
            </Muted>
          </div>

          {/* Well-Known Words Toggle */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="show-well-known"
              checked={settings.showWellKnownWords}
              onChange={(e) => updateShowWellKnownWords(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary bg-paper border-border rounded focus:ring-2 focus:ring-primary focus:ring-offset-1 cursor-pointer"
            />
            <div className="flex-1">
              <label
                htmlFor="show-well-known"
                className="font-sans text-ui-base font-medium text-ink cursor-pointer"
              >
                Show well-known words
              </label>
              <Muted className="text-ui-xs mt-1">
                When unchecked, well-known words appear dimmed in the reader
              </Muted>
            </div>
          </div>

          {/* Color Scheme Selector */}
          <div>
            <label className="block font-sans text-ui-base font-medium text-ink mb-3">
              Color Scheme
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => updateColorScheme('light')}
                className={cn(
                  'flex-1 p-4 border-2 rounded-card transition-all',
                  settings.colorScheme === 'light'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-sans text-ui-base font-medium text-ink">
                    Light
                  </span>
                  {settings.colorScheme === 'light' && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  )}
                </div>
                <Muted className="text-ui-xs text-left">
                  Academic-Naturalist palette
                </Muted>
              </button>

              <button
                onClick={() => updateColorScheme('dark')}
                className={cn(
                  'flex-1 p-4 border-2 rounded-card transition-all',
                  settings.colorScheme === 'dark'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-sans text-ui-base font-medium text-ink">
                    Dark
                  </span>
                  {settings.colorScheme === 'dark' && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  )}
                </div>
                <Muted className="text-ui-xs text-left">
                  Coming soon
                </Muted>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Settings auto-save notice */}
      <div className="flex items-center gap-2 text-muted">
        <svg
          className="w-4 h-4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <Muted className="text-ui-xs">
          Settings are automatically saved as you change them
        </Muted>
      </div>
    </div>
  );
}

// ============================================================================
// Placeholder Tab Component
// ============================================================================

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="bg-paper border border-border rounded-card p-8 shadow-raised text-center">
      <Heading size="md" as="h2" className="mb-2">
        {title}
      </Heading>
      <Muted>This section is coming soon</Muted>
    </div>
  );
}
