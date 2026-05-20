'use client';

import { useState, useEffect } from 'react';
import { Loader2, GripVertical, ClipboardList, Flame, HeartPulse, Wallet, Target, Sparkles } from 'lucide-react';

type WidgetId = 'greeting' | 'tasks' | 'habits' | 'health' | 'finance' | 'goals' | 'modules';

interface Widget {
  id: WidgetId;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultEnabled: boolean;
}

const ALL_WIDGETS: Widget[] = [
  { id: 'greeting', label: 'Daily Greeting',    description: 'Motivational message shown at the top of your dashboard', icon: <Sparkles     className="h-4 w-4" />, defaultEnabled: true },
  { id: 'tasks',    label: "Today's Tasks",      description: 'Shows your pending and overdue tasks',                    icon: <ClipboardList className="h-4 w-4" />, defaultEnabled: true },
  { id: 'habits',   label: "Today's Habits",     description: 'Shows habits scheduled for today with done toggle',       icon: <Flame        className="h-4 w-4" />, defaultEnabled: true },
  { id: 'health',   label: 'Health Check-in',    description: 'Prompt to log your daily health entry',                   icon: <HeartPulse   className="h-4 w-4" />, defaultEnabled: true },
  { id: 'finance',  label: 'Finance Summary',    description: 'Shows total balance across all accounts',                  icon: <Wallet       className="h-4 w-4" />, defaultEnabled: true },
  { id: 'goals',    label: 'Goals Overview',     description: 'Shows active goal count and nearest deadline',             icon: <Target       className="h-4 w-4" />, defaultEnabled: true },
  { id: 'modules',  label: 'Module Quick-Links', description: 'Grid of shortcuts to all app modules',                    icon: null,                                  defaultEnabled: true },
];

const STORAGE_KEY = 'myorbit_dashboard_widgets';

function loadWidgetConfig(): { enabled: WidgetId[]; order: WidgetId[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    enabled: ALL_WIDGETS.filter(w => w.defaultEnabled).map(w => w.id),
    order:   ALL_WIDGETS.map(w => w.id),
  };
}

function saveWidgetConfig(config: { enabled: WidgetId[]; order: WidgetId[] }) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch {}
}

export { loadWidgetConfig, STORAGE_KEY };

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 flex-none rounded-full transition ${value ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export default function DashboardTab() {
  const [config, setConfig]   = useState<{ enabled: WidgetId[]; order: WidgetId[] } | null>(null);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  useEffect(() => {
    setConfig(loadWidgetConfig());
  }, []);

  if (!config) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  const orderedWidgets = config.order
    .map(id => ALL_WIDGETS.find(w => w.id === id)!)
    .filter(Boolean);

  const toggleWidget = (id: WidgetId) => {
    setConfig(prev => {
      if (!prev) return prev;
      const enabled = prev.enabled.includes(id)
        ? prev.enabled.filter(e => e !== id)
        : [...prev.enabled, id];
      return { ...prev, enabled };
    });
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver  = (e: React.DragEvent, idx: number) => { e.preventDefault(); setOverIdx(idx); };
  const handleDrop      = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setOverIdx(null); return; }
    setConfig(prev => {
      if (!prev) return prev;
      const order = [...prev.order];
      const [moved] = order.splice(dragIdx, 1);
      order.splice(idx, 0, moved);
      return { ...prev, order };
    });
    setDragIdx(null);
    setOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null); };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      saveWidgetConfig(config);
      setSaveMsg({ ok: true, text: 'Dashboard layout saved!' });
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg({ ok: false, text: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Dashboard Widgets</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Toggle widgets on/off and drag to reorder them on your dashboard
          </p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {orderedWidgets.map((widget, idx) => {
            const isEnabled = config.enabled.includes(widget.id);
            const isDragging = dragIdx === idx;
            const isOver     = overIdx === idx && dragIdx !== idx;
            return (
              <div
                key={widget.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDrop={e => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 px-5 py-4 transition ${
                  isDragging ? 'opacity-40' : ''
                } ${isOver ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : ''}`}
              >
                {/* Drag handle */}
                <GripVertical className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-none cursor-grab active:cursor-grabbing" />

                {/* Icon */}
                <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-xl ${
                  isEnabled ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                }`}>
                  {widget.icon}
                </span>

                {/* Label + description */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isEnabled ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                    {widget.label}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{widget.description}</p>
                </div>

                {/* Toggle */}
                <Toggle value={isEnabled} onChange={() => toggleWidget(widget.id)} />
              </div>
            );
          })}
        </div>
      </div>

      {saveMsg && (
        <p className={`text-sm font-medium ${saveMsg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {saveMsg.text}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? 'Saving…' : 'Save Layout'}
      </button>

      <p className="text-xs text-center text-gray-400 dark:text-gray-500">
        Changes are saved to this browser. Reload the dashboard to see them.
      </p>
    </div>
  );
}
