'use client';

import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';

type Habit = {
  id: string; name: string; iconEmoji: string; color: string;
  logs: { logDate: string }[];
};

function getStreakCount(logs: { logDate: string }[]): number {
  const logSet = new Set(logs.map(l => l.logDate));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (logSet.has(d.toISOString().split('T')[0])) streak++;
    else break;
  }
  return streak;
}

function getBestStreak(logs: { logDate: string }[]): number {
  if (logs.length === 0) return 0;
  const sorted = [...logs].sort((a, b) => a.logDate.localeCompare(b.logDate));
  let best = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].logDate + 'T12:00:00');
    const curr = new Date(sorted[i].logDate + 'T12:00:00');
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) { cur++; best = Math.max(best, cur); }
    else cur = 1;
  }
  return best;
}

export default function HabitsStreaksPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/habits').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setHabits(d);
    }).finally(() => setLoading(false));
  }, []);

  const sorted = [...habits].sort((a, b) => getStreakCount(b.logs) - getStreakCount(a.logs));

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}</div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-center">
          <Flame className="h-10 w-10 text-orange-200 mb-3" />
          <p className="font-semibold text-gray-900">No habits yet</p>
          <p className="text-sm text-gray-500 mt-1">Create habits to start building streaks</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {sorted.map((habit, idx) => {
            const current = getStreakCount(habit.logs);
            const best = getBestStreak(habit.logs);
            const total = habit.logs.length;
            return (
              <div key={habit.id} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0">
                <span className="text-lg text-gray-400 font-bold w-6 text-center">{idx + 1}</span>
                <span className="text-2xl">{habit.iconEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{habit.name}</p>
                  <p className="text-xs text-gray-400">{total} total logs</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <span className="text-lg font-bold text-gray-900">{current}</span>
                  </div>
                  <p className="text-xs text-gray-400">current</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-600">{best}</span>
                  <p className="text-xs text-gray-400">best</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
