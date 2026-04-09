'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3, Download,
  Target, CheckCircle2, Pause,
} from 'lucide-react';
import { toast } from '@/components/Toast';
import SettingsShell, { SettingsCard } from '@/components/settings/SettingsShell';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'data',     label: 'Data',     icon: Download  },
];

const DEFAULT_CATEGORIES = ['Finance', 'Health', 'Career', 'Learning', 'Personal', 'Other'];

const CATEGORY_COLORS: Record<string, string> = {
  Finance:  'bg-emerald-100 text-emerald-700',
  Health:   'bg-rose-100 text-rose-700',
  Career:   'bg-amber-100 text-amber-700',
  Learning: 'bg-blue-100 text-blue-700',
  Personal: 'bg-indigo-100 text-indigo-700',
  Other:    'bg-gray-100 text-gray-700',
};

export default function GoalsSettingsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [goals, setGoals]         = useState<{ id: string; title: string; category: string; status: string }[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setGoals(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total:     goals.length,
    active:    goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    paused:    goals.filter(g => g.status === 'paused').length,
  };

  const categoryStats = DEFAULT_CATEGORIES.map(cat => ({
    name:      cat,
    active:    goals.filter(g => g.category === cat && g.status === 'active').length,
    completed: goals.filter(g => g.category === cat && g.status === 'completed').length,
    total:     goals.filter(g => g.category === cat).length,
  }));

  const handleExport = (format: 'csv' | 'json') => {
    try {
      let content: string;
      let mime: string;
      if (format === 'json') {
        content = JSON.stringify({ exportedAt: new Date().toISOString(), goals }, null, 2);
        mime    = 'application/json';
      } else {
        const rows = [['id', 'title', 'category', 'status', 'deadline', 'why', 'metric']];
        for (const g of goals) {
          rows.push([g.id, g.title, g.category, g.status,
            (g as any).deadline ?? '', (g as any).why ?? '', (g as any).metric ?? '']);
        }
        content = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        mime    = 'text/csv';
      }
      const blob = new Blob([content], { type: mime });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `goals-export.${format}`; a.click();
      URL.revokeObjectURL(url);
      toast(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast('Export failed', 'error');
    }
  };

  return (
    <SettingsShell
      title="Goals Settings"
      subtitle="Overview of your goals by category"
      backHref="/orbit/goals"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total',     value: stats.total,     Icon: Target,        color: 'text-indigo-600 bg-indigo-50'  },
              { label: 'Active',    value: stats.active,    Icon: Target,        color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Completed', value: stats.completed, Icon: CheckCircle2,  color: 'text-blue-600 bg-blue-50'      },
              { label: 'Paused',    value: stats.paused,    Icon: Pause,         color: 'text-amber-600 bg-amber-50'    },
            ].map(({ label, value, Icon, color }) => {
              const [textCls, bgCls] = color.split(' ');
              return (
                <div key={label} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bgCls} mb-3`}>
                    <Icon className={`h-4 w-4 ${textCls}`} />
                  </div>
                  <p className={`text-2xl font-bold ${textCls}`}>{loading ? '…' : value}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{label}</p>
                </div>
              );
            })}
          </div>

          {/* Category breakdown */}
          <SettingsCard title="Goals by Category" subtitle="Active and completed goals per category">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl bg-gray-100 animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {categoryStats.map(cat => (
                  <div key={cat.name} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[cat.name] ?? 'bg-gray-100 text-gray-700'}`}>
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {cat.active > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          {cat.active} active
                        </span>
                      )}
                      {cat.completed > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          {cat.completed} done
                        </span>
                      )}
                      {cat.total === 0 && (
                        <span className="text-xs text-gray-400">No goals</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SettingsCard>
        </>
      )}

      {/* ── Data ── */}
      {activeTab === 'data' && (
        <SettingsCard title="Export Goals" subtitle="Download your goal data">
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
