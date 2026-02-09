'use client';

import { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';

// ============================================================================
// KeyboardShortcutsProvider Component
// Global keyboard shortcuts for the application
// ============================================================================

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

/**
 * Provides global keyboard shortcuts for the application
 *
 * Shortcuts:
 * - / : Focus search input (navigates to /vocabulary if not there)
 * - Esc : Close/dismiss (fallback - components handle primarily)
 * - Shift+? : Show keyboard shortcuts help (future enhancement)
 */
export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  useKeyboardShortcuts([
    {
      key: '/',
      handler: (e) => {
        e.preventDefault();

        // If not on vocabulary page, navigate there first
        if (!pathname.includes('/vocabulary')) {
          router.push('/vocabulary');
          // Wait for navigation, then focus search
          setTimeout(() => {
            const searchInput = document.getElementById('vocab-search');
            searchInput?.focus();
          }, 100);
        } else {
          // Already on vocabulary page, just focus search
          const searchInput = document.getElementById('vocab-search');
          searchInput?.focus();
        }
      },
      description: 'Focus search',
    },
    {
      key: 'Escape',
      handler: () => {
        // Fallback for closing dropdowns
        // Individual components should handle ESC primarily
        // This just blurs the current element as a last resort
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
      },
      description: 'Close/dismiss',
    },
    {
      key: '?',
      shiftKey: true,
      handler: (e) => {
        e.preventDefault();
        // Future enhancement: Show keyboard shortcuts modal
        console.log('Keyboard shortcuts help - to be implemented');
      },
      description: 'Show keyboard shortcuts help',
      enabled: false, // Disabled until modal is implemented
    },
  ]);

  return <>{children}</>;
}
