'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/Toast';
import { useRouter } from 'next/navigation';

const MOOD_LABELS = ['', '😞 Terrible', '😕 Bad', '😐 Okay', '😊 Good', '😄 Great'];
const ENERGY_LABELS = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export default function HealthLogPage() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    date: today,
    steps: '',
    sleepHours: '',
    waterMl: '',
    weightKg: '',
    mood: 0,
    energyLevel: 0,
    heartRate: '',
    notes: '',
  });

  // Load existing entry for today
  useEffect(() => {
    fetch('/api/health/entries?limit=7')
      .then(r => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        const existing = data.find(e => e.date === today);
        if (existing) {
          setForm({
            date: existing.date,
            steps: existing.steps?.toString() ?? '',
            sleepHours: existing.sleepHours?.toString() ?? '',
            waterMl: existing.waterMl?.toString() ?? '',
            weightKg: existing.weightKg?.toString() ?? '',
            mood: existing.mood ?? 0,
            energyLevel: existing.energyLevel ?? 0,
            heartRate: existing.heartRate?.toString() ?? '',
            notes: existing.notes ?? '',
          });
        }
      });
  }, [today]);

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: any = { date: form.date };
      if (form.steps)      body.steps       = parseInt(form.steps);
      if (form.sleepHours) body.sleepHours  = parseFloat(form.sleepHours);
      if (form.waterMl)    body.waterMl     = parseInt(form.waterMl);
      if (form.weightKg)   body.weightKg    = parseFloat(form.weightKg);
      if (form.mood)       body.mood        = form.mood;
      if (form.energyLevel) body.energyLevel = form.energyLevel;
      if (form.heartRate)  body.heartRate   = parseInt(form.heartRate);
      if (form.notes)      body.notes       = form.notes;

      const res = await fetch('/api/health/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast('Health logged!');
      setSaved(true);
      setTimeout(() => router.push('/orbit/health'), 800);
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 bg-white';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Log Health</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track your daily wellness metrics</p>
      </div>

      {/* Date */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
        <label className={labelCls}>Date</label>
        <input type="date" className={inputCls} value={form.date} onChange={e => set('date', e.target.value)} />
      </div>

      {/* Activity */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-900">Activity</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Steps</label>
            <input type="number" className={inputCls} placeholder="e.g. 8500" value={form.steps} onChange={e => set('steps', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Heart Rate (bpm)</label>
            <input type="number" className={inputCls} placeholder="e.g. 65" value={form.heartRate} onChange={e => set('heartRate', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Sleep & Hydration */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-900">Sleep & Hydration</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Sleep Hours</label>
            <input type="number" step="0.5" className={inputCls} placeholder="e.g. 7.5" value={form.sleepHours} onChange={e => set('sleepHours', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Water (ml)</label>
            <input type="number" step="100" className={inputCls} placeholder="e.g. 2000" value={form.waterMl} onChange={e => set('waterMl', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
        <label className={labelCls}>Weight (kg)</label>
        <input type="number" step="0.1" className={inputCls} placeholder="e.g. 72.5" value={form.weightKg} onChange={e => set('weightKg', e.target.value)} />
      </div>

      {/* Mood */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
        <label className={labelCls}>Mood</label>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => set('mood', n)}
              className={`flex-1 rounded-xl py-3 text-center text-2xl transition ${form.mood === n ? 'bg-pink-50 ring-2 ring-pink-400 scale-105' : 'bg-gray-50 hover:bg-gray-100'}`}>
              {MOOD_LABELS[n].split(' ')[0]}
            </button>
          ))}
        </div>
        {form.mood > 0 && (
          <p className="text-xs text-center text-gray-500 mt-2">{MOOD_LABELS[form.mood]}</p>
        )}
      </div>

      {/* Energy */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
        <label className={labelCls}>Energy Level (1–10)</label>
        <div className="flex gap-1">
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button key={n} onClick={() => set('energyLevel', n)}
              className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition ${
                form.energyLevel >= n ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {n}
            </button>
          ))}
        </div>
        {form.energyLevel > 0 && (
          <p className="text-xs text-center text-gray-500 mt-2">Energy: {form.energyLevel}/10</p>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
        <label className={labelCls}>Notes (optional)</label>
        <textarea
          className={`${inputCls} resize-none`} rows={3}
          placeholder="How are you feeling today? Any observations..."
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving || saved}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-400 py-3.5 text-sm font-semibold text-white hover:bg-rose-500 transition disabled:opacity-60">
        {saved ? <CheckCircle2 className="h-5 w-5" /> : <Save className="h-5 w-5" />}
        {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Health Log'}
      </button>
    </div>
  );
}
