import Link from 'next/link';
import { Home, Search, Library } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyStateIllustration } from '@/components/ui/EmptyStateIllustration';

// ============================================================================
// 404 Not Found Page
// Displayed when user navigates to non-existent route
// ============================================================================

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-desk">
      <div className="bg-paper border border-border rounded-card shadow-raised p-12 max-w-md text-center">
        {/* Illustration */}
        <div className="mb-6 flex justify-center">
          <EmptyStateIllustration type="telescope" />
        </div>

        {/* 404 Badge */}
        <div className="inline-block px-3 py-1 bg-primary/10 rounded-full mb-4">
          <span className="font-sans text-ui-sm font-semibold text-primary">404</span>
        </div>

        {/* Heading */}
        <h1 className="font-sans text-ui-2xl font-semibold text-ink mb-3">
          Page Not Found
        </h1>

        {/* Description */}
        <p className="font-sans text-ui-base text-muted mb-8">
          {`The page you're looking for doesn't exist or has been moved.`}
        </p>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <Link href="/">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Home size={18} strokeWidth={2} />}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/series">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Library size={16} strokeWidth={2} />}
                className="w-full"
              >
                Series
              </Button>
            </Link>
            <Link href="/vocabulary">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Search size={16} strokeWidth={2} />}
                className="w-full"
              >
                Vocabulary
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: '404 - Page Not Found | Auto Language Learning',
};
