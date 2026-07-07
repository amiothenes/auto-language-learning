'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SettingSection } from '@/components/settings/SettingSection';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, AlertCircle } from 'lucide-react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function useSaveStatus() {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [message, setMessage] = useState('');

  const setSaving = () => setStatus('saving');
  const setSaved = () => {
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 2500);
  };
  const setError = (msg: string) => {
    setStatus('error');
    setMessage(msg);
    setTimeout(() => setStatus('idle'), 4000);
  };

  return { status, message, setSaving, setSaved, setError };
}

export default function AccountSettingsPage() {
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const profileStatus = useSaveStatus();
  const passwordStatus = useSaveStatus();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email ?? '');
      setDisplayName(user.user_metadata?.displayName ?? '');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile() {
    profileStatus.setSaving();
    const { error } = await supabase.auth.updateUser({
      data: { displayName: displayName.trim() },
    });
    if (error) profileStatus.setError(error.message);
    else profileStatus.setSaved();
  }

  async function savePassword() {
    if (newPassword.length < 6) {
      passwordStatus.setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      passwordStatus.setError('Passwords do not match.');
      return;
    }
    passwordStatus.setSaving();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      passwordStatus.setError(error.message);
    } else {
      passwordStatus.setSaved();
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <SettingSection
        title="Profile"
        description="Your public display name and account email"
      >
        <div className="space-y-4">
          <div>
            <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
              Email
            </label>
            <Input value={email} disabled className="text-muted" />
            <p className="font-sans text-ui-xs text-muted mt-1">
              To change your email, contact support.
            </p>
          </div>

          <div>
            <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
              Display Name
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={60}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={saveProfile}
              disabled={profileStatus.status === 'saving'}
            >
              {profileStatus.status === 'saving' ? 'Saving...' : 'Save Profile'}
            </Button>
            <SaveFeedback status={profileStatus.status} errorMessage={profileStatus.message} />
          </div>
        </div>
      </SettingSection>

      {/* Security */}
      <SettingSection
        title="Security"
        description="Change your account password"
      >
        <div className="space-y-4">
          <div>
            <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
              New Password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block font-sans text-ui-sm font-medium text-ink mb-2">
              Confirm Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={savePassword}
              disabled={passwordStatus.status === 'saving' || !newPassword}
            >
              {passwordStatus.status === 'saving' ? 'Saving...' : 'Change Password'}
            </Button>
            <SaveFeedback status={passwordStatus.status} errorMessage={passwordStatus.message} />
          </div>
        </div>
      </SettingSection>
    </div>
  );
}

function SaveFeedback({ status, errorMessage }: { status: SaveStatus; errorMessage: string }) {
  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1.5 font-sans text-ui-sm text-primary">
        <CheckCircle2 size={16} strokeWidth={2} />
        Saved
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1.5 font-sans text-ui-sm text-danger">
        <AlertCircle size={16} strokeWidth={2} />
        {errorMessage}
      </span>
    );
  }
  return null;
}
