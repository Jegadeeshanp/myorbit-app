'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dumbbell, Utensils, LayoutDashboard, BarChart2,
  CheckCircle2, Circle, Flame, Clock, Trash2, Activity,
  Target, ChevronRight, Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useHealth } from '@/lib/healthStore';
import LogHealthModal from '@/components/health/LogHealthModal';
import AddWorkoutModal from '@/components/health/AddWorkoutModal';
import HealthInsights from '@/components/health/HealthInsights';
import { toast } from '@/components/Toast';
import ErrorState from '@/components/ErrorState';

// ── Theme ──────────────────────────────────────────────────────────────────────
const BG     = '#090d16';
const BG2    = '#0d1220';
const BG3    = '#111826';
const BORD   = '#1a2a3a';
const GREEN  = '#00E5A0';
const BLUE   = '#5BE4FF';
const PURPLE = '#A78BFA';
const AMBER  = '#F9A44A';
const RED    = '#FF6B6B';
const CYAN   = '#60C8FF';
const TXT    = '#e2e8f0';
const MUTED  = '#7a8ba0';
const DIM    = '#3a5060';
const ACCENT = GREEN;
const CARD_BG   = 'rgba(255,255,255,0.04)';
const CARD_BORD = 'rgba(255,255,255,0.08)';

// ── Segment definitions for Orbit Ring ────────────────────────────────────────
const SEGS = [
  { key: 'steps',     color: GREEN,  label: 'Steps',    target: 10000, unit: ''    },
  { key: 'exercise',  color: BLUE,   label: 'Exercise', target: 60,    unit: 'min' },
  { key: 'sleep',     color: PURPLE, label: 'Sleep',    target: 8,     unit: 'h'   },
  { key: 'water',     color: CYAN,   label: 'Water',    target: 3,     unit: 'L'   },
  { key: 'nutrition', color: AMBER,  label: 'Calories', target: 2000,  unit: 'kcal'},
];

const CARD: React.CSSProperties = {
  background: `linear-gradient(145deg,${BG3} 0%,${BG2} 100%)`,
  border: `1px solid ${BORD}`,
  borderRadius: 16,
  padding: '20px',
};

const TAG: React.CSSProperties = {
  fontSize: 10, color: DIM, letterSpacing: '0.14em',
  textTransform: 'uppercase', fontWeight: 700, marginBottom: 8,
};

