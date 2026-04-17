'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import OrbitIcon from '@/components/OrbitIcon';

const PAGE_TITLES: Record<string, string> = {
  '/orbit/habits':             'Dashboard',
  '/orbit/habits/calendar':    'Calendar',
  '/orbit/habits/streaks':     'Streaks',
  '/orbit/habits/focus':       'Focus Timer',
  '/orbit/habits/countdowns':  'Countdowns',
};

const PAGE_SUBTITLES: Record<string, string> = {
  '/orbit/habits':             'Build systems that compound over time.',
  '/orbit/habits/calendar':    'Track your habit completion across days and months.',
  '/orbit/habits/streaks':     'Your habit consistency and longest streaks at a glance.',
  '/orbit/habits/focus':       'Deep work sessions with Pomodoro-style focus blocks.',
  '/orbit/habits/countdowns':  'Important dates and milestone countdowns.',
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

export default function HabitsTopBar({ action }: { action?: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const title    = PAGE_TITLES[pathname] ?? 'Habits';
  const subtitle = PAGE_SUBTITLES[pathname] ?? 'Track and build your daily habits.';

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
