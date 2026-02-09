'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage, languages } from '@/lib/contexts/LanguageContext';
import { useDropdownNavigation } from '@/lib/hooks/useDropdownNavigation';
import {
  Globe,
  LayoutDashboard,
  Library,
  ClipboardList,
  Settings,
  ChevronUp,
  ChevronDown,
  Wrench
} from 'lucide-react';

// ============================================================================
// Hardcoded Data
// ============================================================================

const navItems = [
  { id: 'dashboard', label: 'Dashboard', href: '/', icon: 'dashboard' },
  { id: 'series', label: 'Series', href: '/series', icon: 'series' },
  { id: 'vocabulary', label: 'Vocabulary', href: '/vocabulary', icon: 'vocabulary' },
  { id: 'settings', label: 'Settings', href: '/settings', icon: 'settings' },
] as const;

// Icon mapping
const iconMap = {
  dashboard: LayoutDashboard,
  series: Library,
  vocabulary: ClipboardList,
  settings: Settings,
};

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

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for language dropdown
  const { highlightedIndex } = useDropdownNavigation(
    isDropdownOpen,
    languages,
    languages.find((lang) => lang.code === selectedLanguage),
    (lang) => {
      setSelectedLanguage(lang.code);
      setIsDropdownOpen(false);
    },
    () => setIsDropdownOpen(false),
    dropdownRef
  );

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
                role="combobox"
                aria-expanded={isDropdownOpen}
                aria-haspopup="listbox"
                aria-controls="language-listbox"
                aria-label="Select language"
                className="w-full h-10 px-2 bg-paper border border-border rounded-card shadow-raised hover:shadow-raised-hover hover:brightness-105 transition-all duration-200 flex items-center gap-2 font-sans text-ui-base text-ink font-medium overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                title={currentLanguage?.name}
              >
                <Globe size={20} className="shrink-0 text-primary" strokeWidth={1.5} />
                <span className="whitespace-nowrap overflow-hidden w-0 group-hover:w-auto transition-all duration-200">
                  {currentLanguage?.name}
                </span>
                <span className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {isDropdownOpen ? (
                    <ChevronUp size={16} strokeWidth={2} />
                  ) : (
                    <ChevronDown size={16} strokeWidth={2} />
                  )}
                </span>
              </button>
              
              {isDropdownOpen && (
                <div
                  ref={dropdownRef}
                  id="language-listbox"
                  role="listbox"
                  className="absolute top-full left-0 w-60 mt-2 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-50"
                >
                  {languages.map((lang, index) => (
                    <button
                      key={lang.code}
                      role="option"
                      aria-selected={lang.code === selectedLanguage}
                      data-index={index}
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        setIsDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full px-4 py-3 text-left font-sans text-ui-base transition-colors',
                        lang.code === selectedLanguage
                          ? 'bg-primary text-white font-medium'
                          : highlightedIndex === index
                          ? 'bg-desk text-ink'
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
              const IconComponent = iconMap[item.icon];
              
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
                  <IconComponent 
                    size={20} 
                    className={cn("shrink-0", isActive ? "text-primary" : "text-ink")} 
                    strokeWidth={1.5} 
                  />
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
              <Wrench size={18} className="shrink-0 text-ink" strokeWidth={1.5} />
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
            const IconComponent = iconMap[item.icon];
            
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
                <IconComponent 
                  size={24} 
                  className={isActive ? 'text-primary' : 'text-muted'} 
                  strokeWidth={1.5} 
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
