'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useIsGuest } from '@/lib/hooks/useIsGuest';

// Generates a public /share/[userId]?lang=xx URL and copies it to the clipboard.
// Hidden for guests: an unsaved library has no stable public page to share.
export function ShareProgressButton({ languageCode }: { languageCode: string }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const isGuest = useIsGuest();

  if (isGuest) return null;

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) return;
      const url = `${window.location.origin}/share/${userId}?lang=${languageCode}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={busy}
      className="inline-flex items-center gap-1.5 font-sans text-ui-sm text-muted hover:text-ink border border-border bg-paper rounded px-3 py-1.5 transition-colors hover:border-border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {copied ? (
        <>
          <Check size={13} strokeWidth={2.5} className="text-primary" />
          Link copied
        </>
      ) : (
        <>
          <Share2 size={13} strokeWidth={2} />
          Share progress
        </>
      )}
    </button>
  );
}
