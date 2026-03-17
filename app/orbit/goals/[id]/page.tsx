'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, Circle, Plus, Trash2, Target,
  Calendar, Edit3, Save, X, Zap, RotateCcw,
} from 'lucide-react';
import { toast } from '@/components/Toast';

type GoalMilestone = { id: string; title: string; horizon: string; isCompleted: boolean; dueDate?: string };
type GoalProcess   = { id: string; title: string; frequency: string; isActive: boolean };
type Goal = {
  id: string; title: string; category: string; why?: string;
  metric?: string; deadline?: string; status: string;
  milestones: GoalMilestone[]; processes: GoalProcess[];
};

const CATEGORY_COLORS: Record<string, string> = {
  Finance: 'bg-emerald-100 text-emerald-700', Health: 'bg-rose-100 text-rose-700',
  Career: 'bg-amber-100 text-amber-700',       Learning: 'bg-blue-100 text-blue-700',
  Personal: 'bg-indigo-100 text-indigo-700',   Other: 'bg-gray-100 text-gray-700',
};
const GRADIENT_BY_CATEGORY: Record<string, string> = {
  Finance: 'from-emerald-500 to-teal-600', Health: 'from-rose-500 to-pink-600',
  Career: 'from-amber-500 to-orange-600',  Learning: 'from-blue-500 to-indigo-600',
  Personal: 'from-indigo-500 to-purple-600', Other: 'from-gray-400 to-gray-600',
};

const HORIZONS = ['6m', '3m', '1m'] as const;
const HORIZON_LABELS: Record<string, string> = { '6m': '6 Months', '3m': '3 Months', '1m': '1 Month' };

const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white';

type Tab = 'goal' | 'milestones' | 'process';

