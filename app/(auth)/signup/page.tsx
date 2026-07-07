'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { AuthIllustration } from '@/components/illustrations/AuthIllustration';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { onboardingComplete: false },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) { setError(error.message); return; }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-desk">
        <div className="w-full max-w-sm bg-paper border border-border rounded-card shadow-modal p-8 space-y-4 text-center">
          <p className="font-sans text-ui-xl font-semibold text-ink">Confirm your email</p>
          <p className="font-sans text-ui-sm text-muted">
            We sent a confirmation link to{' '}
            <span className="text-ink font-medium">{email}</span>. Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block font-sans text-ui-sm text-primary hover:underline"
          >
            Back to sign in
          </Link>
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
          {/* Mobile wordmark */}
          <div className="text-center space-y-1 md:hidden">
            <p className="font-sans text-ui-2xl font-bold text-primary">Verbista</p>
            <p className="font-sans text-ui-sm text-muted">Create your account</p>
          </div>
          <p className="hidden md:block font-sans text-ui-xl font-semibold text-ink">Create account</p>

          <div className="bg-paper border border-border rounded-card shadow-modal p-8 space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
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
              <FormField
                label="Password"
                fieldId="password"
                helperText="At least 6 characters"
                required
              >
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a password"
                  minLength={6}
                  required
                />
              </FormField>
              {error && (
                <p className="font-sans text-ui-sm text-danger" role="alert">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </div>

          <p className="font-sans text-ui-sm text-muted text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
