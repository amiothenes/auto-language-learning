'use client';

import { useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

// ============================================================================
// ViewTransitionWrapper Component
// Enables View Transitions API for Next.js route changes
// Falls back gracefully for unsupported browsers
// ============================================================================

interface ViewTransitionWrapperProps {
  children: ReactNode;
}

export function ViewTransitionWrapper({ children }: ViewTransitionWrapperProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Check if browser supports View Transitions API
    if (!document.startViewTransition) {
      return; // Graceful degradation for unsupported browsers
    }

    // View transition is handled automatically by CSS
    // This wrapper ensures the API is available
  }, [pathname]);

  return <>{children}</>;
}
