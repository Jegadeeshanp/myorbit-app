'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Target, Calendar, CheckCircle2, Zap, ChevronRight, X,
  Repeat, Clock, ListChecks, CheckSquare, AlertCircle,
} from 'lucide-react';
import { toast } from '@/components/Toast';
import Confetti from '@/components/Confetti';

type GoalMilestone = { id: string; title: string; horizon: string; isCompleted: boolean };
type GoalProcess    = { id: string; title: string; frequency: string };
type Goal = {
  id: string; title: string; category: string; why?: string;
  metric?: string; deadline?: string; status: string;
  milestones: GoalMilestone[]; processes: GoalProcess[];
  createdAt: string;
};

const CATEGORIES = ['All', 'Finance', 'Health', 'Career', 'Learning', 'Personal', 'Other'];
const CATEGORY_COLORS: Record<string, string> = {
  Finance:  'bg-emerald-100 text-emerald-700',
  Health:   'bg-rose-100 text-rose-700',
  Career:   'bg-amber-100 text-amber-700',
  Learning: 'bg-blue-100 text-blue-700',
  Personal: 'bg-indigo-100 text-indigo-700',
  Other:    'bg-gray-100 text-gray-700',
};

const GRADIENT_BY_CATEGORY: Record<string, string> = {
  Finance:  'from-emerald-500 to-teal-600',
  Health:   'from-rose-500 to-pink-600',
  Career:   'from-amber-500 to-orange-600',
  Learning: 'from-blue-500 to-indigo-600',
  Personal: 'from-indigo-500 to-purple-600',
  Other:    'from-gray-400 to-gray-600',
};

// ── Habit form constants (same as habits/page.tsx) ─────────────────────────
const HABIT_COLORS = ['#78716C', '#6B7280', '#7C3AED', '#2563EB', '#059669', '#D97706', '#DB2777', '#4F46E5', '#EF4444', '#EC4899', '#F97316', '#14B8A6'];
const HABIT_EMOJIS = [
  '✅', '🔥', '💪', '📚', '🧘', '🏃', '💧', '🥗', '😴', '🎯', '✍️', '🎵',
  '🎨', '🏋️', '☕', '🚶', '🧠', '💊', '🌅', '🛌', '🌿', '❤️', '⭐', '🎓',
  '💼', '🏊', '🚴', '🧹', '🪴', '🎮', '📝', '🌞', '💰', '🙏', '🎸', '📱',
];
const HABIT_TIME_OPTIONS = [
  { value: 'all_day', label: 'All Day',  time: ''       },
  { value: 'morning', label: 'Morning',  time: '9:00 AM' },
  { value: 'noon',    label: 'Noon',     time: '12:00 PM' },
  { value: 'evening', label: 'Evening',  time: '4:00 PM' },
  { value: 'night',   label: 'Night',    time: '8:00 PM' },
  { value: 'custom',  label: 'Custom',   time: ''       },
];
const HABIT_WEEK_DAYS = [
  { label: 'Su', value: 0 }, { label: 'M',  value: 1 }, { label: 'Tu', value: 2 },
  { label: 'W',  value: 3 }, { label: 'Th', value: 4 }, { label: 'F',  value: 5 },
  { label: 'Sa', value: 6 },
];

// ── Task repeat / reminder options (same as tasks/page.tsx) ────────────────
const REPEAT_OPTIONS = [
  { value: '',          label: 'No repeat'  },
  { value: 'daily',     label: 'Daily'      },
  { value: 'weekly',    label: 'Weekly'     },
  { value: 'weekdays',  label: 'Weekdays'   },
  { value: 'weekends',  label: 'Weekends'   },
  { value: 'monthly',   label: 'Monthly'    },
  { value: 'yearly',    label: 'Yearly'     },
];
const REMINDER_OPTIONS = [
  { value: '',        label: 'No reminder' },
  { value: 'on-time', label: 'On time'     },
  { value: '5m',      label: '5 min before' },
  { value: '30m',     label: '30 min before' },
  { value: '1h',      label: '1 hour before' },
  { value: '1d',      label: '1 day before' },
];
const PRIORITY_OPTIONS = [
  { value: 'none',   label: 'None',   color: 'bg-gray-100 text-gray-600'   },
  { value: 'low',    label: 'Low',    color: 'bg-blue-50 text-blue-600'    },
  { value: 'medium', label: 'Medium', color: 'bg-amber-50 text-amber-600'  },
  { value: 'high',   label: 'High',   color: 'bg-rose-50 text-rose-600'   },
];

