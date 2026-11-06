'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * True while the visitor is a Supabase anonymous user ("Start reading" without
 * signing up). Updates on auth changes, so it flips to false once a guest
 * saves their library (email linked).
 */
export function useIsGuest(): boolean {
  const [isGuest, setIsGuest] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setIsGuest(data.user?.is_anonymous === true));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsGuest(session?.user?.is_anonymous === true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return isGuest;
}
