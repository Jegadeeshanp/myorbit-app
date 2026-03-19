'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  X, Plus, Trash2, CheckCircle2, Circle, Flag, Calendar, Bell,
  RotateCcw, Clock, ChevronRight, Tag, Timer, Moon, Sun, ChevronLeft, ChevronDown,
} from 'lucide-react';
import { toast } from '@/components/Toast';

type Subtask = { id: string; title: string; isDone: boolean };
type TaskList = { id: string; name: string; emoji?: string };
type Task = {
  id: string;
  title: string;
  notes?: string;
  status: string;
  priority: string;
  dueDate?: string;
  dueTime?: string;
  tags: string;
  listId?: string;
  isActive?: boolean;
  subtasks: Subtask[];
  list?: { id: string; name: string; emoji?: string } | null;
};

const PRIORITY_FLAG_COLOR: Record<string, string> = {
  high: 'text-rose-500',
  medium: 'text-amber-400',
  low: 'text-blue-400',
  none: 'text-slate-500',
};

const REMINDER_OPTIONS = [
  { value: 'on-time', label: 'On time' },
  { value: '5m', label: '5 minutes early' },
  { value: '30m', label: '30 minutes early' },
  { value: '1h', label: '1 hour early' },
  { value: '1d', label: '1 day early' },
  { value: 'custom', label: 'Custom' },
];

const REPEAT_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'weekdays', label: 'Every Weekday' },
  { value: 'indian', label: 'Indian Repeat' },
  { value: 'custom', label: 'Custom' },
];

