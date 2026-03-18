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
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E0E7FF" strokeWidth="8" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#4F46E5" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={dash}
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

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Focus Timer</h2>
        <p className="text-sm text-gray-600 mt-0.5">Deep work, one session at a time</p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-xl bg-gray-100 p-1">
        {[
          { key: 'pomo' as Mode, label: 'Pomodoro', Icon: Timer },
          { key: 'stopwatch' as Mode, label: 'Stopwatch', Icon: Watch },
        ].map(({ key, label, Icon }) => (
          <button key={key} onClick={() => handleModeChange(key)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition ${mode === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Timer */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 text-center">
        <div className="relative inline-block mb-6">
          <CircleTimer progress={progress} size={200} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-5xl font-bold text-gray-900 tabular-nums tracking-tight">{formatTime(secs)}</p>
            <p className="text-xs text-gray-400 mt-1">{mode === 'pomo' ? 'Focus Session' : 'Stopwatch'}</p>
          </div>
        </div>

        {/* Task input */}
        <input
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-center focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 mb-5"
          placeholder="What are you working on? (optional)"
          value={taskTitle}
          onChange={e => setTaskTitle(e.target.value)}
          disabled={running}
        />

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button onClick={handleReset}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition">
            <RotateCcw className="h-5 w-5" />
          </button>
          {running ? (
            <button onClick={handlePause}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition">
              <Pause className="h-7 w-7" />
            </button>
          ) : (
            <button onClick={handleStart}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition">
              <Play className="h-7 w-7 ml-1" />
            </button>
          )}
          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-500">
            <span className="text-base font-bold text-indigo-600">{completedPomos}</span>
            <span>pomos</span>
          </div>
        </div>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{completedPomos}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pomos Today</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{totalMins}</p>
          <p className="text-xs text-gray-500 mt-0.5">Minutes Focused</p>
        </div>
      </div>

      {/* Recent sessions */}
      {!loadingSessions && sessions.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <p className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">Recent Sessions</p>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/30">
            {sessions.slice(0, 8).map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={`text-lg ${s.wasCompleted ? '' : 'opacity-50'}`}>{s.mode === 'pomo' ? '🍅' : '⏱'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{s.taskTitle || 'Focus session'}</p>
                  <p className="text-xs text-gray-400">{s.durationSecs ? `${Math.floor(s.durationSecs / 60)}m` : '—'}</p>
                </div>
                {s.wasCompleted && <span className="text-xs text-emerald-600 font-medium">Done</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
