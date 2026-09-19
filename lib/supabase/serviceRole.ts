import { createClient } from '@supabase/supabase-js';

// Service-role client: bypasses RLS and storage policies entirely.
// Server-only — never import this from a client component or expose the key
// with a NEXT_PUBLIC_ prefix. Used for server-initiated writes (e.g. TTS audio
// uploads) that shouldn't depend on the calling user's own storage grants.
export const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
