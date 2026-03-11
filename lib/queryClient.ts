import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query Client Configuration
 *
 * Configured for optimal performance in Auto-Language-Learning app:
 * - 5-minute stale time: Data stays fresh for typical reading sessions
 * - No refetch on window focus: Prevents unnecessary API calls
 * - 1 retry for mutations: Handles network hiccups without excessive retries
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});
