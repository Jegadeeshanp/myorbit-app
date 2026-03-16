// components/ErrorBoundary.tsx
// Global React error boundary for catching unexpected runtime errors.
// Renders a friendly fallback UI instead of a blank white screen.
//
// Usage in layout.tsx:
//   import ErrorBoundary from '@/components/ErrorBoundary';
//   <ErrorBoundary><YourComponent /></ErrorBoundary>

'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface State {
  hasError: boolean;
  error:    Error | null;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production you'd send this to Sentry / Datadog
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
            <AlertTriangle className="h-8 w-8 text-rose-500" />
          </div>

          <h2 className="mt-4 text-xl font-bold text-gray-900">Something went wrong</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            An unexpected error occurred. Try refreshing the page or going back to the dashboard.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 max-w-md rounded-xl bg-gray-50 p-4 text-left">
              <summary className="cursor-pointer text-xs font-medium text-gray-500">
                Error details
              </summary>
              <pre className="mt-2 overflow-auto text-xs text-rose-600 whitespace-pre-wrap">
                {this.state.error.message}
              </pre>
            </details>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
            <a
              href="/orbit"
              className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
