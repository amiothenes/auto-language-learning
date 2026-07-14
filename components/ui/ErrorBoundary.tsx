'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ============================================================================
// ErrorBoundary Component
// React Error Boundary for catching unhandled errors
// ============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode; // Optional custom fallback
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // TODO: Log to error reporting service when backend is implemented
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-desk">
          <div className="bg-paper border border-border rounded-card shadow-raised p-8 max-w-md text-center">
            {/* Error Icon */}
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center">
                <AlertTriangle size={40} className="text-danger" strokeWidth={1.5} />
              </div>
            </div>

            {/* Heading */}
            <h1 className="font-sans text-ui-xl font-semibold text-ink mb-3">
              Something went wrong
            </h1>

            {/* Description */}
            <p className="font-sans text-ui-base text-muted mb-2">
              An unexpected error occurred. This has been logged for review.
            </p>

            {/* Error details in development only */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-desk rounded text-left">
                <summary className="font-sans text-ui-sm font-medium text-ink cursor-pointer mb-2">
                  Error details (dev only)
                </summary>
                <pre className="font-mono text-xs text-muted overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {/* Action buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                size="md"
                leftIcon={<RefreshCw size={16} strokeWidth={2} />}
                onClick={this.handleReset}
              >
                Try again
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Home size={16} strokeWidth={2} />}
                onClick={() => (window.location.href = '/dashboard')}
              >
                Go to Dashboard
              </Button>
            </div>

            {/* Temporary backend note */}
            <p className="mt-6 font-sans text-ui-xs text-muted">
              Note: Error logging will be enabled when the backend is implemented.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
