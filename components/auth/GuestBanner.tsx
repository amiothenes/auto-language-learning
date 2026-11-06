'use client';

import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { useIsGuest } from '@/lib/hooks/useIsGuest';

/**
 * Mobile-only nudge for guests (the desktop sidebar has its own "Save your
 * library" item). A slim strip at the top of the page, not a modal, so it
 * never interrupts reading.
 */
export function GuestBanner() {
  const isGuest = useIsGuest();
  if (!isGuest) return null;
  return (
    <Link
      href="/signup"
      className="md:hidden flex items-center justify-center gap-2 px-4 py-2 bg-riso-coral/10 border-b border-riso-coral/20 font-sans text-ui-sm text-ink"
    >
      <KeyRound size={14} strokeWidth={1.75} className="text-riso-coral" aria-hidden="true" />
      Reading as a guest. <span className="font-semibold text-primary underline underline-offset-2">Save your library</span>
    </Link>
  );
}
