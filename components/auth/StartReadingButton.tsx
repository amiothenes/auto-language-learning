'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTurnstile } from './Turnstile';

/**
 * "Start reading": no signup wall. Signs the visitor in as a Supabase
 * anonymous user and goes straight to onboarding. After their first chapter
 * they're invited to save the library (email or Google), which upgrades the
 * same user, so nothing is lost.
 */
export function StartReadingButton({ className, children }: { className?: string; children: ReactNode }) {
  const router = useRouter();
  const { getToken, widget, error: captchaError } = useTurnstile();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: existing } = await supabase.auth.getUser();
      if (!existing.user) {
        const captchaToken = await getToken();
        const { error: signInError } = await supabase.auth.signInAnonymously({
          options: { captchaToken, data: { onboardingComplete: false } },
        });
        if (signInError) throw signInError;
      }
      router.push('/onboarding');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start. Please try again.');
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-2">
      <button type="button" onClick={start} disabled={busy} className={className} aria-busy={busy}>
        {busy ? 'Opening the door…' : children}
      </button>
      {widget}
      {(error || captchaError) && (
        <span className="font-sans text-ui-sm text-danger" role="alert">
          {error ?? captchaError}
        </span>
      )}
    </span>
  );
}
