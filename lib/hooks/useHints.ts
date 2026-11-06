'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * One-time teaching moments (the guided read, field notes), remembered per
 * account in Supabase user_metadata.hintsSeen so they don't repeat on another
 * device. `ready` is false until the account's list has loaded. Never show a
 * hint before it's ready, or it would flash for people who already saw it.
 */

export type HintKey =
  | 'guided-read'
  | 'note-review'
  | 'note-review-due'
  | 'note-starter-deck'
  | 'note-vocabulary'
  | 'note-series'
  | 'note-series-detail'
  | 'note-own-import'
  | 'note-readiness'
  | 'note-progress'
  | 'note-today';

let cache: Set<string> | null = null;
const listeners = new Set<(s: Set<string>) => void>();

function publish(next: Set<string>) {
  cache = next;
  listeners.forEach((l) => l(next));
}

export function useHints() {
  const [seen, setSeen] = useState<Set<string> | null>(cache);

  useEffect(() => {
    listeners.add(setSeen);
    if (!cache) {
      createClient()
        .auth.getUser()
        .then(({ data }) => {
          const list = data.user?.user_metadata?.hintsSeen;
          publish(new Set(Array.isArray(list) ? (list as string[]) : []));
        })
        .catch(() => publish(new Set()));
    }
    return () => {
      listeners.delete(setSeen);
    };
  }, []);

  const hasSeen = useCallback((key: HintKey) => seen?.has(key) ?? true, [seen]);

  const markSeen = useCallback(async (key: HintKey) => {
    const current = cache ?? new Set<string>();
    if (current.has(key)) return;
    const next = new Set(current).add(key);
    publish(next); // optimistic, so the hint disappears right away
    try {
      await createClient().auth.updateUser({ data: { hintsSeen: [...next] } });
    } catch {
      // Non-fatal: worst case the hint shows once more on another device.
    }
  }, []);

  return { ready: seen !== null, hasSeen, markSeen };
}
