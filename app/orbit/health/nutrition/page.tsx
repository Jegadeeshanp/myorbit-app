'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Pencil, UtensilsCrossed, ChevronLeft, ChevronRight,
  Settings2, X,
} from 'lucide-react';
import { toast } from '@/components/Toast';

// ── Types ─────────────────────────────────────────────────────────────────

type MealTime = 'morning' | 'noon' | 'evening' | 'night';

type FoodEntry = {
  id: string;
  date: string;
  name: string;
  mealType: MealTime;
  calories?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  saturatedFatG?: number | null;
  sodiumMg?: number | null;
  potassiumMg?: number | null;
  fiberG?: number | null;
  servingSize?: string | null;
  notes?: string | null;
};

type BodyProfile = {
  heightCm: number;
  weightKg: number;
  ageYears: number;
  gender: 'male' | 'female';
  activity: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
};

// ── Meal groups ────────────────────────────────────────────────────────────

const MEALS: { key: MealTime; label: string; time: string; color: string; border: string }[] = [
  { key: 'morning', label: 'Morning',  time: '6 am – 11 am', color: 'bg-amber-50',  border: 'border-amber-100' },
  { key: 'noon',    label: 'Noon',     time: '11 am – 2 pm', color: 'bg-blue-50',   border: 'border-blue-100' },
  { key: 'evening', label: 'Evening',  time: '2 pm – 7 pm',  color: 'bg-orange-50', border: 'border-orange-100' },
  { key: 'night',   label: 'Night',    time: '7 pm onwards', color: 'bg-indigo-50', border: 'border-indigo-100' },
];

const MEAL_EMOJI: Record<MealTime, string> = {
  morning: '🌅', noon: '☀️', evening: '🌇', night: '🌙',
};

// ── Calorie calculation (Mifflin-St Jeor) ─────────────────────────────────

const ACTIVITY_FACTORS: Record<BodyProfile['activity'], number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};

function calcTargets(p: BodyProfile) {
  const bmr = p.gender === 'male'
    ? 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.ageYears + 5
    : 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.ageYears - 161;
  const calories = Math.round(bmr * ACTIVITY_FACTORS[p.activity]);
  return {
    calories,
    proteinG:  Math.round((calories * 0.30) / 4),  // 30% from protein
    carbsG:    Math.round((calories * 0.45) / 4),  // 45% from carbs
    fatG:      Math.round((calories * 0.25) / 9),  // 25% from fat
    fiberG:    p.gender === 'male' ? 38 : 25,
    sodiumMg:  2300,
    waterMl:   Math.round(p.weightKg * 35),        // ~35ml per kg body weight
  };
}

const DEFAULT_TARGETS = { calories: 2000, proteinG: 50, carbsG: 250, fatG: 65, fiberG: 28, sodiumMg: 2300, waterMl: 2000 };

// ── Profile modal ──────────────────────────────────────────────────────────

