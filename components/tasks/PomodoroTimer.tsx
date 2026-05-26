'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Timer, Watch } from 'lucide-react';
import { toast } from '@/components/Toast';

type Mode    = 'pomo' | 'stopwatch';
type Session = { id: string; taskTitle?: string; durationSecs?: number; wasCompleted: boolean; startedAt: string; mode: string };

const POMO_SECS = 25 * 60;

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function CircleTimer({ progress, size = 200 }: { progress: number; size?: number }) {
  const r   = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - progress);

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#A78BFA" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={dash}
        filter="url(#glow)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
}

export default function PomodoroTimer() {
  const [mode, setMode]         = useState<Mode>('pomo');
  const [running, setRunning]   = useState(false);
  const [secs, setSecs]         = useState(POMO_SECS);
  const [taskTitle, setTaskTitle] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startSecsRef = useRef(POMO_SECS);

  const fetchSessions = useCallback(() => {
    fetch('/api/pomodoro')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSessions(d); })
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const startSession = async () => {
    try {
      const res = await fetch('/api/pomodoro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle: taskTitle.trim() || null, mode }),
      });
      if (!res.ok) throw new Error();
      const s = await res.json();
      setSessionId(s.id);
    } catch {
      toast('Failed to start session', 'error');
    }
  };

  const endSession = async (completed: boolean) => {
    if (!sessionId) return;
    const duration = mode === 'pomo' ? (POMO_SECS - secs) : secs;
    try {
      await fetch(`/api/pomodoro/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wasCompleted: completed, durationSecs: duration }),
      });
      fetchSessions();
    } catch {}
    setSessionId(null);
  };

  const tick = useCallback(() => {
    setSecs(prev => {
      if (mode === 'pomo') {
        if (prev <= 1) {
          setRunning(false);
          endSession(true);
          toast('Pomodoro complete! Take a break.');
          return 0;
        }
        return prev - 1;
      } else {
        return prev + 1;
      }
    });
  }, [mode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, tick]);

  const handleStart = async () => {
    if (!running && !sessionId) await startSession();
    setRunning(true);
  };

  const handlePause = () => {
    setRunning(false);
  };

  const handleReset = async () => {
    setRunning(false);
    if (sessionId) await endSession(false);
    setSecs(mode === 'pomo' ? POMO_SECS : 0);
  };

  const handleModeChange = async (m: Mode) => {
    if (running) { setRunning(false); if (sessionId) await endSession(false); }
    setMode(m);
    setSecs(m === 'pomo' ? POMO_SECS : 0);
    setSessionId(null);
  };

  const progress = mode === 'pomo' ? 1 - (secs / POMO_SECS) : 0;
  const todaySessions = sessions.filter(s => s.startedAt.startsWith(new Date().toISOString().split('T')[0]));
  const totalMins = todaySessions.reduce((sum, s) => sum + Math.floor((s.durationSecs || 0) / 60), 0);
  const completedPomos = todaySessions.filter(s => s.wasCompleted && s.mode === 'pomo').length;

  const CARD: React.CSSProperties = { background: 'linear-gradient(145deg,#131c2e,#0e1420)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)' };
  const TXT = '#e4eaf4'; const MUTED = '#8fa3b8'; const DIM = '#3d5166'; const PURPLE = '#A78BFA';

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: TXT, fontFamily: 'Georgia,serif' }}>Focus Timer</h2>
        <p style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>Deep work, one session at a time</p>
      </div>

      <div style={{ display: 'flex', borderRadius: 12, background: 'rgba(255,255,255,0.05)', padding: 4 }}>
        {([{ key: 'pomo' as Mode, label: 'Pomodoro', Icon: Timer }, { key: 'stopwatch' as Mode, label: 'Stopwatch', Icon: Watch }]).map(({ key, label, Icon }) => (
          <button key={key} onClick={() => handleModeChange(key)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 9, padding: '8px', fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', background: mode === key ? 'rgba(167,139,250,0.15)' : 'transparent', color: mode === key ? PURPLE : DIM, transition: 'all 0.15s' }}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div style={{ ...CARD, padding: 32, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
          <CircleTimer progress={progress} size={200} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 48, fontWeight: 700, color: TXT, fontFamily: 'Georgia,serif', letterSpacing: '-0.02em', lineHeight: 1 }}>{formatTime(secs)}</p>
            <p style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{mode === 'pomo' ? 'Focus Session' : 'Stopwatch'}</p>
          </div>
        </div>

        <input style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: TXT, padding: '10px', fontSize: 13, textAlign: 'center', outline: 'none', marginBottom: 20, boxSizing: 'border-box' }}
          placeholder="What are you working on? (optional)"
          value={taskTitle} onChange={e => setTaskTitle(e.target.value)} disabled={running}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <button onClick={handleReset} style={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RotateCcw size={18} />
          </button>
          {running ? (
            <button onClick={handlePause} style={{ width: 64, height: 64, borderRadius: '50%', border: 'none', background: PURPLE, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 24px ${PURPLE}66` }}>
              <Pause size={26} />
            </button>
          ) : (
            <button onClick={handleStart} style={{ width: 64, height: 64, borderRadius: '50%', border: 'none', background: PURPLE, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 24px ${PURPLE}66` }}>
              <Play size={26} style={{ marginLeft: 4 }} />
            </button>
          )}
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: PURPLE }}>{completedPomos}</span>
            <span style={{ fontSize: 9, color: DIM }}>pomos</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        <div style={{ ...CARD, padding: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: PURPLE, fontFamily: 'Georgia,serif' }}>{completedPomos}</p>
          <p style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>Pomos Today</p>
        </div>
        <div style={{ ...CARD, padding: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: PURPLE, fontFamily: 'Georgia,serif' }}>{totalMins}</p>
          <p style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>Minutes Focused</p>
        </div>
      </div>

      {!loadingSessions && sessions.length > 0 && (
        <div style={{ ...CARD, overflow: 'hidden' }}>
          <p style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Recent Sessions</p>
          {sessions.slice(0, 8).map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none', opacity: s.wasCompleted ? 1 : 0.5 }}>
              <span style={{ fontSize: 18 }}>{s.mode === 'pomo' ? '🍅' : '⏱'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.taskTitle || 'Focus session'}</p>
                <p style={{ fontSize: 10, color: DIM }}>{s.durationSecs ? `${Math.floor(s.durationSecs / 60)}m` : '—'}</p>
              </div>
              {s.wasCompleted && <span style={{ fontSize: 10, color: '#00E5A0', fontWeight: 600 }}>Done</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
