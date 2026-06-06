'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useLanguages } from '@/lib/hooks/useLanguages';
import type { LanguageContextType } from '@/lib/types/language';

const STORAGE_KEY = 'verbista_selected_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { data: dbLanguages = [] } = useLanguages();

  const [selectedLanguage, setSelectedLanguageRaw] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEY) ?? '';
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Auto-select first language when nothing is stored and DB has loaded
  useEffect(() => {
    if (!selectedLanguage && dbLanguages.length > 0) {
      const code = dbLanguages[0].code;
      localStorage.setItem(STORAGE_KEY, code);
      setSelectedLanguageRaw(code);
    }
  }, [selectedLanguage, dbLanguages]);

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
