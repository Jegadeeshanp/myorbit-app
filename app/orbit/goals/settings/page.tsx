'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/Toast';

const DEFAULT_CATEGORIES = ['Finance', 'Health', 'Career', 'Learning', 'Personal', 'Other'];

export default function GoalsSettingsPage() {
  const [goals, setGoals] = useState<{ id: string; title: string; category: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setGoals(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categoryStats = DEFAULT_CATEGORIES.map(cat => ({
    name: cat,
    count: goals.filter(g => g.category === cat).length,
    active: goals.filter(g => g.category === cat && g.status === 'active').length,
    completed: goals.filter(g => g.category === cat && g.status === 'completed').length,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/orbit/goals"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Goals Settings</h1>
          <p className="text-sm text-gray-500">Manage your goal categories and preferences</p>
        </div>
      </div>

      {/* Category Overview */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Goal Categories</h2>
          <p className="text-xs text-gray-500 mt-0.5">Overview of goals across each category</p>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {categoryStats.map(cat => (
              <div key={cat.name} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {cat.active > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700 font-medium">
                      {cat.active} active
                    </span>
                  )}
                  {cat.completed > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 font-medium">
                      {cat.completed} done
                    </span>
                  )}
                  {cat.count === 0 && (
                    <span className="text-gray-400">No goals</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats summary */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Goals',     value: goals.length },
            { label: 'Active',          value: goals.filter(g => g.status === 'active').length },
            { label: 'Completed',       value: goals.filter(g => g.status === 'completed').length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
