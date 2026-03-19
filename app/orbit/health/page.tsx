'use client';

import { useState, useEffect } from 'react';
import { Plus, Heart, Footprints, Moon, Droplets, Smile, Zap, Activity } from 'lucide-react';
import Link from 'next/link';

type HealthEntry = {
  id: string; date: string; steps?: number; sleepHours?: number; waterMl?: number;
  weightKg?: number; mood?: number; energyLevel?: number; heartRate?: number; notes?: string;
};

type Workout = { id: string; name: string; type: string; durationMins: number; caloriesBurned?: number; date: string };

const MOOD_LABELS = ['', '😞', '😕', '😐', '😊', '😄'];

function HealthScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="#f3f4f6" strokeWidth="12" />
        <circle cx="72" cy="72" r={r} fill="none" stroke="url(#hg)" strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        <defs>
          <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center z-10">
        <p className="text-3xl font-bold text-gray-900">{score}</p>
        <p className="text-xs text-gray-500">Health Score</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, icon: Icon, iconBg, iconColor }: {
  label: string; value: string | number | undefined; unit: string; icon: any; iconBg: string; iconColor: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg} mb-3`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <p className="text-xl font-bold text-gray-900">{value ?? '—'} <span className="text-sm font-normal text-gray-400">{value !== undefined ? unit : ''}</span></p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function HealthPage() {
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Promise.all([
      fetch('/api/health/entries?limit=7').then(r => r.json()),
      fetch('/api/workouts?limit=5').then(r => r.json()),
    ]).then(([e, w]) => {
      if (Array.isArray(e)) setEntries(e);
      if (Array.isArray(w)) setWorkouts(w);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const todayEntry = entries.find(e => e.date === today);

  let score = 0;
  if (todayEntry) {
    if (todayEntry.steps && todayEntry.steps >= 10000) score += 25;
    else if (todayEntry.steps) score += Math.round((todayEntry.steps / 10000) * 25);
    if (todayEntry.sleepHours && todayEntry.sleepHours >= 7.5) score += 25;
    else if (todayEntry.sleepHours) score += Math.round((todayEntry.sleepHours / 7.5) * 25);
    if (todayEntry.mood) score += Math.round((todayEntry.mood / 5) * 25);
    if (todayEntry.energyLevel) score += Math.round((todayEntry.energyLevel / 10) * 25);
  }

  const WORKOUT_TYPES: Record<string, string> = {
    running: '🏃', cycling: '🚴', strength: '💪', yoga: '🧘', sports: '⚽', other: '🏋️'
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Action row */}
      <div className="flex justify-end">
        <Link href="/orbit/health/log"
          className="hidden md:flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition">
          <Plus className="h-4 w-4" />
          Log Today
        </Link>
      </div>

      {/* Score + today's entry */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 flex flex-col items-center justify-center gap-2">
          <HealthScoreRing score={score} />
          <p className="text-xs text-gray-400">
            {todayEntry ? "Based on today's data" : "Log today's metrics to see your score"}
          </p>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-3">
          <MetricCard label="Steps"      value={todayEntry?.steps}       unit="steps" icon={Footprints} iconBg="bg-blue-50"   iconColor="text-blue-500" />
          <MetricCard label="Sleep"      value={todayEntry?.sleepHours}  unit="hrs"   icon={Moon}       iconBg="bg-indigo-50" iconColor="text-indigo-500" />
          <MetricCard label="Water"      value={todayEntry?.waterMl ? Math.round(todayEntry.waterMl / 100) / 10 : undefined} unit="L" icon={Droplets} iconBg="bg-cyan-50" iconColor="text-cyan-500" />
          <MetricCard label="Heart Rate" value={todayEntry?.heartRate}   unit="bpm"   icon={Heart}      iconBg="bg-rose-50"  iconColor="text-rose-500" />
        </div>
      </div>

      {/* Mood & Energy */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Smile className="h-5 w-5 text-pink-400" />
            <p className="text-sm font-medium text-gray-700">Today's Mood</p>
          </div>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(n => (
              <div key={n} className={`flex-1 text-center rounded-lg py-2 text-lg transition ${todayEntry?.mood === n ? 'bg-rose-50 ring-2 ring-rose-200' : 'bg-gray-50'}`}>
                {MOOD_LABELS[n]}
              </div>
            ))}
          </div>
          {!todayEntry?.mood && <p className="text-xs text-gray-400 mt-2 text-center">Not logged today</p>}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-amber-400" />
            <p className="text-sm font-medium text-gray-700">Energy Level</p>
          </div>
          {todayEntry?.energyLevel ? (
            <div>
              <div className="flex items-end gap-1 mb-1">
                <p className="text-3xl font-bold text-gray-900">{todayEntry.energyLevel}</p>
                <p className="text-sm text-gray-400 mb-1">/10</p>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-amber-400 transition-all" style={{ width: `${todayEntry.energyLevel * 10}%` }} />
              </div>
            </div>
          ) : <p className="text-xs text-gray-400 mt-2">Not logged today</p>}
        </div>
      </div>

      {/* 7-day history */}
      {entries.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Last 7 Days</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-gray-500 font-medium pb-2 pr-4">Date</th>
                  <th className="text-right text-gray-500 font-medium pb-2 px-2">Steps</th>
                  <th className="text-right text-gray-500 font-medium pb-2 px-2">Sleep</th>
                  <th className="text-right text-gray-500 font-medium pb-2 px-2">Mood</th>
                  <th className="text-right text-gray-500 font-medium pb-2 px-2">Energy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/30">
                {entries.map(e => (
                  <tr key={e.id}>
                    <td className="py-2 pr-4 text-gray-600 font-medium">{e.date === today ? 'Today' : e.date}</td>
                    <td className="py-2 px-2 text-right text-gray-700">{e.steps?.toLocaleString() ?? '—'}</td>
                    <td className="py-2 px-2 text-right text-gray-700">{e.sleepHours ? `${e.sleepHours}h` : '—'}</td>
                    <td className="py-2 px-2 text-right text-gray-700">{e.mood ? MOOD_LABELS[e.mood] : '—'}</td>
                    <td className="py-2 px-2 text-right text-gray-700">{e.energyLevel ? `${e.energyLevel}/10` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent workouts */}
      {workouts.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">Recent Workouts</p>
            <Link href="/orbit/health/workouts" className="text-xs text-rose-500 hover:text-rose-600">See all →</Link>
          </div>
          <div className="space-y-2">
            {workouts.slice(0, 4).map(w => (
              <div key={w.id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
                <span className="text-xl">{WORKOUT_TYPES[w.type] || '🏋️'}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{w.name}</p>
                  <p className="text-xs text-gray-500">{w.durationMins} min{w.caloriesBurned ? ` · ${w.caloriesBurned} kcal` : ''}</p>
                </div>
                <p className="text-xs text-gray-400">{w.date === today ? 'Today' : w.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && workouts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
            <Activity className="h-8 w-8 text-rose-400" />
          </div>
          <p className="text-base font-semibold text-gray-900">Start tracking your health</p>
          <p className="mt-1 text-sm text-gray-500">Log your daily metrics to see your Health Score</p>
          <Link href="/orbit/health/log"
            className="mt-4 flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition">
            <Plus className="h-4 w-4" />
            Log Today's Health
          </Link>
        </div>
      )}
    </div>
  );
}
