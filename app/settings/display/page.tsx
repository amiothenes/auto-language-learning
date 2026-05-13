'use client';

// ============================================================================
// Display Settings Page
// Reader and Dashboard display preferences
// ============================================================================

import { useState } from 'react';
import { Info } from 'lucide-react';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { SettingSection } from '@/components/settings/SettingSection';
import { SettingRow } from '@/components/settings/SettingRow';
import { RadioGroup, RadioOption } from '@/components/settings/RadioGroup';
import { Slider } from '@/components/settings/Slider';
import { Toggle } from '@/components/settings/Toggle';
import { Select, SelectOption } from '@/components/settings/Select';

export default function DisplaySettingsPage() {
  const {
    settings,
    updateFontSize,
    updateHighlightIntensity,
    updateShowWellKnownWords,
    updateColorScheme,
  } = useReaderSettings();

  // Local state for Dashboard settings (UI mockup only)
  const [dashboardLayout, setDashboardLayout] = useState<'grid' | 'list'>('grid');
  const [textsCount, setTextsCount] = useState('20');
  const [graphRange, setGraphRange] = useState('30');

  // Font size options
  const fontSizeOptions: RadioOption[] = [
    { value: 'small', label: 'A−', description: '16px - Compact reading' },
    { value: 'medium', label: 'A', description: '18px - Default (recommended)' },
    { value: 'large', label: 'A+', description: '20px - Comfortable reading' },
  ];

  // Color scheme options — dark mode is not yet implemented
  const colorSchemeOptions: RadioOption[] = [
    { value: 'light', label: 'Light', description: 'Academic-Naturalist palette' },
  ];

  // Dashboard layout options
  const layoutOptions: RadioOption[] = [
    { value: 'grid', label: 'Grid', description: 'Card-based grid layout' },
    { value: 'list', label: 'List', description: 'Compact list view' },
  ];

  // Texts count options
  const textsCountOptions: SelectOption[] = [
    { value: '10', label: '10 texts' },
    { value: '20', label: '20 texts' },
    { value: '30', label: '30 texts' },
    { value: '50', label: '50 texts' },
  ];

  // Graph range options
  const graphRangeOptions: SelectOption[] = [
    { value: '7', label: 'Last 7 days' },
    { value: '14', label: 'Last 14 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
  ];

  return (
    <div className="space-y-6">
      {/* Reader Settings Section */}
      <SettingSection
        title="Reader Settings"
        description="Customize how text appears in the reader view"
      >
        <SettingRow label="Font Size" description="Choose your preferred reading size">
          <RadioGroup
            options={fontSizeOptions}
            value={settings.fontSize}
            onChange={(value) => updateFontSize(value as 'small' | 'medium' | 'large')}
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
            onChange={updateHighlightIntensity}
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
            onChange={updateShowWellKnownWords}
          />
        </SettingRow>

        <SettingRow label="Color Scheme" description="Choose your preferred theme">
          <RadioGroup
            options={colorSchemeOptions}
            value={settings.colorScheme}
            onChange={(value) => updateColorScheme(value as 'light' | 'dark')}
            name="colorScheme"
          />
        </SettingRow>
        <div className="opacity-50 pointer-events-none select-none flex items-center justify-between py-1 px-1">
          <div>
            <p className="font-sans text-ui-sm font-medium text-ink">Dark mode</p>
            <p className="font-sans text-ui-xs text-muted">Coming soon</p>
          </div>
        </div>
      </SettingSection>

      {/* Dashboard Settings Section (UI Mockup) */}
      <SettingSection
        title="Dashboard Settings"
        description="Customize your dashboard experience"
      >
        <div className="opacity-50 pointer-events-none select-none">
          <SettingRow label="Layout" description="Choose how content is displayed">
            <RadioGroup
              options={layoutOptions}
              value={dashboardLayout}
              onChange={(value) => setDashboardLayout(value as 'grid' | 'list')}
              name="dashboardLayout"
            />
          </SettingRow>
          <p className="font-sans text-ui-xs text-muted mt-1 ml-0.5">Coming soon</p>
        </div>

        <div className="opacity-50 pointer-events-none select-none">
          <SettingRow
            label="Texts Count"
            description="Number of texts to display per page"
          >
            <Select
              options={textsCountOptions}
              value={textsCount}
              onChange={setTextsCount}
            />
          </SettingRow>
          <p className="font-sans text-ui-xs text-muted mt-1 ml-0.5">Coming soon</p>
        </div>

        <div className="opacity-50 pointer-events-none select-none">
          <SettingRow
            label="Graph Range"
            description="Time range for progress graphs"
          >
            <Select
              options={graphRangeOptions}
              value={graphRange}
              onChange={setGraphRange}
            />
          </SettingRow>
          <p className="font-sans text-ui-xs text-muted mt-1 ml-0.5">Coming soon</p>
        </div>
      </SettingSection>

      {/* Auto-save Notice */}
      <div className="flex items-center gap-2 text-muted px-1">
        <Info className="w-4 h-4" strokeWidth={2} />
        <p className="font-sans text-ui-xs">
          Settings are automatically saved as you change them
        </p>
      </div>
    </div>
  );
}
