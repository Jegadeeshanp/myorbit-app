'use client';

import { useMemo, useState } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, List, Menu,
} from 'lucide-react';
import TaskItem from '@/components/tasks/TaskItem';

type Subtask = { id: string; title: string; isDone: boolean };
type Task = {
  id: string;
  title: string;
  notes?: string;
  dueDate?: string;
  dueTime?: string;
  status: string;
  priority: string;
  tags: string;
  listId?: string;
  isActive?: boolean;
  subtasks: Subtask[];
  list?: { id: string; name: string; emoji?: string } | null;
};

type CalendarView = 'year' | 'month' | 'week' | '3days' | 'day';
type PanelMode = 'calendar' | 'timeline' | 'today-list';

interface Props {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onOpenSidebar?: () => void;
}

const CALENDAR_VIEWS: Array<{ key: CalendarView; label: string }> = [
  { key: 'year', label: 'Year' },
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: '3days', label: '3 Days' },
  { key: 'day', label: 'Day' },
];

const WEEKDAY_LABELS = [
  { key: 'm', label: 'M' },
  { key: 't1', label: 'T' },
  { key: 'w', label: 'W' },
  { key: 't2', label: 'T' },
  { key: 'f', label: 'F' },
  { key: 's1', label: 'S' },
  { key: 's2', label: 'S' },
];

const EVENT_TONES = [
  'bg-sky-500/20 text-sky-100 border-sky-300/30',
  'bg-indigo-500/25 text-indigo-100 border-indigo-300/30',
  'bg-rose-500/20 text-rose-100 border-rose-300/30',
  'bg-amber-500/20 text-amber-100 border-amber-300/30',
  'bg-emerald-500/20 text-emerald-100 border-emerald-300/30',
  'bg-violet-500/20 text-violet-100 border-violet-300/30',
];

const HOURS = Array.from({ length: 16 }, (_, index) => 6 + index);

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function parseDate(value?: string) {
  if (!value) return startOfDay(new Date());
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return startOfDay(next);
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return startOfDay(next);
}

function addYears(date: Date, amount: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + amount);
  return startOfDay(next);
}

