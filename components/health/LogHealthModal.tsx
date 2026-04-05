'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { HealthEntry } from '@/lib/healthStore';

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: HealthEntry | null;
  onSave: (data: Omit<HealthEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<HealthEntry>;
};

const MOOD_LABELS = ['', '😞 Bad', '😕 Poor', '😐 Okay', '😊 Good', '😄 Great'];

export default function LogHealthModal({ open, onClose, initial, onSave }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [steps, setSteps] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [waterMl, setWaterMl] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [mood, setMood] = useState<number>(0);
  const [energyLevel, setEnergyLevel] = useState<number>(0);
  const [heartRate, setHeartRate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(initial?.date ?? today);
      setSteps(initial?.steps?.toString() ?? '');
      setSleepHours(initial?.sleepHours?.toString() ?? '');
      setWaterMl(initial?.waterMl?.toString() ?? '');
      setWeightKg(initial?.weightKg?.toString() ?? '');
      setMood(initial?.mood ?? 0);
      setEnergyLevel(initial?.energyLevel ?? 0);
      setHeartRate(initial?.heartRate?.toString() ?? '');
      setNotes(initial?.notes ?? '');
    }
  }, [open, initial]);

  if (!open) return null;

  async function handleSubmit() {
    setSaving(true);
    try {
      await onSave({
        date,
        steps: steps ? parseInt(steps) : null,
        sleepHours: sleepHours ? parseFloat(sleepHours) : null,
        waterMl: waterMl ? parseInt(waterMl) : null,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        mood: mood || null,
        energyLevel: energyLevel || null,
        heartRate: heartRate ? parseInt(heartRate) : null,
        notes: notes || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-none">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Log Health Entry</h2>
            <p className="text-xs text-gray-400 mt-0.5">Track your daily wellness metrics</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-medium">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-rose-400 focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Steps</label>
              <input type="number" placeholder="0" value={steps} onChange={e => setSteps(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-rose-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Sleep (hrs)</label>
              <input type="number" step="0.5" placeholder="7.5" value={sleepHours} onChange={e => setSleepHours(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-rose-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Water (ml)</label>
              <input type="number" placeholder="2000" value={waterMl} onChange={e => setWaterMl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-rose-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Weight (kg)</label>
              <input type="number" step="0.1" placeholder="70.0" value={weightKg} onChange={e => setWeightKg(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-rose-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Heart Rate (bpm)</label>
              <input type="number" placeholder="72" value={heartRate} onChange={e => setHeartRate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-rose-400 focus:outline-none" />
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="text-xs text-gray-500 font-medium">Mood</label>
            <div className="mt-1 flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setMood(mood === n ? 0 : n)}
                  className={`flex-1 rounded-xl py-2 text-sm transition border ${mood === n ? 'border-rose-300 bg-rose-50 font-medium' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
                  {['😞', '😕', '😐', '😊', '😄'][n - 1]}
                </button>
              ))}
            </div>
            {mood > 0 && <p className="text-xs text-gray-400 mt-1">{MOOD_LABELS[mood]}</p>}
          </div>

          {/* Energy */}
          <div>
            <label className="text-xs text-gray-500 font-medium">Energy Level ({energyLevel}/10)</label>
            <input type="range" min="0" max="10" value={energyLevel} onChange={e => setEnergyLevel(Number(e.target.value))}
              className="mt-1 w-full accent-rose-500" />
            <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
              <span>Low</span><span>High</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-500 font-medium">Notes</label>
            <textarea rows={2} placeholder="How are you feeling today?" value={notes} onChange={e => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:border-rose-400 focus:outline-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-100 flex-none">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}