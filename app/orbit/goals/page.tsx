'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Target, Calendar, CheckCircle2, Zap, ChevronRight, X } from 'lucide-react';
import { toast } from '@/components/Toast';

type GoalMilestone = { id: string; title: string; horizon: string; isCompleted: boolean };
type GoalProcess    = { id: string; title: string; frequency: string };
type Goal = {
  id: string; title: string; category: string; why?: string;
  metric?: string; deadline?: string; status: string;
  milestones: GoalMilestone[]; processes: GoalProcess[];
  createdAt: string;
};

const CATEGORIES = ['All', 'Finance', 'Health', 'Career', 'Learning', 'Personal', 'Other'];
const CATEGORY_COLORS: Record<string, string> = {
  Finance:  'bg-emerald-100 text-emerald-700',
  Health:   'bg-rose-100 text-rose-700',
  Career:   'bg-amber-100 text-amber-700',
  Learning: 'bg-blue-100 text-blue-700',
  Personal: 'bg-indigo-100 text-indigo-700',
  Other:    'bg-gray-100 text-gray-700',
};

const GRADIENT_BY_CATEGORY: Record<string, string> = {
  Finance:  'from-emerald-500 to-teal-600',
  Health:   'from-rose-500 to-pink-600',
  Career:   'from-amber-500 to-orange-600',
  Learning: 'from-blue-500 to-indigo-600',
  Personal: 'from-indigo-500 to-purple-600',
  Other:    'from-gray-400 to-gray-600',
};

// ── Add Goal Modal ─────────────────────────────────────────────────────────

type WizardData = {
  title: string; category: string; why: string; metric: string; deadline: string;
  milestone1m: string; milestone3m: string; milestone6m: string;
  process1: string; process1freq: string;
  process2: string; process2freq: string;
};

