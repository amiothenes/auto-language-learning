'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { queryClient } from '@/lib/queryClient';

const LANGUAGE_STORAGE_KEY = 'verbista_selected_language';

// Syncs Supabase auth state changes to the TanStack Query cache.
// SIGNED_IN  → invalidate all queries so they re-fetch with the new session.
// SIGNED_OUT → clear all cached data so the next user starts fresh.
export function AuthQuerySync() {
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        queryClient.invalidateQueries();
      } else if (event === 'SIGNED_OUT') {
        queryClient.clear();
        localStorage.removeItem(LANGUAGE_STORAGE_KEY);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return null;
}
