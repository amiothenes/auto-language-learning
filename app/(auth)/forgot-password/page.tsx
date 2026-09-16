'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { friendlyAuthError } from '@/lib/auth/authErrorMessages';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { AuthIllustration } from '@/components/illustrations/AuthIllustration';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?type=recovery&next=/reset-password`,
      });
      if (error) { setError(friendlyAuthError(error.message)); return; }
      setSent(true);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-desk">
        <div className="w-full max-w-sm bg-paper border border-border rounded-card shadow-modal p-8 space-y-4 text-center">
          <p className="font-sans text-ui-xl font-semibold text-ink">Check your inbox</p>
          <p className="font-sans text-ui-sm text-muted">
            If an account exists for <span className="text-ink font-medium">{email}</span>, we sent a
            password reset link to it.
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
            <p className="font-sans text-ui-sm text-muted">Reset your password</p>
          </div>
          <p className="hidden md:block font-sans text-ui-xl font-semibold text-ink">Reset your password</p>

          <div className="bg-paper border border-border rounded-card shadow-modal p-8 space-y-4">
            <p className="font-sans text-ui-sm text-muted">
              Enter the email address for your account and we&apos;ll send you a link to reset your
              password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              {error && (
                <p className="font-sans text-ui-sm text-danger" role="alert">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending link...' : 'Send reset link'}
              </Button>
            </form>
          </div>

          <p className="font-sans text-ui-sm text-muted text-center">
            Remembered your password?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
