'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/orbit/reflect':        'Life Score',
  '/orbit/reflect/weekly': 'Weekly Review',
};

const PAGE_SUBTITLES: Record<string, string> = {
  '/orbit/reflect':        'Your cross-module intelligence dashboard.',
  '/orbit/reflect/weekly': 'A structured reflection on your week across all modules.',
};

const MyOrbitBadge = () => (
  <Link
    href="/orbit"
    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition hover:bg-gray-100"
  >
    <div className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 text-white text-sm font-bold leading-none shadow-sm">
      ⭑
    </div>
    <span className="text-base font-semibold text-gray-800">MyOrbit</span>
  </Link>
);

export default function InsightsTopBar({ action }: { action?: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const title    = PAGE_TITLES[pathname] ?? 'Reflect';
  const subtitle = PAGE_SUBTITLES[pathname] ?? 'Intelligent insights from your data.';

  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:px-6 flex-none">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-0.5 hidden text-sm text-gray-400 sm:block">{subtitle}</p>
      </div>
      <div className="flex flex-none items-center gap-2">
        {action}
        <MyOrbitBadge />
      </div>
    </div>
  );
}
