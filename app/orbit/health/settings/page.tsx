'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3, Target, Download,
  Footprints, Moon, Droplets, Heart,
  Dumbbell, Save,
} from 'lucide-react';
import { toast } from '@/components/Toast';
import SettingsShell, { SettingsCard, SettingsRow, Toggle } from '@/components/settings/SettingsShell';

const TABS = [
  { id: 'overview',      label: 'Overview',     icon: BarChart3 },
  { id: 'targets',       label: 'Targets',      icon: Target    },
  { id: 'data',          label: 'Data',         icon: Download  },
];

const inputCls =
  'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white';

export default function HealthSettingsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Stats
  const [stats, setStats] = useState({ entries: 0, workouts: 0, avgMood: 0, avgSleep: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  // Targets (loaded from /api/settings, saved on submit)
  const [stepsGoal,   setStepsGoal]   = useState(10000);
  const [sleepGoal,   setSleepGoal]   = useState(7.5);
  const [waterGoal,   setWaterGoal]   = useState(2000);
  const [caloriesGoal, setCaloriesGoal] = useState(2000);
  const [savingTargets, setSavingTargets] = useState(false);

  useEffect(() => {
    // Load stats
    Promise.all([
      fetch('/api/health/entries?limit=30').then(r => r.json()).catch(() => []),
      fetch('/api/workouts?limit=50').then(r => r.json()).catch(() => []),
    ]).then(([entries, workouts]) => {
      if (!Array.isArray(entries) || !Array.isArray(workouts)) { setLoadingStats(false); return; }
      const moods  = entries.filter((e: any) => e.mood).map((e: any) => e.mood as number);
      const sleeps = entries.filter((e: any) => e.sleepHours).map((e: any) => e.sleepHours as number);
      setStats({
        entries:  entries.length,
        workouts: workouts.length,
        avgMood:  moods.length  ? Math.round((moods.reduce((s, m) => s + m, 0)  / moods.length)  * 10) / 10 : 0,
        avgSleep: sleeps.length ? Math.round((sleeps.reduce((s, sl) => s + sl, 0) / sleeps.length) * 10) / 10 : 0,
      });
      setLoadingStats(false);
    });

    // Load saved targets from settings
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d?.preferences) {
        if (d.preferences.stepsGoal   != null) setStepsGoal(d.preferences.stepsGoal);
        if (d.preferences.sleepGoal   != null) setSleepGoal(d.preferences.sleepGoal);
        if (d.preferences.waterGoal   != null) setWaterGoal(d.preferences.waterGoal);
        if (d.preferences.caloriesGoal != null) setCaloriesGoal(d.preferences.caloriesGoal);
      }
    }).catch(() => {});
  }, []);

  const handleSaveTargets = async () => {
    setSavingTargets(true);
    try {
      const res = await fetch('/api/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ stepsGoal, sleepGoal, waterGoal, caloriesGoal }),
      });
      if (!res.ok) throw new Error();
      toast('Targets saved');
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSavingTargets(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const [entries, workouts] = await Promise.all([
        fetch('/api/health/entries?limit=365').then(r => r.json()),
        fetch('/api/workouts?limit=365').then(r => r.json()),
      ]);
      const data = { exportedAt: new Date().toISOString(), entries, workouts };
      let content: string;
      let mime: string;
      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        mime    = 'application/json';
      } else {
        const rows = [['date', 'steps', 'sleepHours', 'waterMl', 'mood', 'energyLevel', 'weightKg', 'heartRate']];
        for (const e of (Array.isArray(entries) ? entries : [])) {
          rows.push([e.date, e.steps ?? '', e.sleepHours ?? '', e.waterMl ?? '', e.mood ?? '', e.energyLevel ?? '', e.weightKg ?? '', e.heartRate ?? '']);
        }
        content = rows.map(r => r.join(',')).join('\n');
        mime    = 'text/csv';
      }
      const blob = new Blob([content], { type: mime });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `health-export.${format}`; a.click();
      URL.revokeObjectURL(url);
      toast(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast('Export failed', 'error');
    }
  };

  const statCards = [
    { label: 'Days Logged',     value: loadingStats ? '…' : stats.entries,                      Icon: Heart,    bg: 'bg-rose-50',   ic: 'text-rose-500'   },
    { label: 'Workouts',        value: loadingStats ? '…' : stats.workouts,                     Icon: Dumbbell, bg: 'bg-orange-50', ic: 'text-orange-500' },
    { label: 'Avg Mood',        value: loadingStats ? '…' : (stats.avgMood  ? `${stats.avgMood}/5`  : '—'), Icon: Moon,     bg: 'bg-pink-50',   ic: 'text-pink-500'   },
    { label: 'Avg Sleep',       value: loadingStats ? '…' : (stats.avgSleep ? `${stats.avgSleep}h` : '—'), Icon: Droplets, bg: 'bg-indigo-50', ic: 'text-indigo-500' },
  ];

  return (
    <SettingsShell
      title="Health Settings"
      subtitle="Manage your wellness goals and data"
      backHref="/orbit/health"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {statCards.map(({ label, value, Icon, bg, ic }) => (
              <div key={label} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg} mb-3`}>
                  <Icon className={`h-5 w-5 ${ic}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <SettingsCard title="Your Targets" subtitle="Active daily health targets">
            <div className="space-y-3">
              {[
                { label: 'Steps',    value: `${stepsGoal.toLocaleString()} steps`,  Icon: Footprints, color: 'text-blue-500'   },
                { label: 'Sleep',    value: `${sleepGoal} hours`,                   Icon: Moon,       color: 'text-indigo-500' },
                { label: 'Water',    value: `${waterGoal} ml`,                      Icon: Droplets,   color: 'text-cyan-500'   },
                { label: 'Calories', value: `${caloriesGoal} kcal`,                 Icon: Heart,      color: 'text-rose-500'   },
              ].map(({ label, value, Icon, color }) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm text-gray-700">
                    <Icon className={`h-4 w-4 ${color}`} /> {label}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </SettingsCard>
        </>
      )}

      {/* ── Targets ── */}
      {activeTab === 'targets' && (
        <SettingsCard title="Daily Targets" subtitle="Set your personal health goals">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                <Footprints className="inline h-3.5 w-3.5 mr-1 text-blue-500" />Daily Steps
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={stepsGoal}
                onChange={e => setStepsGoal(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                <Moon className="inline h-3.5 w-3.5 mr-1 text-indigo-500" />Sleep Goal (hours)
              </label>
              <input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={sleepGoal}
                onChange={e => setSleepGoal(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                <Droplets className="inline h-3.5 w-3.5 mr-1 text-cyan-500" />Water Goal (ml)
              </label>
              <input
                type="number"
                min={0}
                step={100}
                value={waterGoal}
                onChange={e => setWaterGoal(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                <Heart className="inline h-3.5 w-3.5 mr-1 text-rose-500" />Calories Goal (kcal)
              </label>
              <input
                type="number"
                min={0}
                step={50}
                value={caloriesGoal}
                onChange={e => setCaloriesGoal(Number(e.target.value))}
                className={inputCls}
              />
            </div>

            <button
              onClick={handleSaveTargets}
              disabled={savingTargets}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              <Save className="h-4 w-4" />
              {savingTargets ? 'Saving…' : 'Save Targets'}
            </button>
          </div>
        </SettingsCard>
      )}

      {/* ── Data ── */}
      {activeTab === 'data' && (
        <SettingsCard title="Export Data" subtitle="Download your health history">
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
    </SettingsShell>
  );
}
