'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Workout } from '@/lib/healthStore';

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: Workout | null;
  onSave: (data: Omit<Workout, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Workout>;
};

const WORKOUT_TYPES = [
  { value: 'running',  label: '🏃 Running' },
  { value: 'cycling',  label: '🚴 Cycling' },
  { value: 'strength', label: '💪 Strength' },
  { value: 'yoga',     label: '🧘 Yoga' },
  { value: 'sports',   label: '⚽ Sports' },
  { value: 'other',    label: '🏋️ Other' },
];

export default function AddWorkoutModal({ open, onClose, initial, onSave }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [type, setType] = useState('other');
  const [durationMins, setDurationMins] = useState('30');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setType(initial?.type ?? 'other');
      setDurationMins(initial?.durationMins?.toString() ?? '30');
      setCaloriesBurned(initial?.caloriesBurned?.toString() ?? '');
      setDistanceKm(initial?.distanceKm?.toString() ?? '');
      setDate(initial?.date ?? today);
      setNotes(initial?.notes ?? '');
    }
  }, [open, initial]);

  if (!open) return null;

  async function handleSubmit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        type,
        durationMins: parseInt(durationMins) || 30,
        caloriesBurned: caloriesBurned ? parseInt(caloriesBurned) : undefined,
        distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
        date,
        notes: notes || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-none">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{initial ? 'Edit Workout' : 'Log Workout'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Record your exercise session</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-medium">Workout Name *</label>
            <input type="text" placeholder="e.g. Morning Run" value={name} onChange={e => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-rose-400 focus:outline-none" />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium">Type</label>
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {WORKOUT_TYPES.map(t => (
                <button key={t.value} onClick={() => setType(t.value)}
                  className={`rounded-xl py-2 text-xs font-medium transition border ${type === t.value ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Duration (mins)</label>
              <input type="number" placeholder="30" value={durationMins} onChange={e => setDurationMins(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-rose-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Calories burned</label>
              <input type="number" placeholder="optional" value={caloriesBurned} onChange={e => setCaloriesBurned(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-rose-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Distance (km)</label>
              <input type="number" step="0.1" placeholder="optional" value={distanceKm} onChange={e => setDistanceKm(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-rose-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-rose-400 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium">Notes</label>
            <textarea rows={2} placeholder="How did it go?" value={notes} onChange={e => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:border-rose-400 focus:outline-none" />
          </div>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-gray-100 flex-none">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || !name.trim()}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition disabled:opacity-60">
            {saving ? 'Saving…' : initial ? 'Update' : 'Log Workout'}
          </button>
        </div>
      </div>
    </div>
  );
}