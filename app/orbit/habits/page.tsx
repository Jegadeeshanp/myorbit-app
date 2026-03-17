'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Flame, CheckCircle2, X, Trash2 } from 'lucide-react';
import { toast } from '@/components/Toast';

type Habit = {
  id: string; name: string; color: string; iconEmoji: string;
  goalPerDay: number; isCountBased: boolean; daysOfWeek: string;
  sortOrder: number; isActive: boolean;
  logs: { logDate: string; value: number }[];
};

const COLORS = ['#78716C','#6B7280','#7C3AED','#2563EB','#059669','#D97706','#DB2777','#4F46E5'];
const EMOJIS = ['✅','🔥','💪','📚','🧘','🏃','💧','🥗','😴','🎯','✍️','🎵'];

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

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

// ── Add Habit Modal ────────────────────────────────────────────────────────
function AddHabitModal({ onClose, onCreated }: { onClose: () => void; onCreated: (h: Habit) => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [emoji, setEmoji] = useState('✅');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast('Habit name is required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color, iconEmoji: emoji }),
      });
      if (!res.ok) throw new Error();
      const habit = await res.json();
      toast('Habit created!');
      onCreated(habit);
    } catch {
      toast('Failed to create habit', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="font-semibold text-gray-900">New Habit</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Habit Name *</label>
            <input
              autoFocus
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              placeholder="e.g. Morning run, Read 30 min..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition ${emoji === e ? 'bg-amber-50 ring-2 ring-amber-400' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`h-8 w-8 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Create Habit'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Habit Card ─────────────────────────────────────────────────────────────
function HabitCard({ habit, dates, onLog, onDelete }: {
  habit: Habit;
  dates: string[];
  onLog: (id: string, date: string) => void;
  onDelete: (id: string) => void;
}) {
  const logSet = new Set(habit.logs.map(l => l.logDate));
  const streak = getStreakCount(habit.logs);
  const today = dates[dates.length - 1];
  const todayDone = logSet.has(today);
  const weekDone = dates.filter(d => logSet.has(d)).length;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-all">
      <div className="h-1 w-full" style={{ backgroundColor: habit.color }} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{habit.iconEmoji}</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{habit.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Flame className="h-3 w-3 text-amber-400" />
                <span className="text-xs text-gray-500">{streak} day streak</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onLog(habit.id, today)}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                todayDone
                  ? 'text-white shadow-sm'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              style={todayDone ? { backgroundColor: habit.color } : {}}
            >
              <CheckCircle2 className="h-5 w-5" />
            </button>
            <button onClick={() => onDelete(habit.id)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-300 hover:text-rose-400 hover:bg-rose-50 transition">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 7-day grid */}
        <div className="flex gap-1.5 items-center">
          {dates.map((date, i) => {
            const done = logSet.has(date);
            const isToday = i === dates.length - 1;
            const dayLabel = ['S','M','T','W','T','F','S'][new Date(date + 'T12:00:00').getDay()];
            return (
              <button key={date} onClick={() => onLog(habit.id, date)}
                className={`flex-1 flex flex-col items-center gap-1 rounded-lg py-1.5 transition ${
                  done ? 'text-white' : isToday ? 'bg-gray-50 border border-dashed border-gray-300' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                style={done ? { backgroundColor: habit.color } : {}}>
                <span className={`text-[10px] font-medium ${done ? 'text-white/80' : 'text-gray-400'}`}>{dayLabel}</span>
                <div className={`h-3 w-3 rounded-full ${done ? 'bg-white/40' : 'bg-gray-200'}`} />
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">{weekDone}/7 this week</span>
          <div className="h-1.5 flex-1 mx-2 rounded-full bg-gray-100">
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${(weekDone / 7) * 100}%`, backgroundColor: habit.color }} />
          </div>
          <span className="text-xs font-medium text-gray-600">{Math.round((weekDone / 7) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const dates = getLast7Days();
  const today = dates[dates.length - 1];

  const fetchHabits = useCallback(() => {
    fetch('/api/habits')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setHabits(d); })
      .catch(() => toast('Failed to load habits', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const handleLog = async (habitId: string, date: string) => {
    try {
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });
      const data = await res.json();
      setHabits(prev => prev.map(h => {
        if (h.id !== habitId) return h;
        if (data.removed) {
          return { ...h, logs: h.logs.filter(l => l.logDate !== date) };
        }
        const existing = h.logs.find(l => l.logDate === date);
        if (existing) return h;
        return { ...h, logs: [...h.logs, { logDate: date, value: 1 }] };
      }));
    } catch {
      toast('Failed to log habit', 'error');
    }
  };

  const handleDelete = async (habitId: string) => {
    if (!confirm('Archive this habit?')) return;
    try {
      await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
      setHabits(prev => prev.filter(h => h.id !== habitId));
      toast('Habit archived');
    } catch {
      toast('Failed to archive habit', 'error');
    }
  };

  const totalLogged   = habits.filter(h => h.logs.some(l => l.logDate === today)).length;
  const totalStreaks   = habits.reduce((s, h) => s + getStreakCount(h.logs), 0);
  const longestStreak = Math.max(0, ...habits.map(h => getStreakCount(h.logs)));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Action row — New Habit button (desktop) */}
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)}
          className="hidden md:flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition">
          <Plus className="h-4 w-4" />
          New Habit
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Today's Done", value: `${totalLogged}/${habits.length}`, sub: 'habits completed' },
          { label: 'Total Streak XP', value: totalStreaks, sub: 'combined streak days' },
          { label: 'Longest Streak', value: longestStreak, sub: 'consecutive days' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Habit grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-44 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <Flame className="h-8 w-8 text-amber-500" />
          </div>
          <p className="text-base font-semibold text-gray-900">No habits yet</p>
          <p className="mt-1 text-sm text-gray-500">Start building your daily system</p>
          <button onClick={() => setShowModal(true)}
            className="mt-4 flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition">
            <Plus className="h-4 w-4" />
            Create Habit
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {habits.map(habit => (
            <HabitCard key={habit.id} habit={habit} dates={dates} onLog={handleLog} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Mobile FAB */}
      <button onClick={() => setShowModal(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-amber-600 text-white shadow-lg hover:bg-amber-700 transition md:hidden">
        <Plus className="h-6 w-6" />
      </button>

      {showModal && (
        <AddHabitModal
          onClose={() => setShowModal(false)}
          onCreated={h => { setHabits(prev => [{ ...h, logs: [] }, ...prev]); setShowModal(false); }}
        />
      )}
    </div>
  );
}
