'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

interface Language {
  code: string;
  name: string;
}

interface LanguageContextType {
  selectedLanguage: string;
  currentLanguage: Language | undefined;
  setSelectedLanguage: (code: string) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
}

// ============================================================================
// Hardcoded Data (same as Sidebar)
// ============================================================================

export const languages: Language[] = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'ru', name: 'Russian' },
];

// ============================================================================
// Context
// ============================================================================

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
