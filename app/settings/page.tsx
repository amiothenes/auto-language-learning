// ============================================================================
// Settings Root Page
// Redirects to /settings/display by default
// ============================================================================

import { redirect } from 'next/navigation';

export default function SettingsPage() {
  redirect('/settings/display');
}
