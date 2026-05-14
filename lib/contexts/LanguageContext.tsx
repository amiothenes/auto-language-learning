'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Language, LanguageContextType } from '@/lib/types';

// ============================================================================
// Hardcoded Data (same as Sidebar)
// ============================================================================

export const languages: Language[] = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'ru', name: 'Russian' },
];

const STORAGE_KEY = 'verbista_selected_language';
const validCodes = new Set(languages.map((l) => l.code));

// ============================================================================
// Context
// ============================================================================

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [selectedLanguage, setSelectedLanguageRaw] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && validCodes.has(stored) ? stored : 'es';
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const setSelectedLanguage = useCallback((code: string) => {
    localStorage.setItem(STORAGE_KEY, code);
    setSelectedLanguageRaw(code);
  }, []);

  const currentLanguage = languages.find((lang) => lang.code === selectedLanguage);

  return (
    <LanguageContext.Provider
      value={{
        selectedLanguage,
        currentLanguage,
        setSelectedLanguage,
        isDropdownOpen,
        setIsDropdownOpen,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
