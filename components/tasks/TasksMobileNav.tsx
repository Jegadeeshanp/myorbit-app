'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Sun, Inbox, CalendarDays, Plus, MoreHorizontal,
  X, Settings, CalendarCheck, ArrowUpDown,
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

  const tab = (active: boolean) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 transition ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`;
  const iconBox = (active: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-xl ${active ? 'bg-emerald-50 dark:bg-emerald-900/40' : ''}`;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-md dark:border-gray-700 dark:bg-[#1C1F26]/95 md:hidden">
        <div className="flex items-center px-1 pb-safe pt-1">
          <button onClick={() => { onViewChange('tasks'); onSelect('today'); }} className={tab(isActive('today'))}>
            <div className={iconBox(isActive('today'))}><Sun className="h-5 w-5" /></div>
            <span className="text-[10px] font-medium">Today</span>
          </button>
          <button onClick={() => { onViewChange('tasks'); onSelect('inbox'); }} className={tab(isActive('inbox'))}>
            <div className={iconBox(isActive('inbox'))}><Inbox className="h-5 w-5" /></div>
            <span className="text-[10px] font-medium">Inbox</span>
          </button>
          {/* Centre add button — taps the task input */}
          <button onClick={focusAdd} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-emerald-600 dark:text-emerald-400">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] font-medium">Add</span>
          </button>
          <button onClick={() => onViewChange('calendar')} className={tab(calActive)}>
            <div className={iconBox(calActive)}><CalendarDays className="h-5 w-5" /></div>
            <span className="text-[10px] font-medium">Calendar</span>
          </button>
          <button onClick={() => setMoreOpen(true)} className={tab(false)}>
            <div className={iconBox(false)}><MoreHorizontal className="h-5 w-5" /></div>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="w-full overflow-y-auto rounded-t-2xl border-t border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#1C1F26]" style={{ maxHeight: '65vh' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 pt-5 pb-3">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white select-none">{initials || 'U'}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{userName}</p>
                <p className="text-xs text-gray-400">Personal account</p>
              </div>
              <button onClick={() => setMoreOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="mx-4 border-t border-gray-100 dark:border-gray-700" />
            <div className="space-y-0.5 px-3 py-3">
              <button onClick={() => { onViewChange('tasks'); onSelect('next7'); setMoreOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">
                <CalendarCheck className="h-4 w-4 flex-none text-gray-400" />Next 7 Days
              </button>
              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">
                <ArrowUpDown className="h-4 w-4 flex-none text-gray-400" />Sort by
              </button>
            </div>
            <div className="mx-4 border-t border-gray-100 dark:border-gray-700" />
            <div className="space-y-0.5 px-3 py-3 pb-8">
              <Link href="/orbit/tasks/settings" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">
                <Settings className="h-4 w-4 flex-none text-gray-400" />Settings
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
