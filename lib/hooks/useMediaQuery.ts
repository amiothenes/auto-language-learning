'use client';

import { useState, useEffect } from 'react';

/**
 * SSR-safe media query hook.
 * Returns false during SSR and on initial client render,
 * then updates to the actual match state.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatches(mql.matches); // Intentional: sync with browser media query state

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
