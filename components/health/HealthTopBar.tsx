'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import OrbitIcon from '@/components/OrbitIcon';

const PAGE_TITLES: Record<string, string> = {
  '/orbit/health':          'Dashboard',
  '/orbit/health/log':      'Log Today',
  '/orbit/health/workouts': 'Workouts',
};

const PAGE_SUBTITLES: Record<string, string> = {
  '/orbit/health':          'Track your wellness metrics daily.',
  '/orbit/health/log':      'Record today\'s health data — steps, sleep, mood and more.',
  '/orbit/health/workouts': 'Your workout history and performance over time.',
};

const MyOrbitBadge = () => (
  <Link
    href="/orbit"
    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition hover:bg-gray-100"
  >
    <OrbitIcon src="/icons/top-icon.png" />
    <span className="text-base font-semibold text-gray-800">MyOrbit</span>
  </Link>
);

export default function HealthTopBar({ action }: { action?: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const title    = PAGE_TITLES[pathname] ?? 'Health';
  const subtitle = PAGE_SUBTITLES[pathname] ?? 'Your wellness and fitness overview.';

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
