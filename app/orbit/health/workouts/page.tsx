'use client';

import { useState, useEffect } from 'react';
import { Plus, Dumbbell, X, Clock, Flame } from 'lucide-react';
import { toast } from '@/components/Toast';

type Workout = { id: string; name: string; type: string; durationMins: number; caloriesBurned?: number; distanceKm?: number; date: string; notes?: string };

const WORKOUT_TYPES = [
  { value: 'running',  label: 'Running',  emoji: '🏃' },
  { value: 'cycling',  label: 'Cycling',  emoji: '🚴' },
  { value: 'strength', label: 'Strength', emoji: '💪' },
  { value: 'yoga',     label: 'Yoga',     emoji: '🧘' },
  { value: 'sports',   label: 'Sports',   emoji: '⚽' },
  { value: 'other',    label: 'Other',    emoji: '🏋️' },
];

function AddWorkoutModal({ onClose, onCreated }: { onClose: () => void; onCreated: (w: Workout) => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ name: '', type: 'running', durationMins: '30', caloriesBurned: '', distanceKm: '', date: today, notes: '' });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));
  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100 bg-white';

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Workout name required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(), type: form.type,
          durationMins: parseInt(form.durationMins) || 30,
          caloriesBurned: form.caloriesBurned ? parseInt(form.caloriesBurned) : null,
          distanceKm: form.distanceKm ? parseFloat(form.distanceKm) : null,
          date: form.date,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error();
      const w = await res.json();
      toast('Workout logged!');
      onCreated(w);
    } catch { toast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="font-semibold text-gray-900">Log Workout</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Workout Name *</label>
            <input autoFocus className={inputCls} placeholder="e.g. Morning Run, Gym Session" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {WORKOUT_TYPES.map(t => (
                <button key={t.value} onClick={() => set('type', t.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs transition ${form.type === t.value ? 'bg-rose-50 ring-2 ring-rose-400 text-rose-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                  <span className="text-lg">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Duration (min)</label>
              <input type="number" className={inputCls} value={form.durationMins} onChange={e => set('durationMins', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Calories</label>
              <input type="number" className={inputCls} placeholder="optional" value={form.caloriesBurned} onChange={e => set('caloriesBurned', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
            <input type="date" className={inputCls} value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Log Workout'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetch('/api/workouts?limit=50')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setWorkouts(d); })
      .finally(() => setLoading(false));
  }, []);

  const totalMins = workouts.reduce((s, w) => s + w.durationMins, 0);
  const totalCals = workouts.reduce((s, w) => s + (w.caloriesBurned ?? 0), 0);
  const thisWeek  = workouts.filter(w => {
    const d = new Date(w.date + 'T12:00:00');
    const diff = (new Date().getTime() - d.getTime()) / 86400000;
    return diff <= 7;
  }).length;

  const typeEmoji = (t: string) => WORKOUT_TYPES.find(x => x.value === t)?.emoji ?? '🏋️';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Workouts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your training sessions</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 transition">
          <Plus className="h-4 w-4" />
          Log Workout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'This Week', value: thisWeek, sub: 'workouts' },
          { label: 'Total Time', value: `${Math.round(totalMins / 60)}h`, sub: `${totalMins} min overall` },
          { label: 'Calories', value: totalCals.toLocaleString(), sub: 'total burned' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : workouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
            <Dumbbell className="h-8 w-8 text-rose-400" />
          </div>
          <p className="text-base font-semibold text-gray-900">No workouts logged</p>
          <p className="mt-1 text-sm text-gray-500">Log your first training session</p>
          <button onClick={() => setShowModal(true)} className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 transition">
            <Plus className="h-4 w-4" /> Log Workout
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {workouts.map(w => (
            <div key={w.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
              <span className="text-2xl">{typeEmoji(w.type)}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{w.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" /> {w.durationMins} min
                  </span>
                  {w.caloriesBurned && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Flame className="h-3 w-3" /> {w.caloriesBurned} kcal
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400">{w.date === today ? 'Today' : w.date}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddWorkoutModal
          onClose={() => setShowModal(false)}
          onCreated={w => { setWorkouts(prev => [w, ...prev]); setShowModal(false); }}
        />
      )}
    </div>
  );
}
