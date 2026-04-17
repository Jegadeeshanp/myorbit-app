'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { toast } from '@/components/Toast';

type ModulePreferences = {
  finance: { enabled: boolean; order: number };
  tasks: { enabled: boolean; order: number };
  goals: { enabled: boolean; order: number };
  health: { enabled: boolean; order: number };
};

export default function DashboardModulesTab() {
  const [modules, setModules] = useState<ModulePreferences>({
    finance: { enabled: true, order: 0 },
    tasks: { enabled: true, order: 1 },
    goals: { enabled: true, order: 2 },
    health: { enabled: true, order: 3 },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = () => {
    try {
      const stored = localStorage.getItem('dashboardModules');
      if (stored) {
        setModules(JSON.parse(stored));
      }
    } catch {
      // Use defaults
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      localStorage.setItem('dashboardModules', JSON.stringify(modules));
      toast('Dashboard preferences saved', 'success');
    } catch {
      toast('Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (key: keyof ModulePreferences) => {
    setModules(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  };

  const moveModule = (key: keyof ModulePreferences, direction: 'up' | 'down') => {
    const entries = Object.entries(modules) as [keyof ModulePreferences, any][];
    const idx = entries.findIndex(([k]) => k === key);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === entries.length - 1)) return;

    const newOrder = direction === 'up' ? idx - 1 : idx + 1;
    setModules(prev => {
      const newModules = { ...prev };
      const current = newModules[key];
      const other = entries[newOrder]![0];
      const otherOrder = newModules[other].order;
      newModules[key].order = otherOrder;
      newModules[other].order = current.order;
      return newModules;
    });
  };

  const sortedModules = Object.entries(modules)
    .sort(([, a], [, b]) => a.order - b.order) as [keyof ModulePreferences, any][];

  const moduleNames: Record<keyof ModulePreferences, string> = {
    finance: 'Finance',
    tasks: 'Tasks',
    goals: 'Goals',
    health: 'Health',
  };

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Modules</h2>
        <p className="text-sm text-gray-600">Choose which modules appear on your dashboard and reorder them.</p>
      </div>

      <div className="space-y-3">
        {sortedModules.map(([key, config]) => (
          <div key={key} className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition">
            {/* Status icon */}
            <button
              onClick={() => toggleModule(key)}
              className={`p-2 rounded-lg transition ${
                config.enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {config.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>

            {/* Name */}
            <span className={`flex-1 font-medium ${config.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
              {moduleNames[key]}
            </span>

            {/* Drag handle (visual only for now) */}
            <GripVertical className="h-4 w-4 text-gray-300" />

            {/* Reorder buttons */}
            <div className="flex gap-1">
              <button
                onClick={() => moveModule(key, 'up')}
                disabled={sortedModules.length === 0 || sortedModules[0]![0] === key}
                className="px-2 py-1 text-xs rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↑
              </button>
              <button
                onClick={() => moveModule(key, 'down')}
                disabled={sortedModules.length === 0 || sortedModules[sortedModules.length - 1]![0] === key}
                className="px-2 py-1 text-xs rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
        >
          {saving ? 'Saving...' : 'Save Dashboard Layout'}
        </button>
      </div>
    </div>
  );
}
