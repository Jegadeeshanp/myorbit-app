'use client';

import { useEffect, useState } from 'react';
import { Heart, Droplets, Moon, Footprints } from 'lucide-react';

export default function HealthSettingsPage() {
  const [stats, setStats] = useState({ entries: 0, workouts: 0, avgMood: 0, avgSleep: 0 });

  useEffect(() => {
    Promise.all([
      fetch('/api/health/entries?limit=30').then(r => r.json()),
      fetch('/api/workouts?limit=50').then(r => r.json()),
    ]).then(([entries, workouts]) => {
      if (!Array.isArray(entries) || !Array.isArray(workouts)) return;
      const moods = entries.filter((e: any) => e.mood).map((e: any) => e.mood);
      const sleeps = entries.filter((e: any) => e.sleepHours).map((e: any) => e.sleepHours);
      setStats({
        entries: entries.length,
        workouts: workouts.length,
        avgMood: moods.length ? Math.round((moods.reduce((s: number, m: number) => s + m, 0) / moods.length) * 10) / 10 : 0,
        avgSleep: sleeps.length ? Math.round((sleeps.reduce((s: number, sl: number) => s + sl, 0) / sleeps.length) * 10) / 10 : 0,
      });
    });
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Health Settings</h1>
        <p className="text-sm text-gray-500">Your wellness statistics</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Days Logged', value: stats.entries, Icon: Heart, color: 'text-rose-500 bg-rose-50' },
          { label: 'Workouts Logged', value: stats.workouts, Icon: Footprints, color: 'text-orange-500 bg-orange-50' },
          { label: 'Avg Mood', value: stats.avgMood ? `${stats.avgMood}/5` : '—', Icon: Moon, color: 'text-pink-500 bg-pink-50' },
          { label: 'Avg Sleep', value: stats.avgSleep ? `${stats.avgSleep}h` : '—', Icon: Droplets, color: 'text-indigo-500 bg-indigo-50' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color.split(' ')[1]} mb-3`}>
              <Icon className={`h-5 w-5 ${color.split(' ')[0]}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-900 mb-2">Daily Targets</p>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Footprints className="h-4 w-4 text-blue-500" /> Steps</span>
            <span className="font-medium">10,000 steps</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Moon className="h-4 w-4 text-indigo-500" /> Sleep</span>
            <span className="font-medium">7.5 hours</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Droplets className="h-4 w-4 text-cyan-500" /> Water</span>
            <span className="font-medium">2,000 ml</span>
          </div>
        </div>
      </div>
    </div>
  );
}
