'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useLanguages } from '@/lib/hooks/useLanguages';
import type { LanguageContextType } from '@/lib/types/language';

const STORAGE_KEY = 'verbista_selected_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { data: dbLanguages = [] } = useLanguages();

  const [selectedLanguage, setSelectedLanguageRaw] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Load selected language from localStorage on mount (client-only — localStorage
  // isn't available during SSR, so this can't run in the lazy useState initializer
  // without causing a server/client hydration mismatch)
  useEffect(() => {
    setSelectedLanguageRaw(localStorage.getItem(STORAGE_KEY) ?? '');
    setIsInitialized(true);
  }, []);

  // Auto-select first language when nothing is stored and DB has loaded
  useEffect(() => {
    if (isInitialized && !selectedLanguage && dbLanguages.length > 0) {
      const code = dbLanguages[0].code;
      localStorage.setItem(STORAGE_KEY, code);
      setSelectedLanguageRaw(code);
    }
  }, [isInitialized, selectedLanguage, dbLanguages]);

  const setSelectedLanguage = useCallback((code: string) => {
    localStorage.setItem(STORAGE_KEY, code);
    setSelectedLanguageRaw(code);
  }, []);

  const currentLanguage = dbLanguages.find((lang) => lang.code === selectedLanguage);

  return (
    <LanguageContext.Provider
      value={{
        selectedLanguage,
        currentLanguage,
        languages: dbLanguages,
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
