'use client';

import { useState, useEffect } from 'react';
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
    <div className="space-y-5">
      {/* Legend */}
      {!loading && habits.length > 0 && (
        <div className="flex flex-wrap gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-3 shadow-sm">
          {habits.filter(h => h.isActive).map(h => (
            <div key={h.id} className="flex items-center gap-1.5">
              <span className="text-sm">{h.iconEmoji}</span>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{h.name}</span>
              <div className="h-2.5 w-2.5 rounded-full flex-none" style={{ backgroundColor: h.color }} />
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      ) : habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-16 text-center">
          <p className="text-base font-semibold text-gray-900 dark:text-white">No habits yet</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create habits on the Dashboard to see them here</p>
        </div>
      ) : (
        <HabitCalendar habits={habits} />
      )}
    </div>
  );
}
