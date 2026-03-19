'use client';

import { useState, useEffect } from 'react';
import { Flame, Trash2 } from 'lucide-react';
import { toast } from '@/components/Toast';

type Habit = { id: string; name: string; iconEmoji: string; color: string; isActive: boolean };

export default function HabitsSettingsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    fetch('/api/habits').then(r => r.json()).then(d => { if (Array.isArray(d)) setHabits(d); });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Archive this habit? It will be hidden but data preserved.')) return;
    try {
      await fetch(`/api/habits/${id}`, { method: 'DELETE' });
      setHabits(prev => prev.filter(h => h.id !== id));
      toast('Habit archived');
    } catch { toast('Failed', 'error'); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Habits Settings</h1>
        <p className="text-sm text-gray-500">Manage your habit library</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="font-semibold text-gray-900">Active Habits</p>
          <p className="text-xs text-gray-500 mt-0.5">{habits.length} habits tracked</p>
        </div>
        {habits.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Flame className="h-8 w-8 text-orange-200 mb-2" />
            <p className="text-sm text-gray-500">No habits yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/30">
            {habits.map(h => (
              <div key={h.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-xl">{h.iconEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{h.name}</p>
                </div>
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: h.color }} />
                <button onClick={() => handleDelete(h.id)} className="text-gray-300 hover:text-rose-400 transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
