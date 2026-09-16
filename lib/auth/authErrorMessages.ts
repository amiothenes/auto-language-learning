const AUTH_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Incorrect email or password.',
  'User already registered': 'An account with this email already exists. Try signing in instead.',
  'Password should be at least 6 characters': 'Password must be at least 8 characters.',
  'Password should be at least 8 characters': 'Password must be at least 8 characters.',
  'Email not confirmed': 'Please confirm your email before signing in. Check your inbox for the confirmation link.',
  'Email link is invalid or has expired': 'This link is invalid or has expired. Please request a new one.',
  'Token has expired or is invalid': 'This link is invalid or has expired. Please request a new one.',
  'New password should be different from the old password':
    'Please choose a different password than your current one.',
};

export function friendlyAuthError(rawMessage: string | undefined | null): string {
  if (!rawMessage) return 'Something went wrong. Please try again.';
  return AUTH_ERROR_MAP[rawMessage] ?? 'Something went wrong. Please try again.';
}
