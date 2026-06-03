'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

type Scores = {
  lifeScore: number;
  scores: { habit: number; task: number; goal: number; health: number; finance: number };
  insights: { type: string; title: string; body: string; severity: string }[];
};

const TXT    = '#e4eaf4';
const MUTED  = '#8fa3b8';
const DIM    = '#3d5166';
const GREEN  = '#00E5A0';
const BLUE   = '#5BE4FF';
const PURPLE = '#A78BFA';
const AMBER  = '#F9A44A';
const RED    = '#FF6B6B';
const CARD: React.CSSProperties = { background: 'linear-gradient(145deg,#131c2e,#0e1420)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)' };

const MODULES = [
  { key: 'habit',   label: 'Habits',  icon: '🔥', color: AMBER,  weight: 30, tip: 'Try logging at least one habit every day.', href: '/orbit/habits' },
  { key: 'task',    label: 'Tasks',   icon: '📋', color: BLUE,   weight: 20, tip: 'Clear your overdue backlog to unlock points.', href: '/orbit/tasks' },
  { key: 'goal',    label: 'Goals',   icon: '🎯', color: PURPLE, weight: 20, tip: 'Add at least one active goal to boost this score.', href: '/orbit/goals' },
  { key: 'health',  label: 'Health',  icon: '❤️', color: RED,    weight: 20, tip: 'Log a daily check-in to earn full health points.', href: '/orbit/health' },
  { key: 'finance', label: 'Finance', icon: '💰', color: GREEN,  weight: 10, tip: 'Connect an account or log a transaction to earn points.', href: '/orbit/finance' },
] as const;

const IMPROVE = [
  { label: '+ Log Habit',       href: '/orbit/habits',          bg: 'rgba(249,164,74,.12)', color: AMBER,  border: 'rgba(249,164,74,.22)' },
  { label: '+ Add Task',        href: '/orbit/tasks',           bg: 'rgba(91,228,255,.1)',  color: BLUE,   border: 'rgba(91,228,255,.2)' },
  { label: '+ New Goal',        href: '/orbit/goals',           bg: 'rgba(167,139,250,.1)', color: PURPLE, border: 'rgba(167,139,250,.2)' },
  { label: '+ Log Health',      href: '/orbit/health',          bg: 'rgba(255,107,107,.1)', color: RED,    border: 'rgba(255,107,107,.2)' },
  { label: '+ Add Transaction', href: '/orbit/finance',         bg: 'rgba(0,229,160,.08)',  color: GREEN,  border: 'rgba(0,229,160,.18)' },
  { label: 'Weekly Review',     href: '/orbit/insights/weekly', bg: 'rgba(129,140,248,.1)', color: '#818cf8', border: 'rgba(129,140,248,.2)' },
];

