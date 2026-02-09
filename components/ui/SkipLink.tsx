'use client';

// ============================================================================
// SkipLink Component
// WCAG AA requirement - allows keyboard users to skip navigation
// ============================================================================

interface SkipLinkProps {
  /** ID of the main content element to skip to */
  targetId: string;
}

/**
 * Skip-to-content link for keyboard accessibility
 *
 * Required by WCAG AA guidelines. This link is visually hidden by default
 * but becomes visible when focused with keyboard navigation (Tab key).
 *
 * Must be the first focusable element on the page.
 *
 * @param targetId - ID of the main content area (e.g., "main-content")
 *
 * @example
 * ```tsx
 * <body>
 *   <SkipLink targetId="main-content" />
 *   <Sidebar />
 *   <main id="main-content">
 *     {children}
 *   </main>
 * </body>
 * ```
 */
export function SkipLink({ targetId }: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="
        fixed left-4 top-4 z-[9999]
        px-4 py-2
        font-sans text-ui-sm font-medium
        bg-primary text-paper
        rounded-md
        shadow-raised
        transition-all duration-150

        /* Visually hidden by default */
        -translate-y-20 opacity-0

        /* Visible on focus */
        focus:translate-y-0 focus:opacity-100
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2

        /* Smooth animation */
        ease-out
      "
    >
      Skip to main content
    </a>
  );
}
