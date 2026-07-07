'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { ViewTransitionWrapper } from '@/components/ViewTransitionWrapper';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { SkipLink } from '@/components/ui/SkipLink';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

const SHELL_HIDDEN_PATHS = ['/login', '/signup', '/onboarding'];

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const showShell = !SHELL_HIDDEN_PATHS.some((p) => pathname.startsWith(p));

  return (
    <>
      {showShell && <SkipLink targetId="main-content" />}
      {showShell && <Sidebar />}
      <ViewTransitionWrapper>
        <ErrorBoundary>
          <main
            id="main-content"
            tabIndex={-1}
            className={cn('min-h-screen pb-16 md:pb-0', showShell && 'md:ml-16')}
          >
            {children}
          </main>
        </ErrorBoundary>
      </ViewTransitionWrapper>
    </>
  );
}
