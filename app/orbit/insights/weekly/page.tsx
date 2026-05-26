'use client';

import { useState, useEffect } from 'react';

type Scores = {
  lifeScore: number;
  scores: { habit: number; task: number; goal: number; health: number; finance: number };
  insights: { type: string; title: string; body: string; severity: string }[];
};

const TXT    = '#e4eaf4';
const MUTED  = '#8fa3b8';
const DIM    = '#3d5166';
const GREEN  = '#00E5A0';
const AMBER  = '#F9A44A';
const PURPLE = '#A78BFA';
const CARD: React.CSSProperties = { background: 'linear-gradient(145deg,#131c2e,#0e1420)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)' };

function scoreLabel(s: number) {
  return s >= 70 ? '🔥 Strong' : s >= 40 ? '📈 Building' : '💪 Start';
}

export default function WeeklyReviewPage() {
  const [data,       setData]       = useState<Scores | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [habitCount, setHabitCount] = useState(0);
  const [taskCount,  setTaskCount]  = useState(0);
  const [goalCount,  setGoalCount]  = useState(0);

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

  const week   = new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const wins   = data?.insights.filter(i => i.severity === 'info') ?? [];
  const misses = data?.insights.filter(i => i.severity === 'warning' || i.severity === 'critical') ?? [];
  const tips   = data?.insights.filter(i => i.severity === 'tip') ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Hero */}
      <div style={{ borderRadius: 18, padding: '26px 30px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#3b0764,#4c1d95,#2d1b69)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 90% 50%,rgba(167,139,250,.15) 0%,transparent 65%)', pointerEvents: 'none' }} />
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>WEEKLY REVIEW</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: 'Georgia,serif', marginBottom: 4 }}>Your Week in Review</h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: data ? 18 : 0 }}>{week}</p>
        {data && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#fff', fontFamily: 'Georgia,serif', lineHeight: 1 }}>{data.lifeScore}</div>
            <div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Life Score</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>this week</div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse" style={{ height: 80, borderRadius: 16, background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Score Breakdown */}
          <div style={{ ...CARD, padding: '18px 20px' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
              <span>📊</span> The Numbers
            </p>
            <div className="space-y-0">
              {([
                { label: 'Habits Score',  value: data?.scores.habit   ?? 0 },
                { label: 'Tasks Score',   value: data?.scores.task    ?? 0 },
                { label: 'Goals Score',   value: data?.scores.goal    ?? 0 },
                { label: 'Health Score',  value: data?.scores.health  ?? 0 },
                { label: 'Finance Score', value: data?.scores.finance ?? 0 },
              ]).map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 11, color: MUTED, width: 100, flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, margin: '0 14px', height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${value}%`, background: PURPLE, borderRadius: 99, boxShadow: value >= 70 ? `0 0 4px ${PURPLE}` : undefined, transition: 'width 0.7s' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, minWidth: 90 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: TXT }}>{value} {scoreLabel(value)}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                      background: value >= 70 ? 'rgba(0,229,160,0.1)' : 'rgba(249,164,74,0.12)',
                      color: value >= 70 ? GREEN : AMBER }}>
                      {value >= 70 ? 'Strong' : value >= 40 ? 'Building' : 'Start'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { icon: '🔥', value: habitCount, label: 'active habits' },
              { icon: '✅', value: taskCount,  label: 'completed tasks' },
              { icon: '🎯', value: goalCount,  label: 'goals in progress' },
            ].map(({ icon, value, label }) => (
              <div key={label} style={{ ...CARD, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 7 }}>{icon}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: TXT, fontFamily: 'Georgia,serif', lineHeight: 1, marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 10, color: DIM }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Wins */}
          {wins.length > 0 && (
            <div style={{ background: 'linear-gradient(145deg,rgba(0,229,160,.06),rgba(0,229,160,.02))', border: '1px solid rgba(0,229,160,.15)', borderRadius: 14, padding: '16px 18px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 10 }}>🏆 Your Wins</p>
              <div className="space-y-3">
                {wins.map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN, boxShadow: `0 0 5px ${GREEN}`, flexShrink: 0, marginTop: 5 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: GREEN }}>{w.title}</p>
                      <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{w.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Focus Areas */}
          {misses.length > 0 && (
            <div style={{ background: 'linear-gradient(145deg,rgba(249,164,74,.06),rgba(249,164,74,.02))', border: '1px solid rgba(249,164,74,.18)', borderRadius: 14, padding: '16px 18px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 10 }}>⚡ Focus Areas</p>
              <div className="space-y-3">
                {misses.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: AMBER, boxShadow: `0 0 5px ${AMBER}`, flexShrink: 0, marginTop: 5 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: AMBER }}>{m.title}</p>
                      <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{m.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {tips.length > 0 && (
            <div style={{ background: 'linear-gradient(145deg,rgba(167,139,250,.06),rgba(167,139,250,.02))', border: '1px solid rgba(167,139,250,.18)', borderRadius: 14, padding: '16px 18px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 10 }}>💡 This Week's Focus</p>
              <div className="space-y-3">
                {tips.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: PURPLE, flexShrink: 0, marginTop: 5 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: PURPLE }}>{t.title}</p>
                      <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{t.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No data */}
          {wins.length === 0 && misses.length === 0 && tips.length === 0 && (
            <div style={{ ...CARD, padding: '56px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 11, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🎯</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: TXT }}>Keep tracking!</p>
              <p style={{ fontSize: 11, color: DIM, maxWidth: 300 }}>Use all modules for a week to unlock your personalized weekly review.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
