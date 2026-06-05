'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { SettingSection } from '@/components/settings/SettingSection';
import { SettingRow } from '@/components/settings/SettingRow';
import { RadioGroup, RadioOption } from '@/components/settings/RadioGroup';
import { Slider } from '@/components/settings/Slider';
import { Toggle } from '@/components/settings/Toggle';
import { Select, SelectOption } from '@/components/settings/Select';
import { useAutoSaveToast } from '@/components/ui/AutoSaveToast';
import { cn } from '@/lib/utils';

export default function DisplaySettingsPage() {
  const {
    settings,
    updateFontSize,
    updateHighlightIntensity,
    updateShowWellKnownWords,
    updateColorScheme,
  } = useReaderSettings();
  const { showSaved, ToastComponent } = useAutoSaveToast();

  const [dashboardLayout, setDashboardLayout] = useState<'grid' | 'list'>('grid');
  const [textsCount, setTextsCount] = useState('20');
  const [graphRange, setGraphRange] = useState('30');

  const fontSizeOptions: RadioOption[] = [
    { value: 'small', label: 'A−', description: '16px - Compact reading' },
    { value: 'medium', label: 'A', description: '18px - Default (recommended)' },
    { value: 'large', label: 'A+', description: '20px - Comfortable reading' },
  ];

  const layoutOptions: RadioOption[] = [
    { value: 'grid', label: 'Grid', description: 'Card-based grid layout' },
    { value: 'list', label: 'List', description: 'Compact list view' },
  ];

  const textsCountOptions: SelectOption[] = [
    { value: '10', label: '10 texts' },
    { value: '20', label: '20 texts' },
    { value: '30', label: '30 texts' },
    { value: '50', label: '50 texts' },
  ];

  const graphRangeOptions: SelectOption[] = [
    { value: '7', label: 'Last 7 days' },
    { value: '14', label: 'Last 14 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
  ];

  return (
    <div className="space-y-6">
      {/* Reader Section */}
      <SettingSection
        title="Reader"
        description="How text appears in the reading view"
      >
        <SettingRow label="Font Size" description="Choose your preferred reading size">
          <RadioGroup
            options={fontSizeOptions}
            value={settings.fontSize}
            onChange={(value) => {
              updateFontSize(value as 'small' | 'medium' | 'large');
              showSaved();
            }}
            name="fontSize"
          />
        </SettingRow>

        <SettingRow
          label="Highlight Intensity"
          description="Controls the opacity of word highlighting"
          value={`${settings.highlightIntensity}%`}
        >
          <Slider
            value={settings.highlightIntensity}
            onChange={(v) => {
              updateHighlightIntensity(v);
              showSaved();
            }}
            min={0}
            max={100}
            step={5}
            showValue={false}
          />
        </SettingRow>

        <SettingRow
          label="Show Well-Known Words"
          description="When disabled, well-known words appear dimmed in the reader"
        >
          <Toggle
            checked={settings.showWellKnownWords}
            onChange={(v) => {
              updateShowWellKnownWords(v);
              showSaved();
            }}
          />
        </SettingRow>
      </SettingSection>

      {/* Theme Section */}
      <SettingSection
        title="Theme"
        description="Application color scheme"
      >
        <SettingRow label="Color Scheme" description="Choose your preferred theme">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color Scheme">
            {/* Light — active */}
            <label className="cursor-pointer">
              <input
                type="radio"
                name="colorScheme"
                value="light"
                checked={settings.colorScheme === 'light'}
                onChange={() => {
                  updateColorScheme('light');
                  showSaved();
                }}
                className="sr-only"
              />
              <span
                className={cn(
                  'inline-flex px-3 py-1.5 font-sans text-ui-sm font-medium rounded border-2 transition-colors',
                  settings.colorScheme === 'light'
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-border text-ink hover:border-primary/40'
                )}
              >
                Light
              </span>
            </label>

            {/* Dark — coming soon */}
            <span
              aria-disabled="true"
              title="Coming soon"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-sans text-ui-sm font-medium rounded border-2 border-border text-muted opacity-50 cursor-not-allowed select-none"
            >
              Dark
              <span className="text-ui-xs font-normal">(coming soon)</span>
            </span>
          </div>
        </SettingRow>
      </SettingSection>

      {/* Dashboard Section */}
      <SettingSection
        title="Dashboard"
        description="Layout and display preferences"
      >
        <div className="opacity-50 pointer-events-none select-none space-y-6">
          <SettingRow label="Layout" description="Card grid or compact list view">
            <RadioGroup
              options={layoutOptions}
              value={dashboardLayout}
              onChange={(value) => setDashboardLayout(value as 'grid' | 'list')}
              name="dashboardLayout"
            />
          </SettingRow>

          <SettingRow
            label="Texts Per Page"
            description="Number of texts shown per page"
          >
            <Select
              options={textsCountOptions}
              value={textsCount}
              onChange={setTextsCount}
            />
          </SettingRow>

          <SettingRow
            label="Progress Graph Range"
            description="Time range for the progress graph"
          >
            <Select
              options={graphRangeOptions}
              value={graphRange}
              onChange={setGraphRange}
            />
          </SettingRow>
        </div>
        <p className="font-sans text-ui-xs text-muted mt-2">
          Dashboard customisation — coming soon
        </p>
      </SettingSection>

      {/* Auto-save Notice */}
      <div className="flex items-center gap-2 text-muted px-1">
        <Info className="w-4 h-4" strokeWidth={2} />
        <p className="font-sans text-ui-xs">
          Settings are automatically saved as you change them
        </p>
      </div>

      {ToastComponent}
    </div>
  );
}
