'use client';

import Link from 'next/link';
import { Zap, Target, CheckSquare, CalendarCheck, Timer, Repeat } from 'lucide-react';

const DO_SECTIONS = [
  {
    title: 'Tasks',
    subtitle: 'Manage tasks, projects and quick notes.',
    href: '/orbit/tasks',
    Icon: CheckSquare,
    color: 'sky',
    cta: 'Open Tasks →',
    features: ['Task lists', 'Subtasks', 'Priority flags', 'Due dates'],
  },
  {
    title: 'Goals',
    subtitle: 'Set and track personal targets with milestones.',
    href: '/orbit/goals',
    Icon: Target,
    color: 'violet',
    cta: 'Open Goals →',
    features: ['Goal wizard', 'Milestones', 'Progress tracking', 'Due dates'],
  },
  {
    title: 'Habits',
    subtitle: 'Build routines with streaks, focus timer & countdowns.',
    href: '/orbit/habits',
    Icon: Repeat,
    color: 'amber',
    cta: 'Open Habits →',
    features: ['Daily streaks', 'Habit grid', 'Pomodoro timer', 'Countdowns'],
  },
];

const colorMap: Record<string, { bg: string; icon: string; badge: string; pill: string; cta: string }> = {
  sky: {
    bg: 'bg-sky-50',
    icon: 'bg-sky-100 text-sky-600',
    badge: 'bg-sky-100 text-sky-700',
    pill: 'bg-sky-50 text-sky-700',
    cta: 'bg-sky-600 hover:bg-sky-700',
  },
  violet: {
    bg: 'bg-violet-50',
    icon: 'bg-violet-100 text-violet-600',
    badge: 'bg-violet-100 text-violet-700',
    pill: 'bg-violet-50 text-violet-700',
    cta: 'bg-violet-600 hover:bg-violet-700',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-100 text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    pill: 'bg-amber-50 text-amber-700',
    cta: 'bg-amber-600 hover:bg-amber-700',
  },
};

export default function DoPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-white">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Do</h1>
            <p className="text-xs text-gray-400">Tasks, Goals &amp; Habits in one place</p>
          </div>
        </div>
        <Link
          href="/orbit"
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition"
        >
          <div className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 text-white text-sm font-bold leading-none shadow-sm">
            ⭑
          </div>
          <span className="text-base font-semibold text-gray-800 hidden sm:inline">MyOrbit</span>
        </Link>
      </header>

      {/* Section cards */}
      <main className="max-w-3xl mx-auto px-4 py-8 grid gap-5 sm:grid-cols-3">
        {DO_SECTIONS.map(({ title, subtitle, href, Icon, color, cta, features }) => {
          const c = colorMap[color];
          return (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className={`px-5 pt-5 pb-4 ${c.bg}`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.icon} mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
              </div>
              <div className="px-5 py-4 flex-1">
                <div className="flex flex-wrap gap-1.5">
                  {features.map((f) => (
                    <span key={f} className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.pill}`}>{f}</span>
                  ))}
                </div>
              </div>
              <div className="px-5 pb-5">
                <Link
                  href={href}
                  className={`block w-full text-center rounded-full px-4 py-2 text-sm font-semibold text-white transition ${c.cta}`}
                >
                  {cta}
                </Link>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
