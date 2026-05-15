'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Flame, Target, CheckCircle2, Heart, Wallet, AlertCircle } from 'lucide-react';

type Scores = {
  lifeScore: number;
  scores: { habit: number; task: number; goal: number; health: number; finance: number };
  insights: { type: string; title: string; body: string; severity: string }[];
  history: { date: string; mood?: number; energy?: number; steps?: number }[];
};

const SCORE_MODULES = [
  { key: 'habit',   label: 'Habits',  Icon: Flame,        iconBg: 'bg-amber-50 dark:bg-amber-900/30',   iconColor: 'text-amber-600 dark:text-amber-400',  barColor: 'bg-amber-400' },
  { key: 'task',    label: 'Tasks',   Icon: CheckCircle2, iconBg: 'bg-sky-50 dark:bg-sky-900/30',       iconColor: 'text-sky-600 dark:text-sky-400',      barColor: 'bg-sky-400' },
  { key: 'goal',    label: 'Goals',   Icon: Target,       iconBg: 'bg-violet-50 dark:bg-violet-900/30', iconColor: 'text-violet-600 dark:text-violet-400', barColor: 'bg-violet-400' },
  { key: 'health',  label: 'Health',  Icon: Heart,        iconBg: 'bg-rose-50 dark:bg-rose-900/30',     iconColor: 'text-rose-600 dark:text-rose-400',    barColor: 'bg-rose-400' },
  { key: 'finance', label: 'Finance', Icon: Wallet,       iconBg: 'bg-emerald-50 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', barColor: 'bg-emerald-400' },
] as const;

const SEVERITY_STYLE: Record<string, string> = {
  info:     'border-blue-100 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-900/20',
  tip:      'border-indigo-100 bg-indigo-50/60 dark:border-indigo-900/40 dark:bg-indigo-900/20',
  warning:  'border-amber-100 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-900/20',
  critical: 'border-rose-100 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-900/20',
};

function LifeScoreRing({ score }: { score: number }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#d97706' : '#f43f5e';
  const label = score >= 70 ? 'Great' : score >= 40 ? 'Building' : 'Getting Started';

  return (
    <div className="relative flex h-48 w-48 items-center justify-center mx-auto">
      <svg className="absolute inset-0 -rotate-90" width="192" height="192">
        <circle cx="96" cy="96" r={r} fill="none" stroke="#f3f4f6" strokeWidth="14" />
        <circle cx="96" cy="96" r={r} fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div className="text-center z-10">
        <p className="text-5xl font-bold text-gray-900 dark:text-white">{score}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">Life Score</p>
      </div>
    </div>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
      <div className={`h-1.5 rounded-full ${color} transition-all duration-700`} style={{ width: `${score}%` }} />
    </div>
  );
}

export default function InsightsPage() {
  const [data,       setData]       = useState<Scores | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScores = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/insights/scores');
      if (!res.ok) throw new Error(`${res.status}`);
      const d = await res.json();
      setData(d);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchScores(); }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 w-48 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#1C1F26] py-20 text-center max-w-4xl mx-auto">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/20">
          <AlertCircle className="h-7 w-7 text-rose-500" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Failed to load insights</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Check your connection and try again.</p>
        </div>
        <button
          onClick={() => fetchScores()}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  const scores    = data?.scores ?? { habit: 0, task: 0, goal: 0, health: 0, finance: 0 };
  const insights  = data?.insights ?? [];
  const lifeScore = data?.lifeScore ?? 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Refresh button */}
      <div className="flex justify-end">
        <button onClick={() => fetchScores(true)} disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#1C1F26] dark:text-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Life Score Hero */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#1C1F26] shadow-sm p-6">
        <LifeScoreRing score={lifeScore} />
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
          Weighted average across Habits (30%) · Tasks (20%) · Goals (20%) · Health (20%) · Finance (10%)
        </p>
      </div>

      {/* Module Scores Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {SCORE_MODULES.map(({ key, label, Icon, iconBg, iconColor, barColor }) => {
          const score = scores[key as keyof typeof scores];
          return (
            <div key={key} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#1C1F26] shadow-sm p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg} mb-2`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{score}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{label}</p>
              <ScoreBar score={score} color={barColor} />
            </div>
          );
        })}
      </div>

      {/* Insights Feed */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Insights</p>
        {insights.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#1C1F26] shadow-sm p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Keep using the app — insights will appear as you track more data across modules.</p>
          </div>
        ) : (
          insights.map((ins, i) => (
            <div key={i} className={`rounded-2xl border p-4 ${SEVERITY_STYLE[ins.severity] ?? SEVERITY_STYLE.info}`}>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{ins.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{ins.body}</p>
            </div>
          ))
        )}
      </div>

      {/* Quick links */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#1C1F26] shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Improve Your Scores</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: '+ Log Habit',       href: '/orbit/habits',       color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300' },
            { label: '+ Add Task',        href: '/orbit/tasks',        color: 'bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/20 dark:text-sky-300' },
            { label: '+ New Goal',        href: '/orbit/goals',        color: 'bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-300' },
            { label: '+ Log Health',      href: '/orbit/health',       color: 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-300' },
            { label: '+ Add Transaction', href: '/orbit/finance',      color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300' },
            { label: 'Weekly Review',     href: '/orbit/insights/weekly', color: 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700' },
          ].map(({ label, href, color }) => (
            <a key={href} href={href}
              className={`rounded-xl px-3 py-2.5 text-xs font-medium text-center transition ${color}`}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
