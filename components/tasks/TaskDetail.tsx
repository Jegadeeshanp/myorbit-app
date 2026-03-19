'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  X, Plus, Trash2, CheckCircle2, Circle, Flag, Calendar, Bell,
  RotateCcw, Clock, ChevronRight, Tag, Timer, Moon, Sun, ChevronLeft, ChevronDown, Check,
} from 'lucide-react';
import { toast } from '@/components/Toast';

type Subtask = { id: string; title: string; isDone: boolean };
type TaskList = { id: string; name: string; emoji?: string; color?: string };
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
  list?: { id: string; name: string; emoji?: string; color?: string } | null;
};

const PRIORITY_FLAG_COLOR: Record<string, string> = {
  high: 'text-rose-500',
  medium: 'text-amber-500',
  low: 'text-blue-500',
  none: 'text-gray-400',
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
  const monthName = viewDate.toLocaleString('default', { month: 'short', year: 'numeric' });
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = today.toISOString().split('T')[0];

  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="rounded p-1 text-gray-400 transition hover:text-gray-900">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-gray-900">{monthName}</span>
        <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="rounded p-1 text-gray-400 transition hover:text-gray-900">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => (
          <div key={`${label}-${index}`} className="text-center text-[10px] font-medium text-gray-400">{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (!day) return <div key={index} className="h-8" />;
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onChange(dateStr)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs transition ${
                isSelected
                  ? 'bg-emerald-500 text-white'
                  : isToday
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
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
    <div className="flex h-full w-full flex-col overflow-y-auto border-l border-gray-200 bg-white text-gray-900">
      <div className="flex flex-none items-center gap-2 border-b border-gray-200 px-5 py-4">
        {task.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-gray-400" />}
        <span className="flex flex-1 items-center gap-2 truncate text-xs text-sky-600">
          <span className="truncate">{topLabel || 'Today'}</span>
          {repeat !== 'none' ? <RotateCcw className="h-3.5 w-3.5 text-emerald-500" /> : null}
        </span>
        <Flag className={`h-4 w-4 ${PRIORITY_FLAG_COLOR[priority]}`} />
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-none px-5 py-5">
        <input
          className="w-full bg-transparent text-lg font-bold text-gray-900 placeholder-gray-400 focus:outline-none"
          value={title}
          placeholder="Task title..."
          onChange={e => setTitle(e.target.value)}
          onBlur={() => void handleSave({ title })}
          onKeyDown={e => e.key === 'Enter' && handleSave({ title })}
        />
        {saving ? <p className="mt-1 text-xs text-gray-400">Saving...</p> : null}
      </div>

      <div className="px-5 pb-4">
        <textarea
          value={notes}
          placeholder="Add notes"
          rows={4}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => void handleSave({ notes })}
          className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
        />
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-24">
        <div className="relative">
          <button onClick={() => setShowDate(open => !open)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-gray-50">
            <Calendar className="h-4 w-4 flex-none text-gray-400" />
            <span className="text-sm text-gray-700">Date</span>
            <span className="ml-auto text-xs text-sky-600">{formatDateLabel(dueDate)}</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showDate ? 'rotate-180' : ''}`} />
          </button>

          {showDate ? (
            <div className="absolute left-3 right-3 top-full z-20 mt-2 max-w-[360px] rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
              <div className="mb-3 flex gap-1 rounded-xl bg-gray-100 p-1">
                <button className="flex-1 rounded-lg bg-white py-1.5 text-xs font-medium text-gray-900 shadow-sm">Date</button>
                <button className="flex-1 rounded-lg py-1.5 text-xs font-medium text-gray-500">Duration</button>
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
                    className="flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                  >
                    {'icon' in shortcut && shortcut.icon ? <shortcut.icon className="h-4 w-4" /> : <span className="text-sm font-bold">{shortcut.label}</span>}
                    {'icon' in shortcut && shortcut.icon ? <span className="text-[10px]">{shortcut.label}</span> : null}
                  </button>
                ))}
              </div>

              <MiniCalendar selectedDate={dueDate || new Date().toISOString().split('T')[0]} onChange={setDueDate} />

              <div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
                <Clock className="h-4 w-4 text-sky-600" />
                <input
                  type="time"
                  value={dueTime}
                  onChange={e => setDueTime(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-sky-600 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowReminderMenu(open => !open)}
                className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-gray-50"
              >
                <Bell className="h-4 w-4 text-sky-600" />
                <span className="text-sm text-sky-600">Reminder</span>
                <span className="ml-auto text-sm text-sky-600">{reminderLabel}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>

              {showReminderMenu ? (
                <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {REMINDER_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => { setReminder(option.value); setShowReminderMenu(false); }}
                      className={`block w-full px-4 py-3 text-left text-sm transition ${reminder === option.value ? 'bg-gray-50 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setShowRepeatMenu(open => !open)}
                className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4 text-sky-600" />
                <span className="text-sm text-sky-600">Repeat</span>
                <span className="ml-auto text-sm text-sky-600">{repeatLabel}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>

              {showRepeatMenu ? (
                <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={() => { setRepeat('none'); setShowRepeatMenu(false); }}
                    className={`block w-full px-4 py-3 text-left text-sm transition ${repeat === 'none' ? 'bg-gray-50 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    No repeat
                  </button>
                  {REPEAT_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => { setRepeat(option.value); setShowRepeatMenu(false); }}
                      className={`block w-full px-4 py-3 text-left text-sm transition ${repeat === option.value ? 'bg-gray-50 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
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
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 py-2 text-sm text-gray-600 transition hover:bg-white hover:text-gray-900"
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
        </div>

        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <Flag className="h-4 w-4 flex-none text-gray-400" />
          <span className="text-sm text-gray-700">Priority</span>
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

        <button onClick={() => setShowAddSubtask(open => !open)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-gray-50">
          <Plus className="h-4 w-4 flex-none text-gray-400" />
          <span className="text-sm text-gray-700">Add Subtask</span>
          {subtasks.length > 0 ? <span className="ml-auto text-xs text-gray-400">{subtasks.filter(item => item.isDone).length}/{subtasks.length}</span> : null}
        </button>

        {showAddSubtask ? (
          <div className="px-3 pb-2">
            <input
              autoFocus
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
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
              <div key={st.id} className="group flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-50">
                <button onClick={() => void toggleSubtask(st.id)} className="flex h-4 w-4 items-center justify-center rounded border border-gray-300">
                  {st.isDone ? <Check className="h-3 w-3 text-emerald-600" /> : null}
                </button>
                <span className={`flex-1 text-sm ${st.isDone ? 'line-through text-gray-400' : 'text-gray-700'}`}>{st.title}</span>
                <button onClick={() => void deleteSubtask(st.id)} className="opacity-0 transition group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-rose-500" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <Calendar className="h-4 w-4 flex-none text-gray-400" />
          <span className="text-sm text-gray-700">Move to</span>
          <select
            className="ml-auto cursor-pointer bg-transparent text-sm text-gray-600 focus:outline-none"
            value={listId}
            onChange={e => { setListId(e.target.value); void handleSave({ listId: e.target.value }); }}
          >
            <option value="">Inbox</option>
            {lists.map(list => (
              <option key={list.id} value={list.id}>{list.emoji || 'List'} {list.name}</option>
            ))}
          </select>
        </div>

        <button onClick={() => setShowTags(open => !open)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-gray-50">
          <Tag className="h-4 w-4 flex-none text-gray-400" />
          <span className="text-sm text-gray-700">Tags</span>
          {visibleTagList.length > 0 ? <span className="ml-auto max-w-[100px] truncate text-xs text-gray-400">{visibleTagList.join(', ')}</span> : null}
        </button>

        {showTags ? (
          <div className="px-3 pb-2">
            <div className="mb-2 flex flex-wrap gap-1">
              {visibleTagList.map(tag => (
                <span key={tag} className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-emerald-500 transition hover:text-emerald-700">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
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

        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-gray-50">
          <Timer className="h-4 w-4 flex-none text-gray-400" />
          <span className="text-sm text-gray-700">Start Focus</span>
          <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
        </button>

        <div className="my-2 border-t border-gray-200" />

        {task.status !== 'completed' ? (
          <button
            onClick={() => onCompleted(task.id)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-emerald-600 transition hover:bg-emerald-50"
          >
            <CheckCircle2 className="h-4 w-4 flex-none text-emerald-500" />
            <span className="text-sm">Complete</span>
          </button>
        ) : null}

        <button
          onClick={() => onDeleted(task.id)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-rose-500 transition hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4 flex-none text-rose-500" />
          <span className="text-sm">Delete</span>
        </button>
      </div>

      <div className="flex flex-none items-center gap-3 border-t border-gray-200 px-5 py-4">
        <span className="truncate text-xs text-gray-400">
          {currentList ? `${currentList.emoji || 'List'} ${currentList.name}` : 'Inbox'}
        </span>
      </div>
    </div>
  );
}
