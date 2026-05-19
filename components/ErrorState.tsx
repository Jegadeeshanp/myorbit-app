'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  onRetry?: () => void;
  message?: string;
  className?: string;
}

export default function ErrorState({
  onRetry,
  message = 'Something went wrong.',
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#1C1F26] py-16 text-center ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/20">
        <AlertCircle className="h-6 w-6 text-rose-500" />
      </div>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">{message}</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Check your connection and try again.</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  );
}
