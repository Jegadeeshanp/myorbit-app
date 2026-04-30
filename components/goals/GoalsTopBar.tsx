'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import OrbitIcon from '@/components/OrbitIcon';

const PAGE_TITLES: Record<string, string> = {
  '/orbit/goals':           'Overview',
  '/orbit/goals/all':       'All Goals',
  '/orbit/goals/active':    'Active',
  '/orbit/goals/completed': 'Completed',
};

const PAGE_SUBTITLES: Record<string, string> = {
  '/orbit/goals':           'Your personal GPS — direction, process, and daily execution.',
  '/orbit/goals/all':       'Every goal you have set, in one place.',
  '/orbit/goals/active':    'Goals you are actively working towards right now.',
  '/orbit/goals/completed': 'Goals you have successfully achieved.',
};

const MyOrbitBadge = () => (
  <Link
    href="/orbit"
    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition hover:bg-gray-100"
  >
    <OrbitIcon src="/icons/top-icon.svg" />
    <span className="text-base font-semibold text-gray-800">MyOrbit</span>
  </Link>
);

export default function GoalsTopBar({ action }: { action?: React.ReactNode }) {
  const pathname = usePathname() ?? '';

  // For goal detail pages like /orbit/goals/[id], use a generic title
  const title    = PAGE_TITLES[pathname] ?? 'Goal';
  const subtitle = PAGE_SUBTITLES[pathname] ?? 'Goal details and GPS breakdown.';

  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-6">
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
