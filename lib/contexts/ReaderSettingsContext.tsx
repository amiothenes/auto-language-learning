'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  FontSize,
  ColorScheme,
  ReaderSettings,
  ReaderSettingsContextType,
} from '@/lib/types';

// ============================================================================
// Default Settings
// ============================================================================

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 'medium',
  highlightIntensity: 100,
  showWellKnownWords: true,
  colorScheme: 'light',
  highlightMode: 'highlight',
  isImmersionMode: false,
};

const STORAGE_KEY = 'reader-settings';

// ============================================================================
// Context Creation
// ============================================================================

const ReaderSettingsContext = createContext<ReaderSettingsContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

export function ReaderSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings) as ReaderSettings;
        setSettings(parsed);
      }
    } catch (error) {
      console.error('Failed to load reader settings from localStorage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save reader settings to localStorage:', error);
      }
    }
  }, [settings, isInitialized]);

  // Update functions
  const updateFontSize = (size: FontSize) => {
    setSettings((prev) => ({ ...prev, fontSize: size }));
  };

  const updateHighlightIntensity = (intensity: number) => {
    // Clamp value between 0 and 100
    const clamped = Math.max(0, Math.min(100, intensity));
    setSettings((prev) => ({ ...prev, highlightIntensity: clamped }));
  };

  const updateShowWellKnownWords = (show: boolean) => {
    setSettings((prev) => ({ ...prev, showWellKnownWords: show }));
  };

  const updateColorScheme = (scheme: ColorScheme) => {
    setSettings((prev) => ({ ...prev, colorScheme: scheme }));
  };

  const updateHighlightMode = (mode: 'highlight' | 'underline') => {
    setSettings((prev) => ({ ...prev, highlightMode: mode }));
  };

  const toggleImmersionMode = () => {
    setSettings((prev) => ({ ...prev, isImmersionMode: !prev.isImmersionMode }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const value: ReaderSettingsContextType = {
    settings,
    updateFontSize,
    updateHighlightIntensity,
    updateShowWellKnownWords,
    updateColorScheme,
    updateHighlightMode,
    toggleImmersionMode,
    resetToDefaults,
  };

  return (
    <ReaderSettingsContext.Provider value={value}>
      {children}
    </ReaderSettingsContext.Provider>
  );
}

// ============================================================================
// Hook to use ReaderSettings
// ============================================================================

export function useReaderSettings(): ReaderSettingsContextType {
  const context = useContext(ReaderSettingsContext);
  if (context === undefined) {
    throw new Error('useReaderSettings must be used within a ReaderSettingsProvider');
  }
  return context;
}
