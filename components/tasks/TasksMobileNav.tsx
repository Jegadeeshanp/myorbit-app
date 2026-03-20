'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Sun, Inbox, CalendarDays, List, MoreHorizontal,
  X, Settings, User, CalendarCheck,
} from 'lucide-react';

interface Props {
  selected: string;
  view: 'tasks' | 'calendar';
  onSelect: (key: string) => void;
  onViewChange: (v: 'tasks' | 'calendar') => void;
  focusAdd: () => void;
}

export default function TasksMobileNav({ selected, view, onSelect, onViewChange, focusAdd }: Props) {
  const { data: session } = useSession();
  const [moreOpen, setMoreOpen] = useState(false);

  const userName = session?.user?.name ?? 'User';
  const initials = userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const isActive = (key: string) => view === 'tasks' && selected === key;
  const calActive = view === 'calendar';

  const btnCls = (active: boolean) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 transition ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`;

  const iconWrap = (active: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-xl transition ${active ? 'bg-emerald-50 dark:bg-emerald-900/40' : ''}`;

  return (
    <>
      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-md dark:border-gray-700 dark:bg-[#1C1F26]/95 md:hidden">
        <div className="flex items-center px-1 pb-safe pt-1">

          {/* Today */}
          <button onClick={() => { onViewChange('tasks'); onSelect('today'); }} className={btnCls(isActive('today'))}>
            <div className={iconWrap(isActive('today'))}><Sun className="h-5 w-5" /></div>
            <span className="text-[10px] font-medium">Today</span>
          </button>

          {/* Inbox */}
          <button onClick={() => { onViewChange('tasks'); onSelect('inbox'); }} className={btnCls(isActive('inbox'))}>
            <div className={iconWrap(isActive('inbox'))}><Inbox className="h-5 w-5" /></div>
            <span className="text-[10px] font-medium">Inbox</span>
          </button>

          {/* Lists */}
          <button onClick={() => { onViewChange('tasks'); onSelect('inbox'); }} className={btnCls(false)}>
            <div className={iconWrap(false)}><List className="h-5 w-5" /></div>
            <span className="text-[10px] font-medium">Lists</span>
          </button>

          {/* Calendar */}
          <button onClick={() => onViewChange('calendar')} className={btnCls(calActive)}>
            <div className={iconWrap(calActive)}><CalendarDays className="h-5 w-5" /></div>
            <span className="text-[10px] font-medium">Calendar</span>
          </button>

          {/* More */}
          <button onClick={() => setMoreOpen(true)} className={btnCls(false)}>
            <div className={iconWrap(false)}><MoreHorizontal className="h-5 w-5" /></div>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More sheet — slides up from bottom */}
      {moreOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:hidden" onClick={() => setMoreOpen(false)}>
          <div
            className="w-full overflow-y-auto rounded-t-2xl border-t border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#1C1F26]"
            style={{ maxHeight: '65vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">More</p>
              <button onClick={() => setMoreOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Nav options */}
            <div className="space-y-0.5 px-3 pb-2">
              <button
                onClick={() => { onViewChange('tasks'); onSelect('next7'); setMoreOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive('next7') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'}`}
              >
                <CalendarCheck className="h-4 w-4 flex-none text-gray-400" />
                Next 7 Days
              </button>
            </div>

            <div className="mx-4 border-t border-gray-100 dark:border-gray-700" />

            {/* User + settings */}
            <div className="space-y-0.5 px-3 pt-3 pb-8">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white select-none">
                  {initials || <User className="h-3.5 w-3.5" />}
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
              </div>
              <Link
                href="/orbit/tasks/settings"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
              >
                <Settings className="h-4 w-4 flex-none text-gray-400" />
                Task Settings
              </Link>
              <Link
                href="/orbit"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
              >
                <div className="flex h-4 w-4 flex-none items-center justify-center rounded-md bg-gradient-to-br from-green-400 to-emerald-600 text-[8px] font-bold text-white">★</div>
                Back to MyOrbit
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
