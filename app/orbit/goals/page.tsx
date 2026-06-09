'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, Target, CheckCircle2, Zap, X,
  Repeat, Clock, ListChecks, CheckSquare, AlertCircle,
  LayoutDashboard, Play, Settings, Pause, RotateCcw, Trash2, Pencil,
  Trophy, Wallet, Heart, Briefcase, BookOpen, User, Flag,
} from 'lucide-react';
import { toast } from '@/components/Toast';
import Confetti from '@/components/Confetti';

// ── Types ─────────────────────────────────────────────────────────────────────
type GoalMilestone = { id: string; title: string; horizon: string; isCompleted: boolean };
type GoalProcess   = { id: string; title: string; frequency: string };
type Goal = {
  id: string; title: string; category: string; why?: string | null;
  metric?: string | null; deadline?: string | null; status: string;
  milestones: GoalMilestone[]; processes: GoalProcess[];
  createdAt: string;
};

// ── Theme ─────────────────────────────────────────────────────────────────────
const BG     = '#060b14';
const BG2    = '#0a0f1e';
const BG3    = '#0e1623';
const BORD   = '#1a2a3a';
const GREEN  = '#00E5A0';
const BLUE   = '#5BE4FF';
const PURPLE = '#A78BFA';
const AMBER  = '#F9A44A';
const RED    = '#FF6B6B';
const INDIGO = '#6366F1';
const TXT    = '#e2e8f0';
const MUTED  = '#7a8ba0';
const DIM    = '#3a5060';
const ACCENT = PURPLE;
const CARD_BG   = 'rgba(255,255,255,0.04)';
const CARD_BORD = 'rgba(255,255,255,0.08)';

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

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = ['Finance', 'Health', 'Career', 'Learning', 'Personal', 'Other'];

const CAT_COLORS: Record<string, string> = {
  Finance: GREEN, Health: RED, Career: BLUE,
  Learning: INDIGO, Personal: AMBER, Other: PURPLE,
};

const CAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Finance: Wallet, Health: Heart, Career: Briefcase,
  Learning: BookOpen, Personal: User, Other: Flag,
};

const STATUS_STYLES: Record<string, { label: string; textColor: string; bgColor: string }> = {
  active:    { label: 'Active',    textColor: GREEN,  bgColor: `${GREEN}18` },
  completed: { label: 'Completed', textColor: BLUE,   bgColor: `${BLUE}18` },
  paused:    { label: 'Paused',    textColor: AMBER,  bgColor: `${AMBER}18` },
};

const HABIT_COLORS   = ['#78716C','#6B7280','#7C3AED','#2563EB','#059669','#D97706','#DB2777','#4F46E5','#EF4444','#EC4899','#F97316','#14B8A6'];
const HABIT_EMOJIS   = ['✅','🔥','💪','📚','🧘','🏃','💧','🥗','😴','🎯','✍️','🎵','🎨','🏋️','☕','🚶','🧠','💊','🌅','🛌','🌿','❤️','⭐','🎓','💼','🏊','🚴','🧹','🪴','🎮','📝','🌞','💰','🙏','🎸','📱'];
const HABIT_TIME_OPTIONS = [
  { value: 'all_day', label: 'All Day',  time: ''        },
  { value: 'morning', label: 'Morning',  time: '9:00 AM' },
  { value: 'noon',    label: 'Noon',     time: '12:00 PM'},
  { value: 'evening', label: 'Evening',  time: '4:00 PM' },
  { value: 'night',   label: 'Night',    time: '8:00 PM' },
  { value: 'custom',  label: 'Custom',   time: ''        },
];
const HABIT_WEEK_DAYS = [
  {label:'Su',value:0},{label:'M',value:1},{label:'Tu',value:2},
  {label:'W',value:3},{label:'Th',value:4},{label:'F',value:5},{label:'Sa',value:6},
];
const REPEAT_OPTIONS   = [{value:'',label:'No repeat'},{value:'daily',label:'Daily'},{value:'weekly',label:'Weekly'},{value:'weekdays',label:'Weekdays'},{value:'weekends',label:'Weekends'},{value:'monthly',label:'Monthly'},{value:'yearly',label:'Yearly'}];
const REMINDER_OPTIONS = [{value:'',label:'No reminder'},{value:'on-time',label:'On time'},{value:'5m',label:'5 min before'},{value:'30m',label:'30 min before'},{value:'1h',label:'1 hour before'},{value:'1d',label:'1 day before'}];
const PRIORITY_OPTIONS = [{value:'none',label:'None',color:'bg-gray-100 text-gray-600'},{value:'low',label:'Low',color:'bg-blue-50 text-blue-600'},{value:'medium',label:'Medium',color:'bg-amber-50 text-amber-600'},{value:'high',label:'High',color:'bg-rose-50 text-rose-600'}];

