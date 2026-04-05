'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Pencil, UtensilsCrossed, ChevronLeft, ChevronRight,
  Flame, Beef, Wheat, Droplets, FlaskConical, Zap, Activity,
} from 'lucide-react';
import { toast } from '@/components/Toast';

type FoodEntry = {
  id: string;
  date: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  saturatedFatG?: number | null;
  sodiumMg?: number | null;
  potassiumMg?: number | null;
  fiberG?: number | null;
  waterMl?: number | null;
  servingSize?: string | null;
  notes?: string | null;
};

type Totals = {
  calories: number; proteinG: number; carbsG: number; fatG: number;
  saturatedFatG: number; sodiumMg: number; potassiumMg: number;
  fiberG: number; waterMl: number;
};

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_LABELS: Record<string, string> = {
  breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner', snack: '🍎 Snack',
};
const MEAL_COLORS: Record<string, string> = {
  breakfast: 'bg-amber-50 border-amber-100',
  lunch: 'bg-blue-50 border-blue-100',
  dinner: 'bg-indigo-50 border-indigo-100',
  snack: 'bg-emerald-50 border-emerald-100',
};

type FormState = {
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servingSize: string;
  calories: string; proteinG: string; carbsG: string; fatG: string;
  saturatedFatG: string; sodiumMg: string; potassiumMg: string;
  fiberG: string; waterMl: string; notes: string;
};

const EMPTY_FORM: FormState = {
  name: '', mealType: 'snack', servingSize: '',
  calories: '', proteinG: '', carbsG: '', fatG: '',
  saturatedFatG: '', sodiumMg: '', potassiumMg: '', fiberG: '', waterMl: '', notes: '',
};

function fmt(n?: number | null, decimals = 1) {
  if (n == null || n === 0) return '—';
  return Number(n.toFixed(decimals)).toString();
}

