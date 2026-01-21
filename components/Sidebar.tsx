'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage, languages } from '@/lib/contexts/LanguageContext';

// ============================================================================
// Hardcoded Data
// ============================================================================

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
  const {
    selectedLanguage,
    currentLanguage,
    setSelectedLanguage,
    isDropdownOpen,
    setIsDropdownOpen,
  } = useLanguage();

  return (
    <>
      {/* Desktop Sidebar - Icon Only with Hover Expansion */}
      <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:w-16 hover:md:w-60 bg-desk border-r border-border transition-all duration-200 ease-in-out group z-40">
        <div className="flex flex-col h-full p-3">
          {/* Language Selector */}
          <div className="mb-6">
            <div className="relative">
              {/* Collapsed: Show icon only */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full h-10 px-2 bg-paper border border-border rounded-card shadow-raised hover:shadow-raised-hover hover:brightness-105 transition-all duration-200 flex items-center gap-2 font-sans text-ui-base text-ink font-medium overflow-hidden cursor-pointer"
                title={currentLanguage?.name}
              >
                <span className="text-lg shrink-0">🌐</span>
                <span className="whitespace-nowrap overflow-hidden w-0 group-hover:w-auto transition-all duration-200">
                  {currentLanguage?.name}
                </span>
                <span className="text-ui-sm ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {isDropdownOpen ? '▲' : '▼'}
                </span>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-60 mt-2 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-50">
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
                    'flex items-center gap-3 px-2 py-3 rounded font-sans text-ui-base transition-all duration-200 relative overflow-hidden',
                    isActive
                      ? 'text-primary font-semibold bg-primary/5'
                      : 'text-ink hover:bg-paper'
                  )}
                  title={item.label}
                >
                  {/* Active state 2px left border */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r"></div>
                  )}
                  <span className="text-lg shrink-0">{item.icon}</span>
                  <span className="whitespace-nowrap overflow-hidden w-0 group-hover:w-auto transition-all duration-200">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Manage Languages Button */}
          <div className="mt-4 pt-4 border-t border-border">
            <button 
              className="w-full h-10 px-2 bg-transparent border border-border text-ink font-sans font-medium text-ui-base rounded hover:bg-paper active:translate-y-px transition-all duration-200 flex items-center gap-2 overflow-hidden cursor-pointer"
              title="Manage Languages"
            >
              <span className="text-base shrink-0">🔧</span>
              <span className="whitespace-nowrap overflow-hidden w-0 group-hover:w-auto transition-all duration-200 text-ui-sm">
                Manage Languages
              </span>
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