export default function GoalDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [goal, setGoal]       = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<Tab>('goal');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', why: '', metric: '', deadline: '', status: '' });
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  // process add state
  const [newProcess, setNewProcess]     = useState('');
  const [newProcessFreq, setNewProcessFreq] = useState('daily');
  const [addingProcess, setAddingProcess]   = useState(false);

  // milestone add state
  const [newMilestone, setNewMilestone]         = useState('');
  const [newMilestoneHorizon, setNewMilestoneHorizon] = useState('1m');
  const [addingMilestone, setAddingMilestone]         = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/goals/${id}`)
      .then(r => r.json())
      .then(d => {
        setGoal(d);
        setEditData({ title: d.title, why: d.why || '', metric: d.metric || '', deadline: d.deadline || '', status: d.status });
      })
      .catch(() => toast('Failed to load goal', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!editData.title.trim()) { toast('Title required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editData.title.trim(),
          why: editData.why.trim() || null,
          metric: editData.metric.trim() || null,
          deadline: editData.deadline || null,
          status: editData.status,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setGoal(updated);
      setEditing(false);
      toast('Goal updated');
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this goal permanently?')) return;
    setDeleting(true);
    try {
      await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      toast('Goal deleted');
      router.push('/orbit/goals');
    } catch {
      toast('Failed to delete', 'error');
      setDeleting(false);
    }
  };

  const toggleMilestone = async (mid: string, current: boolean) => {
    try {
      const res = await fetch(`/api/goals/${id}/milestones/${mid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !current }),
      });
      if (!res.ok) throw new Error();
      setGoal(prev => prev ? {
        ...prev,
        milestones: prev.milestones.map(m => m.id === mid ? { ...m, isCompleted: !current } : m),
      } : prev);
    } catch {
      toast('Failed to update', 'error');
    }
  };

  const deleteMilestone = async (mid: string) => {
    try {
      await fetch(`/api/goals/${id}/milestones/${mid}`, { method: 'DELETE' });
      setGoal(prev => prev ? { ...prev, milestones: prev.milestones.filter(m => m.id !== mid) } : prev);
      toast('Milestone removed');
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  const addMilestone = async () => {
    if (!newMilestone.trim()) return;
    setAddingMilestone(true);
    try {
      const res = await fetch(`/api/goals/${id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newMilestone.trim(), horizon: newMilestoneHorizon }),
      });
      if (!res.ok) throw new Error();
      const m = await res.json();
      setGoal(prev => prev ? { ...prev, milestones: [...prev.milestones, m] } : prev);
      setNewMilestone('');
      toast('Milestone added');
    } catch {
      toast('Failed to add', 'error');
    } finally {
      setAddingMilestone(false);
    }
  };

  const addProcess = async () => {
    if (!newProcess.trim()) return;
    setAddingProcess(true);
    try {
      const res = await fetch(`/api/goals/${id}/processes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newProcess.trim(), frequency: newProcessFreq }),
      });
      if (!res.ok) throw new Error();
      const p = await res.json();
      setGoal(prev => prev ? { ...prev, processes: [...prev.processes, p] } : prev);
      setNewProcess('');
      toast('Process added');
    } catch {
      toast('Failed to add', 'error');
    } finally {
      setAddingProcess(false);
    }
  };

  const deleteProcess = async (pid: string) => {
    try {
      await fetch(`/api/goals/${id}/processes/${pid}`, { method: 'DELETE' });
      setGoal(prev => prev ? { ...prev, processes: prev.processes.filter(p => p.id !== pid) } : prev);
      toast('Process removed');
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-32 rounded-2xl bg-gray-200" />
        <div className="h-64 rounded-2xl bg-gray-200" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Target className="h-12 w-12 text-gray-300 mb-3" />
        <p className="font-semibold text-gray-900">Goal not found</p>
        <button onClick={() => router.push('/orbit/goals')} className="mt-4 text-sm text-indigo-600 hover:underline">
          Back to Goals
        </button>
      </div>
    );
  }

  const grad    = GRADIENT_BY_CATEGORY[goal.category] || GRADIENT_BY_CATEGORY.Personal;
  const catClr  = CATEGORY_COLORS[goal.category] || CATEGORY_COLORS.Other;
  const doneMs  = goal.milestones.filter(m => m.isCompleted).length;
  const totalMs = goal.milestones.length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back + Delete */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/orbit/goals')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-rose-500 hover:bg-rose-50 transition"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {/* Hero card */}
      <div className={`rounded-2xl bg-gradient-to-br ${grad} p-6 text-white`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-0.5 text-xs font-medium">
            {goal.category}
          </span>
          <div className="flex items-center gap-2">
            {goal.status === 'completed' && (
              <span className="bg-white/20 rounded-lg px-2.5 py-0.5 text-xs font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Achieved
              </span>
            )}
            <button
              onClick={() => { setEditing(true); setTab('goal'); }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">{goal.title}</h1>
        {goal.why && <p className="text-sm opacity-80 italic mb-3">"{goal.why}"</p>}
        <div className="flex flex-wrap gap-3 text-sm opacity-90">
          {goal.metric && <span>📏 {goal.metric}</span>}
          {goal.deadline && <span>📅 {goal.deadline}</span>}
        </div>
        {totalMs > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs opacity-75 mb-1.5">
              <span>Progress</span><span>{doneMs}/{totalMs} milestones</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/20">
              <div className="h-2 rounded-full bg-white/80 transition-all" style={{ width: `${totalMs > 0 ? (doneMs/totalMs)*100 : 0}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-gray-100 p-1">
        {[
          { key: 'goal' as Tab, label: 'Goal' },
          { key: 'milestones' as Tab, label: 'Milestones' },
          { key: 'process' as Tab, label: 'Process' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Goal */}
      {tab === 'goal' && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
          {editing ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title</label>
                <input className={inputCls} value={editData.title} onChange={e => setEditData(d => ({ ...d, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Why</label>
                <textarea className={`${inputCls} resize-none`} rows={3} value={editData.why} onChange={e => setEditData(d => ({ ...d, why: e.target.value }))} placeholder="Your motivation..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Metric</label>
                <input className={inputCls} value={editData.metric} onChange={e => setEditData(d => ({ ...d, metric: e.target.value }))} placeholder="How will you measure success?" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Deadline</label>
                <input type="date" className={inputCls} value={editData.deadline} onChange={e => setEditData(d => ({ ...d, deadline: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                <select className={inputCls} value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </>
          ) : (
            <>
              {goal.why && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Why</p>
                  <p className="text-sm text-gray-700 italic">"{goal.why}"</p>
                </div>
              )}
              {goal.metric && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Success Metric</p>
                  <p className="text-sm text-gray-700">📏 {goal.metric}</p>
                </div>
              )}
              {goal.deadline && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Deadline</p>
                  <p className="text-sm text-gray-700 flex items-center gap-1"><Calendar className="h-4 w-4 text-indigo-400" />{goal.deadline}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${catClr}`}>
                  {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                </span>
              </div>
              {!goal.why && !goal.metric && !goal.deadline && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Click edit to add your why, metric, and deadline.
                </p>
              )}
              <button
                onClick={() => setEditing(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-200 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition"
              >
                <Edit3 className="h-4 w-4" /> Edit Goal
              </button>
            </>
          )}
        </div>
      )}

      {/* Tab: Milestones */}
      {tab === 'milestones' && (
        <div className="space-y-4">
          {HORIZONS.map(hz => {
            const msList = goal.milestones.filter(m => m.horizon === hz);
            return (
              <div key={hz} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  <p className="text-sm font-semibold text-gray-900">{HORIZON_LABELS[hz]}</p>
                  <span className="ml-auto text-xs text-gray-400">{msList.filter(m => m.isCompleted).length}/{msList.length}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {msList.length === 0 && (
                    <p className="px-4 py-3 text-sm text-gray-400 italic">No milestones for this horizon</p>
                  )}
                  {msList.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3 group">
                      <button onClick={() => toggleMilestone(m.id, m.isCompleted)} className="flex-none">
                        {m.isCompleted
                          ? <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                          : <Circle className="h-5 w-5 text-gray-300 hover:text-indigo-400 transition" />}
                      </button>
                      <p className={`flex-1 text-sm ${m.isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {m.title}
                      </p>
                      <button
                        onClick={() => deleteMilestone(m.id)}
                        className="opacity-0 group-hover:opacity-100 transition flex h-6 w-6 items-center justify-center rounded-full hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Add milestone */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Add Milestone</p>
            <div className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                placeholder="Milestone title..."
                value={newMilestone}
                onChange={e => setNewMilestone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addMilestone()}
              />
              <select
                className="rounded-xl border border-gray-200 px-2 py-2 text-sm focus:border-indigo-400 focus:outline-none bg-white"
                value={newMilestoneHorizon}
                onChange={e => setNewMilestoneHorizon(e.target.value)}
              >
                <option value="1m">1 Month</option>
                <option value="3m">3 Months</option>
                <option value="6m">6 Months</option>
              </select>
              <button
                onClick={addMilestone}
                disabled={addingMilestone}
                className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Process */}
      {tab === 'process' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {goal.processes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Zap className="h-10 w-10 text-indigo-200 mb-2" />
                <p className="text-sm text-gray-500">No processes yet</p>
                <p className="text-xs text-gray-400 mt-0.5">Processes are recurring habits that drive your goal</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {goal.processes.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3 group">
                    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-indigo-50">
                      <RotateCcw className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{p.title}</p>
                      <p className="text-xs text-gray-400 capitalize">{p.frequency}</p>
                    </div>
                    <button
                      onClick={() => deleteProcess(p.id)}
                      className="opacity-0 group-hover:opacity-100 transition flex h-7 w-7 items-center justify-center rounded-full hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add process */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Add Process</p>
            <div className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                placeholder="e.g. Run 5km, Read 30 pages..."
                value={newProcess}
                onChange={e => setNewProcess(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addProcess()}
              />
              <select
                className="rounded-xl border border-gray-200 px-2 py-2 text-sm focus:border-indigo-400 focus:outline-none bg-white"
                value={newProcessFreq}
                onChange={e => setNewProcessFreq(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <button
                onClick={addProcess}
                disabled={addingProcess}
                className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
