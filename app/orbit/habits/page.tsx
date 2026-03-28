'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Flame, CheckCircle2, X, Trash2, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { toast } from '@/components/Toast';

type Habit = {
  id: string;
  name: string;
  color: string;
  iconEmoji: string;
  goalPerDay: number;
  isCountBased: boolean;
  daysOfWeek: string;
  sortOrder: number;
  isActive: boolean;
  timeOfDay: string | null;
  customTime: string | null;
  logs: { logDate: string; value: number }[];
};

const COLORS = ['#78716C', '#6B7280', '#7C3AED', '#2563EB', '#059669', '#D97706', '#DB2777', '#4F46E5', '#EF4444', '#EC4899', '#F97316', '#14B8A6'];
const EMOJIS = [
  '✅', '🔥', '💪', '📚', '🧘', '🏃', '💧', '🥗', '😴', '🎯', '✍️', '🎵',
  '🎨', '🏋️', '☕', '🚶', '🧠', '💊', '🌅', '🛌', '🌿', '❤️', '⭐', '🎓',
  '💼', '🏊', '🚴', '🧹', '🪴', '🎮', '📝', '🌞', '💰', '🙏', '🎸', '📱',
  '🌊', '🍎', '🏆', '⚡', '🦋', '🌈', '🧘‍♀️', '🍷', '🐾', '🎬', '🏠', '✈️',
];

// Days of week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const WEEK_DAYS = [
  { label: 'S', value: 0, full: 'Sun' },
  { label: 'M', value: 1, full: 'Mon' },
  { label: 'T', value: 2, full: 'Tue' },
  { label: 'W', value: 3, full: 'Wed' },
  { label: 'T', value: 4, full: 'Thu' },
  { label: 'F', value: 5, full: 'Fri' },
  { label: 'S', value: 6, full: 'Sat' },
];

// Map timeOfDay → 24-hour time string for task creation
const TIME_OF_DAY_TO_HOUR: Record<string, string> = {
  morning: '09:00',
  noon: '12:00',
  evening: '16:00',
  night: '20:00',
};

const TIME_OF_DAY_OPTIONS = [
  { value: 'all_day', label: 'All Day', time: '' },
  { value: 'morning', label: 'Morning', time: '9:00 AM' },
  { value: 'noon', label: 'Noon', time: '12:00 PM' },
  { value: 'evening', label: 'Evening', time: '4:00 PM' },
  { value: 'night', label: 'Night', time: '8:00 PM' },
  { value: 'custom', label: 'Custom', time: '' },
];

const TIME_OF_DAY_ORDER = ['all_day', 'morning', 'noon', 'evening', 'night', 'custom'];

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

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