function LifeScoreRing({ score }: { score: number }) {
  const r    = 72;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? GREEN : score >= 40 ? AMBER : PURPLE;
  const label = score >= 70 ? 'Great' : score >= 40 ? 'Building' : 'Getting Started';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <p style={{ fontSize: 9, color: DIM, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 14 }}>Life Score</p>
      <svg width="172" height="172" viewBox="0 0 172 172" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="86" cy="86" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="11" />
        <circle cx="86" cy="86" r={r} fill="none" stroke={color} strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 7px ${color}80)`, transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div style={{ marginTop: -86, marginBottom: 86, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 40, fontWeight: 700, color: TXT, fontFamily: 'Georgia,serif', lineHeight: 1 }}>{score}</p>
        <p style={{ fontSize: 11, color, marginTop: 3 }}>{label}</p>
        <p style={{ fontSize: 10, color: DIM }}>Life Score</p>
      </div>
      <p style={{ fontSize: 11, color: DIM, marginTop: 10, textAlign: 'center', maxWidth: 320 }}>
        Weighted average across Habits (30%) · Tasks (20%) · Goals (20%) · Health (20%) · Finance (10%)
      </p>
    </div>
  );
}

function ScoreExplainer({ scores }: { scores: Record<string, number> }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ ...CARD, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: TXT }}>What's in your Life Score?</p>
        <p style={{ fontSize: 11, color: DIM, marginTop: 2 }}>5 areas of life, each weighted by impact.</p>
      </div>

      {MODULES.map(({ key, label, icon, color, weight, tip, href }) => {
        const score  = scores[key] ?? 0;
        const isGood = score >= 70;
        return (
          <div key={key} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                {icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: TXT }}>{label}</p>
                  <span style={{ fontSize: 9, color: DIM }}>{weight}% weight</span>
                  <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                    background: isGood ? 'rgba(0,229,160,0.12)' : 'rgba(249,164,74,0.12)',
                    color: isGood ? GREEN : AMBER }}>
                    {isGood ? '✓ Good' : '↑ Needs work'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 99, transition: 'width 0.7s' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: TXT, width: 24, textAlign: 'right' }}>{score}</span>
                </div>
                {!isGood && (
                  <p style={{ marginTop: 5, fontSize: 10, color: DIM }}>💡 {tip}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => setOpen(v => !v)}
          style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', fontSize: 12, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <span style={{ fontWeight: 600 }}>How is this calculated?</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {open && (
          <div style={{ padding: '0 20px 16px', color: DIM, fontSize: 11, lineHeight: 1.6 }}>
            <p style={{ marginBottom: 8 }}>Your Life Score is a weighted average recalculated each time you refresh.</p>
            <ul style={{ paddingLeft: 16 }}>
              <li><span style={{ color: MUTED, fontWeight: 600 }}>Habits (30%)</span> — ratio of habits logged vs. scheduled today × 100.</li>
              <li><span style={{ color: MUTED, fontWeight: 600 }}>Tasks (20%)</span> — tasks completed this week ÷ total tasks created, capped at 100.</li>
              <li><span style={{ color: MUTED, fontWeight: 600 }}>Goals (20%)</span> — number of active goals with milestones, scaled 0–100.</li>
              <li><span style={{ color: MUTED, fontWeight: 600 }}>Health (20%)</span> — daily check-in streak. Logging today gives full points.</li>
              <li><span style={{ color: MUTED, fontWeight: 600 }}>Finance (10%)</span> — presence of connected accounts and recent transactions.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [data,       setData]       = useState<Scores | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScores = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/insights/scores');
      if (!res.ok) throw new Error(`${res.status}`);
      setData(await res.json());
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
      <div className="space-y-5">
        <div className="animate-pulse" style={{ height: 220, borderRadius: 16, background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="animate-pulse" style={{ height: 90, borderRadius: 13, background: 'rgba(255,255,255,0.04)' }} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...CARD, padding: '56px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,107,107,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={28} color={RED} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: TXT }}>Failed to load insights</p>
        <p style={{ fontSize: 12, color: DIM }}>Check your connection and try again.</p>
        <button onClick={() => fetchScores()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10, background: `linear-gradient(135deg,${GREEN},#00c47a)`, border: 'none', padding: '10px 22px', color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const scores    = data?.scores ?? { habit: 0, task: 0, goal: 0, health: 0, finance: 0 };
  const insights  = data?.insights ?? [];
  const lifeScore = data?.lifeScore ?? 0;

  return (
    <div className="space-y-5">
      {/* Refresh */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => fetchScores(true)} disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', padding: '6px 13px', color: MUTED, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Life Score Ring */}
      <div style={{ ...CARD, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <LifeScoreRing score={lifeScore} />
      </div>

      {/* Module Scores Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 11 }}>
        {MODULES.map(({ key, label, icon, color }) => {
          const score = scores[key as keyof typeof scores];
          return (
            <div key={key} style={{ ...CARD, borderRadius: 13, padding: '13px 14px' }}>
              <div style={{ fontSize: 16, marginBottom: 7 }}>{icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'Georgia,serif', lineHeight: 1, marginBottom: 3 }}>{score}</div>
              <div style={{ fontSize: 10, color: DIM }}>{label}</div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, marginTop: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 99 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Score Explainer */}
      <ScoreExplainer scores={scores} />

      {/* Insights Feed */}
      {insights.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 11 }}>Insights</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
            {insights.map((ins, i) => {
              const isWarn = ins.severity === 'warning' || ins.severity === 'critical';
              const c = isWarn ? AMBER : GREEN;
              return (
                <div key={i} style={{ padding: '14px 16px', borderRadius: 12, border: `1px solid ${c}30`, background: `${c}0d` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <span style={{ fontSize: 14 }}>{isWarn ? '⚡' : '✅'}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{ins.title}</span>
                  </div>
                  <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{ins.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {insights.length === 0 && (
        <div style={{ ...CARD, padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: DIM }}>Keep using the app — insights will appear as you track more data across modules.</p>
        </div>
      )}

      {/* Improve Your Scores */}
      <div style={{ ...CARD, padding: '18px 20px' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 11 }}>Improve Your Scores</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>
          {IMPROVE.map(({ label, href, bg, color, border }) => (
            <Link key={href} href={href}
              style={{ padding: 11, borderRadius: 10, fontSize: 11, fontWeight: 600, textAlign: 'center', background: bg, color, border: `1px solid ${border}`, textDecoration: 'none', transition: 'all 0.18s' }}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
