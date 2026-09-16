'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { friendlyAuthError } from '@/lib/auth/authErrorMessages';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { AuthIllustration } from '@/components/illustrations/AuthIllustration';

type SessionState = 'checking' | 'valid' | 'invalid';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSessionState(user ? 'valid' : 'invalid');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) { setError(friendlyAuthError(error.message)); return; }
      const onboarded = data.user?.user_metadata?.onboardingComplete;
      router.replace(onboarded ? '/dashboard' : '/onboarding');
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sessionState === 'checking') {
    return <div className="min-h-screen bg-desk" />;
  }

  if (sessionState === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-desk">
        <div className="w-full max-w-sm bg-paper border border-border rounded-card shadow-modal p-8 space-y-4 text-center">
          <p className="font-sans text-ui-xl font-semibold text-ink">Link invalid or expired</p>
          <p className="font-sans text-ui-sm text-muted">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block font-sans text-ui-sm text-primary hover:underline"
          >
            Request a new link
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
            <p className="font-sans text-ui-sm text-muted">Choose a new password</p>
          </div>
          <p className="hidden md:block font-sans text-ui-xl font-semibold text-ink">Choose a new password</p>

          <div className="bg-paper border border-border rounded-card shadow-modal p-8 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="New password" fieldId="password" helperText="At least 8 characters" required>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a password"
                  minLength={8}
                  required
                />
              </FormField>
              <FormField label="Confirm password" fieldId="confirm-password" required>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  minLength={8}
                  required
                />
              </FormField>
              {error && (
                <p className="font-sans text-ui-sm text-danger" role="alert">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving...' : 'Save new password'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