function formatCustomTime(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

function getDisplayTime(habit: Habit): string {
  const tod = habit.timeOfDay || 'all_day';
  if (tod === 'custom') return habit.customTime ? formatCustomTime(habit.customTime) : '';
  const option = TIME_OF_DAY_OPTIONS.find(o => o.value === tod);
  return option?.time || '';
}

// ── Calendar helpers ────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // 0=Sun, returns Mon-based (0=Mon)
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

function getDaysInYear(year: number): number {
  return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getWeekDays(weekOffset = 0): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

type CalendarDayStatus = 'all' | 'some' | 'none';

function getDayStatus(date: string, habits: Habit[]): CalendarDayStatus {
  const activeHabits = habits.filter(h => h.isActive);
  if (activeHabits.length === 0) return 'none';
  const done = activeHabits.filter(h => h.logs.some(l => l.logDate === date)).length;
  if (done === 0) return 'none';
  if (done === activeHabits.length) return 'all';
  return 'some';
}

function getDayStatusColor(status: CalendarDayStatus): string {
  if (status === 'all') return 'bg-emerald-500';
  if (status === 'some') return 'bg-amber-400';
  return 'bg-gray-200 dark:bg-gray-700';
}

// ── Add Habit Modal ─────────────────────────────────────────────────────────
function AddHabitModal({ onClose, onCreated }: { onClose: () => void; onCreated: (h: Habit) => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[4]); // emerald default
  const [emoji, setEmoji] = useState('✅');
  const [timeOfDay, setTimeOfDay] = useState('all_day');
  const [customTime, setCustomTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // all days by default
  const [addToTask, setAddToTask] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev; // must keep at least 1 day
        return prev.filter(d => d !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const handleSave = async () => {
    if (!name.trim()) { toast('Habit name is required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          color,
          iconEmoji: emoji,
          timeOfDay,
          customTime: timeOfDay === 'custom' ? customTime : null,
          daysOfWeek: selectedDays,
        }),
      });
      if (!res.ok) throw new Error();
      const habit: Habit = await res.json();

      if (addToTask) {
        try {
          // Find or create the "Habit" task list
          const listsRes = await fetch('/api/task-lists');
          const lists = listsRes.ok ? await listsRes.json() : [];
          let habitListId: string | null = null;
          const existing = Array.isArray(lists) ? lists.find((l: any) => l.name === 'Habit') : null;
          if (existing) {
            habitListId = existing.id;
          } else {
            const createRes = await fetch('/api/task-lists', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: 'Habit', emoji: '🔥', color: '#F59E0B' }),
            });
            if (createRes.ok) {
              const newList = await createRes.json();
              habitListId = newList.id;
            }
          }
          if (habitListId) {
            // Derive dueTime from timeOfDay
            const dueTime = timeOfDay === 'custom' ? customTime : (TIME_OF_DAY_TO_HOUR[timeOfDay] ?? null);
            await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: name.trim(),
                dueDate: getTodayString(),
                dueTime: dueTime || null,
                tags: [`habit:${habit.id}`],  // send as array, not pre-stringified
                listId: habitListId,
              }),
            });
          }
        } catch {
          // Task creation failed silently — habit was still created
        }
      }

      toast('Habit created!');
      onCreated(habit);
    } catch {
      toast('Failed to create habit', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="font-semibold text-gray-900 dark:text-white">New Habit</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Habit Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Habit Name *</label>
            <input
              autoFocus
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              placeholder="e.g. Morning run, Read 30 min..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Icon</label>
            <div className="grid grid-cols-8 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition ${emoji === e ? 'bg-amber-50 ring-2 ring-amber-400' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`h-8 w-8 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                />
              ))}
            </div>
          </div>

          {/* Time of Day */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Time of Day</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TIME_OF_DAY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTimeOfDay(opt.value)}
                  className={`flex flex-col items-center justify-center rounded-xl px-2 py-2 text-xs font-medium transition border ${
                    timeOfDay === opt.value
                      ? 'bg-amber-50 border-amber-400 text-amber-700 dark:bg-amber-950 dark:border-amber-500 dark:text-amber-300'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.time && <span className="text-[10px] mt-0.5 opacity-70">{opt.time}</span>}
                </button>
              ))}
            </div>
            {timeOfDay === 'custom' && (
              <div className="mt-2">
                <input
                  type="time"
                  value={customTime}
                  onChange={e => setCustomTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </div>
            )}
          </div>

          {/* Days of Week */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Days of Week
              <span className="ml-2 font-normal normal-case text-gray-400">({selectedDays.length}×/week)</span>
            </label>
            <div className="flex gap-1.5">
              {WEEK_DAYS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDay(value)}
                  className={`flex-1 flex items-center justify-center h-9 rounded-xl text-xs font-bold transition border ${
                    selectedDays.includes(value)
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Add to Task */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
            <input
              id="add-to-task"
              type="checkbox"
              checked={addToTask}
              onChange={e => setAddToTask(e.target.checked)}
              className="h-4 w-4 rounded accent-amber-500 cursor-pointer"
            />
            <label htmlFor="add-to-task" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              Also add as a task for today
            </label>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Create Habit'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Day Popup ───────────────────────────────────────────────────────────────
function DayPopup({ date, habits, onClose }: { date: string; habits: Habit[]; onClose: () => void }) {
  const [d, m, y] = (() => {
    const dt = new Date(date + 'T12:00:00');
    return [dt.getDate(), dt.toLocaleString('default', { month: 'long' }), dt.getFullYear()];
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-xs rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="font-semibold text-gray-900 dark:text-white">{m} {d}, {y}</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-2 max-h-72 overflow-y-auto">
          {habits.map(h => {
            const done = h.logs.some(l => l.logDate === date);
            return (
              <div key={h.id} className="flex items-center gap-3">
                <span className="text-base">{h.iconEmoji}</span>
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{h.name}</span>
                <span className={`text-sm font-medium ${done ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'}`}>
                  {done ? '✅' : '⬜'}
                </span>
              </div>
            );
          })}
          {habits.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">No habits tracked yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Week View ───────────────────────────────────────────────────────────────
function WeekView({ habits }: { habits: Habit[] }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const days = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const today = getTodayString();
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {new Date(days[0] + 'T12:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })} –{' '}
          {new Date(days[6] + 'T12:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekOffset(o => o - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
              Today
            </button>
          )}
          <button onClick={() => setWeekOffset(o => o + 1)} disabled={weekOffset >= 0} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left py-1 pr-3 text-gray-400 dark:text-gray-500 font-medium w-28">Habit</th>
              {days.map((d, i) => {
                const isToday = d === today;
                const dt = new Date(d + 'T12:00:00');
                return (
                  <th key={d} className={`text-center py-1 px-1 font-medium min-w-[36px] ${isToday ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    <div>{DAY_LABELS[i]}</div>
                    <div className={`text-[10px] ${isToday ? 'font-bold' : 'font-normal opacity-70'}`}>{dt.getDate()}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {habits.map(h => {
              const logSet = new Set(h.logs.map(l => l.logDate));
              return (
                <tr key={h.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-3 truncate max-w-[112px]">
                    <span className="mr-1">{h.iconEmoji}</span>
                    <span className="text-gray-700 dark:text-gray-300">{h.name}</span>
                  </td>
                  {days.map(d => {
                    const done = logSet.has(d);
                    return (
                      <td key={d} className="text-center py-2 px-1">
                        <div className={`mx-auto h-5 w-5 rounded-full ${done ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-gray-800'}`} style={done ? { backgroundColor: h.color } : {}} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {habits.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No habits to display</p>
        )}
      </div>
    </div>
  );
}

// ── Month View ──────────────────────────────────────────────────────────────
function MonthView({ habits }: { habits: Habit[] }) {
  const [offset, setOffset] = useState(0);
  const [popupDate, setPopupDate] = useState<string | null>(null);
  const today = getTodayString();
  const now = new Date();
  const year = new Date(now.getFullYear(), now.getMonth() + offset, 1).getFullYear();
  const month = new Date(now.getFullYear(), now.getMonth() + offset, 1).getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthLabel = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => dateStr(year, month, i + 1)),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{monthLabel}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setOffset(o => o - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {offset !== 0 && (
            <button onClick={() => setOffset(0)} className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
              Today
            </button>
          )}
          <button onClick={() => setOffset(o => o + 1)} disabled={offset >= 0} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map(l => (
          <div key={l} className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 py-1">{l}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />;
          const status = getDayStatus(d, habits);
          const isToday = d === today;
          const isFuture = d > today;
          return (
            <button
              key={d}
              onClick={() => !isFuture && setPopupDate(d)}
              disabled={isFuture}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition text-xs font-medium
                ${isToday ? 'ring-2 ring-amber-400' : ''}
                ${isFuture ? 'opacity-30 cursor-default' : 'hover:opacity-80 cursor-pointer'}
              `}
            >
              <span className={`text-[11px] ${isToday ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                {new Date(d + 'T12:00:00').getDate()}
              </span>
              {!isFuture && (
                <div className={`h-2 w-2 rounded-full ${getDayStatusColor(status)}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><span className="text-xs text-gray-500 dark:text-gray-400">All done</span></div>
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="text-xs text-gray-500 dark:text-gray-400">Some done</span></div>
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-gray-200 dark:bg-gray-700" /><span className="text-xs text-gray-500 dark:text-gray-400">None</span></div>
      </div>

      {popupDate && <DayPopup date={popupDate} habits={habits} onClose={() => setPopupDate(null)} />}
    </div>
  );
}

// ── Year View ───────────────────────────────────────────────────────────────
function YearView({ habits }: { habits: Habit[] }) {
  const [yearOffset, setYearOffset] = useState(0);
  const [popupDate, setPopupDate] = useState<string | null>(null);
  const today = getTodayString();
  const currentYear = new Date().getFullYear() + yearOffset;
  const totalDays = getDaysInYear(currentYear);

  const days = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(currentYear, 0, i + 1);
      return d.toISOString().split('T')[0];
    });
  }, [currentYear, totalDays]);

  const jan1DayOfWeek = useMemo(() => {
    const day = new Date(currentYear, 0, 1).getDay();
    return (day + 6) % 7; // Mon=0
  }, [currentYear]);

  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Build weeks (columns)
  const paddedDays: (string | null)[] = [
    ...Array(jan1DayOfWeek).fill(null),
    ...days,
  ];
  const numWeeks = Math.ceil(paddedDays.length / 7);
  const weeks: (string | null)[][] = Array.from({ length: numWeeks }, (_, wi) =>
    paddedDays.slice(wi * 7, wi * 7 + 7)
  );

  // Month label positions (week index where month starts)
  const monthPositions = MONTH_LABELS.map((_, mi) => {
    const firstOfMonth = new Date(currentYear, mi, 1).toISOString().split('T')[0];
    const dayIndex = days.indexOf(firstOfMonth);
    if (dayIndex < 0) return { label: MONTH_LABELS[mi], col: 0 };
    const col = Math.floor((dayIndex + jan1DayOfWeek) / 7);
    return { label: MONTH_LABELS[mi], col };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{currentYear}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setYearOffset(o => o - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {yearOffset !== 0 && (
            <button onClick={() => setYearOffset(0)} className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
              This Year
            </button>
          )}
          <button onClick={() => setYearOffset(o => o + 1)} disabled={yearOffset >= 0} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Month labels row */}
          <div className="flex mb-1" style={{ paddingLeft: '14px' }}>
            {weeks.map((_, wi) => {
              const mp = monthPositions.find(m => m.col === wi);
              return (
                <div key={wi} className="w-[13px] mr-[2px] text-[9px] text-gray-400 dark:text-gray-500 font-medium leading-none">
                  {mp ? mp.label : ''}
                </div>
              );
            })}
          </div>

          {/* Day rows (Mon-Sun) */}
          {Array.from({ length: 7 }, (_, row) => (
            <div key={row} className="flex items-center mb-[2px]">
              <div className="w-[12px] mr-[2px] text-[8px] text-gray-400 dark:text-gray-500 leading-none">
                {row % 2 === 0 ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'][row] : ''}
              </div>
              {weeks.map((week, wi) => {
                const d = week[row];
                if (!d) return <div key={wi} className="w-[11px] h-[11px] mr-[2px]" />;
                const isFuture = d > today;
                const status = isFuture ? 'none' : getDayStatus(d, habits);
                const isToday = d === today;
                return (
                  <button
                    key={wi}
                    onClick={() => !isFuture && setPopupDate(d)}
                    disabled={isFuture}
                    title={d}
                    className={`w-[11px] h-[11px] mr-[2px] rounded-sm transition
                      ${getDayStatusColor(status)}
                      ${isFuture ? 'opacity-30 cursor-default' : 'hover:opacity-70 cursor-pointer'}
                      ${isToday ? 'ring-1 ring-amber-400' : ''}
                    `}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /><span className="text-xs text-gray-500 dark:text-gray-400">All done</span></div>
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-amber-400" /><span className="text-xs text-gray-500 dark:text-gray-400">Some done</span></div>
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-gray-200 dark:bg-gray-700" /><span className="text-xs text-gray-500 dark:text-gray-400">None</span></div>
      </div>

      {popupDate && <DayPopup date={popupDate} habits={habits} onClose={() => setPopupDate(null)} />}
    </div>
  );
}

// ── Calendar Section ────────────────────────────────────────────────────────
function CalendarSection({ habits }: { habits: Habit[] }) {
  const [view, setView] = useState<'week' | 'month' | 'year'>('week');

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Habit Calendar</h2>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {(['week', 'month', 'year'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                view === v
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {view === 'week' && <WeekView habits={habits} />}
      {view === 'month' && <MonthView habits={habits} />}
      {view === 'year' && <YearView habits={habits} />}
    </div>
  );
}

// ── Today's Habits by Time ──────────────────────────────────────────────────
function TodayHabitsSection({ habits, today, onLog }: {
  habits: Habit[];
  today: string;
  onLog: (id: string, date: string) => void;
}) {
  // Group by timeOfDay, preserving order
  const groups = useMemo(() => {
    const grouped: Record<string, Habit[]> = {};
    for (const h of habits) {
      const key = h.timeOfDay || 'all_day';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(h);
    }
    return TIME_OF_DAY_ORDER
      .filter(k => grouped[k] && grouped[k].length > 0)
      .map(k => ({ key: k, habits: grouped[k] }));
  }, [habits]);

  if (groups.length === 0) return null;

  const groupLabel = (key: string): string => {
    const opt = TIME_OF_DAY_OPTIONS.find(o => o.value === key);
    return opt ? opt.label : key;
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Today's Habits</h2>
      <div className="space-y-4">
        {groups.map(({ key, habits: groupHabits }) => (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2">
              {key !== 'all_day' && <Clock className="h-3.5 w-3.5 text-gray-400" />}
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {groupLabel(key)}
                {key !== 'all_day' && key !== 'custom' && (
                  <span className="ml-1 font-normal normal-case">
                    ({TIME_OF_DAY_OPTIONS.find(o => o.value === key)?.time})
                  </span>
                )}
              </span>
            </div>
            <div className="space-y-2">
              {groupHabits.map(h => {
                const done = h.logs.some(l => l.logDate === today);
                const displayTime = getDisplayTime(h);
                return (
                  <div key={h.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${done ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                    <span className="text-lg">{h.iconEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                        {h.name}
                      </p>
                      {displayTime && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{displayTime}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onLog(h.id, today)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition flex-shrink-0 ${
                        done ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Habit Card ──────────────────────────────────────────────────────────────
function HabitCard({ habit, dates, onLog, onDelete }: {
  habit: Habit;
  dates: string[];
  onLog: (id: string, date: string) => void;
  onDelete: (id: string) => void;
}) {
  const logSet = new Set(habit.logs.map(l => l.logDate));
  const streak = getStreakCount(habit.logs);
  const today = dates[dates.length - 1];
  const todayDone = logSet.has(today);

  // Parse daysOfWeek — default to all 7 days if not set
  const activeDays: number[] = useMemo(() => {
    try {
      const parsed = JSON.parse(habit.daysOfWeek || '[0,1,2,3,4,5,6]');
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return [0, 1, 2, 3, 4, 5, 6];
  }, [habit.daysOfWeek]);

  // Filter last-7 days to only the habit's active days
  const activeDates = useMemo(
    () => dates.filter(d => activeDays.includes(new Date(d + 'T12:00:00').getDay())),
    [dates, activeDays],
  );

  const weekDone = activeDates.filter(d => logSet.has(d)).length;
  const weekTotal = activeDates.length;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden hover:shadow-md transition-all">
      <div className="h-1 w-full" style={{ backgroundColor: habit.color }} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{habit.iconEmoji}</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{habit.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Flame className="h-3 w-3 text-amber-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{streak} day streak</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onLog(habit.id, today)}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                todayDone ? 'text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={todayDone ? { backgroundColor: habit.color } : {}}
            >
              <CheckCircle2 className="h-5 w-5" />
            </button>
            <button onClick={() => onDelete(habit.id)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-300 dark:text-gray-600 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Day grid — only shows habit's active days */}
        <div className="flex gap-1 items-center">
          {activeDates.length > 0 ? activeDates.map((date) => {
            const done = logSet.has(date);
            const isToday = date === today;
            const dayLabel = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(date + 'T12:00:00').getDay()];
            return (
              <button key={date} onClick={() => onLog(habit.id, date)}
                className={`flex-1 flex flex-col items-center gap-1 rounded-lg py-1.5 transition ${
                  done ? 'text-white' : isToday ? 'bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                style={done ? { backgroundColor: habit.color } : {}}>
                <span className={`text-[10px] font-medium ${done ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'}`}>{dayLabel}</span>
                <div className={`h-3 w-3 rounded-full ${done ? 'bg-white/40' : 'bg-gray-200 dark:bg-gray-700'}`} />
              </button>
            );
          }) : dates.map((date, i) => {
            const done = logSet.has(date);
            const isToday = i === dates.length - 1;
            const dayLabel = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(date + 'T12:00:00').getDay()];
            return (
              <button key={date} onClick={() => onLog(habit.id, date)}
                className={`flex-1 flex flex-col items-center gap-1 rounded-lg py-1.5 transition ${
                  done ? 'text-white' : isToday ? 'bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                style={done ? { backgroundColor: habit.color } : {}}>
                <span className={`text-[10px] font-medium ${done ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'}`}>{dayLabel}</span>
                <div className={`h-3 w-3 rounded-full ${done ? 'bg-white/40' : 'bg-gray-200 dark:bg-gray-700'}`} />
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {weekDone}/{weekTotal} this week
            {weekTotal < 7 && <span className="ml-1 opacity-60">({activeDays.length}×/wk)</span>}
          </span>
          <div className="h-1.5 flex-1 mx-2 rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${weekTotal > 0 ? (weekDone / weekTotal) * 100 : 0}%`, backgroundColor: habit.color }} />
          </div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const dates = useMemo(() => getLast7Days(), []);
  const today = dates[dates.length - 1];

  const fetchHabits = useCallback(() => {
    fetch('/api/habits')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setHabits(d); })
      .catch(() => toast('Failed to load habits', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const handleLog = async (habitId: string, date: string) => {
    try {
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });
      const data = await res.json();
      setHabits(prev => prev.map(h => {
        if (h.id !== habitId) return h;
        if (data.removed) {
          return { ...h, logs: h.logs.filter(l => l.logDate !== date) };
        }
        const existing = h.logs.find(l => l.logDate === date);
        if (existing) return h;
        return { ...h, logs: [...h.logs, { logDate: date, value: 1 }] };
      }));
    } catch {
      toast('Failed to log habit', 'error');
    }
  };

  const handleDelete = async (habitId: string) => {
    if (!confirm('Archive this habit?')) return;
    try {
      await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
      setHabits(prev => prev.filter(h => h.id !== habitId));
      toast('Habit archived');
    } catch {
      toast('Failed to archive habit', 'error');
    }
  };

  const totalLogged = habits.filter(h => h.logs.some(l => l.logDate === today)).length;
  const totalStreaks = habits.reduce((s, h) => s + getStreakCount(h.logs), 0);
  const longestStreak = Math.max(0, ...habits.map(h => getStreakCount(h.logs)));

  const completionRate = habits.length > 0 ? totalLogged / habits.length : 0;
  const insightMessage = useMemo(() => {
    if (habits.length === 0) return null;
    if (completionRate === 1) return "🎉 Perfect day! All habits done — you're unstoppable!";
    if (completionRate >= 0.7) return '🌟 Great job! Almost there, keep the momentum!';
    if (completionRate >= 0.4) return '💪 Good start! A few more habits to go today.';
    if (completionRate > 0) return '🌱 You\'ve started! Every habit done counts.';
    return '☀️ Fresh start! Let\'s make today count.';
  }, [habits.length, completionRate]);

  return (
    <div className="space-y-6">

      {/* ── Overview: Insight + Stats + New Habit button ── */}
      {/* Insight message */}
      {insightMessage && !loading && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-5 py-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{insightMessage}</p>
        </div>
      )}

      {/* Stats row with New Habit button in top-right */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Overview</h2>
          <button onClick={() => setShowModal(true)}
            className="hidden md:flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition">
            <Plus className="h-3.5 w-3.5" />
            New Habit
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Today's Done", value: `${totalLogged}/${habits.length}`, sub: 'habits completed' },
            { label: 'Total Streak XP', value: totalStreaks, sub: 'combined streak days' },
            { label: 'Longest Streak', value: longestStreak, sub: 'consecutive days' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3">
              <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-0.5">{label}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Today's habits by time */}
      {!loading && habits.length > 0 && (
        <TodayHabitsSection habits={habits} today={today} onLog={handleLog} />
      )}

      {/* Habit grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-44 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
        </div>
      ) : habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950">
            <Flame className="h-8 w-8 text-amber-500" />
          </div>
          <p className="text-base font-semibold text-gray-900 dark:text-white">No habits yet</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start building your daily system</p>
          <button onClick={() => setShowModal(true)}
            className="mt-4 flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition">
            <Plus className="h-4 w-4" />
            Create Habit
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {habits.map(habit => (
            <HabitCard key={habit.id} habit={habit} dates={dates} onLog={handleLog} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Calendar section — between Habit grid and Streaks sidebar page */}
      {!loading && habits.length > 0 && (
        <CalendarSection habits={habits} />
      )}

      {/* Mobile FAB */}
      <button onClick={() => setShowModal(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-amber-600 text-white shadow-lg hover:bg-amber-700 transition md:hidden">
        <Plus className="h-6 w-6" />
      </button>

      {showModal && (
        <AddHabitModal
          onClose={() => setShowModal(false)}
          onCreated={h => { setHabits(prev => [{ ...h, logs: [] }, ...prev]); setShowModal(false); }}
        />
      )}
    </div>
  );
}
