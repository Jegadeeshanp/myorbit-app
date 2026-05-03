'use client';

import Link from 'next/link';
import OrbitIcon from '@/components/OrbitIcon';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Activity, LayoutDashboard, Flame, Timer, CalendarClock, Settings, CalendarDays } from 'lucide-react';

const menu = [
  { label: 'Dashboard',   href: '/orbit/habits',             Icon: LayoutDashboard },
  { label: 'Calendar',    href: '/orbit/habits/calendar',    Icon: CalendarDays },
  { label: 'Streaks',     href: '/orbit/habits/streaks',     Icon: Flame },
  { label: 'Focus Timer', href: '/orbit/habits/focus',       Icon: Timer },
  { label: 'Countdowns',  href: '/orbit/habits/countdowns',  Icon: CalendarClock },
];

export default function HabitsSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const active = useMemo(() => {
    if (!pathname) return '/orbit/habits';
    const exact = menu.find(m => m.href === pathname);
    if (exact) return exact.href;
    const prefix = menu.find(m => pathname.startsWith(m.href) && m.href !== '/orbit/habits');
    if (prefix) return prefix.href;
    return '/orbit/habits';
  }, [pathname]);

  const userName = session?.user?.name ?? 'User';
  const initials = userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="sticky top-0 hidden h-screen w-56 flex-none flex-col overflow-y-auto border-r border-gray-100 bg-white px-3 py-5 md:flex">
      <div className="mb-5 px-2">
        <div className="flex items-center gap-2.5">
          <OrbitIcon src="/icons/dashboard-icon.png" className="h-8 w-8 rounded-lg object-cover shadow-sm" fallbackClassName="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100" fallbackContent={<Activity className="h-4 w-4 text-amber-600" />} />
          <div>
            <div className="text-sm font-semibold text-gray-900">Habits</div>
            <div className="text-[11px] text-gray-400">Behavioral engine</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5">
        {menu.map(({ label, href, Icon }) => {
          const isActive = active === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-4 w-4 flex-none ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-gray-100" />

      <div className="mt-3 space-y-0.5">
        <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
          <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white select-none">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 leading-none">{userName}</p>
            <p className="mt-0.5 truncate text-[11px] text-gray-400">Personal account</p>
          </div>
        </div>

        <Link
          href="/orbit/habits/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
        >
          <Settings className="h-4 w-4 flex-none text-gray-400" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
