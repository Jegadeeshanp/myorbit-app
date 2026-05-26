'use client';

import { useState, useEffect } from 'react';
import HabitCalendar, { type HabitForCalendar } from '@/components/habits/HabitCalendar';
import { toast } from '@/components/Toast';

const CARD: React.CSSProperties = { background: 'linear-gradient(145deg,#131c2e,#0e1420)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)' };
const TXT  = '#e4eaf4';
const MUTED = '#8fa3b8';
const DIM  = '#3d5166';

export default function HabitsCalendarPage() {
  const [habits, setHabits] = useState<HabitForCalendar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/habits')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setHabits(d); })
      .catch(() => toast('Failed to load habits', 'error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      {/* Legend */}
      {!loading && habits.length > 0 && (
        <div style={{ ...CARD, padding: '12px 18px', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {habits.filter(h => h.isActive).map(h => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>{h.iconEmoji}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: MUTED }}>{h.name}</span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: h.color }} />
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse" style={{ height: 256, borderRadius: 16, background: 'rgba(255,255,255,0.04)' }} />
      ) : habits.length === 0 ? (
        <div style={{ ...CARD, padding: '64px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: TXT }}>No habits yet</p>
          <p style={{ fontSize: 12, color: DIM }}>Create habits on the Dashboard to see them here</p>
        </div>
      ) : (
        <HabitCalendar habits={habits} />
      )}
    </div>
  );
}
