import { useEffect } from 'react';

// ============================================================================
// useKeyboardShortcuts Hook
// Global keyboard shortcut management system
// ============================================================================

export interface ShortcutConfig {
  /** The key to listen for (e.g., '/', 'Escape', '?') */
  key: string;
  /** Whether Ctrl/Cmd key must be pressed */
  ctrlKey?: boolean;
  /** Whether Shift key must be pressed */
  shiftKey?: boolean;
  /** Whether Meta/Cmd key must be pressed (macOS) */
  metaKey?: boolean;
  /** Handler function when shortcut is triggered */
  handler: (e: KeyboardEvent) => void;
  /** Human-readable description for documentation */
  description: string;
  /** Whether this shortcut is currently enabled (default: true) */
  enabled?: boolean;
}

/**
 * Registers global keyboard shortcuts
 *
 * Shortcuts are automatically disabled when user is typing in
 * input fields, textareas, or contentEditable elements.
 *
 * @param shortcuts - Array of shortcut configurations
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     key: '/',
 *     handler: (e) => {
 *       e.preventDefault();
 *       document.getElementById('search')?.focus();
 *     },
 *     description: 'Focus search',
 *   },
 *   {
 *     key: 'k',
 *     ctrlKey: true,
 *     handler: (e) => {
 *       e.preventDefault();
 *       // Open command palette
 *     },
 *     description: 'Open command palette',
 *   },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in form controls
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isTyping) return;

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        // Skip disabled shortcuts
        if (shortcut.enabled === false) continue;

        // Check if key matches (case-insensitive)
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
        if (!keyMatches) continue;

        // Check modifier keys
        const ctrlMatches = shortcut.ctrlKey ? e.ctrlKey || e.metaKey : true;
        const shiftMatches = shortcut.shiftKey ? e.shiftKey : true;
        const metaMatches = shortcut.metaKey ? e.metaKey : true;

        if (ctrlMatches && shiftMatches && metaMatches) {
          shortcut.handler(e);
          break; // Only trigger first matching shortcut
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
