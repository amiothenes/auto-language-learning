'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { AuthIllustration } from '@/components/illustrations/AuthIllustration';

const ERROR_MESSAGES: Record<string, string> = {
  link_expired: 'Your sign-in link has expired or already been used. Please sign in again.',
};

type Mode = 'password' | 'magic';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(urlError ? (ERROR_MESSAGES[urlError] ?? 'An error occurred. Please try again.') : '');
  const [magicSent, setMagicSent] = useState(false);

  const supabase = createClient();

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); return; }
      const destination = data.user?.user_metadata?.onboardingComplete ? '/dashboard' : '/onboarding';
      router.replace(destination);
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) { setError(error.message); return; }
      setMagicSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (magicSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-desk">
        <div className="w-full max-w-sm bg-paper border border-border rounded-card shadow-modal p-8 space-y-4 text-center">
          <p className="font-sans text-ui-xl font-semibold text-ink">Check your inbox</p>
          <p className="font-sans text-ui-sm text-muted">
            We sent a sign-in link to <span className="text-ink font-medium">{email}</span>
          </p>
          <Button variant="secondary" size="sm" className="w-full" onClick={() => setMagicSent(false)}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — illustration (desktop only) */}
      <div className="hidden md:flex md:w-1/2 lg:w-[45%] bg-primary flex-col items-center justify-center px-12 py-16 gap-10">
        <AuthIllustration />
        <div className="text-center space-y-2">
          <p className="font-sans text-2xl font-bold text-paper tracking-tight">Verbista</p>
          <p className="font-sans text-sm text-paper/70 max-w-xs leading-relaxed">
            Read real texts. Tap any word for grammar, translation, and context.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-desk">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile wordmark — hidden on desktop where left panel shows it */}
          <div className="text-center space-y-1 md:hidden">
            <p className="font-sans text-ui-2xl font-bold text-primary">Verbista</p>
            <p className="font-sans text-ui-sm text-muted">Sign in to your account</p>
          </div>
          <p className="hidden md:block font-sans text-ui-xl font-semibold text-ink">Sign in</p>

          <div className="bg-paper border border-border rounded-card shadow-modal p-8 space-y-6">
            {/* Mode toggle */}
            <div className="flex rounded border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setMode('password')}
                className={`flex-1 py-1.5 font-sans text-ui-sm transition-colors ${
                  mode === 'password' ? 'bg-primary text-white' : 'bg-transparent text-muted hover:bg-desk'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setMode('magic')}
                className={`flex-1 py-1.5 font-sans text-ui-sm transition-colors ${
                  mode === 'magic' ? 'bg-primary text-white' : 'bg-transparent text-muted hover:bg-desk'
                }`}
              >
                Magic link
              </button>
            </div>

            {mode === 'password' ? (
              <form onSubmit={handlePasswordSignIn} className="space-y-4">
                <FormField label="Email" fieldId="email" required>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </FormField>
                <FormField label="Password" fieldId="password" required>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                  />
                </FormField>
                {error && (
                  <p className="font-sans text-ui-sm text-danger" role="alert">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <FormField label="Email" fieldId="magic-email" required>
                  <Input
                    id="magic-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </FormField>
                {error && (
                  <p className="font-sans text-ui-sm text-danger" role="alert">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending link...' : 'Send magic link'}
                </Button>
              </form>
            )}
          </div>

          <p className="font-sans text-ui-sm text-muted text-center">
            No account?{' '}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
