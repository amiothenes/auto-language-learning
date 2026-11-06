'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useDropdownNavigation } from '@/lib/hooks/useDropdownNavigation';
import { useSrsDueCount } from '@/lib/hooks/useSrsDueCount';
import { createClient } from '@/lib/supabase/client';
import {
  TodayIcon,
  LibraryIcon,
  ReviewIcon,
  VocabularyIcon,
  ProgressIcon,
  GuideIcon,
  SettingsIcon,
} from '@/components/riso/icons/RisoIcons';
import {
  Globe,
  ChevronUp,
  ChevronDown,
  LogOut,
  UserRound,
  KeyRound,
} from 'lucide-react';
import { useIsGuest } from '@/lib/hooks/useIsGuest';

// ============================================================================
// Hardcoded Data
// ============================================================================

// `desktopOnly` items stay out of the 5-slot phone bottom bar (Progress is one
// tap away from Today's header there).
const navItems = [
  { id: 'dashboard', label: 'Today', href: '/dashboard', icon: 'dashboard', desktopOnly: false },
  { id: 'series', label: 'Series', href: '/series', icon: 'series', desktopOnly: false },
  { id: 'review', label: 'Review', href: '/review', icon: 'review', desktopOnly: false },
  { id: 'vocabulary', label: 'Vocabulary', href: '/vocabulary', icon: 'vocabulary', desktopOnly: false },
  { id: 'progress', label: 'Progress', href: '/progress', icon: 'progress', desktopOnly: true },
  { id: 'guide', label: 'Field Guide', href: '/guide', icon: 'guide', desktopOnly: true },
  { id: 'settings', label: 'Settings', href: '/settings', icon: 'settings', desktopOnly: false },
] as const;

// Icon mapping
const iconMap = {
  dashboard: TodayIcon,
  series: LibraryIcon,
  vocabulary: VocabularyIcon,
  review: ReviewIcon,
  progress: ProgressIcon,
  guide: GuideIcon,
  settings: SettingsIcon,
};

// ============================================================================
// Sidebar Component
// ============================================================================

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isGuest = useIsGuest();

  async function handleSignOut() {
    if (
      isGuest &&
      !window.confirm(
        "You're reading as a guest. If you sign out now, your library and progress can't be recovered.\n\nSign out anyway? (Cancel, then choose \"Save your library\" to keep it.)"
      )
    ) {
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  const {
    selectedLanguage,
    currentLanguage,
    languages,
    setSelectedLanguage,
    isDropdownOpen,
    setIsDropdownOpen,
  } = useLanguage();

  const { data: reviewDueCount = 0 } = useSrsDueCount(currentLanguage?.id);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for language dropdown
  const { highlightedIndex } = useDropdownNavigation(
    isDropdownOpen,
    languages,
    languages.find((lang) => lang.code === selectedLanguage),
    (lang) => {
      setSelectedLanguage(lang.code);
      setIsDropdownOpen(false);
      router.push('/dashboard');
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
                className="w-full h-10 px-2 bg-paper border border-border rounded shadow-raised hover:shadow-raised-hover hover:brightness-105 transition-all duration-200 flex items-center gap-2 font-sans text-ui-base text-ink font-medium overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
                        router.push('/dashboard');
                      }}
                      className={cn(
                        'w-full px-4 py-3 text-left font-sans text-ui-base transition-colors cursor-pointer',
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
                    // Active nav: 2px left accent bar (spec) + 5% primary tint fill (intentional, approved)
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
                  <span className="relative shrink-0">
                    <IconComponent
                      size={20}
                      className={cn(isActive ? "text-primary" : "text-ink")}
                      strokeWidth={1.5}
                      active={isActive}
                    />
                    {item.id === 'review' && reviewDueCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-danger" aria-hidden="true" />
                    )}
                  </span>
                  <span className="whitespace-nowrap overflow-hidden w-0 group-hover:w-auto transition-all duration-200">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions: Account + Sign Out */}
          <div className="mt-4 pt-4 border-t border-border space-y-1">
            {isGuest && (
              <Link
                href="/signup"
                className="w-full h-10 px-2 rounded bg-riso-coral/10 text-ink font-sans font-medium text-ui-base hover:bg-riso-coral/20 transition-all duration-200 flex items-center gap-2 overflow-hidden"
                title="Save your library"
              >
                <KeyRound size={18} className="shrink-0 text-riso-coral" strokeWidth={1.75} />
                <span className="whitespace-nowrap overflow-hidden w-0 group-hover:w-auto transition-all duration-200 text-ui-sm">
                  Save your library
                </span>
              </Link>
            )}
            <Link
              href="/settings/account"
              className={cn(
                'w-full h-10 px-2 bg-transparent text-ink font-sans font-medium text-ui-base rounded hover:bg-paper active:translate-y-px transition-all duration-200 flex items-center gap-2 overflow-hidden cursor-pointer',
                pathname === '/settings/account' ? 'text-primary bg-primary/5' : ''
              )}
              title="Account Settings"
            >
              <UserRound size={18} className={cn('shrink-0', pathname === '/settings/account' ? 'text-primary' : 'text-muted')} strokeWidth={1.5} />
              <span className="whitespace-nowrap overflow-hidden w-0 group-hover:w-auto transition-all duration-200 text-ui-sm">
                Account
              </span>
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full h-10 px-2 bg-transparent text-ink font-sans font-medium text-ui-base rounded hover:bg-paper hover:text-danger active:translate-y-px transition-all duration-200 flex items-center gap-2 overflow-hidden cursor-pointer group/logout"
              title="Sign out"
            >
              <LogOut size={18} className="shrink-0 text-muted group-hover/logout:text-danger transition-colors" strokeWidth={1.5} />
              <span className="whitespace-nowrap overflow-hidden w-0 group-hover:w-auto transition-all duration-200 text-ui-sm">
                Sign out
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-paper border-t border-border z-50">
        <div className="flex items-center justify-around h-full px-2">
          {navItems.filter((item) => !item.desktopOnly).map((item) => {
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
                <span className="relative">
                  <IconComponent
                    size={24}
                    className={isActive ? 'text-primary' : 'text-muted'}
                    strokeWidth={1.5}
                    active={isActive}
                  />
                  {item.id === 'review' && reviewDueCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-danger" aria-hidden="true" />
                  )}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
