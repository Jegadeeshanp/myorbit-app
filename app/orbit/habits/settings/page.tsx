'use client';

import { useState, useEffect } from 'react';
import { Flame, Trash2, Pencil, X, Check, Download } from 'lucide-react';
import { toast } from '@/components/Toast';
import SettingsShell, { SettingsCard } from '@/components/settings/SettingsShell';

const TABS = [
  { id: 'habits', label: 'Habits',  icon: Flame    },
  { id: 'data',   label: 'Data',    icon: Download },
];

const COLORS = [
  '#78716C', '#6B7280', '#7C3AED', '#2563EB', '#059669', '#D97706',
  '#DB2777', '#4F46E5', '#EF4444', '#EC4899', '#F97316', '#14B8A6',
];

const EMOJIS = [
  '✅', '🔥', '💪', '📚', '🧘', '🏃', '💧', '🥗', '😴', '🎯', '✍️', '🎵',
  '🎨', '🏋️', '☕', '🚶', '🧠', '💊', '🌅', '🛌', '🌿', '❤️', '⭐', '🎓',
  '💼', '🏊', '🚴', '🧹', '🪴', '🎮', '📝', '🌞', '💰', '🙏', '🎸', '📱',
  '🌊', '🍎', '🏆', '⚡', '🦋', '🌈', '🧘‍♀️', '🍷', '🐾', '🎬', '🏠', '✈️',
];

const inputCls =
  'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white';

type Habit = { id: string; name: string; iconEmoji: string; color: string; isActive: boolean };

function EditHabitModal({
  habit,
  onClose,
  onSaved,
}: {
  habit: Habit;
  onClose: () => void;
  onSaved: (updated: Habit) => void;
}) {
  const [name,   setName]   = useState(habit.name);
  const [emoji,  setEmoji]  = useState(habit.iconEmoji);
  const [color,  setColor]  = useState(habit.color);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/habits/${habit.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), iconEmoji: emoji, color }),
      });
      if (!res.ok) throw new Error('Failed');
      onSaved({ ...habit, name: name.trim(), iconEmoji: emoji, color });
      toast('Habit updated');
      onClose();
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-gray-900">Edit Habit</h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl"
              style={{ backgroundColor: `${color}22` }}
            >
              {emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{name || 'Habit name'}</p>
              <div className="mt-0.5 h-1.5 w-16 rounded-full" style={{ backgroundColor: color }} />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void handleSave(); }}
              placeholder="Habit name…"
              className={inputCls}
            />
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Icon</label>
            <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto pr-0.5">
              {EMOJIS.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`flex h-9 items-center justify-center rounded-xl text-lg transition ${
                    emoji === em ? 'bg-emerald-100 ring-2 ring-emerald-400' : 'hover:bg-gray-100'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 flex-none rounded-full transition"
                  style={{
                    backgroundColor: c,
                    outline:       color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!name.trim() || saving}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {saving ? 'Saving…' : <><Check className="h-4 w-4" />Save</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HabitsSettingsPage() {
  const [activeTab, setActiveTab] = useState('habits');
  const [habits,    setHabits]    = useState<Habit[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState<Habit | null>(null);

  useEffect(() => {
    fetch('/api/habits')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setHabits(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Archive this habit? Its data will be preserved.')) return;
    try {
      await fetch(`/api/habits/${id}`, { method: 'DELETE' });
      setHabits(prev => prev.filter(h => h.id !== id));
      toast('Habit archived');
    } catch {
      toast('Failed to archive', 'error');
    }
  };

  const handleSaved = (updated: Habit) => {
    setHabits(prev => prev.map(h => h.id === updated.id ? updated : h));
  };

  const handleExport = (format: 'csv' | 'json') => {
    try {
      let content: string;
      let mime: string;
      if (format === 'json') {
        content = JSON.stringify({ exportedAt: new Date().toISOString(), habits }, null, 2);
        mime    = 'application/json';
      } else {
        const rows = [['id', 'name', 'iconEmoji', 'color', 'isActive']];
        for (const h of habits) rows.push([h.id, h.name, h.iconEmoji, h.color, String(h.isActive)]);
        content = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        mime    = 'text/csv';
      }
      const blob = new Blob([content], { type: mime });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `habits-export.${format}`; a.click();
      URL.revokeObjectURL(url);
      toast(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast('Export failed', 'error');
    }
  };

  return (
    <SettingsShell
      title="Habits Settings"
      subtitle="Manage your habit library"
      backHref="/orbit/habits"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* ── Habits ── */}
      {activeTab === 'habits' && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Active Habits</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {loading ? '…' : `${habits.length} habit${habits.length !== 1 ? 's' : ''} tracked`}
            </p>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : habits.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Flame className="h-8 w-8 text-orange-200 mb-2" />
              <p className="text-sm text-gray-500">No habits yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {habits.map(h => (
                <div key={h.id} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-xl text-xl"
                    style={{ backgroundColor: `${h.color}22` }}
                  >
                    {h.iconEmoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{h.name}</p>
                  </div>
                  <div className="h-2.5 w-2.5 rounded-full flex-none" style={{ backgroundColor: h.color }} />
                  <button
                    onClick={() => setEditing(h)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                    title="Edit habit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(h.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-300 hover:bg-rose-50 hover:text-rose-400 transition"
                    title="Archive habit"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Data ── */}
      {activeTab === 'data' && (
        <SettingsCard title="Export Habits" subtitle="Download your habit library">
          <div className="flex gap-3">
            {(['csv', 'json'] as const).map(fmt => (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                <Download className="h-4 w-4" />
                Export {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </SettingsCard>
      )}

      {editing && (
        <EditHabitModal
          habit={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </SettingsShell>
  );
}