function calcTotals(entries: FoodEntry[]): Totals {
  return entries.reduce((acc, e) => ({
    calories: acc.calories + (e.calories ?? 0),
    proteinG: acc.proteinG + (e.proteinG ?? 0),
    carbsG: acc.carbsG + (e.carbsG ?? 0),
    fatG: acc.fatG + (e.fatG ?? 0),
    saturatedFatG: acc.saturatedFatG + (e.saturatedFatG ?? 0),
    sodiumMg: acc.sodiumMg + (e.sodiumMg ?? 0),
    potassiumMg: acc.potassiumMg + (e.potassiumMg ?? 0),
    fiberG: acc.fiberG + (e.fiberG ?? 0),
    waterMl: acc.waterMl + (e.waterMl ?? 0),
  }), { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, saturatedFatG: 0, sodiumMg: 0, potassiumMg: 0, fiberG: 0, waterMl: 0 });
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────

function FoodModal({ open, onClose, initial, date, onSaved }: {
  open: boolean; onClose: () => void;
  initial?: FoodEntry | null; date: string;
  onSaved: (entry: FoodEntry) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        name: initial.name,
        mealType: initial.mealType,
        servingSize: initial.servingSize ?? '',
        calories: initial.calories?.toString() ?? '',
        proteinG: initial.proteinG?.toString() ?? '',
        carbsG: initial.carbsG?.toString() ?? '',
        fatG: initial.fatG?.toString() ?? '',
        saturatedFatG: initial.saturatedFatG?.toString() ?? '',
        sodiumMg: initial.sodiumMg?.toString() ?? '',
        potassiumMg: initial.potassiumMg?.toString() ?? '',
        fiberG: initial.fiberG?.toString() ?? '',
        waterMl: initial.waterMl?.toString() ?? '',
        notes: initial.notes ?? '',
      } : EMPTY_FORM);
    }
  }, [open, initial]);

  if (!open) return null;

  function field(key: string) {
    return {
      value: (form as any)[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(f => ({ ...f, [key]: e.target.value })),
    };
  }

  function numField(key: string) {
    return {
      value: (form as any)[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [key]: e.target.value })),
    };
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        date,
        name: form.name.trim(),
        mealType: form.mealType,
        servingSize: form.servingSize || undefined,
        notes: form.notes || undefined,
        calories: form.calories ? parseFloat(form.calories) : undefined,
        proteinG: form.proteinG ? parseFloat(form.proteinG) : undefined,
        carbsG: form.carbsG ? parseFloat(form.carbsG) : undefined,
        fatG: form.fatG ? parseFloat(form.fatG) : undefined,
        saturatedFatG: form.saturatedFatG ? parseFloat(form.saturatedFatG) : undefined,
        sodiumMg: form.sodiumMg ? parseFloat(form.sodiumMg) : undefined,
        potassiumMg: form.potassiumMg ? parseFloat(form.potassiumMg) : undefined,
        fiberG: form.fiberG ? parseFloat(form.fiberG) : undefined,
        waterMl: form.waterMl ? parseFloat(form.waterMl) : undefined,
      };

      const url = initial ? `/api/health/food/${initial.id}` : '/api/health/food';
      const method = initial ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed');
      const saved = await res.json();
      onSaved(saved);
      onClose();
    } catch {
      toast('Failed to save food entry', 'error');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-none">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{initial ? 'Edit Food' : 'Log Food'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Track what you ate and its nutrition</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Name + Meal type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 font-medium">Food Item *</label>
              <input type="text" placeholder="e.g. Chicken Rice, Apple, Dal" {...field('name')}
                className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Meal</label>
              <select {...field('mealType')} className={`mt-1 ${inputCls}`}>
                {MEAL_TYPES.map(m => <option key={m} value={m}>{MEAL_LABELS[m]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Serving Size</label>
              <input type="text" placeholder="e.g. 1 cup, 100g" {...field('servingSize')}
                className={`mt-1 ${inputCls}`} />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Nutrition (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'calories',      label: '🔥 Calories',       unit: 'kcal' },
                { key: 'proteinG',      label: '🥩 Protein',        unit: 'g' },
                { key: 'carbsG',        label: '🍞 Carbs',          unit: 'g' },
                { key: 'fatG',          label: '🧈 Fat',            unit: 'g' },
                { key: 'saturatedFatG', label: '🧀 Saturated Fat',  unit: 'g' },
                { key: 'fiberG',        label: '🥦 Fiber',          unit: 'g' },
                { key: 'sodiumMg',      label: '🧂 Sodium',         unit: 'mg' },
                { key: 'potassiumMg',   label: '🍌 Potassium',      unit: 'mg' },
                { key: 'waterMl',       label: '💧 Water',          unit: 'ml' },
              ].map(({ key, label, unit }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 font-medium">{label} <span className="text-gray-300">({unit})</span></label>
                  <input type="number" step="0.1" placeholder="0" {...numField(key)}
                    className={`mt-1 ${inputCls}`} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium">Notes</label>
            <textarea rows={2} placeholder="Any notes about this meal..." {...field('notes')}
              className={`mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:border-rose-400 focus:outline-none`} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-100 flex-none">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition disabled:opacity-60">
            {saving ? 'Saving…' : initial ? 'Update' : 'Log Food'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function NutritionPage() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FoodEntry | null>(null);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/health/food?date=${d}`);
      if (res.ok) setEntries(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  function shiftDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  }

  function formatDateLabel(d: string) {
    const dt = new Date(d + 'T00:00:00');
    if (d === today) return 'Today';
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (d === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/health/food/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setEntries(e => e.filter(x => x.id !== id));
      toast('Food entry deleted');
    } catch {
      toast('Failed to delete', 'error');
    }
  }

  function handleSaved(entry: FoodEntry) {
    setEntries(prev => {
      const idx = prev.findIndex(e => e.id === entry.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = entry; return next; }
      return [...prev, entry];
    });
    toast(editing ? 'Updated!' : 'Food logged!');
    setEditing(null);
  }

  const totals = calcTotals(entries);
  const grouped = MEAL_TYPES.map(m => ({ meal: m, items: entries.filter(e => e.mealType === m) })).filter(g => g.items.length > 0);

  const macroCalFromProtein = totals.proteinG * 4;
  const macroCalFromCarbs = totals.carbsG * 4;
  const macroCalFromFat = totals.fatG * 9;
  const totalMacroCal = macroCalFromProtein + macroCalFromCarbs + macroCalFromFat || 1;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Date nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftDate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition shadow-sm">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-gray-900 min-w-[90px] text-center">{formatDateLabel(date)}</span>
          <button onClick={() => shiftDate(1)} disabled={date >= today}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition shadow-sm disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 shadow-sm transition">
          <Plus className="h-4 w-4" />
          Log Food
        </button>
      </div>

      {/* Daily totals summary */}
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-900 mb-4">Today&apos;s Totals</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {[
            { icon: '🔥', label: 'Calories', value: totals.calories ? Math.round(totals.calories).toLocaleString() : '—', unit: 'kcal', highlight: true },
            { icon: '🥩', label: 'Protein',  value: fmt(totals.proteinG), unit: 'g' },
            { icon: '🍞', label: 'Carbs',    value: fmt(totals.carbsG),   unit: 'g' },
            { icon: '🧈', label: 'Fat',      value: fmt(totals.fatG),     unit: 'g' },
            { icon: '💧', label: 'Water',    value: totals.waterMl ? `${Math.round(totals.waterMl / 100) / 10}` : '—', unit: 'L' },
          ].map(stat => (
            <div key={stat.label} className={`rounded-2xl px-3 py-3 text-center ${stat.highlight ? 'bg-rose-50 border border-rose-100' : 'bg-gray-50'}`}>
              <p className="text-xl mb-0.5">{stat.icon}</p>
              <p className={`text-lg font-bold ${stat.highlight ? 'text-rose-600' : 'text-gray-900'}`}>{stat.value}</p>
              <p className="text-[11px] text-gray-400">{stat.unit}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Macro breakdown bar */}
        {(totals.proteinG > 0 || totals.carbsG > 0 || totals.fatG > 0) && (
          <div className="mt-4">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="bg-blue-400 transition-all" style={{ width: `${(macroCalFromProtein / totalMacroCal) * 100}%` }} />
              <div className="bg-amber-400 transition-all" style={{ width: `${(macroCalFromCarbs / totalMacroCal) * 100}%` }} />
              <div className="bg-rose-400 transition-all" style={{ width: `${(macroCalFromFat / totalMacroCal) * 100}%` }} />
            </div>
            <div className="mt-1.5 flex gap-4 text-[11px] text-gray-500">
              <span><span className="inline-block h-2 w-2 rounded-full bg-blue-400 mr-1" />Protein {fmt(totals.proteinG)}g</span>
              <span><span className="inline-block h-2 w-2 rounded-full bg-amber-400 mr-1" />Carbs {fmt(totals.carbsG)}g</span>
              <span><span className="inline-block h-2 w-2 rounded-full bg-rose-400 mr-1" />Fat {fmt(totals.fatG)}g</span>
            </div>
          </div>
        )}

        {/* Secondary nutrients */}
        {(totals.sodiumMg > 0 || totals.potassiumMg > 0 || totals.fiberG > 0 || totals.saturatedFatG > 0) && (
          <div className="mt-3 grid grid-cols-4 gap-2 border-t border-gray-100 pt-3">
            {[
              { label: '🧂 Sodium',      value: totals.sodiumMg,      unit: 'mg' },
              { label: '🍌 Potassium',   value: totals.potassiumMg,   unit: 'mg' },
              { label: '🥦 Fiber',       value: totals.fiberG,        unit: 'g' },
              { label: '🧀 Sat. Fat',    value: totals.saturatedFatG, unit: 'g' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xs font-semibold text-gray-700">{s.value > 0 ? fmt(s.value) : '—'} <span className="font-normal text-gray-400">{s.unit}</span></p>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Food entries by meal */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
            <UtensilsCrossed className="h-8 w-8 text-rose-300" />
          </div>
          <p className="text-base font-semibold text-gray-900">No food logged {date === today ? 'today' : 'on this day'}</p>
          <p className="mt-1 text-sm text-gray-400">Tap "Log Food" to start tracking your nutrition</p>
          <button onClick={() => { setEditing(null); setModalOpen(true); }}
            className="mt-4 flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition">
            <Plus className="h-4 w-4" />
            Log Food
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ meal, items }) => (
            <div key={meal} className={`rounded-2xl border px-5 py-4 shadow-sm ${MEAL_COLORS[meal]}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800">{MEAL_LABELS[meal]}</p>
                <p className="text-xs text-gray-500">
                  {Math.round(items.reduce((s, e) => s + (e.calories ?? 0), 0))} kcal
                </p>
              </div>
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-start gap-3 rounded-xl bg-white px-3 py-2.5 shadow-sm group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        {item.servingSize && <span className="text-[11px] text-gray-400">{item.servingSize}</span>}
                        {item.calories != null && <span className="text-[11px] text-gray-500">🔥 {Math.round(item.calories)} kcal</span>}
                        {item.proteinG != null && <span className="text-[11px] text-gray-500">P: {fmt(item.proteinG)}g</span>}
                        {item.carbsG != null && <span className="text-[11px] text-gray-500">C: {fmt(item.carbsG)}g</span>}
                        {item.fatG != null && <span className="text-[11px] text-gray-500">F: {fmt(item.fatG)}g</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-none">
                      <button onClick={() => { setEditing(item); setModalOpen(true); }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
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
            </div>
          ))}
        </div>
      )}

      <FoodModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        initial={editing}
        date={date}
        onSaved={handleSaved}
      />
    </div>
  );
}