// ── Shared helpers ─────────────────────────────────────────────────────────────
function Bar({ pct, color, h = 5 }: { pct: number; color: string; h?: number }) {
  return (
    <div style={{ height: h, borderRadius: 99, background: '#151e30', overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(pct * 100, 100)}%`, height: '100%', borderRadius: 99,
        background: color, boxShadow: `0 0 8px ${color}55`, transition: 'width 1.2s ease' }} />
    </div>
  );
}

function Bdg({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 10, color, background: color + '18', borderRadius: 6,
      padding: '2px 8px', fontWeight: 700, border: `1px solid ${color}33`, letterSpacing: '0.06em' }}>
      {label}
    </span>
  );
}

// ── Radial Pct ring ───────────────────────────────────────────────────────────
function RadialPct({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const r = 22, cx = 28, cy = 28, sw = 4, circ = 2 * Math.PI * r;
  const scale = size / 56;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#151e30" strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${circ * Math.min(pct, 1)} ${circ * (1 - Math.min(pct, 1))}`}
        strokeDashoffset={circ * 0.25}
        style={{ filter: `drop-shadow(0 0 4px ${color}66)` }} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#fff" fontSize={`${11 / scale}`} fontWeight="700" fontFamily="Georgia,serif">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────
function GoalCard({ goal, onEdit, onDelete, onComplete, onPause, onToggleMilestone, compact }: {
  goal: Goal;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onPause: (id: string, status: string) => void;
  onToggleMilestone: (goalId: string, ms: GoalMilestone) => void;
  compact?: boolean;
}) {
  const catColor = CAT_COLORS[goal.category] ?? PURPLE;
  const status   = STATUS_STYLES[goal.status] ?? STATUS_STYLES.active;
  const done     = goal.milestones.filter(m => m.isCompleted).length;
  const total    = goal.milestones.length;
  const pct      = total > 0 ? Math.round((done / total) * 100) : 0;
  const today    = new Date().toISOString().split('T')[0];
  const isOverdue = goal.deadline && goal.deadline < today && goal.status === 'active';
  const daysLeft  = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86_400_000)
    : null;
  const CatIcon = CAT_ICONS[goal.category];

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, marginBottom: 12,
      background: `linear-gradient(145deg,${BG3} 0%,${BG2} 100%)`,
      border: `1px solid ${BORD}` }}>

      {/* Top accent line */}
      <div style={{ height: 2, background: `linear-gradient(90deg,${catColor},${catColor}88,transparent)` }} />
      {/* Left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 2, bottom: 0, width: 3, borderRadius: '0 0 0 16px',
        background: `linear-gradient(180deg,${catColor},${catColor}44)` }} />

      <div style={{ padding: '14px 16px 14px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ flex: 1, marginRight: 8 }}>
            {/* Chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 7 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20,
                background: catColor + '22', fontSize: 11, fontWeight: 600, color: catColor }}>
                {CatIcon && <CatIcon className="w-2.5 h-2.5" />}
                {goal.category}
              </span>
              <span style={{ padding: '3px 8px', borderRadius: 20, background: status.bgColor, fontSize: 11, fontWeight: 600, color: status.textColor }}>
                {status.label}
              </span>
              {isOverdue && (
                <span style={{ padding: '3px 8px', borderRadius: 20, background: `${RED}18`, fontSize: 11, fontWeight: 600, color: RED }}>Overdue</span>
              )}
              {daysLeft !== null && !isOverdue && goal.status === 'active' && (
                <span style={{ padding: '3px 8px', borderRadius: 20, background: CARD_BG, fontSize: 11, color: MUTED }}>
                  {daysLeft <= 0 ? 'Due today' : `${daysLeft}d left`}
                </span>
              )}
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: TXT, margin: 0 }}>{goal.title}</p>
            {goal.why && !compact && (
              <p style={{ fontSize: 12, color: MUTED, marginTop: 3, fontStyle: 'italic',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
                &ldquo;{goal.why}&rdquo;
              </p>
            )}
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => onEdit(goal)} title="Edit"
              style={{ padding: '5px 6px', borderRadius: 8, background: `${PURPLE}18`, border: 'none', cursor: 'pointer' }}>
              <Pencil className="w-3 h-3" style={{ color: PURPLE }} />
            </button>
            {goal.status !== 'completed' && (
              <button onClick={() => onPause(goal.id, goal.status)} title={goal.status === 'paused' ? 'Resume' : 'Pause'}
                style={{ padding: '5px 6px', borderRadius: 8, background: goal.status === 'paused' ? `${AMBER}18` : CARD_BG, border: 'none', cursor: 'pointer' }}>
                {goal.status === 'paused'
                  ? <RotateCcw className="w-3 h-3" style={{ color: AMBER }} />
                  : <Pause className="w-3 h-3" style={{ color: MUTED }} />}
              </button>
            )}
            {goal.status !== 'completed' && (
              <button onClick={() => onComplete(goal.id)} title="Mark complete"
                style={{ padding: '5px 6px', borderRadius: 8, background: `${GREEN}12`, border: 'none', cursor: 'pointer' }}>
                <CheckCircle2 className="w-3 h-3" style={{ color: GREEN }} />
              </button>
            )}
            <button onClick={() => onDelete(goal.id)} title="Delete"
              style={{ padding: '5px 6px', borderRadius: 8, background: `${RED}12`, border: 'none', cursor: 'pointer' }}>
              <Trash2 className="w-3 h-3" style={{ color: RED }} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div style={{ marginBottom: compact ? 0 : 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Progress · {done}/{total} milestones</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: catColor }}>{pct}%</span>
            </div>
            <Bar pct={pct / 100} color={catColor} h={5} />
          </div>
        )}

        {/* Deadline + meta badges */}
        {!compact && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {goal.deadline && <Bdg label={`📅 ${goal.deadline}`} color={DIM} />}
            {daysLeft !== null && goal.status !== 'completed' && (
              <Bdg label={`${Math.max(0, daysLeft)}d left`} color={daysLeft < 90 ? AMBER : DIM} />
            )}
            {goal.processes.length > 0 && <Bdg label={`⚡ ${goal.processes.length} processes`} color={BLUE} />}
            {total > 0 && <Bdg label={`✓ ${done}/${total} milestones`} color={PURPLE} />}
          </div>
        )}

        {/* Milestones (non-compact) */}
        {!compact && goal.milestones.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {goal.milestones.map(ms => (
              <button key={ms.id} onClick={() => onToggleMilestone(goal.id, ms)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '2px 0' }}>
                {ms.isCompleted
                  ? <CheckCircle2 className="w-3.5 h-3.5 flex-none" style={{ color: GREEN }} />
                  : <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex-none" />}
                <span style={{ flex: 1, fontSize: 12, color: ms.isCompleted ? MUTED : 'rgba(255,255,255,0.7)', textDecoration: ms.isCompleted ? 'line-through' : 'none' }} className="truncate">
                  {ms.title}
                </span>
                <span style={{ fontSize: 10, color: MUTED }}>
                  {ms.horizon === '1m' ? '1mo' : ms.horizon === '3m' ? '3mo' : '6mo'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Processes (non-compact) */}
        {!compact && goal.processes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
            {goal.processes.map(p => (
              <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20,
                background: `${PURPLE}12`, fontSize: 11, color: PURPLE }}>
                <Zap className="w-2.5 h-2.5" />
                {p.title} · {p.frequency}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Wizard types ──────────────────────────────────────────────────────────────
type WizardData = {
  title: string; category: string; why: string; metric: string; deadline: string;
  milestone1m: string; milestone3m: string; milestone6m: string;
  process1: string; process1freq: string;
  process2: string; process2freq: string;
};

// ── Post-Goal Wizard ──────────────────────────────────────────────────────────
function PostGoalWizard({ goal, onDone }: { goal: Goal; onDone: () => void }) {
  type PWStep = 'choice' | 'habit' | 'task';
  const [step, setStep]             = useState<PWStep>('choice');
  const [saving, setSaving]         = useState(false);
  const [dupWarning, setDupWarning] = useState<string | null>(null);
  const [habitName, setHabitName]   = useState('');
  const [habitEmoji, setHabitEmoji] = useState('🎯');
  const [habitColor, setHabitColor] = useState('#6366F1');
  const [habitTimeOfDay, setHabitTimeOfDay] = useState('all_day');
  const [habitCustomTime, setHabitCustomTime] = useState('09:00');
  const [habitDays, setHabitDays]   = useState<number[]>([0,1,2,3,4,5,6]);
  const [habitSaved, setHabitSaved] = useState(false);
  const [taskTitle, setTaskTitle]   = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskDueTime, setTaskDueTime] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskRepeat, setTaskRepeat] = useState('');
  const [taskReminder, setTaskReminder] = useState('');
  const [taskSaved, setTaskSaved]   = useState(false);

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

  const toggleHabitDay = (day: number) =>
    setHabitDays(prev => prev.includes(day) ? prev.length === 1 ? prev : prev.filter(d => d !== day) : [...prev, day].sort((a,b)=>a-b));

  const checkHabitDup = async (name: string) => {
    if (!name.trim()) { setDupWarning(null); return; }
    try {
      const res = await fetch('/api/habits');
      if (!res.ok) return;
      const habits = await res.json();
      const dup = habits.find((h: { name: string }) => h.name.trim().toLowerCase() === name.trim().toLowerCase());
      setDupWarning(dup ? `A habit named "${dup.name}" already exists.` : null);
    } catch {}
  };

  const checkTaskDup = async (title: string) => {
    if (!title.trim()) { setDupWarning(null); return; }
    try {
      const res = await fetch('/api/tasks?smartList=all');
      if (!res.ok) return;
      const tasks = await res.json();
      const dup = tasks.find((t: { title: string }) => t.title.trim().toLowerCase() === title.trim().toLowerCase());
      setDupWarning(dup ? `A task named "${dup.title}" already exists.` : null);
    } catch {}
  };

  const handleAddHabit = async () => {
    if (!habitName.trim()) { toast('Habit name is required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/habits', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: habitName.trim(), color: habitColor, iconEmoji: habitEmoji, daysOfWeek: habitDays, timeOfDay: habitTimeOfDay, customTime: habitTimeOfDay === 'custom' ? habitCustomTime : null }) });
      if (!res.ok) throw new Error('Failed to create habit');
      setHabitSaved(true);
      toast('Habit created!');
    } catch (err: unknown) { toast((err as Error)?.message || 'Failed to create habit', 'error'); }
    finally { setSaving(false); }
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim()) { toast('Task title is required', 'error'); return; }
    setSaving(true);
    try {
      let listId: string | null = null;
      try {
        const listsRes = await fetch('/api/task-lists');
        if (listsRes.ok) {
          const lists = await listsRes.json();
          const existing = Array.isArray(lists) ? lists.find((l: { name: string; id: string }) => l.name.toLowerCase() === 'goals') : null;
          if (existing) listId = existing.id;
          else { const cr = await fetch('/api/task-lists', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name:'Goals', emoji:'🎯', color:'#6366F1' }) }); if (cr.ok) listId = (await cr.json()).id; }
        }
      } catch {}
      const tags: string[] = [];
      if (taskRepeat) tags.push(`repeat:${taskRepeat}`);
      if (taskReminder) tags.push(`reminder:${taskReminder}`);
      const res = await fetch('/api/tasks', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title: taskTitle.trim(), notes:`Related to goal: ${goal.title}`, priority: taskPriority, dueDate: taskDueDate||null, dueTime: taskDueTime||null, tags, listId }) });
      if (!res.ok) throw new Error('Failed to create task');
      setTaskSaved(true);
      toast('Task created!');
    } catch (err: unknown) { toast((err as Error)?.message || 'Failed to create task', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-h-[90vh] sm:max-h-none rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col sm:max-w-md">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex-none">
          <div>
            <p className="font-semibold text-gray-900 text-sm sm:text-base">Goal Created!</p>
            <p className="text-xs text-gray-500 truncate max-w-[180px] sm:max-w-[240px]">{goal.title}</p>
          </div>
          <button onClick={onDone} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex-none"><X className="h-4 w-4" /></button>
        </div>
        {step === 'choice' && (
          <div className="px-4 sm:px-6 py-5 sm:py-6 space-y-4 overflow-y-auto">
            <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 px-4 py-3"><CheckCircle2 className="h-5 w-5 text-indigo-500 flex-none" /><p className="text-sm text-indigo-700 font-medium">Goal saved! Build momentum now.</p></div>
            <p className="text-sm font-semibold text-gray-700">What would you like to add?</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setStep('habit'); setDupWarning(null); }} className="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-indigo-100 bg-indigo-50 px-4 py-5 text-center hover:border-indigo-300 hover:bg-indigo-100 transition">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600"><Repeat className="h-5 w-5 text-white" /></div>
                <div><p className="text-sm font-semibold text-gray-900">Add a Habit</p><p className="text-xs text-gray-500 mt-0.5">Recurring routine</p></div>
              </button>
              <button onClick={() => { setStep('task'); setDupWarning(null); }} className="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-blue-100 bg-blue-50 px-4 py-5 text-center hover:border-blue-300 hover:bg-blue-100 transition">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600"><ListChecks className="h-5 w-5 text-white" /></div>
                <div><p className="text-sm font-semibold text-gray-900">Add a Task</p><p className="text-xs text-gray-500 mt-0.5">One-time action</p></div>
              </button>
            </div>
            <button onClick={onDone} className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition">Skip for now</button>
          </div>
        )}
        {step === 'habit' && (
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-5 space-y-5">
              {habitSaved ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <span className="text-5xl">{habitEmoji}</span>
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 -mt-2" />
                  <p className="font-semibold text-gray-900">Habit Created!</p>
                </div>
              ) : (
                <>
                  <div><label className={labelCls}>Habit Name *</label><input autoFocus className={inputCls} placeholder="e.g. Morning run..." value={habitName} onChange={e=>{setHabitName(e.target.value);setDupWarning(null);}} onBlur={()=>checkHabitDup(habitName)} />{dupWarning&&<div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600"><AlertCircle className="h-3.5 w-3.5 flex-none"/>{dupWarning}</div>}</div>
                  <div><label className={labelCls}>Icon</label><div className="grid grid-cols-8 gap-1.5 max-h-28 overflow-y-auto pr-1">{HABIT_EMOJIS.map(e=><button key={e} type="button" onClick={()=>setHabitEmoji(e)} className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition ${habitEmoji===e?'bg-amber-50 ring-2 ring-amber-400':'bg-gray-50 hover:bg-gray-100'}`}>{e}</button>)}</div></div>
                  <div><label className={labelCls}>Color</label><div className="flex gap-2 flex-wrap">{HABIT_COLORS.map(c=><button key={c} type="button" onClick={()=>setHabitColor(c)} style={{backgroundColor:c}} className={`h-8 w-8 rounded-full transition ${habitColor===c?'ring-2 ring-offset-2 ring-gray-400 scale-110':'hover:scale-105'}`}/>)}</div></div>
                  <div><label className={labelCls}>Time of Day</label><div className="grid grid-cols-3 gap-1.5">{HABIT_TIME_OPTIONS.map(opt=><button key={opt.value} type="button" onClick={()=>setHabitTimeOfDay(opt.value)} className={`flex flex-col items-center justify-center rounded-xl px-2 py-2 text-xs font-medium transition border ${habitTimeOfDay===opt.value?'bg-amber-50 border-amber-400 text-amber-700':'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}><span>{opt.label}</span>{opt.time&&<span className="text-[10px] mt-0.5 opacity-70">{opt.time}</span>}</button>)}</div>{habitTimeOfDay==='custom'&&<input type="time" value={habitCustomTime} onChange={e=>setHabitCustomTime(e.target.value)} className={`mt-2 ${inputCls}`}/>}</div>
                  <div><label className={labelCls}>Days of Week</label><div className="flex gap-1.5">{HABIT_WEEK_DAYS.map(({label,value})=><button key={value} type="button" onClick={()=>toggleHabitDay(value)} className={`flex-1 flex items-center justify-center h-9 rounded-xl text-xs font-bold transition border ${habitDays.includes(value)?'bg-amber-500 border-amber-500 text-white':'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'}`}>{label}</button>)}</div></div>
                </>
              )}
            </div>
            <div className="flex gap-2 px-6 pb-6">
              {!habitSaved&&<button onClick={()=>setStep('choice')} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Back</button>}
              {habitSaved?(<><button onClick={()=>{setStep('task');setDupWarning(null);}} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition">Add a Task too?</button><button onClick={onDone} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition">Done</button></>):(<button onClick={handleAddHabit} disabled={saving} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50">{saving?'Saving...':'Create Habit'}</button>)}
            </div>
          </div>
        )}
        {step === 'task' && (
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-5 space-y-4">
              {taskSaved ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center"><CheckSquare className="h-12 w-12 text-blue-500"/><p className="font-semibold text-gray-900">Task Created!</p></div>
              ) : (
                <>
                  <div><label className={labelCls}>Task Title *</label><input autoFocus className={inputCls} placeholder="e.g. Sign up for a gym..." value={taskTitle} onChange={e=>{setTaskTitle(e.target.value);setDupWarning(null);}} onBlur={()=>checkTaskDup(taskTitle)}/>{dupWarning&&<div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600"><AlertCircle className="h-3.5 w-3.5 flex-none"/>{dupWarning}</div>}</div>
                  <div className="grid grid-cols-2 gap-3"><div><label className={labelCls}>Due Date</label><input type="date" className={inputCls} value={taskDueDate} onChange={e=>setTaskDueDate(e.target.value)}/></div><div><label className={labelCls}>Due Time</label><div className="relative"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/><input type="time" className={`${inputCls} pl-9`} value={taskDueTime} onChange={e=>setTaskDueTime(e.target.value)}/></div></div></div>
                  <div><label className={labelCls}>Priority</label><div className="grid grid-cols-4 gap-1.5">{PRIORITY_OPTIONS.map(opt=><button key={opt.value} type="button" onClick={()=>setTaskPriority(opt.value)} className={`rounded-xl py-2 text-xs font-semibold transition border ${taskPriority===opt.value?`${opt.color} border-current`:'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>{opt.label}</button>)}</div></div>
                  <div className="grid grid-cols-2 gap-3"><div><label className={labelCls}>Repeat</label><select className={inputCls} value={taskRepeat} onChange={e=>setTaskRepeat(e.target.value)}>{REPEAT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div><div><label className={labelCls}>Reminder</label><select className={inputCls} value={taskReminder} onChange={e=>setTaskReminder(e.target.value)}>{REMINDER_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div></div>
                </>
              )}
            </div>
            <div className="flex gap-2 px-6 pb-6">
              {!taskSaved&&<button onClick={()=>setStep(habitSaved?'habit':'choice')} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Back</button>}
              {taskSaved?<button onClick={onDone} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition">All Done!</button>:<button onClick={handleAddTask} disabled={saving} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50">{saving?'Saving...':'Create Task'}</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Goal Modal ────────────────────────────────────────────────────────────
function AddGoalModal({ onClose, onCreated }: { onClose: () => void; onCreated: (g: Goal) => void }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<WizardData>({ title:'', category:'Personal', why:'', metric:'', deadline:'', milestone1m:'', milestone3m:'', milestone6m:'', process1:'', process1freq:'daily', process2:'', process2freq:'weekly' });
  const set = (k: keyof WizardData, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

  const handleSubmit = async () => {
    if (!data.title.trim()) { toast('Goal title is required', 'error'); return; }
    setSaving(true);
    try {
      const milestones = [data.milestone6m.trim()&&{title:data.milestone6m.trim(),horizon:'6m'},data.milestone3m.trim()&&{title:data.milestone3m.trim(),horizon:'3m'},data.milestone1m.trim()&&{title:data.milestone1m.trim(),horizon:'1m'}].filter(Boolean);
      const processes = [data.process1.trim()&&{title:data.process1.trim(),frequency:data.process1freq},data.process2.trim()&&{title:data.process2.trim(),frequency:data.process2freq}].filter(Boolean);
      const res = await fetch('/api/goals', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title:data.title.trim(), category:data.category, why:data.why.trim()||null, metric:data.metric.trim()||null, deadline:data.deadline||null, milestones, processes }) });
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error||'Failed to create goal'); }
      const goal = await res.json();
      onCreated(goal);
    } catch (err: unknown) { toast((err as Error)?.message||'Failed to create goal', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div><p className="font-semibold text-gray-900">New Goal</p><p className="text-xs text-gray-500">Step {step} of 4</p></div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"><X className="h-4 w-4"/></button>
        </div>
        <div className="flex gap-1 px-6 pt-4">{[1,2,3,4].map(s=><div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s<=step?'bg-indigo-600':'bg-gray-100'}`}/>)}</div>
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {step===1&&(<><div><label className={labelCls}>Goal Title *</label><input className={inputCls} placeholder="e.g. Run a marathon, Save ₹5 lakhs" value={data.title} onChange={e=>set('title',e.target.value)} autoFocus/></div><div><label className={labelCls}>Category</label><div className="flex flex-wrap gap-2">{CATEGORIES.map(cat=><button key={cat} type="button" onClick={()=>set('category',cat)} className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${data.category===cat?'bg-indigo-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat}</button>)}</div></div></>)}
          {step===2&&(<><div><label className={labelCls}>Why is this goal important?</label><textarea className={`${inputCls} resize-none`} rows={3} placeholder="e.g. To feel confident, gain financial freedom..." value={data.why} onChange={e=>set('why',e.target.value)}/></div><div><label className={labelCls}>Success Metric</label><input className={inputCls} placeholder="e.g. Complete 42km race, ₹5L in savings" value={data.metric} onChange={e=>set('metric',e.target.value)}/></div><div><label className={labelCls}>Target Deadline</label><input type="date" className={inputCls} value={data.deadline} onChange={e=>set('deadline',e.target.value)}/></div></>)}
          {step===3&&(<><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Milestones</p>{[{key:'milestone6m' as keyof WizardData,label:'6 Month',ph:'Where will you be in 6 months?'},{key:'milestone3m' as keyof WizardData,label:'3 Month',ph:'Where will you be in 3 months?'},{key:'milestone1m' as keyof WizardData,label:'1 Month',ph:'What will you achieve this month?'}].map(({key,label,ph})=><div key={key}><label className="block text-xs text-gray-500 mb-1">{label}</label><input className={inputCls} placeholder={ph} value={data[key]} onChange={e=>set(key,e.target.value)}/></div>)}<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4">Recurring Processes</p>{([{key:'process1',freqKey:'process1freq',n:1},{key:'process2',freqKey:'process2freq',n:2}] as const).map(({key,freqKey,n})=><div key={n} className="flex gap-2"><input className={`${inputCls} flex-1`} placeholder={`Process ${n} (e.g. Run 5km)`} value={data[key as keyof WizardData]} onChange={e=>set(key as keyof WizardData,e.target.value)}/><select className="rounded-xl border border-gray-200 px-2 py-2 text-sm focus:border-indigo-400 focus:outline-none bg-white" value={data[freqKey as keyof WizardData]} onChange={e=>set(freqKey as keyof WizardData,e.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>)}</>)}
          {step===4&&(<><p className="text-lg font-semibold text-gray-900 mb-1">Review & Confirm</p><div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white"><div className="text-xs font-medium opacity-75 mb-1">{data.category}</div><div className="text-xl font-bold mb-2">{data.title||'—'}</div>{data.why&&<div className="text-sm opacity-80 italic mb-2">&ldquo;{data.why}&rdquo;</div>}{data.metric&&<div className="text-sm opacity-90">📏 {data.metric}</div>}{data.deadline&&<div className="text-sm opacity-90">📅 Due {data.deadline}</div>}</div>{(data.milestone6m||data.milestone3m||data.milestone1m)&&<div className="rounded-xl border border-gray-100 p-3 space-y-1.5"><p className="text-xs font-semibold text-gray-500">Milestones</p>{data.milestone6m&&<p className="text-sm text-gray-700">🏁 6M: {data.milestone6m}</p>}{data.milestone3m&&<p className="text-sm text-gray-700">🏁 3M: {data.milestone3m}</p>}{data.milestone1m&&<p className="text-sm text-gray-700">🏁 1M: {data.milestone1m}</p>}</div>}</>)}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          {step>1&&<button type="button" onClick={()=>setStep(s=>s-1)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Back</button>}
          {step<4?<button type="button" onClick={()=>{if(step===1&&!data.title.trim()){toast('Please enter a goal title','error');return;}setStep(s=>s+1);}} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition">Next</button>:<button type="button" onClick={handleSubmit} disabled={saving} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50">{saving?'Creating...':'Create Goal'}</button>}
        </div>
      </div>
    </div>
  );
}


// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GoalsPage() {
  const [goals, setGoals]               = useState<Goal[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [catFilter, setCatFilter]       = useState('All');
  const [postGoal, setPostGoal]         = useState<Goal | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [editGoal, setEditGoal]         = useState<Goal | null>(null);
  const wasEmptyRef                     = useRef(false);

  // ── Delete cascade state ──────────────────────────────────────────────────
  const [deleteTarget,       setDeleteTarget]       = useState<Goal | null>(null);
  const [deleteLinkedHabits, setDeleteLinkedHabits] = useState(false);
  const [deleteLinkedTasks,  setDeleteLinkedTasks]  = useState(false);
  const [linkedHabits,       setLinkedHabits]       = useState<{ id: string; name: string }[]>([]);
  const [linkedTasks,        setLinkedTasks]        = useState<{ id: string; title: string }[]>([]);
  const [deleteSearching,    setDeleteSearching]    = useState(false);
  const [deleteLoading,      setDeleteLoading]      = useState(false);

  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) { setGoals(data); wasEmptyRef.current = data.length === 0; } })
      .catch(() => toast('Failed to load goals', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const activeGoals    = useMemo(() => goals.filter(g => g.status === 'active'),    [goals]);
  const completedGoals = useMemo(() => goals.filter(g => g.status === 'completed'), [goals]);
  const pausedGoals    = useMemo(() => goals.filter(g => g.status === 'paused'),    [goals]);

  const avgProgress = useMemo(() =>
    activeGoals.length
      ? Math.round(activeGoals.reduce((s, g) => {
          const ms = g.milestones;
          return s + (ms.length ? ms.filter(m => m.isCompleted).length / ms.length : 0);
        }, 0) / activeGoals.length * 100)
      : 0,
  [activeGoals]);

  const filteredGoals = useMemo(() =>
    catFilter === 'All' ? goals : goals.filter(g => g.category === catFilter),
  [goals, catFilter]);

  const catStats = useMemo(() =>
    CATEGORIES.map(cat => {
      const list = goals.filter(g => g.category === cat);
      const completed = list.filter(g => g.status === 'completed').length;
      const pct = list.length ? Math.round((completed / list.length) * 100) : 0;
      return { cat, total: list.length, active: list.filter(g => g.status === 'active').length, completed, pct };
    }).filter(s => s.total > 0),
  [goals]);

  const totalProcesses = useMemo(() => goals.reduce((s, g) => s + g.processes.length, 0), [goals]);

  const handleDelete = async (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    setDeleteTarget(goal);
    setDeleteLinkedHabits(false);
    setDeleteLinkedTasks(false);
    setLinkedHabits([]);
    setLinkedTasks([]);
    setDeleteSearching(true);
    try {
      const [habitsRes, tasksRes] = await Promise.all([
        fetch('/api/habits'),
        fetch('/api/tasks?smartList=all'),
      ]);
      const habits: { id: string; name: string }[] = habitsRes.ok ? await habitsRes.json() : [];
      const tasks: { id: string; title: string; notes?: string }[] = tasksRes.ok ? await tasksRes.json() : [];
      const processNames = new Set(goal.processes.map(p => p.title.trim().toLowerCase()));
      setLinkedHabits(
        processNames.size > 0
          ? habits.filter(h => processNames.has(h.name.trim().toLowerCase()))
          : [],
      );
      setLinkedTasks(
        tasks.filter(t => t.notes?.includes(`Related to goal: ${goal.title}`)),
      );
    } finally {
      setDeleteSearching(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await fetch(`/api/goals/${deleteTarget.id}`, { method: 'DELETE' });
      if (deleteLinkedHabits && linkedHabits.length > 0) {
        await Promise.all(linkedHabits.map(h => fetch(`/api/habits/${h.id}`, { method: 'DELETE' })));
      }
      if (deleteLinkedTasks && linkedTasks.length > 0) {
        await Promise.all(linkedTasks.map(t => fetch(`/api/tasks/${t.id}`, { method: 'DELETE' })));
      }
      setGoals(prev => prev.filter(g => g.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast('Goal deleted');
    } catch { toast('Failed to delete goal', 'error'); }
    finally { setDeleteLoading(false); }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: 'completed' }) });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updated } : g));
      toast('Goal marked complete! 🎉');
    } catch { toast('Failed to update goal', 'error'); }
  };

  const handlePause = async (id: string, status: string) => {
    const newStatus = status === 'paused' ? 'active' : 'paused';
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: newStatus }) });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updated } : g));
    } catch { toast('Failed to update goal', 'error'); }
  };

  const handleToggleMilestone = async (goalId: string, ms: GoalMilestone) => {
    try {
      const res = await fetch(`/api/goals/${goalId}/milestones/${ms.id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ isCompleted: !ms.isCompleted }) });
      if (!res.ok) throw new Error();
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, milestones: g.milestones.map(m => m.id === ms.id ? { ...m, isCompleted: !m.isCompleted } : m) } : g));
    } catch { toast('Failed to update milestone', 'error'); }
  };

  const sharedProps = { onEdit: setEditGoal, onDelete: handleDelete, onComplete: handleComplete, onPause: handlePause, onToggleMilestone: handleToggleMilestone };

  // ── OVERVIEW TAB ──────────────────────────────────────────────────────────────
  function OverviewTab() {
    return (
      <div>
        <style>{`
          @media (max-width: 639px) {
            .go-stats-grid { grid-template-columns: repeat(2,1fr) !important; gap: 10px !important; }
            .go-progress-strip { flex-direction: column !important; gap: 16px !important; }
            .go-progress-rings { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            .go-goal-coach { max-width: 100% !important; }
          }
        `}</style>
        {/* 4-stat row */}
        <div className="go-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { l: 'Total Goals', v: goals.length,         c: INDIGO, i: '◎' },
            { l: 'Active',      v: activeGoals.length,   c: GREEN,  i: '▶' },
            { l: 'Completed',   v: completedGoals.length,c: AMBER,  i: '✓' },
            { l: 'Processes',   v: totalProcesses,       c: BLUE,   i: '⚡' },
          ].map(s => (
            <div key={s.l} style={{ ...CARD, display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.c + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: s.c, flexShrink: 0 }}>{s.i}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.c, fontFamily: 'Georgia,serif', lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{s.l}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress rings strip + Goal coach */}
        {activeGoals.length > 0 && (
          <div className="go-progress-strip" style={{ ...CARD, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 32, padding: '20px 28px' }}>
            <div>
              <p style={TAG}>Progress at a Glance</p>
              <p style={{ fontSize: 12, color: DIM }}>Avg: <span style={{ color: ACCENT, fontWeight: 700 }}>{avgProgress}%</span></p>
            </div>
            <div style={{ display: 'flex', gap: 28, flex: 1 }}>
              {activeGoals.map(g => {
                const done  = g.milestones.filter(m => m.isCompleted).length;
                const total = g.milestones.length;
                const pct   = total > 0 ? done / total : 0;
                const cc    = CAT_COLORS[g.category] ?? PURPLE;
                return (
                  <div key={g.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <RadialPct pct={pct} color={cc} size={64} />
                    <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textAlign: 'center', maxWidth: 72 }} className="truncate">{g.title}</div>
                  </div>
                );
              })}
            </div>
            {/* Goal coach */}
            <div style={{ ...CARD, background: `linear-gradient(135deg,#0e1f2f,${BG2})`, borderColor: '#1a3040', padding: '16px 20px', maxWidth: 300, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14 }}>✦</span>
                <div>
                  <div style={{ fontSize: 10, color: INDIGO, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Goal Coach</div>
                  <div style={{ fontSize: 12, color: '#b0c4d4', lineHeight: 1.6 }}>
                    {activeGoals.length} active, {completedGoals.length} completed. Focus on daily processes — consistency compounds.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['All', ...CATEGORIES].map(f => {
            const color  = f === 'All' ? ACCENT : (CAT_COLORS[f] ?? ACCENT);
            const active = catFilter === f;
            return (
              <button key={f} onClick={() => setCatFilter(f)}
                style={{ borderRadius: 99, padding: '6px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: active ? `linear-gradient(135deg,${INDIGO},${PURPLE})` : BG2,
                  border: active ? 'none' : `1px solid ${BORD}`,
                  color: active ? '#fff' : MUTED, transition: 'all 0.2s' }}>{f}</button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[1,2,3,4].map(i => <div key={i} className="animate-pulse" style={{ height: 180, borderRadius: 16, background: 'rgba(255,255,255,0.04)' }} />)}
          </div>
        ) : filteredGoals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, background: CARD_BG, border: `1px solid ${CARD_BORD}`, borderRadius: 18 }}>
            <Target className="w-10 h-10 mx-auto mb-3" style={{ color: MUTED }} />
            <p style={{ color: TXT, fontWeight: 600, marginBottom: 4 }}>{catFilter === 'All' ? 'No goals yet' : `No ${catFilter} goals`}</p>
            <p style={{ color: MUTED, fontSize: 13 }}>Tap New Goal to get started</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {filteredGoals.map(g => <GoalCard key={g.id} goal={g} {...sharedProps} />)}
          </div>
        )}
      </div>
    );
  }

  // ── ACTIVE TAB ────────────────────────────────────────────────────────────────
  function ActiveTab() {
    const overdue = activeGoals.filter(g => g.deadline && g.deadline < new Date().toISOString().split('T')[0]);
    return (
      <div>
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>{activeGoals.length} in progress</div>

        {/* Urgency banner */}
        {overdue.length > 0 && (
          <div style={{ background: `${RED}12`, border: `1px solid ${RED}28`, borderRadius: 14, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: RED, margin: '0 0 2px' }}>⚠ {overdue.length} goal{overdue.length > 1 ? 's' : ''} overdue</p>
            <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>Review and take action to stay on track.</p>
          </div>
        )}

        {/* Status overview with radial rings */}
        {activeGoals.length > 0 && (
          <div style={{ ...CARD, marginBottom: 20, padding: '20px 28px' }}>
            <p style={TAG}>Status Overview</p>
            <div style={{ display: 'flex', gap: 0, marginTop: 12 }}>
              {activeGoals.map((g, i) => {
                const done  = g.milestones.filter(m => m.isCompleted).length;
                const total = g.milestones.length;
                const pct   = total > 0 ? done / total : 0;
                const cc    = CAT_COLORS[g.category] ?? PURPLE;
                const daysLeft = g.deadline
                  ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86_400_000)
                  : null;
                return (
                  <div key={g.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    borderRight: i < activeGoals.length - 1 ? `1px solid ${BORD}` : 'none', padding: '0 16px' }}>
                    <RadialPct pct={pct} color={cc} size={64} />
                    <div style={{ fontSize: 12, fontWeight: 600, color: TXT, textAlign: 'center' }}>{g.title}</div>
                    <Bdg label={g.category} color={cc} />
                    {daysLeft !== null && (
                      <div style={{ fontSize: 11, color: daysLeft < 60 ? AMBER : MUTED }}>{Math.max(0, daysLeft)}d left</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Focus insight */}
        {activeGoals.length > 0 && (
          <div style={{ ...CARD, background: `linear-gradient(135deg,#0e1f2f,${BG2})`, borderColor: '#1a3040', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${GREEN}18`, border: `1px solid ${GREEN}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>✦</div>
              <div>
                <div style={{ fontSize: 10, color: GREEN, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Focus Insight</div>
                <div style={{ fontSize: 13, color: '#b0c4d4', lineHeight: 1.7 }}>
                  {avgProgress}% average progress across {activeGoals.length} active goal{activeGoals.length > 1 ? 's' : ''}.{' '}
                  <span style={{ color: AMBER }}>Daily processes</span> are the key lever — show up consistently to move the needle.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary chips */}
        {activeGoals.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, background: `${GREEN}08`, border: `1px solid ${GREEN}20`, borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: GREEN, fontFamily: 'Georgia,serif' }}>{activeGoals.length}</div>
              <div style={{ fontSize: 11, color: MUTED }}>In Progress</div>
            </div>
            <div style={{ flex: 1, background: CARD_BG, border: `1px solid ${CARD_BORD}`, borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: ACCENT, fontFamily: 'Georgia,serif' }}>{avgProgress}%</div>
              <div style={{ fontSize: 11, color: MUTED }}>Avg Progress</div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[1,2,3,4].map(i => <div key={i} className="animate-pulse" style={{ height: 180, borderRadius: 16, background: 'rgba(255,255,255,0.04)' }} />)}
          </div>
        ) : activeGoals.length === 0
            ? <div style={{ textAlign: 'center', padding: 48, background: CARD_BG, border: `1px solid ${CARD_BORD}`, borderRadius: 18 }}>
                <Play className="w-10 h-10 mx-auto mb-3" style={{ color: MUTED }} />
                <p style={{ color: TXT, fontWeight: 600 }}>No active goals</p>
                <p style={{ color: MUTED, fontSize: 13 }}>Tap New Goal to start working towards something</p>
              </div>
            : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {activeGoals.map(g => {
                  const daysLeft = g.deadline
                    ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86_400_000)
                    : null;
                  return (
                    <div key={g.id}>
                      {daysLeft !== null && daysLeft < 90 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER, boxShadow: `0 0 6px ${AMBER}` }} />
                          <span style={{ fontSize: 10, color: AMBER, fontWeight: 600 }}>Deadline approaching</span>
                        </div>
                      )}
                      <GoalCard goal={g} {...sharedProps} />
                    </div>
                  );
                })}
              </div>}
      </div>
    );
  }

  // ── COMPLETED TAB ─────────────────────────────────────────────────────────────
  function CompletedTab() {
    return (
      <div>
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>
          {completedGoals.length} achievement{completedGoals.length !== 1 ? 's' : ''}
        </div>
        {completedGoals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 64, background: CARD_BG, border: `1px dashed ${CARD_BORD}`, borderRadius: 18 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏁</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: MUTED, marginBottom: 8 }}>No completed goals yet</div>
            <div style={{ fontSize: 13, color: DIM }}>Stay consistent — your achievements will appear here.</div>
          </div>
        ) : (
          <>
            {/* Trophy banner */}
            <div style={{ ...CARD, background: 'linear-gradient(135deg,#1a2f1a,#0a0f1e)', borderColor: `${GREEN}33`, marginBottom: 20, textAlign: 'center', padding: '32px' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: GREEN, fontFamily: 'Georgia,serif' }}>{completedGoals.length} Goal{completedGoals.length !== 1 ? 's' : ''} Achieved</div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>Every completed goal is a victory worth celebrating.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {completedGoals.map(g => <GoalCard key={g.id} goal={g} {...sharedProps} compact />)}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── SETTINGS TAB ──────────────────────────────────────────────────────────────
  function SettingsTab() {
    return (
      <div>
        {/* Overview stats */}
        <div style={{ ...CARD, padding: '16px 20px', marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: TXT, margin: '0 0 14px' }}>Goal Overview</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { l: 'Total',     v: goals.length,          c: INDIGO, bg: `${INDIGO}22`, i: '◎' },
              { l: 'Active',    v: activeGoals.length,    c: GREEN,  bg: `${GREEN}22`,  i: '▶' },
              { l: 'Completed', v: completedGoals.length, c: AMBER,  bg: `${AMBER}22`,  i: '✓' },
              { l: 'Paused',    v: pausedGoals.length,    c: MUTED,  bg: `${MUTED}22`,  i: '⏸' },
            ].map(s => (
              <div key={s.l} style={{ ...CARD, display: 'flex', gap: 12, alignItems: 'center', padding: '16px' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: s.c }}>{s.i}</div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.c, fontFamily: 'Georgia,serif', lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: DIM, marginTop: 3 }}>{s.l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goal health bars (active goals) */}
        {activeGoals.length > 0 && (
          <div style={{ ...CARD, marginBottom: 20 }}>
            <p style={TAG}>Goal Health</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {activeGoals.map(g => {
                const done  = g.milestones.filter(m => m.isCompleted).length;
                const total = g.milestones.length;
                const pct   = total > 0 ? done / total : 0;
                const cc    = CAT_COLORS[g.category] ?? PURPLE;
                return (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: cc, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: TXT, fontWeight: 600 }}>{g.title}</span>
                        <span style={{ fontSize: 11, color: cc, fontWeight: 600 }}>{Math.round(pct * 100)}%</span>
                      </div>
                      <Bar pct={pct} color={cc} h={3} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category breakdown */}
        <div style={CARD}>
          <p style={{ fontSize: 15, fontWeight: 700, color: TXT, marginBottom: 4 }}>Goals by Category</p>
          <p style={{ fontSize: 12, color: DIM, marginBottom: 14 }}>Active and completed goals per category</p>
          {catStats.length === 0 ? (
            <p style={{ color: MUTED, fontSize: 13, textAlign: 'center', padding: 24 }}>No goals yet to show breakdown</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {catStats.map(s => {
                const CatIcon = CAT_ICONS[s.cat];
                const color   = CAT_COLORS[s.cat] ?? ACCENT;
                return (
                  <div key={s.cat} style={{ background: BG2, borderRadius: 12, padding: '13px 16px', border: `1px solid ${BORD}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 10, background: color + '22',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {CatIcon && <span style={{ color }}><CatIcon className="w-4 h-4" /></span>}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: TXT }}>{s.cat}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {s.active > 0 && <Bdg label={`${s.active} active`} color={GREEN} />}
                        {s.completed > 0 && <Bdg label={`${s.completed} done`} color={AMBER} />}
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${s.pct}%`, background: color, transition: 'width 0.4s ease' }} />
                    </div>
                    <p style={{ fontSize: 11, color, fontWeight: 700, marginTop: 5 }}>{s.pct}% complete</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: BG, color: TXT }}>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: TXT, margin: 0 }}>Goals</h1>
        <button onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12,
            background: `linear-gradient(135deg,${INDIGO},${PURPLE})`, border: 'none', color: 'white',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: `0 4px 16px ${INDIGO}44` }}>
          <Plus className="w-4 h-4" />New Goal
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        <OverviewTab />
      </div>

      {showModal && (
        <AddGoalModal onClose={() => setShowModal(false)} onCreated={goal => {
          if (wasEmptyRef.current) setShowConfetti(true);
          wasEmptyRef.current = false;
          setGoals(prev => [goal, ...prev]);
          setShowModal(false);
          setPostGoal(goal);
        }} />
      )}
      {postGoal && <PostGoalWizard goal={postGoal} onDone={() => setPostGoal(null)} />}

      {/* ── Delete Cascade Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div style={{ background: BG3, border: `1px solid ${BORD}`, borderRadius: 20, width: '100%', maxWidth: 420, padding: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,107,107,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 style={{ width: 18, height: 18, color: RED }} />
              </div>
              <div>
                <p style={{ color: TXT, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Delete this goal?</p>
                <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.5 }}>
                  <span style={{ color: TXT, fontStyle: 'italic' }}>&ldquo;{deleteTarget.title}&rdquo;</span> will be permanently removed along with all its milestones and processes.
                </p>
              </div>
            </div>

            {/* Linked items */}
            {deleteSearching ? (
              <div style={{ color: MUTED, fontSize: 13, padding: '8px 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${MUTED}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                Checking for linked items…
              </div>
            ) : (linkedHabits.length > 0 || linkedTasks.length > 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                <p style={{ color: DIM, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Also delete linked items</p>
                {linkedHabits.length > 0 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORD}`, borderRadius: 12, padding: '10px 14px' }}>
                    <input type="checkbox" checked={deleteLinkedHabits} onChange={e => setDeleteLinkedHabits(e.target.checked)} style={{ width: 16, height: 16, accentColor: RED, flexShrink: 0, cursor: 'pointer' }} />
                    <div>
                      <p style={{ color: TXT, fontSize: 13, fontWeight: 600 }}>
                        {linkedHabits.length} linked habit{linkedHabits.length > 1 ? 's' : ''}
                      </p>
                      <p style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>{linkedHabits.map(h => h.name).join(', ')}</p>
                    </div>
                  </label>
                )}
                {linkedTasks.length > 0 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORD}`, borderRadius: 12, padding: '10px 14px' }}>
                    <input type="checkbox" checked={deleteLinkedTasks} onChange={e => setDeleteLinkedTasks(e.target.checked)} style={{ width: 16, height: 16, accentColor: RED, flexShrink: 0, cursor: 'pointer' }} />
                    <div>
                      <p style={{ color: TXT, fontSize: 13, fontWeight: 600 }}>
                        {linkedTasks.length} linked task{linkedTasks.length > 1 ? 's' : ''}
                      </p>
                      <p style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>{linkedTasks.map(t => t.title).join(', ')}</p>
                    </div>
                  </label>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: 20 }} />
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, borderRadius: 12, border: `1px solid ${BORD}`, background: 'transparent', color: TXT, padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                style={{ flex: 1, borderRadius: 12, border: 'none', background: RED, color: 'white', padding: '10px 0', fontSize: 14, fontWeight: 700, cursor: deleteLoading ? 'wait' : 'pointer', opacity: deleteLoading ? 0.7 : 1 }}
              >
                {deleteLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
