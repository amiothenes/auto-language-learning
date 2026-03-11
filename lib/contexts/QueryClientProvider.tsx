'use client';

import { QueryClientProvider as TanStackQueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

/**
 * QueryClientProvider Wrapper
 *
 * Wraps the TanStack Query provider with our configured queryClient.
 * Must be a 'use client' component since TanStack Query uses React hooks.
 */
export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
    </TanStackQueryClientProvider>
  );
}