function AddGoalModal({ onClose, onCreated }: { onClose: () => void; onCreated: (g: Goal) => void }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<WizardData>({
    title: '', category: 'Personal', why: '', metric: '', deadline: '',
    milestone1m: '', milestone3m: '', milestone6m: '',
    process1: '', process1freq: 'daily', process2: '', process2freq: 'weekly',
  });

  const set = (k: keyof WizardData, v: string) => setData(prev => ({ ...prev, [k]: v }));

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

  const handleSubmit = async () => {
    if (!data.title.trim()) { toast('Goal title is required', 'error'); return; }
    setSaving(true);
    try {
      const milestones = [
        data.milestone6m.trim() && { title: data.milestone6m.trim(), horizon: '6m' },
        data.milestone3m.trim() && { title: data.milestone3m.trim(), horizon: '3m' },
        data.milestone1m.trim() && { title: data.milestone1m.trim(), horizon: '1m' },
      ].filter(Boolean);

      const processes = [
        data.process1.trim() && { title: data.process1.trim(), frequency: data.process1freq },
        data.process2.trim() && { title: data.process2.trim(), frequency: data.process2freq },
      ].filter(Boolean);

      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title.trim(),
          category: data.category,
          why: data.why.trim() || null,
          metric: data.metric.trim() || null,
          deadline: data.deadline || null,
          milestones,
          processes,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const goal = await res.json();
      toast('Goal created!');
      onCreated(goal);
    } catch {
      toast('Failed to create goal', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900">New Goal</p>
            <p className="text-xs text-gray-500">Step {step} of 4</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 px-6 pt-4">
          {[1,2,3,4].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-indigo-600' : 'bg-gray-100'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {step === 1 && (
            <>
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-1">What do you want to achieve?</p>
                <p className="text-sm text-gray-500 mb-4">Be specific and inspiring.</p>
              </div>
              <div>
                <label className={labelCls}>Goal Title *</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Run a marathon, Save ₹5 lakhs, Get promoted"
                  value={data.title}
                  onChange={e => set('title', e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.slice(1).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => set('category', cat)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                        data.category === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-1">Define it clearly</p>
                <p className="text-sm text-gray-500 mb-4">Your why and how you'll measure success.</p>
              </div>
              <div>
                <label className={labelCls}>Why is this goal important to you?</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="e.g. To feel confident, gain financial freedom, advance my career..."
                  value={data.why}
                  onChange={e => set('why', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Success Metric</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Complete 42km race, ₹5L in savings account"
                  value={data.metric}
                  onChange={e => set('metric', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Target Deadline</label>
                <input
                  type="date"
                  className={inputCls}
                  value={data.deadline}
                  onChange={e => set('deadline', e.target.value)}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-1">Break it down</p>
                <p className="text-sm text-gray-500 mb-4">Set milestones and daily/weekly processes.</p>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Milestones</p>
                {[
                  { key: 'milestone6m' as keyof WizardData, label: '6 Month milestone', ph: 'Where will you be in 6 months?' },
                  { key: 'milestone3m' as keyof WizardData, label: '3 Month milestone', ph: 'Where will you be in 3 months?' },
                  { key: 'milestone1m' as keyof WizardData, label: '1 Month milestone', ph: 'What will you achieve this month?' },
                ].map(({ key, label, ph }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input className={inputCls} placeholder={ph} value={data[key]} onChange={e => set(key, e.target.value)} />
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4">Processes (recurring habits)</p>
                {[
                  { key: 'process1' as keyof WizardData, freqKey: 'process1freq' as keyof WizardData, n: 1 },
                  { key: 'process2' as keyof WizardData, freqKey: 'process2freq' as keyof WizardData, n: 2 },
                ].map(({ key, freqKey, n }) => (
                  <div key={key} className="flex gap-2">
                    <input
                      className={`${inputCls} flex-1`}
                      placeholder={`Process ${n} (e.g. Run 5km)`}
                      value={data[key]}
                      onChange={e => set(key, e.target.value)}
                    />
                    <select
                      className="rounded-xl border border-gray-200 px-2 py-2 text-sm focus:border-indigo-400 focus:outline-none bg-white"
                      value={data[freqKey]}
                      onChange={e => set(freqKey, e.target.value)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-1">Review & Confirm</p>
                <p className="text-sm text-gray-500 mb-4">Your goal at a glance.</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white">
                <div className="text-xs font-medium opacity-75 mb-1">{data.category}</div>
                <div className="text-xl font-bold mb-2">{data.title || '—'}</div>
                {data.why && <div className="text-sm opacity-80 italic mb-2">"{data.why}"</div>}
                {data.metric && <div className="text-sm opacity-90">📏 {data.metric}</div>}
                {data.deadline && <div className="text-sm opacity-90">📅 Due {data.deadline}</div>}
              </div>
              {(data.milestone6m || data.milestone3m || data.milestone1m) && (
                <div className="rounded-xl border border-gray-100 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500">Milestones</p>
                  {data.milestone6m && <p className="text-sm text-gray-700">🏁 6M: {data.milestone6m}</p>}
                  {data.milestone3m && <p className="text-sm text-gray-700">🏁 3M: {data.milestone3m}</p>}
                  {data.milestone1m && <p className="text-sm text-gray-700">🏁 1M: {data.milestone1m}</p>}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !data.title.trim()) { toast('Please enter a goal title', 'error'); return; }
                setStep(s => s + 1);
              }}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Goal'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Goal Card ──────────────────────────────────────────────────────────────

function GoalCard({ goal, onClick }: { goal: Goal; onClick: () => void }) {
  const completedMilestones = goal.milestones.filter(m => m.isCompleted).length;
  const totalMilestones     = goal.milestones.length;
  const progress            = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
  const gradient            = GRADIENT_BY_CATEGORY[goal.category] || GRADIENT_BY_CATEGORY.Personal;
  const catColor            = CATEGORY_COLORS[goal.category] || CATEGORY_COLORS.Other;
  const isOverdue           = goal.deadline && goal.deadline < new Date().toISOString().split('T')[0] && goal.status === 'active';

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      {/* Gradient top bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${catColor}`}>
            {goal.category}
          </span>
          {goal.status === 'completed' && (
            <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Done
            </span>
          )}
          {goal.status === 'paused' && (
            <span className="inline-flex items-center rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              Paused
            </span>
          )}
        </div>

        <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-indigo-700 transition-colors">
          {goal.title}
        </h3>

        {goal.why && (
          <p className="text-sm text-gray-500 italic mb-3 line-clamp-2">"{goal.why}"</p>
        )}

        {/* Progress */}
        {totalMilestones > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Milestones</span>
              <span className="text-xs font-medium text-gray-700">{completedMilestones}/{totalMilestones}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100">
              <div
                className={`h-1.5 rounded-full bg-gradient-to-r ${gradient} transition-all`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {goal.processes.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Zap className="h-3 w-3 text-indigo-400" />
                {goal.processes.length} process{goal.processes.length !== 1 ? 'es' : ''}
              </div>
            )}
            {goal.deadline && (
              <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-rose-600 font-medium' : 'text-gray-500'}`}>
                <Calendar className="h-3 w-3" />
                {goal.deadline}
              </div>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
        </div>
      </div>
    </div>
  );
}

// ── Stats Card ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals]         = useState<Goal[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [catFilter, setCatFilter] = useState('All');

  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setGoals(data);
      })
      .catch(() => toast('Failed to load goals', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = catFilter === 'All' ? goals : goals.filter(g => g.category === catFilter);
  const stats = {
    total:     goals.length,
    active:    goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    processes: goals.reduce((sum, g) => sum + g.processes.length, 0),
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Your Goals</h1>
          <p className="text-sm text-gray-600 mt-0.5">Track your life's GPS — Goal, Process, System</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="hidden md:flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" />
          New Goal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Goals"  value={stats.total}     />
        <StatCard label="Active"       value={stats.active}    />
        <StatCard label="Completed"    value={stats.completed} />
        <StatCard label="Processes"    value={stats.processes} sub="recurring habits" />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            className={`flex-none rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              catFilter === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Goals grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-44 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <Target className="h-8 w-8 text-indigo-400" />
          </div>
          <p className="text-base font-semibold text-gray-900">No goals yet</p>
          <p className="mt-1 text-sm text-gray-500">Start by creating your first goal</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            Create Goal
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onClick={() => router.push(`/orbit/goals/${goal.id}`)}
            />
          ))}
        </div>
      )}

      {/* FAB on mobile */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition md:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>

      {showModal && (
        <AddGoalModal
          onClose={() => setShowModal(false)}
          onCreated={goal => {
            setGoals(prev => [goal, ...prev]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
