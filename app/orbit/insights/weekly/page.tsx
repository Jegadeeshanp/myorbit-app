'use client';

import { useState, useEffect } from 'react';
import { Trophy, AlertTriangle, TrendingUp, Target } from 'lucide-react';

type Scores = {
  lifeScore: number;
  scores: { habit: number; task: number; goal: number; health: number; finance: number };
  insights: { type: string; title: string; body: string; severity: string }[];
};

export default function WeeklyReviewPage() {
  const [data, setData] = useState<Scores | null>(null);
  const [loading, setLoading] = useState(true);
  const [habitCount, setHabitCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [goalCount, setGoalCount] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch('/api/insights/scores').then(r => r.json()),
      fetch('/api/habits').then(r => r.json()),
      fetch('/api/tasks?smartList=completed').then(r => r.json()),
      fetch('/api/goals').then(r => r.json()),
    ]).then(([scores, habits, tasks, goals]) => {
      setData(scores);
      setHabitCount(Array.isArray(habits) ? habits.length : 0);
      setTaskCount(Array.isArray(tasks) ? tasks.length : 0);
      setGoalCount(Array.isArray(goals) ? goals.filter((g: any) => g.status === 'active').length : 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const week = new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const wins = data?.insights.filter(i => i.severity === 'info') ?? [];
  const misses = data?.insights.filter(i => i.severity === 'warning' || i.severity === 'critical') ?? [];
  const tips = data?.insights.filter(i => i.severity === 'tip') ?? [];

  const scoreLabel = (s: number) => s >= 70 ? '🔥 Strong' : s >= 40 ? '📈 Building' : '💪 Start';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 p-6 text-white">
        <p className="text-xs font-medium text-white/60 uppercase tracking-wide">Weekly Review</p>
        <h1 className="text-2xl font-bold mt-1">Your Week in Review</h1>
        <p className="text-sm text-white/70 mt-1">{week}</p>
        {data && (
          <div className="mt-4 flex items-center gap-3">
            <div className="text-5xl font-bold">{data.lifeScore}</div>
            <div>
              <p className="text-sm font-medium">Life Score</p>
              <p className="text-xs text-white/60">this week</p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100" />)}
        </div>
      ) : (
        <>
          {/* Score Breakdown */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-900 mb-4">📊 The Numbers</p>
            <div className="space-y-3">
              {[
                { label: 'Habits Score', value: data?.scores.habit ?? 0 },
                { label: 'Tasks Score',  value: data?.scores.task  ?? 0 },
                { label: 'Goals Score',  value: data?.scores.goal  ?? 0 },
                { label: 'Health Score', value: data?.scores.health ?? 0 },
                { label: 'Finance Score',value: data?.scores.finance ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <p className="w-32 text-xs text-gray-500">{label}</p>
                  <div className="flex-1 h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-violet-500 transition-all" style={{ width: `${value}%` }} />
                  </div>
                  <p className="w-12 text-xs font-semibold text-gray-700 text-right">{value} {scoreLabel(value)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Habits', value: habitCount, desc: 'active habits', icon: '🔥' },
              { label: 'Tasks Done', value: taskCount, desc: 'completed tasks', icon: '✅' },
              { label: 'Active Goals', value: goalCount, desc: 'goals in progress', icon: '🎯' },
            ].map(({ label, value, desc, icon }) => (
              <div key={label} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 text-center">
                <p className="text-2xl mb-1">{icon}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>

          {/* Wins */}
          {wins.length > 0 && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-800">🏆 Your Wins</p>
              </div>
              <div className="space-y-2">
                {wins.map((w, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <div>
                      <p className="text-sm font-medium text-emerald-800">{w.title}</p>
                      <p className="text-xs text-emerald-700">{w.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Misses */}
          {misses.length > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">⚡ Focus Areas</p>
              </div>
              <div className="space-y-2">
                {misses.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <div>
                      <p className="text-sm font-medium text-amber-800">{m.title}</p>
                      <p className="text-xs text-amber-700">{m.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {tips.length > 0 && (
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-violet-600" />
                <p className="text-sm font-semibold text-violet-800">💡 This Week's Focus</p>
              </div>
              <div className="space-y-2">
                {tips.map((t, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-violet-800">{t.title}</p>
                    <p className="text-xs text-violet-700">{t.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No data state */}
          {wins.length === 0 && misses.length === 0 && tips.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 text-center">
              <Target className="h-10 w-10 text-violet-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">Keep tracking!</p>
              <p className="text-sm text-gray-500 mt-1">Use all modules for a week to unlock your personalized weekly review.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