// ── Types ──────────────────────────────────────────────────────────────────

type WizardData = {
  title: string; category: string; why: string; metric: string; deadline: string;
  milestone1m: string; milestone3m: string; milestone6m: string;
  process1: string; process1freq: string;
  process2: string; process2freq: string;
};

// ── Post-Goal Wizard: Add Habit / Task ─────────────────────────────────────

type PostGoalWizardProps = {
  goal: Goal;
  onDone: () => void;
};

function PostGoalWizard({ goal, onDone }: PostGoalWizardProps) {
  type PWStep = 'choice' | 'habit' | 'task';
  const [step, setStep]             = useState<PWStep>('choice');
  const [saving, setSaving]         = useState(false);
  const [dupWarning, setDupWarning] = useState<string | null>(null);

  // ── Habit form state ──
  const [habitName,      setHabitName]      = useState('');
  const [habitEmoji,     setHabitEmoji]     = useState('🎯');
  const [habitColor,     setHabitColor]     = useState('#6366F1');
  const [habitTimeOfDay, setHabitTimeOfDay] = useState('all_day');
  const [habitCustomTime,setHabitCustomTime]= useState('09:00');
  const [habitDays,      setHabitDays]      = useState<number[]>([0,1,2,3,4,5,6]);
  const [habitSaved,     setHabitSaved]     = useState(false);

  // ── Task form state ──
  const [taskTitle,    setTaskTitle]    = useState('');
  const [taskDueDate,  setTaskDueDate]  = useState('');
  const [taskDueTime,  setTaskDueTime]  = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskRepeat,   setTaskRepeat]   = useState('');
  const [taskReminder, setTaskReminder] = useState('');
  const [taskSaved,    setTaskSaved]    = useState(false);

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

  const toggleHabitDay = (day: number) =>
    setHabitDays(prev => prev.includes(day)
      ? prev.length === 1 ? prev : prev.filter(d => d !== day)
      : [...prev, day].sort((a, b) => a - b));

  const checkHabitDup = async (name: string) => {
    if (!name.trim()) { setDupWarning(null); return; }
    try {
      const res = await fetch('/api/habits');
      if (!res.ok) return;
      const habits = await res.json();
      const dup = habits.find((h: any) => h.name.trim().toLowerCase() === name.trim().toLowerCase());
      setDupWarning(dup ? `A habit named "${dup.name}" already exists.` : null);
    } catch { /* ignore */ }
  };

  const checkTaskDup = async (title: string) => {
    if (!title.trim()) { setDupWarning(null); return; }
    try {
      const res = await fetch('/api/tasks?smartList=all');
      if (!res.ok) return;
      const tasks = await res.json();
      const dup = tasks.find((t: any) => t.title.trim().toLowerCase() === title.trim().toLowerCase());
      setDupWarning(dup ? `A task named "${dup.title}" already exists.` : null);
    } catch { /* ignore */ }
  };

  const handleAddHabit = async () => {
    if (!habitName.trim()) { toast('Habit name is required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: habitName.trim(),
          color: habitColor,
          iconEmoji: habitEmoji,
          daysOfWeek: habitDays,
          timeOfDay: habitTimeOfDay,
          customTime: habitTimeOfDay === 'custom' ? habitCustomTime : null,
        }),
      });
      if (!res.ok) throw new Error('Failed to create habit');
      setHabitSaved(true);
      toast('Habit created!');
    } catch (err: any) {
      toast(err?.message || 'Failed to create habit', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim()) { toast('Task title is required', 'error'); return; }
    setSaving(true);
    try {
      // Find or create the "Goals" task list
      let listId: string | null = null;
      try {
        const listsRes = await fetch('/api/task-lists');
        if (listsRes.ok) {
          const lists = await listsRes.json();
          const existing = Array.isArray(lists) ? lists.find((l: any) => l.name.toLowerCase() === 'goals') : null;
          if (existing) {
            listId = existing.id;
          } else {
            const createRes = await fetch('/api/task-lists', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: 'Goals', emoji: '🎯', color: '#6366F1' }),
            });
            if (createRes.ok) listId = (await createRes.json()).id;
          }
        }
      } catch { /* fall back to inbox */ }

      // Build tags for repeat and reminder
      const tags: string[] = [];
      if (taskRepeat)   tags.push(`repeat:${taskRepeat}`);
      if (taskReminder) tags.push(`reminder:${taskReminder}`);

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:    taskTitle.trim(),
          notes:    `Related to goal: ${goal.title}`,
          priority: taskPriority,
          dueDate:  taskDueDate || null,
          dueTime:  taskDueTime || null,
          tags,
          listId,
        }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      setTaskSaved(true);
      toast('Task created!');
    } catch (err: any) {
      toast(err?.message || 'Failed to create task', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-h-[90vh] sm:max-h-none rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col sm:max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex-none">
          <div>
            <p className="font-semibold text-gray-900 text-sm sm:text-base">Goal Created!</p>
            <p className="text-xs text-gray-500 truncate max-w-[180px] sm:max-w-[240px]">{goal.title}</p>
          </div>
          <button onClick={onDone} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex-none">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Choice step */}
        {step === 'choice' && (
          <div className="px-4 sm:px-6 py-5 sm:py-6 space-y-4 overflow-y-auto">
            <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-indigo-500 flex-none" />
              <p className="text-sm text-indigo-700 font-medium">Goal saved! Build momentum now.</p>
            </div>
            <p className="text-sm font-semibold text-gray-700">What would you like to add?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setStep('habit'); setDupWarning(null); }}
                className="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-indigo-100 bg-indigo-50 px-4 py-5 text-center hover:border-indigo-300 hover:bg-indigo-100 transition"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
                  <Repeat className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Add a Habit</p>
                  <p className="text-xs text-gray-500 mt-0.5">Recurring routine</p>
                </div>
              </button>
              <button
                onClick={() => { setStep('task'); setDupWarning(null); }}
                className="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-blue-100 bg-blue-50 px-4 py-5 text-center hover:border-blue-300 hover:bg-blue-100 transition"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                  <ListChecks className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Add a Task</p>
                  <p className="text-xs text-gray-500 mt-0.5">One-time action</p>
                </div>
              </button>
            </div>
            <button onClick={onDone} className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition">
              Skip for now
            </button>
          </div>
        )}

        {/* Habit step — full form same as Add Habit modal */}
        {step === 'habit' && (
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-base font-semibold text-gray-900 mb-1">New Habit</p>
                <p className="text-sm text-gray-500">A recurring routine to support this goal.</p>
              </div>
              {habitSaved ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <span className="text-5xl">{habitEmoji}</span>
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 -mt-2" />
                  <p className="font-semibold text-gray-900">Habit Created!</p>
                  <p className="text-sm text-gray-500">{habitName}</p>
                </div>
              ) : (
                <>
                  {/* Name */}
                  <div>
                    <label className={labelCls}>Habit Name *</label>
                    <input
                      autoFocus
                      className={inputCls}
                      placeholder="e.g. Morning run, Read 30 min..."
                      value={habitName}
                      onChange={e => { setHabitName(e.target.value); setDupWarning(null); }}
                      onBlur={() => checkHabitDup(habitName)}
                    />
                    {dupWarning && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600">
                        <AlertCircle className="h-3.5 w-3.5 flex-none" />
                        {dupWarning}
                      </div>
                    )}
                  </div>

                  {/* Icon */}
                  <div>
                    <label className={labelCls}>Icon</label>
                    <div className="grid grid-cols-8 gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {HABIT_EMOJIS.map(e => (
                        <button key={e} type="button" onClick={() => setHabitEmoji(e)}
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition ${habitEmoji === e ? 'bg-amber-50 ring-2 ring-amber-400' : 'bg-gray-50 hover:bg-gray-100'}`}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <label className={labelCls}>Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {HABIT_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setHabitColor(c)}
                          style={{ backgroundColor: c }}
                          className={`h-8 w-8 rounded-full transition ${habitColor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`} />
                      ))}
                    </div>
                  </div>

                  {/* Time of Day */}
                  <div>
                    <label className={labelCls}>Time of Day</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {HABIT_TIME_OPTIONS.map(opt => (
                        <button key={opt.value} type="button" onClick={() => setHabitTimeOfDay(opt.value)}
                          className={`flex flex-col items-center justify-center rounded-xl px-2 py-2 text-xs font-medium transition border ${
                            habitTimeOfDay === opt.value
                              ? 'bg-amber-50 border-amber-400 text-amber-700'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}>
                          <span>{opt.label}</span>
                          {opt.time && <span className="text-[10px] mt-0.5 opacity-70">{opt.time}</span>}
                        </button>
                      ))}
                    </div>
                    {habitTimeOfDay === 'custom' && (
                      <input type="time" value={habitCustomTime} onChange={e => setHabitCustomTime(e.target.value)}
                        className={`mt-2 ${inputCls}`} />
                    )}
                  </div>

                  {/* Days of Week */}
                  <div>
                    <label className={labelCls}>
                      Days of Week
                      <span className="ml-2 font-normal normal-case text-gray-400">({habitDays.length}×/week)</span>
                    </label>
                    <div className="flex gap-1.5">
                      {HABIT_WEEK_DAYS.map(({ label, value }) => (
                        <button key={value} type="button" onClick={() => toggleHabitDay(value)}
                          className={`flex-1 flex items-center justify-center h-9 rounded-xl text-xs font-bold transition border ${
                            habitDays.includes(value) ? 'bg-amber-500 border-amber-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                          }`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 px-6 pb-6">
              {!habitSaved && (
                <button onClick={() => setStep('choice')}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                  Back
                </button>
              )}
              {habitSaved ? (
                <>
                  <button onClick={() => { setStep('task'); setDupWarning(null); }}
                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition">
                    Add a Task too?
                  </button>
                  <button onClick={onDone}
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition">
                    Done
                  </button>
                </>
              ) : (
                <button onClick={handleAddHabit} disabled={saving}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Create Habit'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Task step — full form with date, time, priority, repeat, reminder */}
        {step === 'task' && (
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-base font-semibold text-gray-900 mb-1">New Task</p>
                <p className="text-sm text-gray-500">A specific action tied to this goal.</p>
              </div>
              {taskSaved ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <CheckSquare className="h-12 w-12 text-blue-500" />
                  <p className="font-semibold text-gray-900">Task Created!</p>
                  <p className="text-sm text-gray-500">{taskTitle}</p>
                </div>
              ) : (
                <>
                  {/* Title */}
                  <div>
                    <label className={labelCls}>Task Title *</label>
                    <input
                      autoFocus
                      className={inputCls}
                      placeholder="e.g. Sign up for a gym, Buy running shoes"
                      value={taskTitle}
                      onChange={e => { setTaskTitle(e.target.value); setDupWarning(null); }}
                      onBlur={() => checkTaskDup(taskTitle)}
                    />
                    {dupWarning && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600">
                        <AlertCircle className="h-3.5 w-3.5 flex-none" />
                        {dupWarning}
                      </div>
                    )}
                  </div>

                  {/* Due date + time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Due Date</label>
                      <input type="date" className={inputCls} value={taskDueDate}
                        onChange={e => setTaskDueDate(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Due Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="time" className={`${inputCls} pl-9`} value={taskDueTime}
                          onChange={e => setTaskDueTime(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className={labelCls}>Priority</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PRIORITY_OPTIONS.map(opt => (
                        <button key={opt.value} type="button" onClick={() => setTaskPriority(opt.value)}
                          className={`rounded-xl py-2 text-xs font-semibold transition border ${
                            taskPriority === opt.value
                              ? `${opt.color} border-current`
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Repeat + Reminder */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Repeat</label>
                      <select className={inputCls} value={taskRepeat} onChange={e => setTaskRepeat(e.target.value)}>
                        {REPEAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Reminder</label>
                      <select className={inputCls} value={taskReminder} onChange={e => setTaskReminder(e.target.value)}>
                        {REMINDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 px-6 pb-6">
              {!taskSaved && (
                <button onClick={() => setStep(habitSaved ? 'habit' : 'choice')}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                  Back
                </button>
              )}
              {taskSaved ? (
                <button onClick={onDone}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition">
                  All Done!
                </button>
              ) : (
                <button onClick={handleAddTask} disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Create Task'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Goal Modal ─────────────────────────────────────────────────────────

function AddGoalModal({ onClose, onCreated }: { onClose: () => void; onCreated: (g: Goal) => void }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<WizardData>({
    title: '', category: 'Personal', why: '', metric: '', deadline: '',
    milestone1m: '', milestone3m: '', milestone6m: '',
    process1: '', process1freq: 'daily', process2: '', process2freq: 'weekly',
  });

  const set = (k: keyof WizardData, v: string) => setData(prev => ({ ...prev, [k]: v }));

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

  const handleSubmit = async () => {
    if (!data.title.trim()) { toast('Goal title is required', 'error'); return; }
    setSaving(true);
    try {
      const milestones = [
        data.milestone6m.trim() && { title: data.milestone6m.trim(), horizon: '6m' },
        data.milestone3m.trim() && { title: data.milestone3m.trim(), horizon: '3m' },
        data.milestone1m.trim() && { title: data.milestone1m.trim(), horizon: '1m' },
      ].filter(Boolean);

      const processes = [
        data.process1.trim() && { title: data.process1.trim(), frequency: data.process1freq },
        data.process2.trim() && { title: data.process2.trim(), frequency: data.process2freq },
      ].filter(Boolean);

      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title.trim(),
          category: data.category,
          why: data.why.trim() || null,
          metric: data.metric.trim() || null,
          deadline: data.deadline || null,
          milestones,
          processes,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Failed to create goal');
      }
      const goal = await res.json();
      onCreated(goal);
    } catch (err: any) {
      toast(err?.message || 'Failed to create goal', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900">New Goal</p>
            <p className="text-xs text-gray-500">Step {step} of 4</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 px-6 pt-4">
          {[1,2,3,4].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-indigo-600' : 'bg-gray-100'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {step === 1 && (
            <>
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-1">What do you want to achieve?</p>
                <p className="text-sm text-gray-500 mb-4">Be specific and inspiring.</p>
              </div>
              <div>
                <label className={labelCls}>Goal Title *</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Run a marathon, Save ₹5 lakhs, Get promoted"
                  value={data.title}
                  onChange={e => set('title', e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.slice(1).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => set('category', cat)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                        data.category === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-1">Define it clearly</p>
                <p className="text-sm text-gray-500 mb-4">Your why and how you'll measure success.</p>
              </div>
              <div>
                <label className={labelCls}>Why is this goal important to you?</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="e.g. To feel confident, gain financial freedom, advance my career..."
                  value={data.why}
                  onChange={e => set('why', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Success Metric</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Complete 42km race, ₹5L in savings account"
                  value={data.metric}
                  onChange={e => set('metric', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Target Deadline</label>
                <input
                  type="date"
                  className={inputCls}
                  value={data.deadline}
                  onChange={e => set('deadline', e.target.value)}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-1">Break it down</p>
                <p className="text-sm text-gray-500 mb-4">Set milestones and daily/weekly processes.</p>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Milestones</p>
                {[
                  { key: 'milestone6m' as keyof WizardData, label: '6 Month milestone', ph: 'Where will you be in 6 months?' },
                  { key: 'milestone3m' as keyof WizardData, label: '3 Month milestone', ph: 'Where will you be in 3 months?' },
                  { key: 'milestone1m' as keyof WizardData, label: '1 Month milestone', ph: 'What will you achieve this month?' },
                ].map(({ key, label, ph }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input className={inputCls} placeholder={ph} value={data[key]} onChange={e => set(key, e.target.value)} />
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4">Processes (recurring habits)</p>
                {[
                  { key: 'process1' as keyof WizardData, freqKey: 'process1freq' as keyof WizardData, n: 1 },
                  { key: 'process2' as keyof WizardData, freqKey: 'process2freq' as keyof WizardData, n: 2 },
                ].map(({ key, freqKey, n }) => (
                  <div key={key} className="flex gap-2">
                    <input
                      className={`${inputCls} flex-1`}
                      placeholder={`Process ${n} (e.g. Run 5km)`}
                      value={data[key]}
                      onChange={e => set(key, e.target.value)}
                    />
                    <select
                      className="rounded-xl border border-gray-200 px-2 py-2 text-sm focus:border-indigo-400 focus:outline-none bg-white"
                      value={data[freqKey]}
                      onChange={e => set(freqKey, e.target.value)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-1">Review & Confirm</p>
                <p className="text-sm text-gray-500 mb-4">Your goal at a glance.</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white">
                <div className="text-xs font-medium opacity-75 mb-1">{data.category}</div>
                <div className="text-xl font-bold mb-2">{data.title || '—'}</div>
                {data.why && <div className="text-sm opacity-80 italic mb-2">"{data.why}"</div>}
                {data.metric && <div className="text-sm opacity-90">📏 {data.metric}</div>}
                {data.deadline && <div className="text-sm opacity-90">📅 Due {data.deadline}</div>}
              </div>
              {(data.milestone6m || data.milestone3m || data.milestone1m) && (
                <div className="rounded-xl border border-gray-100 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500">Milestones</p>
                  {data.milestone6m && <p className="text-sm text-gray-700">🏁 6M: {data.milestone6m}</p>}
                  {data.milestone3m && <p className="text-sm text-gray-700">🏁 3M: {data.milestone3m}</p>}
                  {data.milestone1m && <p className="text-sm text-gray-700">🏁 1M: {data.milestone1m}</p>}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !data.title.trim()) { toast('Please enter a goal title', 'error'); return; }
                setStep(s => s + 1);
              }}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Goal'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Goal List Row ──────────────────────────────────────────────────────────

function GoalRow({ goal, onClick }: { goal: Goal; onClick: () => void }) {
  const completedMilestones = goal.milestones.filter(m => m.isCompleted).length;
  const totalMilestones     = goal.milestones.length;
  const progress            = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
  const gradient            = GRADIENT_BY_CATEGORY[goal.category] || GRADIENT_BY_CATEGORY.Personal;
  const catColor            = CATEGORY_COLORS[goal.category] || CATEGORY_COLORS.Other;
  const isOverdue           = goal.deadline && goal.deadline < new Date().toISOString().split('T')[0] && goal.status === 'active';

  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      {/* Left: gradient color bar */}
      <div className={`h-10 w-1 flex-none rounded-full bg-gradient-to-b ${gradient}`} />

      {/* Center: goal info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${catColor}`}>
            {goal.category}
          </span>
          {goal.status === 'completed' && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Done
            </span>
          )}
          {goal.status === 'paused' && (
            <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
              Paused
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
          {goal.title}
        </p>
        {goal.why && (
          <p className="text-xs text-gray-400 italic truncate mt-0.5">"{goal.why}"</p>
        )}
      </div>

      {/* Right: stats + progress */}
      <div className="flex items-center gap-5 flex-none">
        {/* Milestone progress */}
        {totalMilestones > 0 && (
          <div className="hidden sm:flex flex-col items-end gap-1 w-24">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span className="font-medium text-gray-700">{completedMilestones}/{totalMilestones}</span>
              <span>milestones</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100">
              <div
                className={`h-1.5 rounded-full bg-gradient-to-r ${gradient} transition-all`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Processes count */}
        {goal.processes.length > 0 && (
          <div className="hidden md:flex items-center gap-1 text-xs text-gray-500">
            <Zap className="h-3.5 w-3.5 text-indigo-400" />
            <span>{goal.processes.length}</span>
          </div>
        )}

        {/* Deadline */}
        {goal.deadline && (
          <div className={`hidden md:flex items-center gap-1 text-xs ${isOverdue ? 'text-rose-600 font-medium' : 'text-gray-400'}`}>
            <Calendar className="h-3.5 w-3.5" />
            {goal.deadline}
          </div>
        )}

        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
      </div>
    </div>
  );
}

// ── Stats Card ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'indigo' }: { label: string; value: number; sub?: string; color?: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-600 bg-indigo-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    rose: 'text-rose-600 bg-rose-50',
    amber: 'text-amber-600 bg-amber-50',
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-5 py-4">
      <p className={`text-2xl font-bold ${colorMap[color]?.split(' ')[0] || 'text-gray-900'}`}>{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const GOAL_TEMPLATES = [
  { title: 'Save ₹1,00,000 this year',   category: 'Finance',  why: 'Build my emergency fund' },
  { title: 'Run a 5K without stopping',  category: 'Health',   why: 'Get back in shape'       },
  { title: 'Read 12 books this year',    category: 'Learning', why: 'Grow every month'        },
];

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals]               = useState<Goal[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [catFilter, setCatFilter]       = useState('All');
  const [postGoal, setPostGoal]         = useState<Goal | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const wasEmptyRef                     = useRef(false);

  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setGoals(data);
          wasEmptyRef.current = data.length === 0;
        }
      })
      .catch(() => toast('Failed to load goals', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = catFilter === 'All' ? goals : goals.filter(g => g.category === catFilter);
  const stats = {
    total:     goals.length,
    active:    goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    processes: goals.reduce((sum, g) => sum + g.processes.length, 0),
  };

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Goals"  value={stats.total}     color="indigo" />
        <StatCard label="Active"       value={stats.active}    color="emerald" />
        <StatCard label="Completed"    value={stats.completed} color="amber" />
        <StatCard label="Processes"    value={stats.processes} color="indigo" sub="recurring habits" />
      </div>

      {/* Category filter + Add Goal */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`flex-none rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                catFilter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex flex-none items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" />
          New Goal
        </button>
      </div>

      {/* Goals list */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
              <div className="h-10 w-1 rounded-full bg-gray-200 flex-none" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-64 bg-gray-200 rounded" />
              </div>
              <div className="hidden sm:block h-1.5 w-24 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
              <Target className="h-7 w-7 text-indigo-500" />
            </div>
            <p className="text-base font-semibold text-gray-900">
              {catFilter === 'All' ? 'No goals yet' : `No ${catFilter} goals yet`}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {catFilter === 'All' ? 'Pick a template to get started, or create your own.' : 'Try a template or start from scratch.'}
            </p>
          </div>
          {catFilter === 'All' && (
            <div className="mb-5 space-y-2">
              {GOAL_TEMPLATES.map((t) => (
                <button
                  key={t.title}
                  onClick={() => setShowModal(true)}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50 group"
                >
                  <span className="text-lg">🎯</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                    <p className="text-xs text-gray-400">{t.category} · "{t.why}"</p>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-none text-gray-300 group-hover:text-indigo-400 transition" />
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            {catFilter === 'All' ? 'Create your own goal' : `Create ${catFilter} goal`}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
          {filtered.map(goal => (
            <GoalRow
              key={goal.id}
              goal={goal}
              onClick={() => router.push(`/orbit/goals/${goal.id}`)}
            />
          ))}
        </div>
      )}

      {/* FAB on mobile */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition md:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Add goal modal */}
      {showModal && (
        <AddGoalModal
          onClose={() => setShowModal(false)}
          onCreated={goal => {
            if (wasEmptyRef.current) setShowConfetti(true);
            wasEmptyRef.current = false;
            setGoals(prev => [goal, ...prev]);
            setShowModal(false);
            setPostGoal(goal);
          }}
        />
      )}

      {/* Post-goal wizard */}
      {postGoal && (
        <PostGoalWizard
          goal={postGoal}
          onDone={() => setPostGoal(null)}
        />
      )}
    </div>
  );
}