// ── Shared helpers ─────────────────────────────────────────────────────────────
function Bar({ pct, color, h = 5 }: { pct: number; color: string; h?: number }) {
  return (
    <div style={{ height: h, borderRadius: 99, background: '#151e30', overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(pct * 100, 100)}%`, height: '100%', borderRadius: 99,
        background: color, boxShadow: `0 0 8px ${color}55`, transition: 'width 1.2s ease',
      }} />
    </div>
  );
}

function Bdg({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, color, background: color + '18', borderRadius: 6,
      padding: '2px 8px', fontWeight: 700, border: `1px solid ${color}33`, letterSpacing: '0.06em',
    }}>{label}</span>
  );
}

// ── Orbit Ring (5 arc segments) ────────────────────────────────────────────────
function arcPath(cx: number, cy: number, r: number, a1: number, a2: number) {
  const rad = (x: number) => x * Math.PI / 180;
  const sx = cx + r * Math.cos(rad(a1)), sy = cy + r * Math.sin(rad(a1));
  const ex = cx + r * Math.cos(rad(a2)), ey = cy + r * Math.sin(rad(a2));
  return `M ${sx} ${sy} A ${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${ex} ${ey}`;
}

function OrbitRing({ values, size = 220 }: { values: Record<string, number>; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38, sw = 7, gap = 7;
  const sa = (360 - gap * 5) / 5;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="hog" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={GREEN} stopOpacity="0.06" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={cx * 0.9} fill="url(#hog)" />
      {SEGS.map((s, i) => {
        const st = -90 + i * (sa + gap);
        const pct = Math.min((values[s.key] ?? 0) / s.target, 1);
        return (
          <g key={s.key}>
            <path d={arcPath(cx, cy, r, st, st + sa)} fill="none" stroke="#151e30" strokeWidth={sw} strokeLinecap="round" />
            {pct > 0 && (
              <path d={arcPath(cx, cy, r, st, st + sa * pct)} fill="none" stroke={s.color} strokeWidth={sw} strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${s.color}55)`, transition: 'all 1.2s ease' }} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Mood / Workout helpers ─────────────────────────────────────────────────────
const MOOD_LABELS = ['', '😞', '😕', '😐', '😊', '😄'];
const MOOD_TEXT   = ['', 'Bad', 'Poor', 'Okay', 'Good', 'Great'];
const WORKOUT_EMOJI: Record<string, string> = {
  running: '🏃', cycling: '🚴', strength: '💪', yoga: '🧘', sports: '⚽', other: '🏋️',
};

// ── Tab config ─────────────────────────────────────────────────────────────────
type Tab = 'dashboard' | 'workouts' | 'nutrition' | 'insights';
const TABS: { key: Tab; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'dashboard',  label: 'Overview',   Icon: LayoutDashboard },
  { key: 'workouts',   label: 'Workouts',   Icon: Dumbbell },
  { key: 'nutrition',  label: 'Nutrition',  Icon: Utensils },
  { key: 'insights',   label: 'Insights',   Icon: BarChart2 },
];

// ── Page ───────────────────────────────────────────────────────────────────────
export default function HealthPage() {
  const {
    loadState, entries, dashboard,
    addHealthEntry, addWorkout, deleteWorkout,
    completeHealthTask, undoHealthTask, toggleHealthHabit, reload,
  } = useHealth();

  useEffect(() => {
    reload();
    const handler = () => reload();
    window.addEventListener('health:refresh', handler);
    return () => window.removeEventListener('health:refresh', handler);
  }, []);

  const [logOpen, setLogOpen]               = useState(false);
  const [workoutOpen, setWorkoutOpen]       = useState(false);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [togglingHabit, setTogglingHabit]   = useState<string | null>(null);

  const d                = dashboard;
  const todayEntry       = d?.todayEntry;
  const todayWorkoutMins = (d?.todayWorkouts ?? []).reduce((s, w) => s + w.durationMins, 0);
  const todayWorkoutCal  = (d?.todayWorkouts ?? []).reduce((s, w) => s + (w.caloriesBurned ?? 0), 0);

  const foodLogs = d?.todayFoodLogs ?? [];
  const foodCal  = foodLogs.reduce((s, f) => s + (f.calories  ?? 0), 0);
  const foodProt = foodLogs.reduce((s, f) => s + (f.proteinG  ?? 0), 0);
  const foodCarb = foodLogs.reduce((s, f) => s + (f.carbsG    ?? 0), 0);
  const foodFat  = foodLogs.reduce((s, f) => s + (f.fatG      ?? 0), 0);

  const orbValues = {
    steps:     todayEntry?.steps ?? 0,
    exercise:  todayWorkoutMins,
    sleep:     todayEntry?.sleepHours ?? 0,
    water:     (todayEntry?.waterMl ?? 0) / 1000,
    nutrition: foodCal,
  };

  const orbitScore = useMemo(() => {
    const scores = SEGS.map(s => Math.min((orbValues[s.key as keyof typeof orbValues] ?? 0) / s.target, 1));
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100);
  }, [orbValues.steps, orbValues.exercise, orbValues.sleep, orbValues.water, orbValues.nutrition]);

  if (loadState === 'loading' || loadState === 'idle') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ height: 96, borderRadius: 16, background: CARD_BG, border: `1px solid ${CARD_BORD}` }} />
        ))}
      </div>
    );
  }

  if (loadState === 'error') return <ErrorState message="Couldn't load health data." />;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  async function handleCompleteTask(taskId: string) {
    setCompletingTask(taskId);
    try {
      const allTasks = [
        ...(d?.healthTasks?.today   ?? []),
        ...(d?.healthTasks?.overdue ?? []),
        ...(d?.healthTasks?.missed  ?? []),
      ];
      const task = allTasks.find(t => t.id === taskId);
      if (task?.status === 'completed') {
        await undoHealthTask(taskId);
        toast('Task marked incomplete', 'success');
      } else {
        await completeHealthTask(taskId);
        toast('Task completed!', 'success');
      }
    } catch { toast('Failed to update task', 'error'); }
    finally { setCompletingTask(null); }
  }

  async function handleToggleHabit(habitId: string, completed: boolean) {
    setTogglingHabit(habitId);
    try {
      await toggleHealthHabit(habitId, completed);
      toast(completed ? 'Habit unmarked' : 'Habit marked done!');
    } catch { toast('Failed to update habit'); }
    finally { setTogglingHabit(null); }
  }

  async function handleDeleteWorkout(id: string) {
    try { await deleteWorkout(id); toast('Workout deleted'); }
    catch { toast('Failed to delete workout'); }
  }

  // ── Task row ─────────────────────────────────────────────────────────────────
  function TaskRow({ task, accent }: {
    task: { id: string; title: string; status: string; dueTime?: string | null; habit?: { iconEmoji?: string | null } | null };
    accent: string;
  }) {
    const done = task.status === 'completed';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 10, padding: '10px 12px',
        background: done ? 'rgba(0,229,160,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${CARD_BORD}` }}>
        <button onClick={() => handleCompleteTask(task.id)} disabled={completingTask === task.id}
          style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
          {done
            ? <CheckCircle2 size={18} color={ACCENT} />
            : completingTask === task.id
              ? <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              : <Circle size={18} color={MUTED} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: done ? MUTED : TXT, textDecoration: done ? 'line-through' : 'none',
            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
          {task.dueTime && <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{task.dueTime}</p>}
        </div>
        {task.habit && <span style={{ fontSize: 14 }}>{task.habit.iconEmoji ?? '🏃'}</span>}
      </div>
    );
  }

  // ── DASHBOARD TAB ─────────────────────────────────────────────────────────────
  function DashboardTab() {
    const scoreLabel = orbitScore >= 80 ? 'Excellent Day' : orbitScore >= 60 ? 'Great Day' : orbitScore >= 40 ? 'Good Progress' : 'Keep Going';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 3-column main grid */}
        <div className="hp-main-grid" style={{ display: 'grid', gridTemplateColumns: '1.9fr 1fr 1fr', gap: 16 }}>

          {/* Orbit Ring card — horizontal layout */}
          <div style={{ ...CARD }}>
            <p style={TAG}>Today&apos;s Orbit</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              {/* Ring on left */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <OrbitRing values={orbValues} size={160} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: TXT, fontFamily: 'Georgia,serif', lineHeight: 1 }}>{orbitScore}</div>
                  <div style={{ fontSize: 8, color: GREEN, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 4 }}>{scoreLabel}</div>
                </div>
              </div>

              {/* Right side */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                {/* Legend */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {SEGS.map(s => (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 99, background: s.color, boxShadow: `0 0 5px ${s.color}88` }} />
                      <span style={{ fontSize: 11, color: MUTED }}>{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Metrics grid */}
                <div className="hp-metrics-scroll"><div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', minWidth: 300, background: BG, borderRadius: 10, border: `1px solid ${BORD}`, overflow: 'hidden' }}>
                  {SEGS.map((s, i) => {
                    const val = orbValues[s.key as keyof typeof orbValues] ?? 0;
                    const disp = s.key === 'water' ? (val as number).toFixed(1) : Math.round(val as number);
                    return (
                      <div key={s.key} style={{ padding: '10px 4px', textAlign: 'center', borderRight: i < SEGS.length - 1 ? `1px solid ${BORD}` : 'none' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: TXT }}>{disp}{s.unit}</div>
                        <div style={{ fontSize: 9, color: DIM, marginTop: 3 }}>{s.label}</div>
                      </div>
                    );
                  })}
                </div></div>{/* /hp-metrics-scroll inner */}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setLogOpen(true)}
                    style={{ flex: 1, padding: 11, borderRadius: 10, background: `linear-gradient(135deg,${GREEN},#00c47a)`, border: 'none', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Log Today
                  </button>
                  <button onClick={() => setWorkoutOpen(true)}
                    style={{ flex: 1, padding: 11, borderRadius: 10, background: BG, border: `1px solid ${BORD}`, color: MUTED, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    + Workout
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Nutrition card */}
          <div style={CARD}>
            <p style={TAG}>Nutrition</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: TXT, fontFamily: 'Georgia,serif' }}>
                {Math.round(foodCal)}<span style={{ fontSize: 13, color: MUTED, fontWeight: 400 }}> kcal</span>
              </div>
              <div style={{ background: BG2, borderRadius: 10, padding: '6px 12px', textAlign: 'center', border: `1px solid ${BORD}` }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: AMBER }}>{Math.round(Math.min((foodCal / 2000) * 100, 100))}</div>
                <div style={{ fontSize: 9, color: DIM }}>SCORE</div>
              </div>
            </div>
            {[
              { l: 'Protein', v: foodProt, g: 150, c: BLUE },
              { l: 'Carbs',   v: foodCarb, g: 250, c: AMBER },
              { l: 'Fat',     v: foodFat,  g: 65,  c: PURPLE },
            ].map(m => (
              <div key={m.l} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: MUTED }}>{m.l}</span>
                  <span style={{ fontSize: 11, color: TXT }}>{Math.round(m.v)}g <span style={{ color: DIM }}>/ {m.g}g</span></span>
                </div>
                <Bar pct={m.v / m.g} color={m.c} h={4} />
              </div>
            ))}
            {foodLogs.length === 0 && (
              <p style={{ fontSize: 11, color: MUTED, textAlign: 'center', marginTop: 8 }}>No food logged yet</p>
            )}
          </div>

          {/* Vitals card */}
          <div style={CARD}>
            <p style={TAG}>Vitals</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              {[
                { l: 'Mood',       v: todayEntry?.mood ? MOOD_LABELS[todayEntry.mood] : '—',                    c: PURPLE },
                { l: 'Energy',     v: todayEntry?.energyLevel ? `${todayEntry.energyLevel}/10` : '—',           c: AMBER },
                { l: 'Weight',     v: todayEntry?.weightKg ? `${todayEntry.weightKg} kg` : '—',                 c: CYAN },
                { l: 'Resting HR', v: todayEntry?.heartRate ? `${todayEntry.heartRate} bpm` : '—',              c: RED },
              ].map(s => (
                <div key={s.l} style={{ background: BG2, borderRadius: 10, padding: '12px', border: `1px solid ${BORD}` }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: DIM, marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
            {/* Mood label */}
            {todayEntry?.mood ? (
              <div style={{ marginTop: 10, fontSize: 12, color: MUTED, textAlign: 'center' }}>
                Feeling <span style={{ color: PURPLE, fontWeight: 600 }}>{MOOD_TEXT[todayEntry.mood]}</span> today
              </div>
            ) : null}
          </div>

          {/* Tasks + Habits — spans all 3 cols */}
          <div className="hp-span-all" style={{ ...CARD, gridColumn: 'span 3', background: `linear-gradient(135deg,#0e1f2f,${BG2})`, borderColor: '#1a3040' }}>
            <div className="hp-tasks-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Health Tasks */}
              <div>
                <p style={{ ...TAG, marginBottom: 12 }}>Health Tasks</p>
                {(d?.healthTasks?.today?.length ?? 0) === 0 && (d?.healthTasks?.overdue?.length ?? 0) === 0 && (d?.healthTasks?.missed?.length ?? 0) === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', textAlign: 'center' }}>
                    <CheckCircle2 size={28} color={DIM} style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>No health tasks today.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(d?.healthTasks?.today ?? []).map(task => <TaskRow key={task.id} task={task} accent={ACCENT} />)}
                    {(d?.healthTasks?.overdue ?? []).length > 0 && (
                      <>
                        <p style={{ fontSize: 10, color: AMBER, fontWeight: 700, margin: '4px 0 0' }}>⚠️ Overdue</p>
                        {(d?.healthTasks?.overdue ?? []).map(task => <TaskRow key={task.id} task={task} accent={AMBER} />)}
                      </>
                    )}
                    {(d?.healthTasks?.missed ?? []).length > 0 && (
                      <>
                        <p style={{ fontSize: 10, color: RED, fontWeight: 700, margin: '4px 0 0' }}>❌ Missed</p>
                        {(d?.healthTasks?.missed ?? []).map(task => <TaskRow key={task.id} task={task} accent={RED} />)}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Health Habits */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ ...TAG, marginBottom: 0 }}>Health Habits</p>
                  <Link href="/orbit/habits" style={{ fontSize: 11, color: ACCENT, textDecoration: 'none' }}>Manage →</Link>
                </div>
                {(d?.healthHabits ?? []).length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', textAlign: 'center' }}>
                    <Activity size={28} color={DIM} style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>No health habits set up.</p>
                    <Link href="/orbit/habits" style={{ fontSize: 11, color: ACCENT, marginTop: 4 }}>Add health habits →</Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(d?.healthHabits ?? []).map(habit => (
                      <div key={habit.id} onClick={() => handleToggleHabit(habit.id, habit.completedToday)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 10, padding: '8px 12px',
                          background: 'rgba(255,255,255,0.03)', border: `1px solid ${CARD_BORD}`, cursor: 'pointer' }}>
                        {habit.completedToday
                          ? <CheckCircle2 size={16} color={ACCENT} />
                          : togglingHabit === habit.id
                            ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${ACCENT}`, borderTopColor: 'transparent' }} />
                            : <Circle size={16} color={MUTED} />}
                        <span style={{ fontSize: 13 }}>{habit.iconEmoji ?? '✅'}</span>
                        <p style={{ flex: 1, fontSize: 12, fontWeight: 500, color: habit.completedToday ? MUTED : TXT,
                          margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          textDecoration: habit.completedToday ? 'line-through' : 'none' }}>{habit.name}</p>
                        {habit.completedToday && <Bdg label="Done" color={ACCENT} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Stats */}
        {d && (
          <div className="hp-weekly-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Habits this week',   value: d.weeklyStats.habitsCompletedThisWeek, color: ACCENT },
              { label: 'Workouts this week',  value: d.weeklyStats.workoutsThisWeek,        color: BLUE },
              { label: 'Avg sleep',           value: d.weeklyStats.avgSleep ? `${d.weeklyStats.avgSleep}h` : '—', color: PURPLE },
            ].map(s => (
              <div key={s.label} style={{ ...CARD, textAlign: 'center' }}>
                <p style={{ fontSize: 32, fontWeight: 800, color: s.color, margin: '0 0 4px', fontFamily: 'Georgia,serif' }}>{s.value}</p>
                <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Health Goals */}
        {(d?.healthGoals ?? []).length > 0 && (
          <div style={CARD}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TXT, margin: 0 }}>Health Goals</p>
              <Link href="/orbit/goals" style={{ fontSize: 11, color: ACCENT, textDecoration: 'none' }}>All goals →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(d?.healthGoals ?? []).map(goal => {
                const done  = goal.milestones.filter(m => m.isCompleted).length;
                const total = goal.milestones.length;
                const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <Link key={goal.id} href={`/orbit/goals/${goal.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 10, padding: '10px 14px',
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${CARD_BORD}` }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,107,107,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Target size={16} color={RED} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: TXT, margin: '0 0 4px',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.title}</p>
                        {total > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.1)' }}>
                              <div style={{ height: 4, borderRadius: 4, background: RED, width: `${pct}%` }} />
                            </div>
                            <span style={{ fontSize: 11, color: MUTED }}>{done}/{total}</span>
                          </div>
                        ) : (
                          <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{goal.metric ?? 'No milestones yet'}</p>
                        )}
                      </div>
                      <ChevronRight size={16} color={MUTED} style={{ flexShrink: 0 }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── WORKOUTS TAB ─────────────────────────────────────────────────────────────
  function WorkoutsTab() {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayDow = new Date().getDay();
    const suggested = [
      { icon: '🧘', name: 'Recovery Stretch', duration: '15 min', type: 'Recovery', color: PURPLE },
      { icon: '🚴', name: 'Cycling Session',   duration: '30 min', type: 'Cardio',   color: BLUE },
      { icon: '🏋️', name: 'Upper Body',        duration: '45 min', type: 'Strength', color: AMBER },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { l: 'Workouts Today',  v: (d?.todayWorkouts ?? []).length, c: TXT,   Icon: Dumbbell },
            { l: 'Active Minutes',  v: todayWorkoutMins || '—',          c: BLUE,  Icon: Clock },
            { l: 'Calories Burned', v: todayWorkoutCal  || '—',          c: AMBER, Icon: Flame },
          ].map(s => (
            <div key={s.l} style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.c}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.Icon size={20} color={s.c} />
              </div>
              <div>
                <p style={{ fontSize: 28, fontWeight: 800, color: s.c, margin: 0, fontFamily: 'Georgia,serif' }}>{s.v}</p>
                <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{s.l}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Weekly Activity heatmap */}
            <div style={CARD}>
              <p style={TAG}>Weekly Activity</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {weekDays.map((day, i) => {
                  const isToday   = i === todayDow;
                  const hasWkt    = isToday && (d?.todayWorkouts ?? []).length > 0;
                  return (
                    <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 9, color: DIM }}>{day}</div>
                      <div style={{ width: '100%', aspectRatio: '1', borderRadius: 8,
                        background: hasWkt ? `${GREEN}33` : BG2,
                        border: `1px solid ${hasWkt ? GREEN + '55' : BORD}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                        {hasWkt ? '✅' : isToday ? '📍' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Today's workouts */}
            <div style={CARD}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ ...TAG, marginBottom: 0 }}>Today&apos;s Workouts</p>
                <button onClick={() => setWorkoutOpen(true)}
                  style={{ padding: '7px 14px', borderRadius: 8, background: `linear-gradient(135deg,${AMBER},#e08820)`, border: 'none', color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  + Log Workout
                </button>
              </div>
              {(d?.todayWorkouts ?? []).length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', textAlign: 'center' }}>
                  <Dumbbell size={32} color={DIM} style={{ marginBottom: 10 }} />
                  <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>No workouts logged today.</p>
                  <button onClick={() => setWorkoutOpen(true)}
                    style={{ fontSize: 12, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 }}>Log a workout →</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(d?.todayWorkouts ?? []).map(w => (
                    <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 10, padding: '12px 14px',
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${CARD_BORD}` }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{WORKOUT_EMOJI[w.type ?? ''] ?? '🏋️'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: TXT, margin: '0 0 2px',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</p>
                        <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>
                          {w.durationMins} min
                          {w.caloriesBurned ? ` · ${w.caloriesBurned} kcal` : ''}
                          {w.distanceKm    ? ` · ${w.distanceKm} km` : ''}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteWorkout(w.id)}
                        style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,107,107,0.08)', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={14} color={RED} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Suggested + weekly summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={CARD}>
              <p style={TAG}>Suggested for You</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {suggested.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: BG2, borderRadius: 12,
                    padding: '12px 14px', border: `1px solid ${BORD}` }}>
                    <span style={{ fontSize: 20 }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: TXT }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>⏱ {s.duration}</div>
                    </div>
                    <Bdg label={s.type} color={s.color} />
                  </div>
                ))}
              </div>
            </div>
            {d && (
              <div style={CARD}>
                <p style={TAG}>This Week</p>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <p style={{ fontSize: 28, fontWeight: 800, color: BLUE, margin: 0, fontFamily: 'Georgia,serif' }}>{d.weeklyStats.workoutsThisWeek}</p>
                    <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>workouts</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 28, fontWeight: 800, color: PURPLE, margin: 0, fontFamily: 'Georgia,serif' }}>{d.weeklyStats.avgSleep ? `${d.weeklyStats.avgSleep}h` : '—'}</p>
                    <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>avg sleep</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── NUTRITION TAB ─────────────────────────────────────────────────────────────
  function NutritionTab() {
    const calTarget  = 2000;
    const protTarget = 150;
    const carbTarget = 250;
    const fatTarget  = 65;
    const mealSlots  = [
      { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
      { key: 'lunch',     label: 'Lunch',     icon: '☀️' },
      { key: 'dinner',    label: 'Dinner',    icon: '🌙' },
      { key: 'snack',     label: 'Snacks',    icon: '🍽️' },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Calorie hero */}
        <div style={CARD}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'start' }}>
            <div>
              <p style={TAG}>Calories Today</p>
              <div style={{ fontSize: 42, fontWeight: 700, color: TXT, fontFamily: 'Georgia,serif', lineHeight: 1 }}>
                {Math.round(foodCal)}<span style={{ fontSize: 14, color: MUTED, fontWeight: 400 }}> kcal</span>
              </div>
              <div style={{ marginTop: 12 }}><Bar pct={foodCal / calTarget} color={GREEN} h={8} /></div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                {[
                  { l: 'Consumed', v: Math.round(foodCal).toLocaleString(),                           c: GREEN },
                  { l: 'Target',   v: calTarget.toLocaleString(),                                     c: TXT },
                  { l: 'Remaining',v: Math.max(0, calTarget - Math.round(foodCal)).toLocaleString(),   c: BLUE },
                ].map(s => (
                  <div key={s.l} style={{ background: BG2, borderRadius: 10, padding: '10px 16px', border: `1px solid ${BORD}`, minWidth: 90 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.c, fontFamily: 'Georgia,serif' }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: DIM, marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { l: 'Protein', v: foodProt, g: protTarget, c: BLUE },
                { l: 'Carbs',   v: foodCarb, g: carbTarget, c: AMBER },
                { l: 'Fat',     v: foodFat,  g: fatTarget,  c: PURPLE },
              ].map(m => (
                <div key={m.l} style={{ background: BG2, borderRadius: 12, padding: '14px 12px', border: `1px solid ${BORD}`, minWidth: 80, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: DIM, marginBottom: 8 }}>{m.l} <span style={{ color: MUTED }}>{m.g}g</span></div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: TXT, fontFamily: 'Georgia,serif' }}>
                    {Math.round(m.v)}<span style={{ fontSize: 10, color: DIM }}>g</span>
                  </div>
                  <div style={{ marginTop: 8 }}><Bar pct={m.v / m.g} color={m.c} h={3} /></div>
                  <div style={{ fontSize: 9, color: DIM, marginTop: 4 }}>{Math.max(0, m.g - Math.round(m.v))}g left</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Meal slots */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {mealSlots.map(slot => {
            const items   = foodLogs.filter(f => (f as { mealType?: string }).mealType === slot.key);
            const slotCal = items.reduce((s, f) => s + (f.calories ?? 0), 0);
            return (
              <div key={slot.key} style={CARD}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{slot.icon}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: TXT }}>{slot.label}</div>
                      {slotCal > 0 && <div style={{ fontSize: 11, color: MUTED }}>{Math.round(slotCal)} kcal</div>}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  {items.length === 0 ? (
                    <div style={{ background: BG2, borderRadius: 10, padding: 10, textAlign: 'center', fontSize: 12, color: DIM, border: `1px dashed ${BORD}` }}>
                      Nothing logged
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {items.map(f => (
                        <div key={(f as { id: string }).id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '6px 0', borderBottom: `1px solid ${BORD}` }}>
                          <p style={{ fontSize: 12, color: TXT, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(f as { name: string }).name}
                          </p>
                          {f.calories != null && (
                            <span style={{ fontSize: 11, color: MUTED, flexShrink: 0, marginLeft: 8 }}>{Math.round(f.calories)} kcal</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Nutrition coach */}
        <div style={{ ...CARD, background: `linear-gradient(135deg,#0e1f2f,${BG2})`, borderColor: '#1a3040' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${GREEN}18`, border: `1px solid ${GREEN}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>✦</div>
            <div>
              <div style={{ fontSize: 10, color: GREEN, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Nutrition Coach</div>
              <div style={{ fontSize: 13, color: '#b0c4d4', lineHeight: 1.7 }}>
                {foodCal < 300
                  ? 'Start logging meals to track your nutrition. Use the AI command — type "had 2 rotis and dal" to log instantly.'
                  : foodProt < protTarget * 0.4
                    ? <><span style={{ color: AMBER }}>Protein is critically low</span> — aim for protein-rich foods before dinner. Carbs and fat look balanced.</>
                    : 'Calorie intake on track. Keep eating balanced meals and stay hydrated throughout the day.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── INSIGHTS TAB ─────────────────────────────────────────────────────────────
  function InsightsTab() {
    return d ? (
      <HealthInsights dashboard={d} recentEntries={entries} />
    ) : (
      <div style={{ ...CARD, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', textAlign: 'center' }}>
        <Zap size={36} color={MUTED} style={{ marginBottom: 10 }} />
        <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>No data to show insights yet. Start logging!</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 767px) {
          .hp-main-grid  { grid-template-columns: 1fr !important; }
          .hp-span-all   { grid-column: span 1 !important; }
          .hp-tasks-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .hp-metrics-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .hp-weekly-stats { grid-template-columns: repeat(3,1fr) !important; }
        }
      `}</style>

      <DashboardTab />

      <LogHealthModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        initial={dashboard?.todayEntry}
        onSave={addHealthEntry}
      />
      <AddWorkoutModal
        open={workoutOpen}
        onClose={() => setWorkoutOpen(false)}
        onSave={addWorkout}
      />
    </div>
  );
}
