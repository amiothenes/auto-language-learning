'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  FontSize,
  ColorScheme,
  ReaderSettings,
  ReaderSettingsContextType,
  TutorModeTiming,
  TutorModeThreshold,
  TutorModeResume,
} from '@/lib/types';
import { quantizeRate } from '@/lib/tts/rate';
import { useReaderSyncSettings, useUpdateReaderSyncSettings } from '@/lib/hooks/useReaderSyncSettings';
import type { ReaderSyncSettingsPayload } from '@/lib/types/api';

// ============================================================================
// Default Settings
// ============================================================================

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 'medium',
  highlightIntensity: 100,
  showWellKnownWords: true,
  colorScheme: 'light',
  highlightMode: 'highlight',
  contentWidth: 'normal',
  isImmersionMode: false,
  playbackSpeed: 0.9,
  preferredVoices: {},
  tutorModeEnabled: false,
  tutorModeTiming: 'atWord',
  tutorModeThreshold: 'FAMILIAR',
  tutorModeMaxPerSentence: 2,
  tutorModeResume: 'onDismiss',
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

  // Cross-device sync for the 10 audio/TTS/tutor-mode/highlighting fields
  // below (NOT margin/font/text-display, which stay localStorage-only).
  // localStorage remains the instant-read offline cache; the DB is the
  // source of truth once it loads.
  const syncQuery = useReaderSyncSettings();
  const updateSync = useUpdateReaderSyncSettings();

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings) as Partial<ReaderSettings>;
        // Merged over the defaults rather than replacing them: a settings
        // object saved before a new key existed would otherwise load that key
        // as undefined for every returning user (which is what happened to
        // playbackSpeed/tutorMode* when TTS was added).
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load reader settings from localStorage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Once the DB-synced settings load, they win over whatever localStorage/
  // defaults had for these 10 fields — the DB is the cross-device source of
  // truth, localStorage was only ever a same-device instant-read cache.
  useEffect(() => {
    if (syncQuery.data) {
      setSettings((prev) => ({ ...prev, ...syncQuery.data }));
    }
  }, [syncQuery.data]);

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
    updateSync.mutate({ highlightIntensity: clamped });
  };

  const updateShowWellKnownWords = (show: boolean) => {
    setSettings((prev) => ({ ...prev, showWellKnownWords: show }));
    updateSync.mutate({ showWellKnownWords: show });
  };

  const updateColorScheme = (scheme: ColorScheme) => {
    setSettings((prev) => ({ ...prev, colorScheme: scheme }));
  };

  const updateHighlightMode = (mode: 'highlight' | 'underline') => {
    setSettings((prev) => ({ ...prev, highlightMode: mode }));
    updateSync.mutate({ highlightMode: mode });
  };

  const updateContentWidth = (width: 'narrow' | 'normal' | 'wide') => {
    setSettings((prev) => ({ ...prev, contentWidth: width }));
  };

  const toggleImmersionMode = () => {
    setSettings((prev) => ({ ...prev, isImmersionMode: !prev.isImmersionMode }));
  };

  const updatePlaybackSpeed = (rate: number) => {
    const quantized = quantizeRate(rate);
    setSettings((prev) => ({ ...prev, playbackSpeed: quantized }));
    updateSync.mutate({ playbackSpeed: quantized });
  };

  const updatePreferredVoice = (languageCode: string, voiceId: string) => {
    const nextPreferredVoices = { ...settings.preferredVoices, [languageCode]: voiceId };
    setSettings((prev) => ({
      ...prev,
      preferredVoices: { ...prev.preferredVoices, [languageCode]: voiceId },
    }));
    updateSync.mutate({ preferredVoices: nextPreferredVoices });
  };

  const toggleTutorMode = () => {
    const next = !settings.tutorModeEnabled;
    setSettings((prev) => ({ ...prev, tutorModeEnabled: next }));
    updateSync.mutate({ tutorModeEnabled: next });
  };

  const updateTutorModeTiming = (timing: TutorModeTiming) => {
    setSettings((prev) => ({ ...prev, tutorModeTiming: timing }));
    updateSync.mutate({ tutorModeTiming: timing });
  };

  const updateTutorModeThreshold = (threshold: TutorModeThreshold) => {
    setSettings((prev) => ({ ...prev, tutorModeThreshold: threshold }));
    updateSync.mutate({ tutorModeThreshold: threshold });
  };

  const updateTutorModeMaxPerSentence = (max: number) => {
    const rounded = Math.max(0, Math.round(max));
    setSettings((prev) => ({ ...prev, tutorModeMaxPerSentence: rounded }));
    updateSync.mutate({ tutorModeMaxPerSentence: rounded });
  };

  const updateTutorModeResume = (resume: TutorModeResume) => {
    setSettings((prev) => ({ ...prev, tutorModeResume: resume }));
    updateSync.mutate({ tutorModeResume: resume });
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    const syncDefaults: ReaderSyncSettingsPayload = {
      highlightIntensity: DEFAULT_SETTINGS.highlightIntensity,
      showWellKnownWords: DEFAULT_SETTINGS.showWellKnownWords,
      highlightMode: DEFAULT_SETTINGS.highlightMode,
      playbackSpeed: DEFAULT_SETTINGS.playbackSpeed,
      preferredVoices: DEFAULT_SETTINGS.preferredVoices,
      tutorModeEnabled: DEFAULT_SETTINGS.tutorModeEnabled,
      tutorModeTiming: DEFAULT_SETTINGS.tutorModeTiming,
      tutorModeThreshold: DEFAULT_SETTINGS.tutorModeThreshold,
      tutorModeMaxPerSentence: DEFAULT_SETTINGS.tutorModeMaxPerSentence,
      tutorModeResume: DEFAULT_SETTINGS.tutorModeResume,
    };
    updateSync.mutate(syncDefaults);
  };

  const value: ReaderSettingsContextType = {
    settings,
    updateFontSize,
    updateHighlightIntensity,
    updateShowWellKnownWords,
    updateColorScheme,
    updateHighlightMode,
    updateContentWidth,
    toggleImmersionMode,
    updatePlaybackSpeed,
    updatePreferredVoice,
    toggleTutorMode,
    updateTutorModeTiming,
    updateTutorModeThreshold,
    updateTutorModeMaxPerSentence,
    updateTutorModeResume,
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
