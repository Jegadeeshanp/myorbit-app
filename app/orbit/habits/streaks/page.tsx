'use client';

import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';

type Habit = {
  id: string; name: string; iconEmoji: string; color: string;
  logs: { logDate: string }[];
};

function getStreakCount(logs: { logDate: string }[]): number {
  const logSet = new Set(logs.map(l => l.logDate));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (logSet.has(d.toISOString().split('T')[0])) streak++;
    else break;
  }
  return streak;
}

function getBestStreak(logs: { logDate: string }[]): number {
  if (logs.length === 0) return 0;
  const sorted = [...logs].sort((a, b) => a.logDate.localeCompare(b.logDate));
  let best = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].logDate + 'T12:00:00');
    const curr = new Date(sorted[i].logDate + 'T12:00:00');
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) { cur++; best = Math.max(best, cur); }
    else cur = 1;
  }
  return best;
}

const CARD: React.CSSProperties = { background: 'linear-gradient(145deg,#131c2e,#0e1420)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)', overflow: 'hidden' };
const TXT   = '#e4eaf4';
const MUTED = '#8fa3b8';
const DIM   = '#3d5166';
const AMBER = '#F9A44A';

export default function HabitsStreaksPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/habits').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setHabits(d);
    }).finally(() => setLoading(false));
  }, []);

  const sorted = [...habits].sort((a, b) => getStreakCount(b.logs) - getStreakCount(a.logs));
  const rankColor = (idx: number) => idx === 0 ? AMBER : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : DIM;

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse" style={{ height: 64, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ ...CARD, padding: '56px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(249,164,74,0.1)', border: '1px solid rgba(249,164,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🔥</div>
          <p style={{ fontSize: 14, fontWeight: 700, color: TXT }}>No habits yet</p>
          <p style={{ fontSize: 12, color: DIM }}>Create habits to start building streaks</p>
        </div>
      ) : (
        <div style={CARD}>
          {sorted.map((habit, idx) => {
            const current = getStreakCount(habit.logs);
            const best    = getBestStreak(habit.logs);
            const total   = habit.logs.length;
            return (
              <div key={habit.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: idx < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: rankColor(idx), width: 18, flexShrink: 0, textAlign: 'center' }}>{idx + 1}</span>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{habit.iconEmoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: TXT, marginBottom: 2 }}>{habit.name}</p>
                  <p style={{ fontSize: 10, color: DIM }}>{total} total logs</p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: AMBER, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Flame size={13} color={AMBER} />{current}
                    </div>
                    <div style={{ fontSize: 9, color: DIM, marginTop: 1 }}>current</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: MUTED }}>{best}</div>
                    <div style={{ fontSize: 9, color: DIM, marginTop: 1 }}>best</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
