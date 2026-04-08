'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X, Dumbbell, Droplets, Apple, Activity } from 'lucide-react';
import { toast } from '@/components/Toast';

// ── Quick Water Log modal ─────────────────────────────────────────────────

function QuickWaterModal({ onClose }: { onClose: () => void }) {
  const [ml, setMl] = useState('250');
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const handleSave = async () => {
    const water = parseInt(ml);
    if (!water || water <= 0) { toast('Enter a valid amount', 'error'); return; }
    setSaving(true);
    try {
      // Upsert today's health entry, incrementing waterMl
      const existing = await fetch('/api/health/entries?limit=1').then(r => r.json());
      const todayEntry = Array.isArray(existing) ? existing.find((e: any) => e.date === today) : null;
      const newWater = (todayEntry?.waterMl ?? 0) + water;
      const res = await fetch('/api/health/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, waterMl: newWater }),
      });
      if (!res.ok) throw new Error();
      toast(`💧 +${water}ml logged!`);
      onClose();
    } catch {
      toast('Failed to log water', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xs rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-cyan-500" />
            <p className="font-semibold text-gray-900">Log Water</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {[150, 250, 350, 500].map(v => (
              <button
                key={v}
                onClick={() => setMl(String(v))}
                className={`rounded-xl py-2.5 text-sm font-semibold transition ${ml === String(v) ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {v}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Amount (ml)</label>
            <input
              type="number"
              value={ml}
              onChange={e => setMl(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
            />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-xl bg-cyan-500 py-2.5 text-sm font-semibold text-white hover:bg-cyan-600 transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Log Water'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Quick Food Log modal ──────────────────────────────────────────────────

function QuickFoodModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [mealType, setMealType] = useState('snack');
  const [logging, setLogging] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const today = new Date().toISOString().split('T')[0];

  const handleSearch = (q: string) => {
    setQuery(q);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/food-search?q=${encodeURIComponent(q)}`);
        const d = await r.json();
        if (Array.isArray(d)) setResults(d);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 500);
  };

  const handleLog = async () => {
    if (!selected) return;
    setLogging(true);
    try {
      const r = await fetch('/api/food-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, foodName: selected.name, mealType, ...selected }),
      });
      if (!r.ok) throw new Error();
      toast('🍎 Food logged!');
      onClose();
    } catch {
      toast('Failed to log food', 'error');
    } finally {
      setLogging(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-none">
          <div className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-emerald-500" />
            <p className="font-semibold text-gray-900">Log Food</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search food (e.g. apple, rice, milk)..."
            className={inputCls}
          />

          {searching && <p className="text-sm text-gray-400 text-center py-2">Searching...</p>}

          {results.length > 0 && !selected && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => { setSelected(r); setResults([]); }}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-emerald-50 border-b border-gray-100 last:border-0 transition"
                >
                  <span className="text-gray-800 font-medium truncate flex-1 pr-2">{r.name}</span>
                  {r.calories != null && <span className="text-emerald-600 font-semibold flex-none text-xs">{r.calories} kcal</span>}
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-3">
              <div>
                <p className="font-semibold text-gray-900">{selected.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Per {selected.servingSize}</p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Cal', value: selected.calories, unit: 'kcal' },
                  { label: 'Protein', value: selected.protein, unit: 'g' },
                  { label: 'Carbs', value: selected.carbs, unit: 'g' },
                  { label: 'Fats', value: selected.fats, unit: 'g' },
                ].map(({ label, value, unit }) => value != null && (
                  <div key={label} className="rounded-xl bg-white border border-gray-100 py-2">
                    <p className="text-sm font-bold text-gray-900">{value}</p>
                    <p className="text-[10px] text-gray-400">{unit}</p>
                    <p className="text-[10px] text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
              {(selected.saturatedFat != null || selected.sodium != null || selected.potassium != null || selected.fiber != null) && (
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {selected.saturatedFat != null && <div className="flex justify-between"><span className="text-gray-500">Sat. fat</span><span className="font-medium">{selected.saturatedFat}g</span></div>}
                  {selected.fiber != null && <div className="flex justify-between"><span className="text-gray-500">Fiber</span><span className="font-medium">{selected.fiber}g</span></div>}
                  {selected.sodium != null && <div className="flex justify-between"><span className="text-gray-500">Sodium</span><span className="font-medium">{selected.sodium}mg</span></div>}
                  {selected.potassium != null && <div className="flex justify-between"><span className="text-gray-500">Potassium</span><span className="font-medium">{selected.potassium}mg</span></div>}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Meal</p>
                <div className="flex gap-2">
                  {['breakfast', 'lunch', 'dinner', 'snack'].map(m => (
                    <button key={m} onClick={() => setMealType(m)}
                      className={`flex-1 rounded-xl py-1.5 text-xs font-medium capitalize transition ${mealType === m ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-600">← Back to results</button>
            </div>
          )}

          {!searching && results.length === 0 && query.trim() && !selected && (
            <p className="text-sm text-gray-400 text-center py-4">No results. Try a different name.</p>
          )}
        </div>

        <div className="px-5 pb-5 pt-3 flex gap-3 flex-none border-t border-gray-100">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleLog} disabled={!selected || logging}
            className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition disabled:opacity-50">
            {logging ? 'Logging...' : 'Log Food'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Quick Workout modal ───────────────────────────────────────────────────

function QuickWorkoutModal({ onClose }: { onClose: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ name: '', type: 'running', durationMins: '30', caloriesBurned: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const TYPES = [
    { value: 'running', emoji: '🏃', label: 'Run' },
    { value: 'cycling', emoji: '🚴', label: 'Cycle' },
    { value: 'strength', emoji: '💪', label: 'Lift' },
    { value: 'yoga', emoji: '🧘', label: 'Yoga' },
    { value: 'sports', emoji: '⚽', label: 'Sport' },
    { value: 'other', emoji: '🏋️', label: 'Other' },
  ];

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
          date: today,
        }),
      });
      if (!res.ok) throw new Error();
      toast('💪 Workout logged!');
      onClose();
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-rose-500" />
            <p className="font-semibold text-gray-900">Log Workout</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name *</label>
            <input autoFocus className={inputCls} placeholder="e.g. Morning Run" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map(t => (
                <button key={t.value} onClick={() => set('type', t.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs transition ${form.type === t.value ? 'bg-rose-50 ring-2 ring-rose-400 text-rose-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                  <span className="text-lg">{t.emoji}</span>{t.label}
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

// ── Quick Exercise (single exercise set) modal ────────────────────────────

function QuickExerciseModal({ onClose }: { onClose: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ name: '', sets: '', reps: '', weight: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Exercise name required', 'error'); return; }
    setSaving(true);
    try {
      // Log as a strength workout with exercise name as notes
      const notes = [
        form.sets && `${form.sets} sets`,
        form.reps && `${form.reps} reps`,
        form.weight && `${form.weight}kg`,
      ].filter(Boolean).join(' × ');

      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(), type: 'strength',
          durationMins: 30, date: today,
          notes: notes || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast('🏋️ Exercise logged!');
      onClose();
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-violet-500" />
            <p className="font-semibold text-gray-900">Log Exercise</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Exercise *</label>
            <input autoFocus className={inputCls} placeholder="e.g. Bench Press, Squats" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sets</label>
              <input type="number" className={inputCls} placeholder="3" value={form.sets} onChange={e => set('sets', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Reps</label>
              <input type="number" className={inputCls} placeholder="10" value={form.reps} onChange={e => set('reps', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Kg</label>
              <input type="number" className={inputCls} placeholder="60" value={form.weight} onChange={e => set('weight', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-xl bg-violet-500 py-2.5 text-sm font-semibold text-white hover:bg-violet-600 transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Log Exercise'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FAB ───────────────────────────────────────────────────────────────────

type Modal = 'exercise' | 'workout' | 'food' | 'water' | null;

const ACTIONS = [
  { key: 'exercise' as const, label: 'Exercise',  emoji: '🏋️', bg: 'bg-violet-500 hover:bg-violet-600' },
  { key: 'workout'  as const, label: 'Workout',   emoji: '💪',  bg: 'bg-rose-500 hover:bg-rose-600' },
  { key: 'food'     as const, label: 'Food',      emoji: '🍎',  bg: 'bg-emerald-500 hover:bg-emerald-600' },
  { key: 'water'    as const, label: 'Water',     emoji: '💧',  bg: 'bg-cyan-500 hover:bg-cyan-600' },
];

export default function HealthFAB() {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openModal = (key: Modal) => { setOpen(false); setModal(key); };
  const closeModal = () => setModal(null);

  return (
    <>
      <div ref={ref} className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        {/* Action items */}
        {open && (
          <div className="flex flex-col items-end gap-2 mb-1">
            {ACTIONS.map(({ key, label, emoji, bg }) => (
              <button
                key={key}
                onClick={() => openModal(key)}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition ${bg}`}
              >
                <span className="text-base leading-none">{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Main FAB button */}
        <button
          onClick={() => setOpen(v => !v)}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all ${
            open ? 'bg-gray-700 hover:bg-gray-800 rotate-45' : 'bg-rose-500 hover:bg-rose-600'
          } text-white`}
        >
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>

      {modal === 'water'    && <QuickWaterModal    onClose={closeModal} />}
      {modal === 'food'     && <QuickFoodModal     onClose={closeModal} />}
      {modal === 'workout'  && <QuickWorkoutModal  onClose={closeModal} />}
      {modal === 'exercise' && <QuickExerciseModal onClose={closeModal} />}
    </>
  );
}