function ProfileModal({ profile, onSave, onClose }: {
  profile: BodyProfile | null;
  onSave: (p: BodyProfile) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    heightCm: profile?.heightCm?.toString() ?? '',
    weightKg: profile?.weightKg?.toString() ?? '',
    ageYears: profile?.ageYears?.toString() ?? '',
    gender:   profile?.gender ?? 'male' as 'male' | 'female',
    activity: profile?.activity ?? 'moderate' as BodyProfile['activity'],
  });

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white';

  function handleSave() {
    const h = parseFloat(form.heightCm);
    const w = parseFloat(form.weightKg);
    const a = parseInt(form.ageYears);
    if (!h || !w || !a || h < 50 || h > 250 || w < 20 || w > 300 || a < 10 || a > 120) {
      toast('Please enter valid height, weight and age', 'error');
      return;
    }
    onSave({ heightCm: h, weightKg: w, ageYears: a, gender: form.gender, activity: form.activity });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="font-semibold text-gray-900">Body Profile</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Height (cm)</label>
              <input type="number" className={inputCls} placeholder="170" value={form.heightCm}
                onChange={e => setForm(f => ({ ...f, heightCm: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Weight (kg)</label>
              <input type="number" className={inputCls} placeholder="70" value={form.weightKg}
                onChange={e => setForm(f => ({ ...f, weightKg: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Age</label>
              <input type="number" className={inputCls} placeholder="25" value={form.ageYears}
                onChange={e => setForm(f => ({ ...f, ageYears: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Gender</label>
            <div className="grid grid-cols-2 gap-2">
              {(['male', 'female'] as const).map(g => (
                <button key={g} onClick={() => setForm(f => ({ ...f, gender: g }))}
                  className={`rounded-xl py-2.5 text-sm font-medium capitalize transition ${form.gender === g ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                  {g === 'male' ? '♂ Male' : '♀ Female'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Activity Level</label>
            <div className="space-y-1.5">
              {[
                { key: 'sedentary',  label: 'Sedentary',    sub: 'Desk job, little exercise' },
                { key: 'light',      label: 'Light',        sub: '1–3 days/week exercise' },
                { key: 'moderate',   label: 'Moderate',     sub: '3–5 days/week exercise' },
                { key: 'active',     label: 'Active',       sub: '6–7 days/week exercise' },
                { key: 'very_active',label: 'Very Active',  sub: 'Physical job + daily exercise' },
              ].map(({ key, label, sub }) => (
                <button key={key} onClick={() => setForm(f => ({ ...f, activity: key as BodyProfile['activity'] }))}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left transition ${form.activity === key ? 'bg-emerald-50 ring-1 ring-emerald-300' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <span className={`text-sm font-medium ${form.activity === key ? 'text-emerald-700' : 'text-gray-700'}`}>{label}</span>
                  <span className="text-xs text-gray-400">{sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition">
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Log Food Modal ─────────────────────────────────────────────────────────

function FoodModal({ open, onClose, initial, date, defaultMeal, onSaved }: {
  open: boolean; onClose: () => void;
  initial?: FoodEntry | null; date: string;
  defaultMeal?: MealTime;
  onSaved: (entry: FoodEntry) => void;
}) {
  const [form, setForm] = useState({
    name: '', mealType: (defaultMeal ?? 'morning') as MealTime,
    servingSize: '', calories: '', proteinG: '', carbsG: '', fatG: '',
    saturatedFatG: '', sodiumMg: '', potassiumMg: '', fiberG: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        name: initial.name, mealType: initial.mealType,
        servingSize: initial.servingSize ?? '',
        calories: initial.calories?.toString() ?? '',
        proteinG: initial.proteinG?.toString() ?? '',
        carbsG: initial.carbsG?.toString() ?? '',
        fatG: initial.fatG?.toString() ?? '',
        saturatedFatG: initial.saturatedFatG?.toString() ?? '',
        sodiumMg: initial.sodiumMg?.toString() ?? '',
        potassiumMg: initial.potassiumMg?.toString() ?? '',
        fiberG: initial.fiberG?.toString() ?? '',
        notes: initial.notes ?? '',
      } : { name: '', mealType: defaultMeal ?? 'morning', servingSize: '', calories: '', proteinG: '', carbsG: '', fatG: '', saturatedFatG: '', sodiumMg: '', potassiumMg: '', fiberG: '', notes: '' });
    }
  }, [open, initial, defaultMeal]);

  if (!open) return null;

  const n = (s: string) => s ? parseFloat(s) : undefined;

  async function handleSave() {
    if (!form.name.trim()) { toast('Food name required', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        date, name: form.name.trim(), mealType: form.mealType,
        servingSize: form.servingSize || null,
        notes: form.notes || null,
        calories: n(form.calories), proteinG: n(form.proteinG),
        carbsG: n(form.carbsG), fatG: n(form.fatG),
        saturatedFatG: n(form.saturatedFatG), sodiumMg: n(form.sodiumMg),
        potassiumMg: n(form.potassiumMg), fiberG: n(form.fiberG),
      };
      const url = initial ? `/api/health/food/${initial.id}` : '/api/health/food';
      const method = initial ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      onSaved(saved);
      onClose();
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-none">
          <p className="font-semibold text-gray-900">{initial ? 'Edit Food' : 'Log Food'}</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"><X className="h-4 w-4" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Food Name *</label>
            <input autoFocus type="text" className={inputCls} placeholder="e.g. Idli, Dal Rice, Apple"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Meal Time</label>
            <div className="grid grid-cols-4 gap-2">
              {MEALS.map(m => (
                <button key={m.key} onClick={() => setForm(f => ({ ...f, mealType: m.key }))}
                  className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs transition ${form.mealType === m.key ? 'bg-emerald-50 ring-2 ring-emerald-300 text-emerald-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                  <span className="text-base">{MEAL_EMOJI[m.key]}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Serving Size</label>
              <input type="text" className={inputCls} placeholder="e.g. 1 cup, 100g"
                value={form.servingSize} onChange={e => setForm(f => ({ ...f, servingSize: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Calories (kcal)</label>
              <input type="number" className={inputCls} placeholder="0"
                value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'proteinG',  label: 'Protein (g)' },
              { key: 'carbsG',    label: 'Carbs (g)' },
              { key: 'fatG',      label: 'Fat (g)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
                <input type="number" step="0.1" className={inputCls} placeholder="0"
                  value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 flex gap-3 flex-none border-t border-gray-100">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition disabled:opacity-50">
            {saving ? 'Saving…' : initial ? 'Update' : 'Log Food'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────

function ProgressBar({ consumed, target, color }: { consumed: number; target: number; color: string }) {
  const pct = Math.min((consumed / target) * 100, 100);
  const over = consumed > target;
  return (
    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
      <div className={`h-2 rounded-full transition-all ${over ? 'bg-red-400' : color}`}
        style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

const PROFILE_KEY = 'health_body_profile';

function loadProfile(): BodyProfile | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null'); } catch { return null; }
}
function saveProfile(p: BodyProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export default function NutritionPage() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BodyProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [defaultMeal, setDefaultMeal] = useState<MealTime>('morning');

  // Load profile from localStorage on mount
  useEffect(() => { setProfile(loadProfile()); }, []);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/health/food?date=${d}`);
      if (res.ok) setEntries(await res.json());
      else setEntries([]);
    } catch { setEntries([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  // Refresh when food is logged from the FAB (on any page)
  useEffect(() => {
    const refresh = () => load(date);
    window.addEventListener('health:food-refresh', refresh);
    return () => window.removeEventListener('health:food-refresh', refresh);
  }, [date, load]);

  function shiftDate(days: number) {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  }

  function formatDateLabel(d: string) {
    if (d === today) return 'Today';
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (d === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function handleProfileSave(p: BodyProfile) {
    saveProfile(p);
    setProfile(p);
    setShowProfile(false);
    toast('Profile saved!');
  }

  function openAdd(meal: MealTime) {
    setDefaultMeal(meal);
    setEditing(null);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/health/food/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setEntries(e => e.filter(x => x.id !== id));
      toast('Removed');
    } catch { toast('Failed to delete', 'error'); }
  }

  function handleSaved(entry: FoodEntry) {
    setEntries(prev => {
      const idx = prev.findIndex(e => e.id === entry.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = entry; return n; }
      return [...prev, entry];
    });
    toast(editing ? 'Updated!' : 'Logged!');
    setEditing(null);
  }

  // Compute totals
  const tot = {
    calories:    entries.reduce((s, e) => s + (e.calories ?? 0), 0),
    proteinG:    entries.reduce((s, e) => s + (e.proteinG ?? 0), 0),
    carbsG:      entries.reduce((s, e) => s + (e.carbsG ?? 0), 0),
    fatG:        entries.reduce((s, e) => s + (e.fatG ?? 0), 0),
    fiberG:      entries.reduce((s, e) => s + (e.fiberG ?? 0), 0),
    sodiumMg:    entries.reduce((s, e) => s + (e.sodiumMg ?? 0), 0),
  };

  const targets = profile ? calcTargets(profile) : DEFAULT_TARGETS;

  const fmt = (n: number, d = 1) => n > 0 ? Number(n.toFixed(d)).toString() : '0';
  const remaining = (key: keyof typeof targets) =>
    Math.max(0, targets[key] - ((tot as any)[key] ?? 0));

  return (
    <div className="space-y-5">

      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        {/* Date nav */}
        <div className="flex items-center gap-2">
          <button onClick={() => shiftDate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 shadow-sm">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-gray-900 min-w-[80px] text-center">{formatDateLabel(date)}</span>
          <button onClick={() => shiftDate(1)} disabled={date >= today}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 shadow-sm disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowProfile(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition">
            <Settings2 className="h-4 w-4 text-gray-400" />
            {profile ? 'Profile' : 'Set Profile'}
          </button>
          <button onClick={() => openAdd(currentMeal())}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition">
            <Plus className="h-4 w-4" />
            Log Food
          </button>
        </div>
      </div>

      {/* No profile banner */}
      {!profile && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-800">Set your body profile to get personalised calorie & macro targets.</p>
          <button onClick={() => setShowProfile(true)}
            className="flex-none rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition">
            Set up
          </button>
        </div>
      )}

      {/* Daily calorie summary */}
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Calories</p>
            <p className="text-xs text-gray-400 mt-0.5">Daily target: {targets.calories.toLocaleString()} kcal</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{Math.round(tot.calories).toLocaleString()}</p>
            <p className="text-xs text-gray-400">consumed</p>
          </div>
        </div>

        <ProgressBar consumed={tot.calories} target={targets.calories} color="bg-emerald-400" />

        <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
          <div className="rounded-xl bg-green-50 py-2">
            <p className="font-bold text-green-700 text-sm">{Math.round(tot.calories)}</p>
            <p className="text-green-600">consumed</p>
          </div>
          <div className="rounded-xl bg-gray-50 py-2">
            <p className="font-bold text-gray-700 text-sm">{targets.calories.toLocaleString()}</p>
            <p className="text-gray-500">target</p>
          </div>
          <div className={`rounded-xl py-2 ${tot.calories > targets.calories ? 'bg-red-50' : 'bg-blue-50'}`}>
            <p className={`font-bold text-sm ${tot.calories > targets.calories ? 'text-red-600' : 'text-blue-600'}`}>
              {tot.calories > targets.calories
                ? `+${Math.round(tot.calories - targets.calories)}`
                : Math.round(targets.calories - tot.calories)}
            </p>
            <p className={tot.calories > targets.calories ? 'text-red-500' : 'text-blue-500'}>
              {tot.calories > targets.calories ? 'over' : 'remaining'}
            </p>
          </div>
        </div>
      </div>

      {/* Macros grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Protein', consumed: tot.proteinG, target: targets.proteinG, unit: 'g', color: 'bg-blue-400' },
          { label: 'Carbs',   consumed: tot.carbsG,   target: targets.carbsG,   unit: 'g', color: 'bg-amber-400' },
          { label: 'Fat',     consumed: tot.fatG,     target: targets.fatG,     unit: 'g', color: 'bg-rose-400' },
        ].map(({ label, consumed, target, unit, color }) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-end justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500">{label}</p>
              <p className="text-xs text-gray-400">{Math.round(target)}{unit}</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{fmt(consumed, 1)}<span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span></p>
            <ProgressBar consumed={consumed} target={target} color={color} />
            <p className={`text-[11px] mt-1.5 ${consumed > target ? 'text-red-500' : 'text-gray-400'}`}>
              {consumed > target
                ? `${fmt(consumed - target, 1)}${unit} over`
                : `${fmt(target - consumed, 1)}${unit} left`}
            </p>
          </div>
        ))}
      </div>

      {/* Fiber + Sodium */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: '🥦 Fiber', consumed: tot.fiberG, target: targets.fiberG, unit: 'g', color: 'bg-green-400' },
          { label: '🧂 Sodium', consumed: tot.sodiumMg, target: targets.sodiumMg, unit: 'mg', color: 'bg-orange-400' },
        ].map(({ label, consumed, target, unit, color }) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-end justify-between mb-1.5">
              <p className="text-xs font-semibold text-gray-600">{label}</p>
              <p className="text-xs text-gray-400">{target}{unit}</p>
            </div>
            <p className="text-base font-bold text-gray-900">{fmt(consumed, 1)}<span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span></p>
            <ProgressBar consumed={consumed} target={target} color={color} />
          </div>
        ))}
      </div>

      {/* Meal groups */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {MEALS.map(({ key, label, time, color, border }) => {
            const items = entries.filter(e => e.mealType === key);
            const mealCals = items.reduce((s, e) => s + (e.calories ?? 0), 0);

            return (
              <div key={key} className={`rounded-2xl border ${border} ${color} px-5 py-4 shadow-sm`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{MEAL_EMOJI[key]}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-[11px] text-gray-400">{time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {mealCals > 0 && <span className="text-xs font-medium text-gray-500">{Math.round(mealCals)} kcal</span>}
                    <button onClick={() => openAdd(key)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition shadow-sm">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <button onClick={() => openAdd(key)}
                    className="w-full rounded-xl border border-dashed border-gray-200 bg-white/60 py-3 text-xs text-gray-400 hover:text-gray-600 hover:bg-white transition">
                    + Add {label.toLowerCase()} food
                  </button>
                ) : (
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-sm group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                            {item.servingSize && <span className="text-[11px] text-gray-400">{item.servingSize}</span>}
                            {item.calories != null && item.calories > 0 && <span className="text-[11px] text-gray-500">🔥 {Math.round(item.calories)} kcal</span>}
                            {item.proteinG != null && item.proteinG > 0 && <span className="text-[11px] text-gray-400">P {Number(item.proteinG.toFixed(1))}g</span>}
                            {item.carbsG   != null && item.carbsG   > 0 && <span className="text-[11px] text-gray-400">C {Number(item.carbsG.toFixed(1))}g</span>}
                            {item.fatG     != null && item.fatG     > 0 && <span className="text-[11px] text-gray-400">F {Number(item.fatG.toFixed(1))}g</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-none">
                          <button onClick={() => { setEditing(item); setModalOpen(true); }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(item.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:bg-rose-50 hover:text-rose-500 transition">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showProfile && (
        <ProfileModal profile={profile} onSave={handleProfileSave} onClose={() => setShowProfile(false)} />
      )}
      <FoodModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        initial={editing}
        date={date}
        defaultMeal={defaultMeal}
        onSaved={handleSaved}
      />
    </div>
  );
}

// Helper — default meal based on current hour
function currentMeal(): MealTime {
  const h = new Date().getHours();
  if (h < 11) return 'morning';
  if (h < 14) return 'noon';
  if (h < 19) return 'evening';
  return 'night';
}
