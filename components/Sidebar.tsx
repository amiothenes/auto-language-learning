'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Hardcoded Data
// ============================================================================

const languages = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'ru', name: 'Russian' },
];

const navItems = [
  { id: 'dashboard', label: 'Dashboard', href: '/', icon: '📊' },
  { id: 'series', label: 'Series', href: '/series', icon: '📚' },
  { id: 'vocabulary', label: 'Vocabulary', href: '/vocabulary', icon: '📝' },
  { id: 'settings', label: 'Settings', href: '/settings', icon: '⚙️' },
];

// ============================================================================
// Sidebar Component
// ============================================================================

export function Sidebar() {
  const pathname = usePathname();
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentLanguage = languages.find((lang) => lang.code === selectedLanguage);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:w-60 bg-desk border-r border-border">
        <div className="flex flex-col h-full p-4">
          {/* Language Selector */}
          <div className="mb-6">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-3 bg-paper border border-border rounded-card shadow-raised hover:shadow-raised-hover transition-shadow flex items-center justify-between font-sans text-ui-base text-ink font-medium"
              >
                <span>{currentLanguage?.name}</span>
                <span className="text-ui-sm">{isDropdownOpen ? '▲' : '▼'}</span>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        setIsDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full px-4 py-3 text-left font-sans text-ui-base transition-colors',
                        lang.code === selectedLanguage
                          ? 'bg-primary text-white font-medium'
                          : 'text-ink hover:bg-desk'
                      )}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded font-sans text-ui-base transition-colors relative',
                    isActive
                      ? 'text-primary font-semibold bg-primary/5'
                      : 'text-ink hover:bg-paper'
                  )}
                >
                  {/* Active state 2px left border */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r"></div>
                  )}
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Manage Languages Button */}
          <div className="mt-4 pt-4 border-t border-border">
            <button className="w-full px-4 py-3 bg-transparent border border-border text-ink font-sans font-medium text-ui-base rounded hover:bg-paper active:translate-y-px transition-all">
              Manage Languages
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-paper border-t border-border z-50">
        <div className="flex items-center justify-around h-full px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded font-sans text-ui-xs transition-colors flex-1',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted hover:text-ink'
                )}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
