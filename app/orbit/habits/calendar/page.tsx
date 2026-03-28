'use client';

import { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import HabitCalendar, { type HabitForCalendar } from '@/components/habits/HabitCalendar';
import { toast } from '@/components/Toast';

export default function HabitsCalendarPage() {
  const [habits, setHabits] = useState<HabitForCalendar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/habits')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setHabits(d); })
      .catch(() => toast('Failed to load habits', 'error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
          <CalendarDays className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Habit Calendar</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">Track your habit completion over time</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-3 shadow-sm">
        {habits.filter(h => h.isActive).map(h => (
          <div key={h.id} className="flex items-center gap-1.5">
            <span className="text-sm">{h.iconEmoji}</span>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{h.name}</span>
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: h.color }} />
          </div>
        ))}
        {habits.length === 0 && !loading && (
          <p className="text-xs text-gray-400">No active habits — create some on the Dashboard</p>
        )}
        {loading && (
          <div className="h-4 w-48 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        )}
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      ) : (
        <HabitCalendar habits={habits} />
      )}
    </div>
  );
}
