'use client';

import { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, CheckCircle2, Circle, Flag, Calendar, Bell,
  RotateCcw, Clock, ChevronRight, Pin, Copy, FileText, MessageSquare,
  Tag, Timer, Moon, Sun, ChevronLeft, ChevronDown,
} from 'lucide-react';
import { toast } from '@/components/Toast';

type Subtask  = { id: string; title: string; isDone: boolean };
type TaskList = { id: string; name: string; emoji?: string };
type Task = {
  id: string; title: string; notes?: string; status: string; priority: string;
  dueDate?: string; dueTime?: string; tags: string; listId?: string;
  isActive?: boolean;
  subtasks: Subtask[];
  list?: { id: string; name: string; emoji?: string } | null;
};

// ── MiniCalendar ────────────────────────────────────────────────────────────
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

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // First day of month (0=Sun..6=Sat). Shift so Mon=0
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getWeekNum = (rowIdx: number) => {
    const day = cells[rowIdx * 7];
    if (!day) return '';
    const d = new Date(year, month, day);
    const jan1 = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  };

  const rows = cells.length / 7;

  const todayStr = today.toISOString().split('T')[0];
  const pad = (n: number) => String(n).padStart(2, '0');

  const handlePrev = () => setViewDate(new Date(year, month - 1, 1));
  const handleNext = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div className="rounded-xl bg-white/5 p-3">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={handlePrev} className="text-gray-400 hover:text-white transition p-1 rounded">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-gray-200">{monthName}</span>
        <button onClick={handleNext} className="text-gray-400 hover:text-white transition p-1 rounded">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[24px_repeat(7,1fr)] gap-0.5 mb-1">
        <div />
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-gray-500 py-0.5">{d}</div>
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }, (_, ri) => (
        <div key={ri} className="grid grid-cols-[24px_repeat(7,1fr)] gap-0.5 mb-0.5">
          <div className="text-[10px] text-gray-600 flex items-center justify-end pr-1">{getWeekNum(ri)}</div>
          {cells.slice(ri * 7, ri * 7 + 7).map((day, ci) => {
            if (!day) return <div key={ci} />;
            const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
            const isToday   = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            return (
              <button
                key={ci}
                onClick={() => onChange(dateStr)}
                className={`text-xs rounded-full w-7 h-7 mx-auto flex items-center justify-center transition font-medium ${
                  isSelected
                    ? 'bg-sky-600 text-white'
                    : isToday
                    ? 'bg-sky-900/40 text-sky-400'
                    : 'text-gray-300 hover:bg-white/10'
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

// ── Priority config ──────────────────────────────────────────────────────────
const PRIORITY_FLAG_COLOR: Record<string, string> = {
  high:   'text-rose-500',
  medium: 'text-amber-400',
  low:    'text-blue-400',
  none:   'text-gray-500',
};

function formatDateLabel(d: string) {
  if (!d) return 'No date';
  const date = new Date(d + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
}

const optionRowCls =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white/5';

// ── Main component ───────────────────────────────────────────────────────────
interface Props {
  task: Task;
  lists: TaskList[];
  onClose: () => void;
  onUpdated: (t: Task) => void;
  onDeleted: (id: string) => void;
  onCompleted: (id: string) => void;
}

export default function TaskDetail({ task, lists, onClose, onUpdated, onDeleted, onCompleted }: Props) {
  const [title, setTitle]       = useState(task.title);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate]   = useState(task.dueDate || '');
  const [dueTime, setDueTime]   = useState(task.dueTime || '');
  const [listId, setListId]     = useState(task.listId || '');
  const [tags, setTags]         = useState<string[]>(() => {
    try { return JSON.parse(task.tags || '[]'); } catch { return []; }
  });
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [dirty, setDirty]       = useState(false);
  const [saving, setSaving]     = useState(false);

  const [showDate, setShowDate]           = useState(false);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtask, setNewSubtask]       = useState('');
  const [showTags, setShowTags]           = useState(false);
  const [tagInput, setTagInput]           = useState('');

  // Sync when task prop changes
  useEffect(() => {
    setTitle(task.title);
    setPriority(task.priority);
    setDueDate(task.dueDate || '');
    setDueTime(task.dueTime || '');
    setListId(task.listId || '');
    setSubtasks(task.subtasks || []);
    try { setTags(JSON.parse(task.tags || '[]')); } catch { setTags([]); }
    setDirty(false);
  }, [task.id]);

  const handleSave = async () => {
    if (!title.trim()) { toast('Title required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          priority,
          dueDate: dueDate || null,
          dueTime: dueTime || null,
          tags,
          listId: listId || null,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      onUpdated(updated);
      setDirty(false);
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Move task to trash?')) return;
    await onDeleted(task.id);
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
      const s = await res.json();
      setSubtasks(prev => [...prev, s]);
      setNewSubtask('');
    } catch {
      toast('Failed to add subtask', 'error');
    }
  };

  const toggleSubtask = async (sid: string) => {
    const st = subtasks.find(s => s.id === sid);
    if (!st) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks/${sid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDone: !st.isDone }),
      });
      if (!res.ok) throw new Error();
      setSubtasks(prev => prev.map(s => s.id === sid ? { ...s, isDone: !s.isDone } : s));
    } catch {
      toast('Failed to update', 'error');
    }
  };

  const deleteSubtask = async (sid: string) => {
    try {
      await fetch(`/api/tasks/${task.id}/subtasks/${sid}`, { method: 'DELETE' });
      setSubtasks(prev => prev.filter(s => s.id !== sid));
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      const next = [...tags, t];
      setTags(next);
      setTagInput('');
      setDirty(true);
    }
  };

  const removeTag = (t: string) => {
    setTags(prev => prev.filter(x => x !== t));
    setDirty(true);
  };

  const dateLabel = dueDate ? `${formatDateLabel(dueDate)}${dueTime ? ', ' + dueTime : ''}` : 'No date';

  // Quick date shortcuts
  const setQuickDate = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    setDueDate(d.toISOString().split('T')[0]);
    setDirty(true);
  };

  const setMorning = () => { setDueTime('09:00'); setDirty(true); if (!dueDate) setQuickDate(0); };
  const setEvening = () => { setDueTime('20:00'); setDirty(true); if (!dueDate) setQuickDate(0); };

  const currentList = task.list || lists.find(l => l.id === listId);

  return (
    <div className="w-[340px] h-screen flex flex-col bg-[#2a2a2a] border-l border-white/5 overflow-y-auto flex-none">

      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 flex-none">
        <Flag className="h-4 w-4 text-gray-600" />
        <span className="text-xs text-sky-400 flex-1 truncate">
          {dateLabel} {dueDate && <span className="text-gray-500">↻</span>}
        </span>
        <Flag className={`h-4 w-4 ${PRIORITY_FLAG_COLOR[priority]}`} />
        <button
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Title */}
      <div className="px-4 py-4 flex-none">
        <input
          className="w-full bg-transparent text-lg font-bold text-white focus:outline-none placeholder-gray-600"
          value={title}
          placeholder="Task title..."
          onChange={e => { setTitle(e.target.value); setDirty(true); }}
          onBlur={() => { if (dirty) handleSave(); }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        {saving && <p className="text-xs text-gray-500 mt-1">Saving...</p>}
      </div>

      {/* Options list */}
      <div className="px-2 space-y-0.5 flex-1">

        {/* Date row */}
        <button onClick={() => setShowDate(v => !v)} className={optionRowCls}>
          <Calendar className="h-4 w-4 text-gray-400 flex-none" />
          <span className="text-sm text-gray-300">Date</span>
          {dueDate && (
            <span className="ml-auto text-xs text-sky-400">{formatDateLabel(dueDate)}</span>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ml-1 ${showDate ? 'rotate-180' : ''}`} />
        </button>

        {showDate && (
          <div className="rounded-xl bg-white/5 p-3 mb-2 mx-1">
            {/* Date/Duration tabs */}
            <div className="flex gap-1 mb-3">
              <button className="flex-1 rounded-lg py-1.5 text-xs font-medium bg-white/10 text-white">Date</button>
              <button className="flex-1 rounded-lg py-1.5 text-xs font-medium text-gray-500 hover:text-white hover:bg-white/5 transition">Duration</button>
            </div>

            {/* Quick shortcuts */}
            <div className="flex gap-1 mb-3">
              {[
                { icon: Sun,           label: 'Morning',  action: setMorning },
                { icon: Bell,          label: 'Alarm',    action: () => { setQuickDate(0); setDirty(true); } },
                { label: '+7',         action: () => { setQuickDate(7); setDirty(true); } },
                { icon: Moon,          label: 'Evening',  action: setEvening },
                { icon: ChevronRight,  label: 'Forward',  action: () => { setQuickDate(1); setDirty(true); } },
              ].map((s, i) => (
                <button
                  key={i}
                  onClick={s.action}
                  className="flex-1 flex flex-col items-center gap-1 rounded-lg py-2 text-gray-400 hover:bg-white/10 hover:text-white text-xs transition"
                >
                  {s.icon ? <s.icon className="h-4 w-4" /> : <span className="text-sm font-bold">{s.label}</span>}
                  {s.icon && <span className="text-[10px]">{s.label}</span>}
                </button>
              ))}
            </div>

            {/* Mini calendar */}
            <MiniCalendar selectedDate={dueDate} onChange={d => { setDueDate(d); setDirty(true); }} />

            {/* Time */}
            <div className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer">
              <Clock className="h-4 w-4 text-sky-400 flex-none" />
              <input
                type="time"
                value={dueTime}
                onChange={e => { setDueTime(e.target.value); setDirty(true); }}
                className="flex-1 bg-transparent text-sm text-sky-400 focus:outline-none"
              />
            </div>

            {/* Reminder */}
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer">
              <Bell className="h-4 w-4 text-sky-400 flex-none" />
              <span className="text-sm text-sky-400 flex-1">On time</span>
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </div>

            {/* Repeat */}
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer">
              <RotateCcw className="h-4 w-4 text-sky-400 flex-none" />
              <span className="text-sm text-sky-400 flex-1">No repeat</span>
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </div>

            {/* Clear + OK */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setDueDate(''); setDueTime(''); setShowDate(false); setDirty(true); handleSave(); }}
                className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                Clear
              </button>
              <button
                onClick={() => { setShowDate(false); if (dirty) handleSave(); }}
                className="flex-1 rounded-xl bg-sky-600 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Priority row */}
        <div className={optionRowCls}>
          <Flag className="h-4 w-4 text-gray-400 flex-none" />
          <span className="text-sm text-gray-300">Priority</span>
          <div className="ml-auto flex gap-2">
            {(['high', 'medium', 'low', 'none'] as const).map(p => (
              <button
                key={p}
                onClick={() => { setPriority(p); setDirty(true); handleSave(); }}
                className={`transition ${p === priority ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
              >
                <Flag className={`h-4 w-4 ${PRIORITY_FLAG_COLOR[p]}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Add Subtask */}
        <button onClick={() => setShowAddSubtask(v => !v)} className={optionRowCls}>
          <Plus className="h-4 w-4 text-gray-400 flex-none" />
          <span className="text-sm text-gray-300">Add Subtask</span>
          {subtasks.length > 0 && (
            <span className="ml-auto text-xs text-gray-500">
              {subtasks.filter(s => s.isDone).length}/{subtasks.length}
            </span>
          )}
        </button>

        {showAddSubtask && (
          <div className="px-3 pb-2">
            <input
              autoFocus
              className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Subtask title..."
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddSubtask();
                if (e.key === 'Escape') setShowAddSubtask(false);
              }}
            />
          </div>
        )}

        {/* Subtasks list */}
        {subtasks.length > 0 && (
          <div className="px-3 pb-2 space-y-1">
            {subtasks.map(st => (
              <div key={st.id} className="flex items-center gap-2 rounded-lg py-1.5 hover:bg-white/5 group px-1">
                <button onClick={() => toggleSubtask(st.id)} className="flex-none">
                  {st.isDone
                    ? <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    : <Circle className="h-4 w-4 text-gray-500 hover:text-sky-400 transition" />
                  }
                </button>
                <span className={`flex-1 text-sm ${st.isDone ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                  {st.title}
                </span>
                <button
                  onClick={() => deleteSubtask(st.id)}
                  className="opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="h-3.5 w-3.5 text-gray-500 hover:text-rose-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pin */}
        <button className={optionRowCls}>
          <Pin className="h-4 w-4 text-gray-400 flex-none" />
          <span className="text-sm text-gray-300">Pin</span>
        </button>

        {/* Won't Do */}
        <button className={optionRowCls}>
          <X className="h-4 w-4 text-gray-400 flex-none" />
          <span className="text-sm text-gray-300">Won&#39;t Do</span>
        </button>

        {/* Move to */}
        <button className={optionRowCls}>
          <FileText className="h-4 w-4 text-gray-400 flex-none" />
          <span className="text-sm text-gray-300">Move to</span>
          {lists.length > 0 && (
            <select
              className="ml-auto bg-transparent text-xs text-gray-400 focus:outline-none cursor-pointer"
              value={listId}
              onClick={e => e.stopPropagation()}
              onChange={e => { setListId(e.target.value); setDirty(true); handleSave(); }}
            >
              <option value="">Inbox</option>
              {lists.map(l => (
                <option key={l.id} value={l.id}>{l.emoji || '📋'} {l.name}</option>
              ))}
            </select>
          )}
          <ChevronRight className="h-4 w-4 text-gray-600 ml-1" />
        </button>

        {/* Tags */}
        <button onClick={() => setShowTags(v => !v)} className={optionRowCls}>
          <Tag className="h-4 w-4 text-gray-400 flex-none" />
          <span className="text-sm text-gray-300">Tags</span>
          {tags.length > 0 && (
            <span className="ml-auto text-xs text-gray-400 truncate max-w-[100px]">{tags.join(', ')}</span>
          )}
        </button>

        {showTags && (
          <div className="px-3 pb-2">
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 rounded-full bg-sky-900/40 border border-sky-500/20 px-2 py-0.5 text-xs text-sky-300">
                  {t}
                  <button onClick={() => removeTag(t)} className="text-sky-400 hover:text-white transition">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                className="flex-1 rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Add tag..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
              />
              <button
                onClick={addTag}
                className="rounded-lg bg-sky-600 px-2 py-1.5 text-xs text-white hover:bg-sky-700 transition"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Start Focus */}
        <button className={optionRowCls}>
          <Timer className="h-4 w-4 text-gray-400 flex-none" />
          <span className="text-sm text-gray-300">Start Focus</span>
          <ChevronRight className="ml-auto h-4 w-4 text-gray-600" />
        </button>

        <div className="border-t border-white/5 my-2" />

        {/* Duplicate */}
        <button className={optionRowCls}>
          <Copy className="h-4 w-4 text-gray-400 flex-none" />
          <span className="text-sm text-gray-300">Duplicate</span>
        </button>

        {/* Copy Link */}
        <button
          className={optionRowCls}
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast('Link copied');
          }}
        >
          <Tag className="h-4 w-4 text-gray-400 flex-none" />
          <span className="text-sm text-gray-300">Copy Link</span>
        </button>

        {/* Convert to Note */}
        <button className={optionRowCls}>
          <FileText className="h-4 w-4 text-gray-400 flex-none" />
          <span className="text-sm text-gray-300">Convert to Note</span>
        </button>

        <div className="border-t border-white/5 my-2" />

        {/* Complete */}
        {task.status !== 'completed' && (
          <button
            onClick={() => onCompleted(task.id)}
            className={`${optionRowCls} hover:bg-emerald-900/20`}
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-none" />
            <span className="text-sm text-emerald-400">Complete</span>
          </button>
        )}

        {/* Delete */}
        <button onClick={handleDelete} className={`${optionRowCls} hover:bg-rose-900/20`}>
          <Trash2 className="h-4 w-4 text-rose-400 flex-none" />
          <span className="text-sm text-rose-400">Delete</span>
        </button>
      </div>

      {/* Bottom: list badge + icons */}
      <div className="px-4 py-3 border-t border-white/5 flex items-center gap-3 flex-none">
        <span className="text-xs text-gray-500 truncate">
          {currentList ? `${currentList.emoji || '📋'} ${currentList.name}` : '📥 Inbox'}
        </span>
        <div className="ml-auto flex gap-3">
          <button className="text-gray-500 hover:text-gray-300 transition">
            <FileText className="h-4 w-4" />
          </button>
          <button className="text-gray-500 hover:text-gray-300 transition">
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