function formatDateLabel(d?: string) {
  if (!d) return 'Today';
  const date = new Date(`${d}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
}

function parseTags(raw: string) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function buildSystemTag(prefix: string, value: string) {
  return `${prefix}:${value}`;
}

function extractSystemValue(tags: string[], prefix: string, fallback: string) {
  const hit = tags.find(tag => tag.startsWith(`${prefix}:`));
  return hit ? hit.slice(prefix.length + 1) : fallback;
}

function visibleTags(tags: string[]) {
  return tags.filter(tag => !tag.startsWith('repeat:') && !tag.startsWith('reminder:'));
}

function MiniCalendar({
  selectedDate,
  onChange,
}: {
  selectedDate: string;
  onChange: (d: string) => void;
}) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    if (!selectedDate) return;
    const [y, m] = selectedDate.split('-').map(Number);
    setViewDate(new Date(y, m - 1, 1));
  }, [selectedDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows = cells.length / 7;
  const todayStr = today.toISOString().split('T')[0];
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1A2029] p-3">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="rounded p-1 text-slate-400 transition hover:text-white">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-slate-200">{monthName}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="rounded p-1 text-slate-400 transition hover:text-white">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-[24px_repeat(7,1fr)] gap-0.5">
        <div />
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="py-0.5 text-center text-[10px] font-medium text-slate-500">{d}</div>
        ))}
      </div>

      {Array.from({ length: rows }, (_, ri) => (
        <div key={ri} className="mb-0.5 grid grid-cols-[24px_repeat(7,1fr)] gap-0.5">
          <div className="flex items-center justify-end pr-1 text-[10px] text-slate-600">{10 + ri}</div>
          {cells.slice(ri * 7, ri * 7 + 7).map((day, ci) => {
            if (!day) return <div key={ci} />;
            const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            return (
              <button
                key={ci}
                onClick={() => onChange(dateStr)}
                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition ${
                  isSelected
                    ? 'bg-emerald-500 text-white'
                    : isToday
                    ? 'bg-emerald-950/70 text-emerald-400'
                    : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface Props {
  task: Task;
  lists: TaskList[];
  onClose: () => void;
  onUpdated: (t: Task) => void;
  onDeleted: (id: string) => void;
  onCompleted: (id: string) => void;
}

export default function TaskDetail({ task, lists, onClose, onUpdated, onDeleted, onCompleted }: Props) {
  const initialTags = useMemo(() => parseTags(task.tags), [task.tags]);

  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || '');
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [dueTime, setDueTime] = useState(task.dueTime || '');
  const [listId, setListId] = useState(task.listId || '');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [visibleTagList, setVisibleTagList] = useState<string[]>(visibleTags(initialTags));
  const [reminder, setReminder] = useState(extractSystemValue(initialTags, 'reminder', 'on-time'));
  const [repeat, setRepeat] = useState(extractSystemValue(initialTags, 'repeat', 'none'));
  const [saving, setSaving] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showReminderMenu, setShowReminderMenu] = useState(false);
  const [showRepeatMenu, setShowRepeatMenu] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const parsed = parseTags(task.tags);
    setTitle(task.title);
    setNotes(task.notes || '');
    setPriority(task.priority);
    setDueDate(task.dueDate || '');
    setDueTime(task.dueTime || '');
    setListId(task.listId || '');
    setSubtasks(task.subtasks || []);
    setVisibleTagList(visibleTags(parsed));
    setReminder(extractSystemValue(parsed, 'reminder', 'on-time'));
    setRepeat(extractSystemValue(parsed, 'repeat', 'none'));
    setShowDate(false);
    setShowAddSubtask(false);
    setShowTags(false);
    setShowReminderMenu(false);
    setShowRepeatMenu(false);
  }, [task]);

  const composedTags = useMemo(() => {
    const next = [...visibleTagList];
    if (reminder) next.push(buildSystemTag('reminder', reminder));
    if (repeat && repeat !== 'none') next.push(buildSystemTag('repeat', repeat));
    return next;
  }, [visibleTagList, reminder, repeat]);

  const handleSave = async (overrides?: Partial<{ title: string; notes: string; priority: string; dueDate: string; dueTime: string; listId: string; tags: string[] }>) => {
    const nextPayload = {
      title: overrides?.title ?? title,
      notes: overrides?.notes ?? notes,
      priority: overrides?.priority ?? priority,
      dueDate: overrides?.dueDate ?? dueDate,
      dueTime: overrides?.dueTime ?? dueTime,
      listId: overrides?.listId ?? listId,
      tags: overrides?.tags ?? composedTags,
    };

    if (!nextPayload.title.trim()) {
      toast('Title required', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: nextPayload.title.trim(),
          notes: nextPayload.notes,
          priority: nextPayload.priority,
          dueDate: nextPayload.dueDate || null,
          dueTime: nextPayload.dueTime || null,
          tags: nextPayload.tags,
          listId: nextPayload.listId || null,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      onUpdated(updated);
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtask.trim() }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setSubtasks(prev => [...prev, created]);
      setNewSubtask('');
    } catch {
      toast('Failed to add subtask', 'error');
    }
  };

  const toggleSubtask = async (sid: string) => {
    const st = subtasks.find(item => item.id === sid);
    if (!st) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks/${sid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDone: !st.isDone }),
      });
      if (!res.ok) throw new Error();
      setSubtasks(prev => prev.map(item => item.id === sid ? { ...item, isDone: !item.isDone } : item));
    } catch {
      toast('Failed to update', 'error');
    }
  };

  const deleteSubtask = async (sid: string) => {
    try {
      await fetch(`/api/tasks/${task.id}/subtasks/${sid}`, { method: 'DELETE' });
      setSubtasks(prev => prev.filter(item => item.id !== sid));
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  const addTag = () => {
    const nextTag = tagInput.trim().toLowerCase();
    if (!nextTag || visibleTagList.includes(nextTag)) return;
    const next = [...visibleTagList, nextTag];
    setVisibleTagList(next);
    setTagInput('');
    void handleSave({ tags: [...next, buildSystemTag('reminder', reminder), ...(repeat && repeat !== 'none' ? [buildSystemTag('repeat', repeat)] : [])] });
  };

  const removeTag = (tag: string) => {
    const next = visibleTagList.filter(item => item !== tag);
    setVisibleTagList(next);
    void handleSave({ tags: [...next, buildSystemTag('reminder', reminder), ...(repeat && repeat !== 'none' ? [buildSystemTag('repeat', repeat)] : [])] });
  };

  const reminderLabel = REMINDER_OPTIONS.find(option => option.value === reminder)?.label ?? 'On time';
  const repeatLabel = repeat === 'none' ? 'No repeat' : REPEAT_OPTIONS.find(option => option.value === repeat)?.label ?? 'Custom';
  const currentList = task.list || lists.find(list => list.id === listId);
  const topLabel = `${formatDateLabel(dueDate)}${dueTime ? `, ${dueTime}` : ''}`;

  return (
    <div className="flex h-screen w-full max-w-[420px] flex-none flex-col overflow-y-auto border-l border-white/10 bg-[#1A2029] text-white shadow-sm xl:max-w-none">
      <div className="flex flex-none items-center gap-2 border-b border-white/10 px-5 py-4">
        {task.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-slate-500" />}
        <span className="flex flex-1 items-center gap-2 truncate text-xs text-sky-400">
          <span className="truncate">{topLabel || 'Today'}</span>
          {repeat !== 'none' ? <RotateCcw className="h-3.5 w-3.5 text-emerald-400" /> : null}
        </span>
        <Flag className={`h-4 w-4 ${PRIORITY_FLAG_COLOR[priority]}`} />
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-none px-5 py-5">
        <input
          className="w-full bg-transparent text-lg font-bold text-white placeholder-slate-500 focus:outline-none"
          value={title}
          placeholder="Task title..."
          onChange={e => setTitle(e.target.value)}
          onBlur={() => void handleSave({ title })}
          onKeyDown={e => e.key === 'Enter' && handleSave({ title })}
        />
        {saving ? <p className="mt-1 text-xs text-slate-500">Saving...</p> : null}
      </div>

      <div className="px-5 pb-4">
        <textarea
          value={notes}
          placeholder="Add notes"
          rows={4}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => void handleSave({ notes })}
          className="w-full resize-none rounded-2xl border border-white/10 bg-[#12161D] px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-24">
        <button onClick={() => setShowDate(open => !open)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/5">
          <Calendar className="h-4 w-4 flex-none text-slate-500" />
          <span className="text-sm text-slate-200">Date</span>
          <span className="ml-auto text-xs text-sky-400">{formatDateLabel(dueDate)}</span>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${showDate ? 'rotate-180' : ''}`} />
        </button>

        {showDate ? (
          <div className="mx-1 rounded-2xl border border-white/10 bg-[#12161D] p-3">
            <div className="mb-3 flex gap-1">
              <button className="flex-1 rounded-xl bg-white/10 py-1.5 text-xs font-medium text-white">Date</button>
              <button className="flex-1 rounded-xl py-1.5 text-xs font-medium text-slate-400">Duration</button>
            </div>

            <div className="mb-3 flex gap-1">
              {[
                { icon: Sun, label: 'Morning', action: () => { setDueTime('09:00'); if (!dueDate) setDueDate(new Date().toISOString().split('T')[0]); } },
                { icon: Bell, label: 'Alarm', action: () => setReminder('on-time') },
                { label: '+7', action: () => {
                  const d = new Date();
                  d.setDate(d.getDate() + 7);
                  setDueDate(d.toISOString().split('T')[0]);
                } },
                { icon: Moon, label: 'Evening', action: () => { setDueTime('20:00'); if (!dueDate) setDueDate(new Date().toISOString().split('T')[0]); } },
                { icon: ChevronRight, label: 'Forward', action: () => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  setDueDate(d.toISOString().split('T')[0]);
                } },
              ].map((shortcut, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={shortcut.action}
                  className="flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  {'icon' in shortcut && shortcut.icon ? <shortcut.icon className="h-4 w-4" /> : <span className="text-sm font-bold">{shortcut.label}</span>}
                  {'icon' in shortcut && shortcut.icon ? <span className="text-[10px]">{shortcut.label}</span> : null}
                </button>
              ))}
            </div>

            <MiniCalendar selectedDate={dueDate || new Date().toISOString().split('T')[0]} onChange={setDueDate} />

            <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#1A2029] px-3 py-2">
              <Clock className="h-4 w-4 text-sky-400" />
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="flex-1 bg-transparent text-sm text-sky-400 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowReminderMenu(open => !open)}
              className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-white/5"
            >
              <Bell className="h-4 w-4 text-sky-400" />
              <span className="text-sm text-sky-400">Reminder</span>
              <span className="ml-auto text-sm text-sky-400">{reminderLabel}</span>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>

            {showReminderMenu ? (
              <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#1A2029]">
                {REMINDER_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { setReminder(option.value); setShowReminderMenu(false); }}
                    className={`block w-full px-4 py-3 text-left text-sm transition ${reminder === option.value ? 'bg-white/5 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setShowRepeatMenu(open => !open)}
              className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-white/5"
            >
              <RotateCcw className="h-4 w-4 text-sky-400" />
              <span className="text-sm text-sky-400">Repeat</span>
              <span className="ml-auto text-sm text-sky-400">{repeatLabel}</span>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>

            {showRepeatMenu ? (
              <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#1A2029]">
                <button
                  type="button"
                  onClick={() => { setRepeat('none'); setShowRepeatMenu(false); }}
                  className={`block w-full px-4 py-3 text-left text-sm transition ${repeat === 'none' ? 'bg-white/5 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  No repeat
                </button>
                {REPEAT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { setRepeat(option.value); setShowRepeatMenu(false); }}
                    className={`block w-full px-4 py-3 text-left text-sm transition ${repeat === option.value ? 'bg-white/5 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDueDate('');
                  setDueTime('');
                  setReminder('on-time');
                  setRepeat('none');
                  void handleSave({ dueDate: '', dueTime: '', tags: [...visibleTagList, buildSystemTag('reminder', 'on-time')] });
                  setShowDate(false);
                }}
                className="flex-1 rounded-xl border border-white/10 bg-[#1A2029] py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleSave({ dueDate, dueTime, tags: composedTags });
                  setShowDate(false);
                }}
                className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                OK
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <Flag className="h-4 w-4 flex-none text-slate-500" />
          <span className="text-sm text-slate-200">Priority</span>
          <div className="ml-auto flex gap-2">
            {(['high', 'medium', 'low', 'none'] as const).map(level => (
              <button
                key={level}
                type="button"
                onClick={() => { setPriority(level); void handleSave({ priority: level }); }}
                className={`transition ${level === priority ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
              >
                <Flag className={`h-4 w-4 ${PRIORITY_FLAG_COLOR[level]}`} />
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => setShowAddSubtask(open => !open)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/5">
          <Plus className="h-4 w-4 flex-none text-slate-500" />
          <span className="text-sm text-slate-200">Add Subtask</span>
          {subtasks.length > 0 ? <span className="ml-auto text-xs text-slate-500">{subtasks.filter(item => item.isDone).length}/{subtasks.length}</span> : null}
        </button>

        {showAddSubtask ? (
          <div className="px-3 pb-2">
            <input
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-[#12161D] px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
              placeholder="Subtask title..."
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') void handleAddSubtask();
                if (e.key === 'Escape') setShowAddSubtask(false);
              }}
            />
          </div>
        ) : null}

        {subtasks.length > 0 ? (
          <div className="space-y-1 px-3 pb-2">
            {subtasks.map(st => (
              <div key={st.id} className="group flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5">
                <button onClick={() => void toggleSubtask(st.id)} className="flex-none">
                  {st.isDone
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    : <Circle className="h-4 w-4 text-slate-500 transition hover:text-emerald-500" />
                  }
                </button>
                <span className={`flex-1 text-sm ${st.isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>{st.title}</span>
                <button onClick={() => void deleteSubtask(st.id)} className="opacity-0 transition group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5 text-slate-500 hover:text-rose-500" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <Calendar className="h-4 w-4 flex-none text-slate-500" />
          <span className="text-sm text-slate-200">Move to</span>
          <select
            className="ml-auto cursor-pointer bg-transparent text-sm text-slate-300 focus:outline-none"
            value={listId}
            onChange={e => { setListId(e.target.value); void handleSave({ listId: e.target.value }); }}
          >
            <option value="">Inbox</option>
            {lists.map(list => (
              <option key={list.id} value={list.id}>{list.emoji || '📋'} {list.name}</option>
            ))}
          </select>
        </div>

        <button onClick={() => setShowTags(open => !open)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/5">
          <Tag className="h-4 w-4 flex-none text-slate-500" />
          <span className="text-sm text-slate-200">Tags</span>
          {visibleTagList.length > 0 ? <span className="ml-auto max-w-[100px] truncate text-xs text-slate-500">{visibleTagList.join(', ')}</span> : null}
        </button>

        {showTags ? (
          <div className="px-3 pb-2">
            <div className="mb-2 flex flex-wrap gap-1">
              {visibleTagList.map(tag => (
                <span key={tag} className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-emerald-300 transition hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                className="flex-1 rounded-xl border border-white/10 bg-[#12161D] px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                placeholder="Add tag..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
              />
              <button
                onClick={addTag}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
              >
                Add
              </button>
            </div>
          </div>
        ) : null}

        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/5">
          <Timer className="h-4 w-4 flex-none text-slate-500" />
          <span className="text-sm text-slate-200">Start Focus</span>
          <ChevronRight className="ml-auto h-4 w-4 text-slate-500" />
        </button>

        <div className="my-2 border-t border-white/10" />

        {task.status !== 'completed' ? (
          <button
            onClick={() => onCompleted(task.id)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-emerald-400 transition hover:bg-emerald-500/10"
          >
            <CheckCircle2 className="h-4 w-4 flex-none text-emerald-500" />
            <span className="text-sm">Complete</span>
          </button>
        ) : null}

        <button
          onClick={() => onDeleted(task.id)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-rose-400 transition hover:bg-rose-500/10"
        >
          <Trash2 className="h-4 w-4 flex-none text-rose-500" />
          <span className="text-sm">Delete</span>
        </button>
      </div>

      <div className="flex flex-none items-center gap-3 border-t border-white/10 px-5 py-4">
        <span className="truncate text-xs text-slate-400">
          {currentList ? `${currentList.emoji || '📋'} ${currentList.name}` : '📥 Inbox'}
        </span>
      </div>
    </div>
  );
}
