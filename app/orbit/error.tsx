'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function OrbitError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[OrbitError]', error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10">
        <AlertTriangle className="h-8 w-8 text-rose-500" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-[#e4eaf4]">Something went wrong</h2>
      <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-[#8fa3b8]">
        An unexpected error occurred. Try refreshing or go back to the dashboard.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.05] px-5 py-2 text-sm font-medium text-gray-700 dark:text-[#e4eaf4] shadow-sm transition hover:bg-gray-50 dark:hover:bg-white/[0.08]"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <a
          href="/orbit"
          className="flex items-center gap-2 rounded-full bg-gray-900 dark:bg-white/[0.1] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 dark:hover:bg-white/[0.15]"
        >
          <Home className="h-4 w-4" />
          Dashboard
        </a>
      </div>
    </div>
  );
}
