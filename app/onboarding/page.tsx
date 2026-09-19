'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { PRESET_LANGUAGES } from '@/lib/languages/presets';

type LangCode = (typeof PRESET_LANGUAGES)[number]['code'];

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<LangCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  async function handleContinue() {
    if (!selected) return;
    setError('');
    setLoading(true);

    const lang = PRESET_LANGUAGES.find((l) => l.code === selected)!;

    try {
      const res = await fetch('/api/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: lang.code,
          name: lang.name,
          isRTL: lang.rtl,
          googleTTSCode: lang.ttsCode,
          includeForeignScript: lang.includeForeignScript,
          // defaultTranslationLangCode omitted on purpose: the API applies the
          // per-language default (and gives English none, since en→en is pointless).
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? 'Failed to set up language. Please try again.');
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['languages'] });

      const { error: updateErr } = await supabase.auth.updateUser({ data: { onboardingComplete: true } });
      if (updateErr) {
        setError('Failed to complete setup. Please try again.');
        return;
      }

      router.replace('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <p className="font-sans text-ui-2xl font-bold text-primary">Verbista</p>
          <p className="font-sans text-ui-lg font-semibold text-ink">What language are you learning?</p>
          <p className="font-sans text-ui-sm text-muted">You can add more languages later from settings.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {PRESET_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setSelected(lang.code)}
              className={`
                relative flex flex-col items-center gap-2 p-5 rounded-card border transition-all cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${
                  selected === lang.code
                    ? 'border-primary bg-primary/5 shadow-raised-hover'
                    : 'border-border bg-paper hover:border-primary/40 hover:bg-desk shadow-raised'
                }
              `}
            >
              <span className="text-3xl" aria-hidden="true">{lang.flag}</span>
              <span className="font-sans text-ui-base font-medium text-ink">{lang.name}</span>
              {selected === lang.code && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>

        {error && (
          <p className="font-sans text-ui-sm text-danger text-center" role="alert">{error}</p>
        )}

        <Button
          className="w-full"
          disabled={!selected || loading}
          onClick={handleContinue}
        >
          {loading ? 'Setting up...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