function startOfWeek(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function buildRange(date: Date, view: CalendarView) {
  if (view === 'day') return [startOfDay(date)];
  if (view === '3days') return Array.from({ length: 3 }, (_, index) => addDays(date, index));
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

function buildMonthGrid(date: Date) {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function relativeLabel(date: Date) {
  const today = startOfDay(new Date());
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  return '';
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    if (left.status === 'completed' && right.status !== 'completed') return 1;
    if (left.status !== 'completed' && right.status === 'completed') return -1;
    if (left.dueTime && right.dueTime) return left.dueTime.localeCompare(right.dueTime);
    if (left.dueTime) return -1;
    if (right.dueTime) return 1;
    return left.title.localeCompare(right.title);
  });
}

function taskTone(task: Task) {
  const seed = task.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return EVENT_TONES[seed % EVENT_TONES.length];
}

function TaskPill({ task, onClick }: { task: Task; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={event => {
        event.stopPropagation();
        onClick?.();
      }}
      className={`flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition hover:brightness-110 ${taskTone(task)}`}
    >
      <span className="min-w-0 flex-1 truncate text-xs font-medium">{task.title}</span>
      {task.dueTime ? <span className="shrink-0 text-[10px] opacity-75">{task.dueTime}</span> : null}
    </button>
  );
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export default function TaskCalendar({ tasks, onTaskClick, onOpenSidebar }: Props) {
  const today = startOfDay(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('week');
  const [panelMode, setPanelMode] = useState<PanelMode>('calendar');
  const [selectedDate, setSelectedDate] = useState(formatDateKey(today));
  const [referenceDate, setReferenceDate] = useState(today);
  const [completedOpen, setCompletedOpen] = useState(false);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();

    for (const task of tasks) {
      if (!task.dueDate) continue;
      const bucket = map.get(task.dueDate) ?? [];
      bucket.push(task);
      map.set(task.dueDate, bucket);
    }

    for (const [key, value] of map.entries()) {
      map.set(key, sortTasks(value));
    }

    return map;
  }, [tasks]);

  const selectedDateValue = parseDate(selectedDate);
  const visibleDays = useMemo(() => buildRange(referenceDate, calendarView), [referenceDate, calendarView]);
  const monthGrid = useMemo(() => buildMonthGrid(referenceDate), [referenceDate]);
  const selectedTasks = useMemo(() => sortTasks(tasksByDate.get(selectedDate) ?? []), [tasksByDate, selectedDate]);
  const activeTasks = selectedTasks.filter(task => task.status !== 'completed');
  const completedTasks = selectedTasks.filter(task => task.status === 'completed');
  const timelineTimedTasks = activeTasks.filter(task => task.dueTime);
  const timelineUntimedTasks = activeTasks.filter(task => !task.dueTime);

  const headerTitle = calendarView === 'month'
    ? referenceDate.toLocaleDateString('en-IN', { month: 'long' })
    : calendarView === 'year'
    ? referenceDate.toLocaleDateString('en-IN', { year: 'numeric' })
    : selectedDateValue.toLocaleDateString('en-IN', { month: 'long', day: 'numeric' });

  const headerSubtitle = calendarView === 'month'
    ? referenceDate.toLocaleDateString('en-IN', { year: 'numeric' })
    : calendarView === 'year'
    ? ''
    : relativeLabel(selectedDateValue) || selectedDateValue.toLocaleDateString('en-IN', { weekday: 'long' });

  const togglePanelMode = () => {
    setPanelMode(current => {
      if (current === 'calendar') return 'timeline';
      if (current === 'timeline') return 'today-list';
      return 'calendar';
    });
  };

  const selectDate = (date: Date) => {
    const normalized = startOfDay(date);
    setSelectedDate(formatDateKey(normalized));
    setReferenceDate(normalized);
  };

  const navigate = (direction: -1 | 1) => {
    const nextDate = calendarView === 'month'
      ? addMonths(referenceDate, direction)
      : calendarView === 'year'
      ? addYears(referenceDate, direction)
      : calendarView === 'week'
      ? addDays(referenceDate, direction * 7)
      : calendarView === '3days'
      ? addDays(referenceDate, direction * 3)
      : addDays(referenceDate, direction);

    selectDate(nextDate);
  };

  return (
    <div className="flex h-full flex-col bg-[#1A2029] text-white">
      <div className="border-b border-white/8 px-4 py-2">
        <div className="flex items-center gap-3">
          {onOpenSidebar ? (
            <button
              type="button"
              onClick={onOpenSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-lg font-semibold text-white">{headerTitle}</p>
            {headerSubtitle ? <p className="truncate text-xs text-slate-400">{headerSubtitle}</p> : null}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={togglePanelMode}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white"
              title="Toggle view"
            >
              {panelMode === 'calendar' ? <List className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {panelMode === 'calendar' ? (
        <div className="flex-1 overflow-auto bg-[#12161D]">
          {(calendarView === 'week' || calendarView === '3days' || calendarView === 'day') ? (
            <div className="overflow-hidden border-0 bg-[#161B23]">
              <div
                className="grid border-b border-white/8"
                style={{ gridTemplateColumns: `72px repeat(${visibleDays.length}, minmax(0, 1fr))` }}
              >
                <div className="border-r border-white/8 px-3 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                  Time
                </div>
                {visibleDays.map(day => {
                  const dayKey = formatDateKey(day);
                  const isSelected = dayKey === selectedDate;
                  const isToday = dayKey === formatDateKey(today);

                  return (
                    <button
                      key={dayKey}
                      type="button"
                      onClick={() => selectDate(day)}
                      className={`border-r border-white/8 px-2 py-2 text-left last:border-r-0 ${
                        isSelected ? 'bg-white/5' : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      <p className={`text-sm font-medium leading-tight ${isToday ? 'text-emerald-400' : 'text-slate-200'}`}>
                        <span className="block text-[10px] uppercase tracking-wide opacity-70">{day.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                        <span className="block text-sm font-bold">{day.getDate()}</span>
                      </p>
                    </button>
                  );
                })}
              </div>

              <div
                className="grid border-b border-white/8"
                style={{ gridTemplateColumns: `72px repeat(${visibleDays.length}, minmax(0, 1fr))` }}
              >
                <div className="border-r border-white/8 px-3 py-3 text-xs text-slate-500">All day</div>
                {visibleDays.map(day => {
                  const dayKey = formatDateKey(day);
                  const untimedTasks = (tasksByDate.get(dayKey) ?? []).filter(task => !task.dueTime);
                  const isSelected = dayKey === selectedDate;

                  return (
                    <div
                      key={`${dayKey}-all-day`}
                      className={`min-h-[64px] border-r border-white/8 px-2 py-2 last:border-r-0 ${
                        isSelected ? 'bg-white/[0.03]' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        {untimedTasks.slice(0, 2).map(task => (
                          <TaskPill key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
                        ))}
                        {untimedTasks.length > 2 ? (
                          <p className="text-[11px] text-slate-500">+{untimedTasks.length - 2} more</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="grid"
                  style={{ gridTemplateColumns: `72px repeat(${visibleDays.length}, minmax(0, 1fr))` }}
                >
                  <div className="border-r border-t border-white/8 px-3 py-3 text-xs text-slate-500">
                    {formatHour(hour)}
                  </div>
                  {visibleDays.map(day => {
                    const dayKey = formatDateKey(day);
                    const hourTasks = (tasksByDate.get(dayKey) ?? []).filter(task => {
                      if (!task.dueTime) return false;
                      const taskHour = Number(task.dueTime.split(':')[0]);
                      return taskHour === hour;
                    });
                    const isSelected = dayKey === selectedDate;

                    return (
                      <div
                        key={`${dayKey}-${hour}`}
                        className={`min-h-[68px] border-r border-t border-white/8 px-2 py-2 last:border-r-0 ${
                          isSelected ? 'bg-white/[0.03]' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          {hourTasks.map(task => (
                            <TaskPill key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : null}

          {calendarView === 'month' ? (
            <div className="overflow-hidden border-0 bg-[#161B23]">
              <div className="grid grid-cols-7 border-b border-white/8">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(label => (
                  <p key={label} className="border-r border-white/8 px-3 py-2 text-xs text-slate-400 last:border-r-0">
                    {label}
                  </p>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthGrid.map(day => {
                  const dayKey = formatDateKey(day);
                  const dayTasks = tasksByDate.get(dayKey) ?? [];
                  const isSelected = dayKey === selectedDate;
                  const isToday = dayKey === formatDateKey(today);
                  const isCurrentMonth = day.getMonth() === referenceDate.getMonth();

                  return (
                    <div
                      key={dayKey}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectDate(day)}
                      onKeyDown={e => e.key === 'Enter' && selectDate(day)}
                      className={`min-h-[120px] cursor-pointer border-r border-t border-white/8 px-2 py-2 text-left align-top transition last:border-r-0 ${
                        isSelected ? 'bg-white/5' : 'hover:bg-white/[0.03]'
                      } ${!isCurrentMonth ? 'opacity-45' : ''}`}
                    >
                      <p className={`mb-2 text-sm font-medium ${isToday ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {day.getDate()}
                      </p>
                      <div className="space-y-1">
                        {dayTasks.slice(0, 2).map(task => (
                          <TaskPill key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
                        ))}
                        {dayTasks.length > 2 ? <p className="text-[11px] text-slate-500">+{dayTasks.length - 2} more</p> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {calendarView === 'year' ? (
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 12 }, (_, monthIndex) => {
                const monthDate = new Date(referenceDate.getFullYear(), monthIndex, 1);
                const days = buildMonthGrid(monthDate).slice(0, 35);

                return (
                  <div key={monthIndex} className="border border-white/8 bg-[#161B23] p-3">
                    <p className="mb-3 text-lg font-semibold text-white">
                      {monthDate.toLocaleDateString('en-IN', { month: 'long' })}
                    </p>
                    <div className="mb-2 grid grid-cols-7 gap-1 text-[11px] text-slate-500">
                      {WEEKDAY_LABELS.map(({ key, label }) => (
                        <span key={`${monthIndex}-${key}`} className="text-center">{label}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {days.map(day => {
                        const dayKey = formatDateKey(day);
                        const hasTasks = (tasksByDate.get(dayKey) ?? []).length > 0;
                        const isSelected = dayKey === selectedDate;
                        const isToday = dayKey === formatDateKey(today);
                        const isCurrentMonth = day.getMonth() === monthIndex;

                        return (
                          <button
                            key={dayKey}
                            type="button"
                            onClick={() => selectDate(day)}
                            className={`flex h-8 w-8 items-center justify-center rounded-md text-xs transition ${
                              isSelected ? 'bg-emerald-500 text-white' :
                              isToday ? 'bg-emerald-500/15 text-emerald-300' :
                              hasTasks ? 'bg-white/5 text-slate-200' :
                              isCurrentMonth ? 'text-slate-500 hover:bg-white/5' : 'text-slate-700'
                            }`}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {panelMode === 'timeline' ? (
        <div className="flex-1 overflow-auto bg-[#12161D] p-3">
          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-200">{headerSubtitle || 'Selected day'}</p>
            <p className="text-xs text-slate-500">
              {selectedDateValue.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {timelineTimedTasks.length > 0 ? (
            <div className="space-y-2">
              {timelineTimedTasks.map(task => (
                <div key={task.id} className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-3">
                  <div className="flex items-center gap-2 pt-3 text-xs font-medium text-sky-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{task.dueTime}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onTaskClick?.(task)}
                    className={`rounded-xl border px-4 py-3 text-left transition hover:brightness-110 ${taskTone(task)}`}
                  >
                    <p className="text-sm font-medium">{task.title}</p>
                    {task.subtasks.length > 0 ? <p className="mt-1 text-xs opacity-70">{task.subtasks.length} subtasks</p> : null}
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {timelineUntimedTasks.length > 0 ? (
            <div className={timelineTimedTasks.length > 0 ? 'mt-5' : ''}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">No specific time</p>
              <div className="space-y-2">
                {timelineUntimedTasks.map(task => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onTaskClick?.(task)}
                    className="w-full rounded-xl border border-white/8 bg-[#161B23] px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-white/5"
                  >
                    <p className="font-medium">{task.title}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {timelineTimedTasks.length === 0 && timelineUntimedTasks.length === 0 ? (
            <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-white/8 bg-[#161B23] text-sm text-slate-500">
              No tasks for this date
            </div>
          ) : null}
        </div>
      ) : null}

      {panelMode === 'today-list' ? (
        <div className="flex-1 overflow-auto bg-[#12161D] p-3">
          <div className="mb-3">
            <p className="text-base font-semibold text-white">{headerSubtitle || 'Selected day'}</p>
            <p className="text-xs text-slate-500">
              {selectedDateValue.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {activeTasks.length > 0 ? (
            <div className="space-y-1">
              {activeTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick?.(task)}
                  subtasksMode="expanded"
                />
              ))}
            </div>
          ) : null}

          {completedTasks.length > 0 ? (
            <div className={activeTasks.length > 0 ? 'mt-4' : ''}>
              <button
                type="button"
                onClick={() => setCompletedOpen(open => !open)}
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
              >
                <ChevronRight className={`h-4 w-4 transition ${completedOpen ? 'rotate-90' : ''}`} />
                Completed
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-400">{completedTasks.length}</span>
              </button>

              {completedOpen ? (
                <div className="space-y-1">
                  {completedTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick?.(task)}
                      subtasksMode="expanded"
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-white/8 bg-[#161B23] text-sm text-slate-500">
              No tasks for this date
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="border-t border-white/8 bg-[#1A2029] px-4 py-1">
        <div className="mx-auto flex w-fit items-center justify-center gap-5">
          {CALENDAR_VIEWS.map(view => (
            <button
              key={view.key}
              type="button"
              onClick={() => { setCalendarView(view.key); setPanelMode('calendar'); }}
              className={`border-b px-0 py-1 text-sm font-medium transition ${
                panelMode === 'calendar' && calendarView === view.key
                  ? 'border-emerald-400 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}