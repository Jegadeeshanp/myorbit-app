'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from '@/components/Toast';

type HabitLog = { id: string; logDate: string; value: number };
type Habit    = { id: string; name: string; iconEmoji?: string; color?: string; goalPerDay: number; logs: HabitLog[] };

const LAST_7_DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - 6 + i);
  return d.toISOString().split('T')[0];
});

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white';

function AddHabitModal({ onClose, onCreated }: { onClose: () => void; onCreated: (h: Habit) => void }) {
  const [name, setName]         = useState('');
  const [emoji, setEmoji]       = useState('✅');
  const [color, setColor]       = useState('#3B82F6');
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast('Name required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), iconEmoji: emoji, color }),
      });
      if (!res.ok) throw new Error();
      const h = await res.json();
      toast('Habit created');
      onCreated(h);
    } catch {
      toast('Failed to create', 'error');
    } finally {
      setSaving(false);
    }
  };

  const EMOJIS = ['✅', '💪', '🏃', '📚', '💧', '🧘', '🎯', '⭐', '🔥', '😴', '🥗', '💊'];
  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="font-semibold text-gray-900">New Habit</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Habit Name</label>
            <input className={inputCls} placeholder="e.g. Drink water, Exercise..." value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`text-xl p-2 rounded-xl transition ${emoji === e ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-gray-100 hover:bg-gray-200'}`}>{e}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition ${color === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition">
            {saving ? 'Creating...' : 'Create Habit'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HabitGrid() {
  const [habits, setHabits]     = useState<Habit[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const fetchHabits = useCallback(() => {
    fetch('/api/habits')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setHabits(d); })
      .catch(() => toast('Failed to load habits', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const toggleLog = async (habitId: string, date: string, isLogged: boolean) => {
    try {
      if (isLogged) {
        await fetch(`/api/habits/${habitId}/log?logDate=${date}`, { method: 'DELETE' });
      } else {
        await fetch(`/api/habits/${habitId}/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logDate: date }),
        });
      }
      // Optimistic: refresh habits
      fetchHabits();
    } catch {
      toast('Failed to update', 'error');
    }
  };

  const deleteHabit = async (id: string) => {
    if (!confirm('Remove this habit?')) return;
    try {
      await fetch(`/api/habits/${id}`, { method: 'DELETE' });
      setHabits(prev => prev.filter(h => h.id !== id));
      toast('Habit removed');
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Habits</h2>
          <p className="text-sm text-gray-600 mt-0.5">Build your daily rituals</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" /> Add Habit
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : habits.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-semibold text-gray-900">No habits yet</p>
          <p className="text-sm text-gray-500 mt-1">Start building positive routines</p>
          <button onClick={() => setShowModal(true)} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
            Add First Habit
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Header row */}
          <div className="flex items-center px-4 py-2 border-b border-gray-100 bg-gray-50">
            <div className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Habit</div>
            <div className="flex gap-2 ml-auto">
              {LAST_7_DAYS.map(d => {
                const date = new Date(d + 'T00:00:00');
                return (
                  <div key={d} className={`w-8 text-center text-[10px] font-medium ${d === today ? 'text-blue-600' : 'text-gray-400'}`}>
                    {DAY_LABELS[date.getDay()]}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700/30">
            {habits.map(habit => (
              <div key={habit.id} className="group flex items-center px-4 py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xl">{habit.iconEmoji || '✅'}</span>
                  <p className="text-sm font-medium text-gray-800 truncate">{habit.name}</p>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="opacity-0 group-hover:opacity-100 transition text-gray-300 hover:text-rose-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex gap-2 ml-auto">
                  {LAST_7_DAYS.map(d => {
                    const isLogged = habit.logs.some(l => l.logDate === d);
                    const isToday  = d === today;
                    return (
                      <button
                        key={d}
                        onClick={() => toggleLog(habit.id, d, isLogged)}
                        className={`w-8 h-8 rounded-xl transition flex items-center justify-center text-sm ${
                          isLogged
                            ? 'shadow-sm text-white'
                            : isToday
                              ? 'border-2 border-dashed border-blue-200 bg-blue-50/50 hover:border-blue-400'
                              : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                        style={isLogged ? { backgroundColor: habit.color || '#3B82F6' } : {}}
                      >
                        {isLogged ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <AddHabitModal
          onClose={() => setShowModal(false)}
          onCreated={h => { setHabits(prev => [...prev, h]); setShowModal(false); }}
        />
      )}
    </div>
  );
}
