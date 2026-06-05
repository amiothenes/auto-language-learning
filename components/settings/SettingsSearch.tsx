'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SettingEntry {
  label: string;
  description?: string;
  breadcrumb: string;
  href: string;
  comingSoon?: boolean;
}

const SETTINGS_ENTRIES: SettingEntry[] = [
  // Display › Reader
  { label: 'Font Size', description: 'Choose your preferred reading size', breadcrumb: 'Display › Reader', href: '/settings/display' },
  { label: 'Highlight Intensity', description: 'Controls the opacity of word highlighting', breadcrumb: 'Display › Reader', href: '/settings/display' },
  { label: 'Show Well-Known Words', description: 'When disabled, well-known words appear dimmed', breadcrumb: 'Display › Reader', href: '/settings/display' },
  { label: 'Color Scheme', description: 'Choose your preferred theme', breadcrumb: 'Display › Reader', href: '/settings/display' },
  // Display › Dashboard (coming soon)
  { label: 'Layout', breadcrumb: 'Display › Dashboard', href: '/settings/display', comingSoon: true },
  { label: 'Texts Count', breadcrumb: 'Display › Dashboard', href: '/settings/display', comingSoon: true },
  { label: 'Graph Range', breadcrumb: 'Display › Dashboard', href: '/settings/display', comingSoon: true },
  // Languages
  { label: 'Current Language', description: "Select the language you're currently learning", breadcrumb: 'Languages › Current Language', href: '/settings/languages' },
  { label: 'My Languages', description: 'Manage your learning languages', breadcrumb: 'Languages › My Languages', href: '/settings/languages' },
  // Data
  { label: 'Export Your Data', description: 'Download your vocabulary and progress data', breadcrumb: 'Data › Export', href: '/settings/data' },
  { label: 'Import LWT Vocabulary', description: 'Bulk-import vocabulary from LWT export', breadcrumb: 'Data › Import', href: '/settings/data' },
  { label: 'Danger Zone', description: 'Irreversible actions', breadcrumb: 'Data › Danger Zone', href: '/settings/data' },
  // About
  { label: 'Application Information', breadcrumb: 'About', href: '/settings/about' },
  { label: 'Resources', breadcrumb: 'About', href: '/settings/about' },
  { label: 'License', breadcrumb: 'About', href: '/settings/about' },
];

const LISTBOX_ID = 'settings-search-listbox';

export function SettingsSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const results = query.length >= 1
    ? SETTINGS_ENTRIES.filter(
        (e) =>
          e.label.toLowerCase().includes(query.toLowerCase()) ||
          e.description?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelect = useCallback(
    (entry: SettingEntry) => {
      setQuery('');
      setIsOpen(false);
      setFocusedIndex(-1);
      router.push(entry.href);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((i) => (i < results.length - 1 ? i + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((i) => (i > 0 ? i - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && results[focusedIndex]) {
          handleSelect(results[focusedIndex]);
        } else if (results[0]) {
          handleSelect(results[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // Click-outside dismiss
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listboxRef.current) {
      const item = listboxRef.current.children[focusedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  const focusedOptionId =
    focusedIndex >= 0 ? `settings-search-option-${focusedIndex}` : undefined;

  return (
    <div ref={containerRef} className="relative w-full md:max-w-sm">
      <div className="relative">
        <Search
          size={16}
          strokeWidth={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.length >= 1);
            setFocusedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query.length >= 1) setIsOpen(true); }}
          placeholder="Search settings…"
          aria-label="Search settings"
          aria-expanded={isOpen}
          aria-controls={isOpen ? LISTBOX_ID : undefined}
          aria-activedescendant={focusedOptionId}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          autoComplete="off"
          className="w-full h-10 pl-9 pr-3 font-sans text-ui-base text-ink bg-paper border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary placeholder:text-muted transition-colors"
        />
      </div>

      {isOpen && (
        <ul
          ref={listboxRef}
          id={LISTBOX_ID}
          role="listbox"
          aria-label="Settings search results"
          className="absolute top-[calc(100%+6px)] left-0 right-0 bg-paper border border-border rounded-card shadow-modal z-50 max-h-[280px] overflow-y-auto py-1"
        >
          {results.length === 0 ? (
            <li className="px-3.5 py-4 font-sans text-ui-sm text-muted italic">
              No settings match &ldquo;{query}&rdquo;
            </li>
          ) : (
            results.map((entry, index) => (
              <li
                key={`${entry.breadcrumb}-${entry.label}`}
                id={`settings-search-option-${index}`}
                role="option"
                aria-selected={index === focusedIndex}
                onClick={() => handleSelect(entry)}
                className={cn(
                  'flex items-start justify-between gap-2 px-3.5 py-2.5 cursor-pointer transition-colors',
                  index === focusedIndex ? 'bg-desk' : 'hover:bg-desk'
                )}
              >
                <div className="min-w-0">
                  <p className="font-sans text-ui-sm font-medium text-ink leading-snug">
                    {entry.label}
                    {entry.comingSoon && (
                      <span className="font-normal text-muted ml-1.5">(coming soon)</span>
                    )}
                  </p>
                  <p className="font-sans text-ui-xs text-muted mt-0.5">{entry.breadcrumb}</p>
                </div>
                <span className="text-muted text-ui-sm shrink-0 mt-0.5" aria-hidden="true">
                  →
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
