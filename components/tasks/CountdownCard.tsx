'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from '@/components/Toast';

type Countdown = { id: string; name: string; iconEmoji?: string; targetDate: string; direction: string };

const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white';

function getDaysDiff(targetDate: string, direction: string): number {
  const now    = new Date();
  const target = new Date(targetDate + 'T00:00:00');
  const diffMs = direction === 'until' ? target.getTime() - now.getTime() : now.getTime() - target.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function AddCountdownModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Countdown) => void }) {
  const [name, setName]           = useState('');
  const [emoji, setEmoji]         = useState('🎯');
  const [targetDate, setTargetDate] = useState('');
  const [direction, setDirection] = useState('until');
  const [saving, setSaving]       = useState(false);

  const EMOJIS = ['🎯', '🎂', '✈️', '🎓', '💍', '🏆', '🚀', '🌅', '🎉', '📅'];

  const handleSave = async () => {
    if (!name.trim() || !targetDate) { toast('Name and date required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/countdowns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), iconEmoji: emoji, targetDate, direction }),
      });
      if (!res.ok) throw new Error();
      const c = await res.json();
      toast('Countdown created');
      onCreated(c);
    } catch {
      toast('Failed to create', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="font-semibold text-gray-900">New Countdown</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Name</label>
            <input className={inputCls} placeholder="e.g. Birthday, Trip to Japan..." value={name} onChange={e => setName(e.target.value)} autoFocus />
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
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Target Date</label>
            <input type="date" className={inputCls} value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Direction</label>
            <div className="flex gap-2">
              {[{ v: 'until', l: 'Counting down until' }, { v: 'since', l: 'Counting up since' }].map(({ v, l }) => (
                <button key={v} onClick={() => setDirection(v)}
                  className={`flex-1 rounded-xl px-3 py-2 text-xs font-medium transition ${direction === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition">
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CountdownCards() {
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [now, setNow]               = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const fetchCountdowns = useCallback(() => {
    fetch('/api/countdowns')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCountdowns(d); })
      .catch(() => toast('Failed to load countdowns', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCountdowns(); }, [fetchCountdowns]);

  const deleteCountdown = async (id: string) => {
    try {
      await fetch(`/api/countdowns/${id}`, { method: 'DELETE' });
      setCountdowns(prev => prev.filter(c => c.id !== id));
      toast('Removed');
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Countdowns</h2>
          <p className="text-sm text-gray-600 mt-0.5">Track important dates</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : countdowns.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center">
          <p className="text-4xl mb-3">🗓️</p>
          <p className="font-semibold text-gray-900">No countdowns</p>
          <p className="text-sm text-gray-500 mt-1">Track events, deadlines, and milestones</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {countdowns.map(c => {
            const days = getDaysDiff(c.targetDate, c.direction);
            const isPast = days < 0;
            const bgCls = isPast
              ? 'from-gray-100 to-gray-50 border-gray-200'
              : days <= 7
                ? 'from-rose-50 to-pink-50 border-rose-100'
                : 'from-blue-50 to-indigo-50 border-blue-100';

            return (
              <div key={c.id} className={`group relative rounded-2xl border bg-gradient-to-br ${bgCls} p-4`}>
                <button
                  onClick={() => deleteCountdown(c.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-gray-400 hover:text-rose-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{c.iconEmoji || '🎯'}</span>
                  <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                </div>
                <p className={`text-3xl font-bold tabular-nums ${isPast ? 'text-gray-500' : days <= 7 ? 'text-rose-600' : 'text-blue-600'}`}>
                  {Math.abs(days)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {c.direction === 'until'
                    ? isPast ? 'days ago' : 'days until'
                    : isPast ? 'days since (future?)' : `days since ${c.targetDate}`}
                </p>
                <p className="text-xs text-gray-400 mt-1">{c.targetDate}</p>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <AddCountdownModal
          onClose={() => setShowModal(false)}
          onCreated={c => { setCountdowns(prev => [...prev, c]); setShowModal(false); }}
        />
      )}
    </div>
  );
}
