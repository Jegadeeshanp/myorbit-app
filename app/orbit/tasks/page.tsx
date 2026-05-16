'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useState, useEffect, useCallback, useRef, useMemo, type CSSProperties } from 'react';
import {
  Plus, Sun, Inbox, CalendarDays,
  ChevronRight, Search, X, Flag, Tag, Menu,
  List as ListIcon, MoreHorizontal, Paperclip, Maximize2,
  ChevronLeft, ChevronDown, Check, Bell, RotateCcw, Clock,
  ArrowUpDown,
} from 'lucide-react';
import TasksSidebar from '@/components/tasks/TasksSidebar';
import TaskItem from '@/components/tasks/TaskItem';
import type { TaskInstanceWithTask, TodayResponse } from '@/lib/taskTypes';
import TaskDetail from '@/components/tasks/TaskDetail';
import TaskReminderModal from '@/components/tasks/TaskReminderModal';
import TaskCalendar from '@/components/tasks/TaskCalendar';
import AddTaskSheet from '@/components/tasks/AddTaskSheet';
import { toast } from '@/components/Toast';
import TasksMobileNav from '@/components/tasks/TasksMobileNav';
import { getListIcon } from '@/lib/taskListIcons';
import CustomRepeatPicker, { buildCustomLabel } from '@/components/tasks/CustomRepeatPicker';
import OrbitIcon from '@/components/OrbitIcon';

type Subtask = { id: string; title: string; isDone: boolean };
type TaskList = { id: string; name: string; emoji?: string; color?: string };
type Task = {
  id: string; title: string; notes?: string; status: string; priority: string;
  dueDate?: string; dueTime?: string; tags: string; listId?: string; isActive?: boolean;
  isRecurring?: boolean; recurrenceDays?: number[];
  subtasks: Subtask[];
  list?: { id: string; name: string; emoji?: string; color?: string } | null;
};
type TaskGroup = { label: string; tasks: Task[] };
type SortBy = 'custom' | 'date' | 'title' | 'tag' | 'priority';

const SORT_OPTIONS: { v: SortBy; l: string }[] = [
  { v: 'custom',   l: 'Custom' },
  { v: 'date',     l: 'Date' },
  { v: 'title',    l: 'Title' },
  { v: 'tag',      l: 'Tag' },
  { v: 'priority', l: 'Priority' },
];
const PRI_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };

const SMART_LABELS: Record<string, string> = { today: 'Today', inbox: 'Inbox', next7: 'Next 7 Days' };

function todayString(offset = 0) {
  const d = new Date(); d.setDate(d.getDate() + offset);
  // Use local date (not UTC) so midnight in any timezone is correct
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
}
function next7Label(date: string) {
  const today = todayString(); const tomorrow = todayString(1);
  if (date === today) return 'Today'; if (date === tomorrow) return 'Tomorrow';
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long' });
}
function belongsToCurrentSelection(task: Task, selected: string) {
  const today = todayString(); const next7 = todayString(7);
  if (selected === 'today') return task.dueDate === today;
  if (selected === 'inbox') return !task.listId;
  if (selected === 'next7') return !!task.dueDate && task.dueDate >= today && task.dueDate <= next7;
  if (selected.startsWith('list:')) return task.listId === selected.replace('list:', '');
  return true;
}

// ── Mini Calendar Popup ────────────────────────────────────────────────────
function MiniCalendarPopup({ dueDate, dueTime, repeat, reminder, onSelect, onClose, onTimeChange, onRepeatChange, onReminderChange }: {
  dueDate: string; dueTime?: string; repeat?: string; reminder?: string;
  onSelect: (d: string) => void; onClose: () => void;
  onTimeChange?: (v: string) => void; onRepeatChange?: (v: string) => void; onReminderChange?: (v: string) => void;
}) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(() => {
    if (dueDate) { const [y,m] = dueDate.split('-').map(Number); return new Date(y, m-1, 1); }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [showTime, setShowTime]       = useState(false);
  const [showRepeat, setShowRepeat]   = useState(false);
  const [showRemind, setShowRemind]   = useState(false);
  const [localTime, setLocalTime]     = useState(dueTime || '');
  const [localRepeat, setLocalRepeat] = useState(repeat || 'none');
  const [localRemind, setLocalRemind] = useState(reminder || 'none');

  const pad = (n: number) => String(n).padStart(2,'0');
  const todayStr = today.toISOString().split('T')[0];
  const year = viewDate.getFullYear(); const month = viewDate.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const cells: (number|null)[] = [];
  for (let i=0; i<firstDow; i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(d);

  const QUICK = [
    { label: 'Today',    v: todayString(0) },
    { label: 'Tomorrow', v: todayString(1) },
    { label: 'Next Mon', v: (() => { const d = new Date(); const day = d.getDay(); d.setDate(d.getDate() + (day === 0 ? 1 : 8 - day)); return d.toISOString().split('T')[0]; })() },
    { label: 'No Date',  v: '' },
  ];

  const REPEAT_OPTS = [
    { v: 'none',     l: 'No repeat',           indent: false },
    { v: 'daily',    l: 'Daily',                indent: false },
    { v: 'weekly',   l: 'Weekly',               indent: false },
    { v: 'weekdays', l: 'Weekdays (Mon–Fri)',    indent: true  },
    { v: 'weekends', l: 'Weekends (Sat–Sun)',    indent: true  },
    { v: 'monthly',  l: 'Monthly',              indent: false },
    { v: 'yearly',   l: 'Yearly',               indent: false },
    { v: 'custom',   l: 'Custom…',              indent: false },
  ];
  const REMIND_OPTS = [
    { v: 'none', label: 'None' },
    { v: 'on-time', label: 'On time' },
    { v: '5m', label: '5 min early' },
    { v: '30m', label: '30 min early' },
    { v: '1h', label: '1 hour early' },
    { v: '1d', label: '1 day early' },
  ];
  const [showCustomRepeat, setShowCustomRepeat] = useState(false);

  const timeLabel = localTime || 'None';
  const getRepeatLabel = (v: string) => {
    if (v === 'none') return 'None';
    if (v === 'weekdays') return 'Weekdays';
    if (v === 'weekends') return 'Weekends';
    if (v.startsWith('custom:')) return buildCustomLabel(v);
    if (v === 'custom') return 'Custom';
    return v.charAt(0).toUpperCase() + v.slice(1);
  };
  const repeatLabel = getRepeatLabel(localRepeat);
  const remindLabel = REMIND_OPTS.find(o => o.v === localRemind)?.label ?? 'None';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#1E2128] w-72" onClick={e => e.stopPropagation()}>
      {/* Quick chips */}
      <div className="flex gap-1 p-2 border-b border-gray-100 dark:border-gray-700/60">
        {QUICK.map(q => (
          <button key={q.label} onClick={() => { onSelect(q.v); if (!q.v) onClose(); }}
            className={`flex-1 whitespace-nowrap rounded-full border px-1 py-1 text-[11px] font-medium transition text-center ${dueDate === q.v || (q.v === '' && !dueDate) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-white/5'}`}
          >{q.label}</button>
        ))}
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between px-3 py-2">
        <button onClick={() => setViewDate(new Date(year, month-1, 1))} className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 text-base">‹</button>
        <span className="text-sm font-semibold text-gray-800 dark:text-white">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        <button onClick={() => setViewDate(new Date(year, month+1, 1))} className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 text-base">›</button>
      </div>

      {/* Day grid */}
      <div className="px-3 pb-2">
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['M','Tu','W','Th','F','Sa','Su'].map((l,i) => <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-0.5">{l}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} className="h-8" />;
            const ds = `${year}-${pad(month+1)}-${pad(day)}`;
            const isSel = ds === dueDate; const isTod = ds === todayStr;
            return (
              <button key={ds} onClick={() => onSelect(ds)}
                className={`flex h-8 w-full items-center justify-center rounded-full text-xs transition ${isSel ? 'bg-emerald-500 text-white font-bold' : isTod ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 font-semibold' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10'}`}
              >{day}</button>
            );
          })}
        </div>
      </div>

      {/* Time / Reminder / Repeat — sub-panel floats above the 3 rows as an absolute overlay */}
      <div className="relative border-t border-gray-100 dark:border-gray-700/60">
        {/* Overlay panel — absolutely positioned above the trigger rows, never overflows downward */}
        {(showTime || showRemind || showRepeat) && (
          <div className="absolute bottom-full left-0 right-0 z-20 rounded-t-2xl border border-b-0 border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-[#1E2128]">
            {showTime && (
              <div className="px-3 py-3">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Set Time</p>
                <input type="time" value={localTime} onChange={e => { setLocalTime(e.target.value); onTimeChange?.(e.target.value); }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            )}
            {showRemind && (
              <div className="py-1">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Reminder</p>
                {REMIND_OPTS.map(o => (
                  <button key={o.v} onClick={() => { setLocalRemind(o.v); onReminderChange?.(o.v); setShowRemind(false); }}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition ${localRemind === o.v ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'}`}
                  >
                    {o.label}{localRemind === o.v && <Check className="ml-auto h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            )}
            {showRepeat && !showCustomRepeat && (
              <div className="py-1">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Repeat</p>
                {REPEAT_OPTS.map(o => {
                  const isSelected = o.v === 'custom' ? localRepeat.startsWith('custom') : localRepeat === o.v;
                  return (
                    <button key={o.v} onClick={() => {
                      if (o.v === 'custom') { setShowCustomRepeat(true); }
                      else { setLocalRepeat(o.v); onRepeatChange?.(o.v); setShowRepeat(false); }
                    }}
                      className={`flex w-full items-center gap-2 py-2 text-sm transition ${o.indent ? 'pl-8 pr-4' : 'px-4'} ${isSelected ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'}`}
                    >
                      {o.indent && <span className="text-gray-300">↳</span>}
                      {o.l}
                      {isSelected && <Check className="ml-auto h-3.5 w-3.5" />}
                    </button>
                  );
                })}
              </div>
            )}
            {showCustomRepeat && (
              <CustomRepeatPicker
                initialValue={localRepeat}
                onSave={v => { setLocalRepeat(v); onRepeatChange?.(v); setShowCustomRepeat(false); setShowRepeat(false); }}
                onCancel={() => setShowCustomRepeat(false)}
              />
            )}
          </div>
        )}

        {/* Three trigger rows — always visible at the bottom of the popup */}
        <button onClick={() => { setShowTime(v => !v); setShowRepeat(false); setShowRemind(false); }}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition">
          <Clock className="h-4 w-4 text-gray-400 flex-none" />
          <span className="flex-1 text-left text-gray-700 dark:text-gray-300">Time</span>
          <span className="text-xs text-gray-400">{timeLabel}</span>
          <ChevronRight className={`h-3.5 w-3.5 text-gray-300 transition-transform ${showTime ? 'rotate-90' : ''}`} />
        </button>
        <button onClick={() => { setShowRemind(v => !v); setShowTime(false); setShowRepeat(false); }}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition border-t border-gray-100 dark:border-gray-700/40">
          <Bell className="h-4 w-4 text-gray-400 flex-none" />
          <span className="flex-1 text-left text-gray-700 dark:text-gray-300">Reminder</span>
          <span className="text-xs text-gray-400">{remindLabel}</span>
          <ChevronRight className={`h-3.5 w-3.5 text-gray-300 transition-transform ${showRemind ? 'rotate-90' : ''}`} />
        </button>
        <button onClick={() => { setShowRepeat(v => !v); setShowTime(false); setShowRemind(false); }}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition border-t border-gray-100 dark:border-gray-700/40">
          <RotateCcw className="h-4 w-4 text-gray-400 flex-none" />
          <span className="flex-1 text-left text-gray-700 dark:text-gray-300">Repeat</span>
          <span className="text-xs text-gray-400">{repeatLabel}</span>
          <ChevronRight className={`h-3.5 w-3.5 text-gray-300 transition-transform ${showRepeat ? 'rotate-90' : ''}`} />
        </button>
      </div>
    </div>
  );
}


// ── More Options Dropdown (desktop) ──────────────────────────────────────
function MoreOptionsDropdown({ priority, listId, lists, tags, addToHabit, onPriority, onList, onTag, onAddToHabit, onClose }: {
  priority: string; listId: string; lists: TaskList[]; tags: string[];
  addToHabit?: boolean;
  onPriority: (v: string) => void; onList: (v: string) => void; onTag: (t: string) => void;
  onAddToHabit?: (v: boolean) => void;
  onClose: () => void;
}) {
  const [tagInput, setTagInput] = useState('');
  const [showLists, setShowLists] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);

  const PRI = [
    { v: 'high',   color: '#ef4444' },
    { v: 'medium', color: '#f59e0b' },
    { v: 'low',    color: '#3b82f6' },
    { v: 'none',   color: '#9ca3af' },
  ];
  const selectedList = lists.find(l => l.id === listId);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t) { onTag(t); setTagInput(''); setShowTagInput(false); }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#1E2128] w-56" onClick={e => e.stopPropagation()}>
      {/* Priority */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-xs font-semibold text-gray-400 mb-2">Priority</p>
        <div className="flex gap-1.5">
          {PRI.map(p => (
            <button key={p.v} onClick={() => onPriority(p.v)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${priority === p.v && p.v !== 'none' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
              <Flag className="h-5 w-5" style={{ color: p.color }} />
            </button>
          ))}
        </div>
      </div>

      <div className="mx-4 border-t border-gray-100 dark:border-gray-700" />

      {/* Inbox / List — expands inline below */}
      <button onClick={() => { setShowLists(v => !v); setShowTagInput(false); }}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5 transition">
        <span>📥</span>
        <span className="flex-1 text-left">{selectedList ? selectedList.name : 'Inbox'}</span>
        <ChevronRight className={`h-4 w-4 text-gray-300 transition-transform ${showLists ? 'rotate-90' : ''}`} />
      </button>
      {showLists && (
        <div className="border-t border-gray-100 dark:border-gray-700/60 max-h-40 overflow-y-auto">
          <button onClick={() => { onList(''); setShowLists(false); }}
            className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition ${!listId ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'}`}
          ><span>📥</span><span className="flex-1">Inbox</span>{!listId && <Check className="h-3.5 w-3.5 text-emerald-500" />}</button>
          {lists.map(l => (
            <button key={l.id} onClick={() => { onList(l.id); setShowLists(false); }}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition ${listId === l.id ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'}`}
            >
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded" style={{ backgroundColor: `${l.color || '#10B981'}22` }}>
                {getListIcon(l.emoji, 'h-3.5 w-3.5')}
              </span>
              <span className="flex-1 truncate">{l.name}</span>
              {listId === l.id && <Check className="h-3.5 w-3.5 text-emerald-500" />}
            </button>
          ))}
        </div>
      )}

      {/* Tags — expands inline below, does NOT shift layout */}
      <button onClick={() => { setShowTagInput(v => !v); setShowLists(false); }}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5 transition border-t border-gray-100 dark:border-gray-700/60">
        <Tag className="h-4 w-4 text-gray-400" />
        <span className="flex-1 text-left">Tags</span>
        {tags.length > 0 && <span className="text-xs text-emerald-500 font-medium">{tags.length}</span>}
        <ChevronRight className={`h-4 w-4 text-gray-300 transition-transform ${showTagInput ? 'rotate-90' : ''}`} />
      </button>
      {showTagInput && (
        <div className="border-t border-gray-100 dark:border-gray-700/60 px-3 py-2.5">
          <div className="flex gap-1.5">
            <input autoFocus
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Add tag..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') setShowTagInput(false); }}
            />
            <button onClick={addTag} className="flex-none rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Add</button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {t}<button onClick={() => onTag(t)}><X className="h-2.5 w-2.5" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add to Habit tracker */}
      <label className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5 transition border-t border-gray-100 dark:border-gray-700/60">
        <input
          type="checkbox"
          checked={addToHabit ?? false}
          onChange={e => onAddToHabit?.(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <span className="flex-1 text-left">Add to Habit tracker</span>
      </label>

      {/* Attachment — not yet implemented */}
      <button disabled className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-gray-700/60 cursor-not-allowed opacity-50">
        <Paperclip className="h-4 w-4" />
        <span className="flex-1 text-left">Attachment</span>
        <span className="text-[10px] rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 font-medium">Soon</span>
      </button>
    </div>
  );
}


// ── Add Task Overlay (mobile) ─────────────────────────────────────────────
// ── Mini Calendar ──────────────────────────────────────────────────────────
function AddTaskOverlay({ onClose, onAdd, lists }: {
  onClose: () => void;
  onAdd: (title: string, opts: { dueDate?: string; priority?: string; tags?: string[]; listId?: string; addToHabit?: boolean }) => Promise<Task | null>;
  lists: TaskList[];
}) {
  const [title, setTitle]         = useState('');
  const [dueDate, setDueDate]     = useState('');
  const [priority, setPriority]   = useState('none');
  const [listId, setListId]       = useState('');
  const [tagInput, setTagInput]   = useState('');
  const [tags, setTags]           = useState<string[]>([]);
  const [adding, setAdding]       = useState(false);
  const [showDate, setShowDate]   = useState(false);
  const [showPri, setShowPri]     = useState(false);
  const [showList, setShowList]   = useState(false);
  const [showTag, setShowTag]     = useState(false);
  const [showMore, setShowMore]   = useState(false);
  const [addToHabit, setAddToHabit] = useState(false);
  const [calStyle, setCalStyle]   = useState<CSSProperties>({});
  const [priStyle, setPriStyle]   = useState<CSSProperties>({});
  const [listStyle, setListStyle] = useState<CSSProperties>({});
  const calBtnRef  = useRef<HTMLButtonElement>(null);
  const priBtnRef  = useRef<HTMLButtonElement>(null);
  const listBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  /** Compute a fixed popup style anchored to a ref button, opening above if space is tight */
  function popupStyle(ref: React.RefObject<HTMLButtonElement | null>, popupH: number, popupW: number): CSSProperties {
    if (!ref.current) return {};
    const rect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const left = Math.min(Math.max(rect.left, 8), window.innerWidth - popupW - 8);
    const style: CSSProperties = { position: 'fixed', zIndex: 90, width: `${popupW}px`, left: `${left}px` };
    if (spaceBelow >= popupH) {
      style.top = `${rect.bottom + 6}px`;
    } else {
      style.bottom = `${window.innerHeight - rect.top + 6}px`;
    }
    return style;
  }

  const openCalendar = () => {
    setCalStyle(popupStyle(calBtnRef, 480, 320));
    closeAll();
    setShowDate(v => !v);
  };

  const openPriPicker = () => {
    setPriStyle(popupStyle(priBtnRef, 200, 180));
    closeAll();
    setShowPri(v => !v);
  };

  const openListPicker = () => {
    setListStyle(popupStyle(listBtnRef, 280, 200));
    closeAll();
    setShowList(v => !v);
  };

  const submit = async () => {
    if (!title.trim() || adding) return;
    setAdding(true);
    try { await onAdd(title.trim(), { dueDate: dueDate || undefined, priority, tags, listId: listId || undefined, addToHabit }); onClose(); }
    finally { setAdding(false); }
  };

  const addTag = () => { const t = tagInput.trim().toLowerCase(); if (t && !tags.includes(t)) setTags(p => [...p, t]); setTagInput(''); setShowTag(false); };

  const PRI_OPTS = [
    { v: 'none',   label: 'None',   color: '#9ca3af' },
    { v: 'low',    label: 'Low',    color: '#3b82f6' },
    { v: 'medium', label: 'Medium', color: '#f59e0b' },
    { v: 'high',   label: 'High',   color: '#ef4444' },
  ];

  const dateLabel = dueDate ? (
    dueDate === todayString() ? 'Today' :
    dueDate === todayString(1) ? 'Tomorrow' :
    new Date(`${dueDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  ) : null;

  const selectedList = lists.find(l => l.id === listId);
  const priColor = PRI_OPTS.find(p => p.v === priority)?.color ?? '#9ca3af';

  const closeAll = () => { setShowDate(false); setShowPri(false); setShowList(false); setShowTag(false); setShowMore(false); };

  return (
    <>
      <div className="fixed inset-0 z-[75] bg-black/40 md:hidden" onClick={onClose} />

      {/* Calendar popup — positioned near button */}
      {showDate && (
        <>
          <div className="fixed inset-0 z-[85]" onClick={() => setShowDate(false)} />
          <div style={calStyle} onClick={e => e.stopPropagation()}>
            <MiniCalendarPopup dueDate={dueDate} onSelect={v => { setDueDate(v); if (!v) setShowDate(false); }} onClose={() => setShowDate(false)} />
          </div>
        </>
      )}

      {/* Priority picker — fixed position, outside sheet to avoid clipping */}
      {showPri && (
        <>
          <div className="fixed inset-0 z-[88]" onClick={() => setShowPri(false)} />
          <div style={priStyle} className="z-[89] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#252830]"
            onClick={e => e.stopPropagation()}>
            {PRI_OPTS.map(p => (
              <button key={p.v} onClick={() => { setPriority(p.v); setShowPri(false); }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition ${priority === p.v ? 'bg-gray-50 dark:bg-white/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                <Flag className="h-4 w-4 flex-none" style={{ color: p.color }} />
                <span className="flex-1 text-left text-gray-700 dark:text-gray-300">{p.label}</span>
                {priority === p.v && <Check className="h-3.5 w-3.5 text-emerald-500" />}
              </button>
            ))}
          </div>
        </>
      )}

      {/* List picker — fixed position, outside sheet to avoid clipping */}
      {showList && (
        <>
          <div className="fixed inset-0 z-[88]" onClick={() => setShowList(false)} />
          <div style={listStyle} className="z-[89] max-h-64 overflow-y-auto overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#252830]"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => { setListId(''); setShowList(false); }}
              className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition ${!listId ? 'bg-gray-50 dark:bg-white/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
              <span>📥</span>
              <span className="flex-1 text-left text-gray-700 dark:text-gray-300">Inbox</span>
              {!listId && <Check className="h-3.5 w-3.5 text-emerald-500" />}
            </button>
            {lists.map(l => (
              <button key={l.id} onClick={() => { setListId(l.id); setShowList(false); }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition ${listId === l.id ? 'bg-gray-50 dark:bg-white/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg" style={{ backgroundColor: `${l.color || '#10B981'}22` }}>
                  {getListIcon(l.emoji, 'h-4 w-4')}
                </span>
                <span className="flex-1 truncate text-left text-gray-700 dark:text-gray-300">{l.name}</span>
                {listId === l.id && <Check className="h-3.5 w-3.5 text-emerald-500" />}
              </button>
            ))}
          </div>
        </>
      )}

      {/* AddTask sheet — anchored above bottom nav, rounded top corners */}
      <div className="fixed inset-x-0 z-[80] md:hidden rounded-t-3xl bg-white dark:bg-[#1E2128] shadow-2xl border-t border-gray-200 dark:border-gray-700"
        style={{ bottom: '64px', maxHeight: '55vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Tag input row */}
        {showTag && (
          <div className="border-t border-gray-100 dark:border-gray-700/60 px-4 py-2">
            <div className="flex items-center gap-2">
              <input autoFocus
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Tag name..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') setShowTag(false); }}
              />
              <button onClick={addTag} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Add</button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {t}<button onClick={() => setTags(p => p.filter(i => i !== t))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* More options */}
        {showMore && (
          <div className="border-t border-gray-100 dark:border-gray-700/60">
            <label className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition">
              <input
                type="checkbox"
                checked={addToHabit}
                onChange={e => setAddToHabit(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Add to Habit tracker</span>
            </label>
            <button disabled className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50">
              <Paperclip className="h-4 w-4" /><span>Attach file</span>
              <span className="ml-auto text-[10px] rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 font-medium">Soon</span>
            </button>
            <button
              onClick={async () => { setShowMore(false); await submit(); }}
              disabled={!title.trim() || adding}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition disabled:opacity-40"
            >
              <Maximize2 className="h-4 w-4 text-gray-400" /><span>Open full detail</span>
            </button>
          </div>
        )}

        {/* Title input */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-5 w-5 flex-none rounded-full border-2 border-gray-300 dark:border-gray-600" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-base text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white dark:placeholder-gray-500"
            placeholder="New task"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void submit(); if (e.key === 'Escape') onClose(); }}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 px-3 pb-4">
          <button ref={calBtnRef} onClick={openCalendar}
            className={`flex min-w-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition ${showDate || dueDate ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <CalendarDays className="h-5 w-5 flex-none" />
            {dateLabel && <span className="max-w-[72px] truncate text-xs font-medium">{dateLabel}</span>}
          </button>
          <button ref={priBtnRef} onClick={openPriPicker}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition`}
            style={{ color: priority !== 'none' ? priColor : undefined }}
          >
            <Flag className={`h-5 w-5 ${priority === 'none' ? 'text-gray-500 dark:text-gray-400' : ''}`} />
          </button>
          <button ref={listBtnRef} onClick={openListPicker}
            className={`flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm transition ${showList || listId ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {selectedList
              ? <span className="flex h-6 w-6 items-center justify-center rounded" style={{ backgroundColor: `${selectedList.color || '#10B981'}22` }}>{getListIcon(selectedList.emoji, 'h-4 w-4')}</span>
              : <ListIcon className="h-5 w-5" />}
            {selectedList && <span className="text-xs font-medium max-w-[60px] truncate">{selectedList.name}</span>}
          </button>
          <button onClick={() => { closeAll(); setShowTag(v => !v); }}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${showTag || tags.length > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <Tag className="h-5 w-5" />
          </button>
          <button onClick={() => { closeAll(); setShowMore(v => !v); }}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${showMore ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
            <MoreHorizontal className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button onClick={() => void submit()} disabled={!title.trim() || adding}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white disabled:opacity-40 active:scale-95 transition">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}


export default function TasksPage() {
  const searchParams = useSearchParams();
  const [view, setView]               = useState<'tasks' | 'calendar'>('tasks');
  const [selected, setSelected]       = useState('today');
  const [tasks, setTasks]             = useState<Task[]>([]);
  const [todayData, setTodayData]     = useState<TodayResponse>({ overdue: [], today: [], missed: [], completed: [] });
  const [lists, setLists]             = useState<TaskList[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTask, setActiveTask]   = useState<Task | null>(null);
  const [reminderTask, setReminderTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask]   = useState(false);
  const [refreshKey, setRefreshKey]   = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showFab, setShowFab]         = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen]   = useState(false);
  const [panelWidth, setPanelWidth]   = useState(42); // % for right panel
  const [dragging, setDragging]       = useState(false);
  const [sortBy, setSortBy]           = useState<SortBy>('custom');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showDesktopCal, setShowDesktopCal]   = useState(false);
  const [showDesktopMore, setShowDesktopMore] = useState(false);
  const [desktopDueDate, setDesktopDueDate]   = useState('');
  const [desktopDueTime, setDesktopDueTime]   = useState('');
  const [desktopReminder, setDesktopReminder] = useState('none');
  const [desktopRepeat, setDesktopRepeat]     = useState('none');
  const [desktopPriority, setDesktopPriority] = useState('none');
  const [desktopListId, setDesktopListId]     = useState('');
  const [desktopTags, setDesktopTags]         = useState<string[]>([]);
  const [desktopAddToHabit, setDesktopAddToHabit] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resizable panel drag
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    const startX = e.clientX;
    const startWidth = panelWidth;
    const onMove = (ev: MouseEvent) => {
      const container = document.getElementById('task-panels');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const delta = ev.clientX - startX;
      const newRight = Math.max(25, Math.min(60, startWidth - (delta / rect.width) * 100));
      setPanelWidth(newRight);
    };
    const onUp = () => { setDragging(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const fetchTasks = useCallback(() => {
    setLoading(true);
    // Today view: use TaskInstance-based API
    if (selected === 'today' && view !== 'calendar') {
      fetch('/api/tasks/today')
        .then(r => {
          if (!r.ok) throw new Error(`${r.status}`);
          return r.json() as Promise<TodayResponse>;
        })
        .then(data => {
          // Guard: ensure the response has the expected shape
          setTodayData({
            overdue:   Array.isArray(data?.overdue)   ? data.overdue   : [],
            today:     Array.isArray(data?.today)     ? data.today     : [],
            missed:    Array.isArray(data?.missed)    ? data.missed    : [],
            completed: Array.isArray(data?.completed) ? data.completed : [],
          });
        })
        .catch(() => {
          setTodayData({ overdue: [], today: [], missed: [], completed: [] });
          toast('Failed to load today\'s tasks', 'error');
        })
        .finally(() => setLoading(false));
      return;
    }
    // All other views: use Task-based API
    const url = view === 'calendar'
      ? '/api/tasks?smartList=all'
      : selected.startsWith('list:')
        ? `/api/tasks?listId=${selected.replace('list:', '')}`
        : `/api/tasks?smartList=${selected}`;
    fetch(url)
      .then(r => r.json())
      .then(data => setTasks(Array.isArray(data) ? data : []))
      .catch(() => toast('Failed to load tasks', 'error'))
      .finally(() => setLoading(false));
  }, [selected, view]);

  const fetchLists = useCallback(() => { fetch('/api/task-lists').then(r => r.json()).then(d => { if (Array.isArray(d)) setLists(d); }).catch(() => {}); }, []);
  useEffect(() => { fetchTasks(); fetchLists(); }, [fetchTasks, fetchLists]);
  useEffect(() => { if (searchParams.get('create') === '1') setShowFab(true); }, [searchParams]);

  // Open the reminder modal when navigated to via ?task=ID (e.g. from a push notification).
  // Fetch directly from API so it works regardless of which view is currently selected.
  useEffect(() => {
    const taskId = searchParams.get('task');
    if (!taskId) return;
    fetch(`/api/tasks/${taskId}`)
      .then(r => r.ok ? r.json() : null)
      .then(task => { if (task?.id) setReminderTask(task); })
      .catch(() => {});
  }, [searchParams]);

  // Refresh tasks automatically at midnight so "Today" resets correctly
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1, 0).getTime() - now.getTime();
    const t = setTimeout(() => { fetchTasks(); }, msUntilMidnight);
    return () => clearTimeout(t);
  }, [fetchTasks]);

  const handleAddTask = async (titleArg?: string, opts?: { dueDate?: string; dueTime?: string; reminder?: string; repeat?: string; priority?: string; tags?: string[]; listId?: string; addToHabit?: boolean }): Promise<Task | null> => {
    const t = (titleArg ?? newTaskTitle).trim(); if (!t) return null;
    setAddingTask(true);
    try {
      const listId = opts?.listId ?? (selected.startsWith('list:') ? selected.replace('list:', '') : null);
      const dueDate = opts?.dueDate ?? (selected === 'today' ? todayString() : null);
      // Build tags including reminder/repeat if provided
      const baseTags = opts?.tags ?? [];
      const extraTags: string[] = [];
      if (opts?.reminder && opts.reminder !== 'none') extraTags.push(`reminder:${opts.reminder}`);
      if (opts?.repeat && opts.repeat !== 'none') extraTags.push(`repeat:${opts.repeat}`);
      const allTags = [...baseTags, ...extraTags];
      const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t, listId: listId || null, dueDate, dueTime: opts?.dueTime || null, priority: opts?.priority ?? 'none', tags: allTags }) });
      if (!res.ok) throw new Error();
      const task = await res.json();

      // If addToHabit is requested, create a habit and link it to the task
      if (opts?.addToHabit && task.id) {
        const habitRes = await fetch('/api/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: t, color: '#10B981', iconEmoji: '✅' }),
        });
        if (habitRes.ok) {
          const habit = await habitRes.json();
          const existingTags = JSON.parse(task.tags || '[]');
          await fetch(`/api/tasks/${task.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tags: JSON.stringify([...existingTags, `habit:${habit.id}`]) }),
          });
          task.tags = JSON.stringify([...existingTags, `habit:${habit.id}`]);
        }
      }

      setTasks(prev => [task, ...prev]); setNewTaskTitle(''); setRefreshKey(k => k + 1); setActiveTask(task);
      return task;
    } catch { toast('Failed to add task', 'error'); return null; } finally { setAddingTask(false); }
  };

  // ── List view handlers (work on Task records) ────────────────────────────
  const handleComplete = async (id: string) => {
    const ct = tasks.find(t => t.id === id);
    try {
      const res = await fetch(`/api/tasks/${id}/complete`, { method: 'PATCH' }); if (!res.ok) throw new Error();
      setTasks(prev => prev.filter(t => t.id !== id));
      setRefreshKey(k => k + 1); toast('Task completed!');
    } catch { toast('Failed to complete', 'error'); return; }

    // If task is linked to a habit, log it as done for today — silent failure
    if (ct) {
      try {
        const tags: string[] = (() => { try { return JSON.parse(ct.tags || '[]'); } catch { return []; } })();
        const habitTag = tags.find(t => t.startsWith('habit:'));
        if (habitTag) {
          const habitId = habitTag.replace('habit:', '');
          const today = new Date().toISOString().split('T')[0];
          await fetch(`/api/habits/${habitId}/log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: today }) });
        }
      } catch { /* habit log failure must not affect task UX */ }
    }
  };
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setTasks(p => p.filter(t => t.id !== id));
      toast('Moved to deleted');
    } catch { toast('Failed to delete', 'error'); }
  };
  const handleSetPriority = async (id: string, priority: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ priority }) });
      if (!res.ok) throw new Error();
      setTasks(p => p.map(t => t.id === id ? { ...t, priority } : t));
    } catch { toast('Failed to update priority', 'error'); }
  };
  const handleSetDueDate = async (id: string, date: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dueDate: date || null }) });
      if (!res.ok) throw new Error();
      setTasks(p => p.map(t => t.id === id ? { ...t, dueDate: date || undefined } : t));
      setRefreshKey(k => k + 1);
    } catch { toast('Failed to update due date', 'error'); }
  };
  const handleMoveToList = async (id: string, listId: string | null) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listId }) });
      if (!res.ok) throw new Error();
      const list = listId ? lists.find(l => l.id === listId) : null;
      setTasks(p => p.map(t => t.id === id ? { ...t, listId: listId ?? undefined, list: list ? { id: list.id, name: list.name, emoji: list.emoji, color: list.color } : null } : t));
    } catch { toast('Failed to move task', 'error'); }
  };

  const handleTaskUpdated = (updated: Task) => {
    if (updated.status === 'completed') { setTasks(p => p.filter(t => t.id !== updated.id)); }
    else { setTasks(p => p.map(t => t.id === updated.id ? updated : t)); }
    setActiveTask(updated); setRefreshKey(k => k + 1);
  };
  const handleTaskDeleted = async (id: string) => { await handleDelete(id); setActiveTask(null); };
  const handleTaskCompleted = (id: string) => { handleComplete(id); setActiveTask(null); };

  // ── Today view handlers (work on TaskInstance records) ───────────────────
  const handleInstanceComplete = async (instanceId: string) => {
    try {
      const res = await fetch(`/api/tasks/instances/${instanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (!res.ok) throw new Error();
      toast('Task completed!');
      fetchTasks();
    } catch { toast('Failed to complete', 'error'); }
  };

  const handleInstanceDelete = async (instanceId: string) => {
    try {
      const res = await fetch(`/api/tasks/instances/${instanceId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Removed from today');
      // Optimistic: remove from todayData state
      setTodayData(prev => {
        if (!prev) return prev;
        const remove = (arr: TaskInstanceWithTask[]) => arr.filter(i => i.id !== instanceId);
        return { overdue: remove(prev.overdue), today: remove(prev.today), missed: remove(prev.missed), completed: remove(prev.completed) };
      });
    } catch { toast('Failed to remove', 'error'); }
  };

  // Click an instance → open TaskDetail with the underlying Task
  const handleInstanceClick = async (inst: TaskInstanceWithTask) => {
    setShowFab(false);
    try {
      const res = await fetch(`/api/tasks/${inst.taskId}`);
      if (res.ok) { const task = await res.json(); setActiveTask(task); }
    } catch { /* silently ignore */ }
  };

  // Map a TaskInstance to the Task shape that TaskItem expects.
  // id = instanceId (used for complete/delete instance endpoints).
  // isActive flag carries the real taskId so priority/date/list handlers
  // can call /api/tasks/:taskId instead of /api/tasks/:instanceId.
  function instanceToDisplayTask(inst: TaskInstanceWithTask): Task & { _taskId: string } {
    return {
      id:       inst.id,       // instance id — used by handleInstanceComplete/Delete
      _taskId:  inst.taskId,   // underlying task id — used by metadata handlers
      title:    inst.task.title,
      priority: inst.task.priority,
      dueDate:  inst.date,
      dueTime:  inst.task.dueTime ?? undefined,
      tags:     inst.task.tags,
      listId:   inst.task.listId ?? undefined,
      status:   inst.status === 'completed' ? 'completed' : 'active',
      list:     inst.task.list
        ? { id: inst.task.list.id, name: inst.task.list.name, color: inst.task.list.color ?? undefined, emoji: inst.task.list.emoji ?? undefined }
        : undefined,
      subtasks: [],
    };
  }

  // Wrapper handlers that extract the real task ID from an instance display-task
  const handleInstanceSetPriority = (id: string, priority: string) => {
    const inst = [...todayData.overdue, ...todayData.today, ...todayData.missed, ...todayData.completed]
      .find(i => i.id === id);
    if (inst) handleSetPriority(inst.taskId, priority);
  };
  const handleInstanceSetDueDate = (id: string, date: string) => {
    const inst = [...todayData.overdue, ...todayData.today, ...todayData.missed, ...todayData.completed]
      .find(i => i.id === id);
    if (inst) handleSetDueDate(inst.taskId, date);
  };
  const handleInstanceMoveToList = (id: string, listId: string | null) => {
    const inst = [...todayData.overdue, ...todayData.today, ...todayData.missed, ...todayData.completed]
      .find(i => i.id === id);
    if (inst) handleMoveToList(inst.taskId, listId);
  };
  const toggleGroup = (label: string) => { setCollapsedGroups(p => { const n = new Set(p); n.has(label) ? n.delete(label) : n.add(label); return n; }); };

  const todayStr = todayString();

  const sortTaskList = (list: Task[]): Task[] => {
    if (sortBy === 'custom') return list;
    return [...list].sort((a, b) => {
      if (sortBy === 'date') {
        const da = a.dueDate ?? '9999'; const db = b.dueDate ?? '9999';
        if (da !== db) return da < db ? -1 : 1;
        return (a.dueTime ?? '') < (b.dueTime ?? '') ? -1 : 1;
      }
      if (sortBy === 'title') return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      if (sortBy === 'tag') {
        const ta = (JSON.parse(a.tags || '[]') as string[])[0] ?? '';
        const tb = (JSON.parse(b.tags || '[]') as string[])[0] ?? '';
        return ta.localeCompare(tb);
      }
      if (sortBy === 'priority') return (PRI_ORDER[a.priority] ?? 3) - (PRI_ORDER[b.priority] ?? 3);
      return 0;
    });
  };

  const groupedTasks = useMemo((): TaskGroup[] => {
    // For Today view, filtering is handled inline in the render — groupedTasks is only used for non-today views
    const filtered = searchQuery ? tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())) : tasks;
    // next7: group by day, expanding recurring tasks
    if (selected === 'next7') {
      const days = [0,1,2,3,4,5,6,7].map(i => todayString(i));
      const grouped = new Map<string, Task[]>();
      for (const t of filtered) {
        if (t.isRecurring) {
          let tagArr: string[] = [];
          try { tagArr = JSON.parse(t.tags || '[]'); } catch { /* ignore */ }
          const repeatTag = tagArr.find(tag => tag.startsWith('repeat:'));
          const repeatType = repeatTag?.replace('repeat:', '');
          const taskDow = t.dueDate ? new Date(t.dueDate + 'T00:00:00').getDay() : new Date().getDay();
          for (const day of days) {
            const dow = new Date(day + 'T00:00:00').getDay();
            const matches =
              repeatType === 'daily' ||
              (repeatType === 'weekdays' && dow >= 1 && dow <= 5) ||
              (repeatType === 'weekends' && (dow === 0 || dow === 6)) ||
              (repeatType === 'weekly' && dow === taskDow);
            if (matches) {
              const bucket = grouped.get(day) ?? [];
              bucket.push({ ...t, dueDate: day });
              grouped.set(day, bucket);
            }
          }
        } else {
          const key = t.dueDate;
          if (key && days.includes(key)) {
            grouped.set(key, [...(grouped.get(key) ?? []), t]);
          }
        }
      }
      return days.filter(d => grouped.has(d)).map(d => ({ label: next7Label(d), tasks: sortTaskList(grouped.get(d) ?? []) }));
    }
    // All other list views: single flat group — no overdue/completed sections
    // (inline label logic — avoids TDZ from calling getListName before it's initialized)
    let label = 'Inbox';
    if (selected.startsWith('list:')) {
      const found = lists.find(l => l.id === selected.replace('list:', ''));
      if (found) {
        const isActualEmoji = found.emoji && [...found.emoji].length <= 2;
        label = isActualEmoji ? `${found.emoji} ${found.name}` : found.name;
      } else {
        label = 'List';
      }
    } else if (selected !== 'inbox') {
      label = SMART_LABELS[selected] || selected;
    }
    return [{ label, tasks: sortTaskList(filtered) }];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, lists, selected, todayStr, searchQuery, sortBy]);

  const getListName = (v: string) => {
    if (v.startsWith('list:')) {
      const l = lists.find(i => i.id === v.replace('list:', ''));
      if (!l) return 'List';
      // Only prepend emoji if it's an actual emoji (≤2 code points), not a Lucide icon name string
      const isActualEmoji = l.emoji && [...l.emoji].length <= 2;
      return isActualEmoji ? `${l.emoji} ${l.name}` : l.name;
    }
    return SMART_LABELS[v] || v;
  };
  const listLabel = getListName(selected);
  const listSubtitle = selected === 'today' ? 'Overdue, today, missed and completed task instances.' : selected === 'next7' ? 'Tasks grouped from today through next seven days.' : selected === 'inbox' ? 'Tasks waiting to be scheduled.' : 'Tasks inside the selected list.';
  // Clear the active task detail panel whenever the user switches list/section
  const handleSelectList = (v: string) => { setSelected(v); setActiveTask(null); };

  const focusCreateTask = () => { setView('tasks'); setActiveTask(null); if (typeof window !== 'undefined' && window.innerWidth < 768) setShowFab(true); else window.setTimeout(() => inputRef.current?.focus(), 80); };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F8FB] text-gray-900 dark:bg-[#12161D] dark:text-gray-100">
      <div className="hidden md:flex">
        <TasksSidebar selected={selected} onSelect={handleSelectList} refreshKey={refreshKey} view={view} onViewChange={setView} />
      </div>
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-[55] md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[80%] max-w-sm overflow-y-auto shadow-2xl animate-slide-in-left">
            <TasksSidebar mobile selected={selected} onSelect={v => { handleSelectList(v); setMobileSidebarOpen(false); }} refreshKey={refreshKey} view={view} onViewChange={v => { setView(v); setMobileSidebarOpen(false); }} />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden md:p-5">

        {/* MOBILE HEADER */}
        <div className="flex-none md:hidden px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="flex items-center gap-2">
              <Menu className="h-5 w-5 text-gray-400" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">Tasks</span>
            </button>
            <Link href="/orbit" className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-semibold text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-gray-800 transition">
              <OrbitIcon src="/icons/top-icon.png" className="h-6 w-6 flex-none rounded-lg object-cover shadow-sm" fallbackClassName="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 text-xs font-bold text-white shadow-sm" />
              <span>MyOrbit</span>
            </Link>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{view === 'calendar' ? 'Calendar' : listLabel}</h2>
          {searchOpen ? (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-gray-700/60 dark:bg-[#1C1F26] mb-2">
              <Search className="h-4 w-4 flex-none text-gray-400" />
              <input autoFocus className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white" placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)} />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }}><X className="h-4 w-4 text-gray-400" /></button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-400 shadow-sm mb-2 dark:border-gray-700/60 dark:bg-[#1C1F26]">
              <Search className="h-4 w-4" /><span>Search tasks...</span>
            </button>
          )}
        </div>

        {/* DESKTOP HEADER */}
        <div className="mb-4 hidden items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700/60 md:flex">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-white">{view === 'calendar' ? 'Calendar' : listLabel}</h1>
            <p className="mt-0.5 hidden text-sm text-gray-500 dark:text-gray-400 sm:block">{view === 'calendar' ? 'Plan and review tasks across calendar views.' : listSubtitle}</p>
          </div>
          <Link href="/orbit" className="hidden md:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800">
            <OrbitIcon src="/icons/top-icon.png" />
            <span className="text-base font-semibold text-gray-900 dark:text-white">MyOrbit</span>
          </Link>
        </div>

        {/* CONTENT */}
        <div className="flex min-h-0 flex-1 gap-2 overflow-hidden px-4 pb-24 md:px-0 md:pb-0">
          {view === 'calendar' ? (
            <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-[#1A2029] shadow-sm">
              <TaskCalendar tasks={tasks} onOpenSidebar={() => setMobileSidebarOpen(true)} onTaskClick={t => setActiveTask(t)} />
            </div>
          ) : (
            <>
              <div id="task-panels" className="flex min-h-0 w-full gap-0 overflow-hidden">
              <section className="flex min-w-0 flex-1 flex-col overflow-hidden" style={{ flexBasis: activeTask ? `${100 - panelWidth}%` : '100%' }}>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {/* Desktop add task — calendar + dropdown working */}
                  <div className="relative hidden md:block">
                    <div className="group flex cursor-text items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:border-gray-300 dark:border-gray-700/60 dark:bg-[#1C1F26]">
                      <Plus className="h-5 w-5 flex-none text-gray-400 transition group-hover:text-emerald-500" onClick={() => inputRef.current?.focus()} />
                      <input ref={inputRef} className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white dark:placeholder-gray-600" placeholder="Add task" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !addingTask) {
                            void handleAddTask(undefined, { dueDate: desktopDueDate || undefined, dueTime: desktopDueTime || undefined, reminder: desktopReminder, repeat: desktopRepeat, priority: desktopPriority, listId: desktopListId || undefined, tags: desktopTags, addToHabit: desktopAddToHabit });
                            setDesktopDueDate(''); setDesktopDueTime(''); setDesktopReminder('none'); setDesktopRepeat('none');
                            setDesktopPriority('none'); setDesktopListId(''); setDesktopTags([]); setDesktopAddToHabit(false);
                            setShowDesktopCal(false); setShowDesktopMore(false);
                          }
                        }}
                        disabled={addingTask}
                      />
                      {/* Calendar icon */}
                      <button title="Set due date" onClick={e => { e.stopPropagation(); setShowDesktopMore(false); setShowDesktopCal(v => !v); }}
                        className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg transition hover:bg-gray-100 dark:hover:bg-white/10 ${showDesktopCal || desktopDueDate ? 'text-emerald-500' : 'text-gray-400'}`}
                      >
                        <CalendarDays className="h-4 w-4" />
                      </button>
                      {/* Down arrow — more options */}
                      <button onClick={e => { e.stopPropagation(); setShowDesktopCal(false); setShowDesktopMore(v => !v); }} title="More options"
                        className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg transition hover:bg-gray-100 dark:hover:bg-white/10 ${showDesktopMore ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-white' : 'text-gray-400'}`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                    {/* Calendar popup */}
                    {showDesktopCal && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowDesktopCal(false)} />
                        <div className="absolute left-0 top-full z-50 mt-1 w-72">
                          <MiniCalendarPopup
                            dueDate={desktopDueDate} dueTime={desktopDueTime}
                            reminder={desktopReminder} repeat={desktopRepeat}
                            onSelect={setDesktopDueDate} onClose={() => setShowDesktopCal(false)}
                            onTimeChange={setDesktopDueTime} onReminderChange={setDesktopReminder} onRepeatChange={setDesktopRepeat}
                          />
                        </div>
                      </>
                    )}
                    {/* More options popup */}
                    {showDesktopMore && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowDesktopMore(false)} />
                        <div className="absolute right-0 top-full z-50 mt-1">
                          <MoreOptionsDropdown
                            priority={desktopPriority} listId={desktopListId} lists={lists} tags={desktopTags}
                            addToHabit={desktopAddToHabit}
                            onPriority={setDesktopPriority} onList={setDesktopListId} onTag={t => setDesktopTags(p => p.includes(t) ? p.filter(i => i !== t) : [...p, t])}
                            onAddToHabit={setDesktopAddToHabit}
                            onClose={() => setShowDesktopMore(false)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  {loading ? (
                    <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700/60 dark:bg-[#1C1F26]"><div className="h-5 w-5 flex-none rounded-md bg-gray-200 dark:bg-gray-700" /><div className="h-4 flex-1 rounded bg-gray-200 dark:bg-gray-700" /></div>)}</div>

                  ) : selected === 'today' ? (
                    /* ── TODAY VIEW: 4 TaskInstance sections ─────────────────── */
                    (() => {
                      const td = todayData;
                      const totalPending = (td?.overdue.length ?? 0) + (td?.today.length ?? 0) + (td?.missed.length ?? 0);
                      const totalCompleted = td?.completed.length ?? 0;

                      if (!td || (totalPending === 0 && totalCompleted === 0)) {
                        return (
                          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center dark:border-gray-700/60 dark:bg-[#1C1F26]">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20">
                              <Sun className="h-8 w-8 text-amber-500" />
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white">All caught up!</p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No pending tasks for today</p>
                          </div>
                        );
                      }

                      const filterInstances = (arr: TaskInstanceWithTask[]) =>
                        searchQuery
                          ? arr.filter(i => i.task.title.toLowerCase().includes(searchQuery.toLowerCase()))
                          : arr;

                      const SECTIONS = [
                        { key: 'overdue',   label: 'Overdue',   instances: filterInstances([...td.overdue, ...td.missed]), headerCls: 'text-rose-600 dark:text-rose-400',     badgeCls: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',     borderCls: 'border-rose-200 dark:border-rose-800/30' },
                        { key: 'today',     label: 'Today',     instances: filterInstances(td.today),                      headerCls: 'text-emerald-700 dark:text-emerald-400', badgeCls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', borderCls: 'border-emerald-200 dark:border-emerald-800/30' },
                        { key: 'completed', label: 'Completed', instances: filterInstances(td.completed),                  headerCls: 'text-gray-500 dark:text-gray-400',      badgeCls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',        borderCls: 'border-gray-200 dark:border-gray-700/40' },
                      ] as const;

                      return (
                        <div className="space-y-2">
                          {SECTIONS.filter(s => s.instances.length > 0).map(section => (
                            <div key={section.key} className={`overflow-hidden rounded-2xl border bg-white dark:bg-[#1C1F26] ${section.borderCls}`}>
                              <button onClick={() => toggleGroup(section.key)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
                                <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${!collapsedGroups.has(section.key) ? 'rotate-90' : ''}`} />
                                <span className={`text-sm font-semibold ${section.headerCls}`}>{section.label}</span>
                                <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${section.badgeCls}`}>{section.instances.length}</span>
                              </button>
                              {!collapsedGroups.has(section.key) && (
                                <div className="space-y-0.5 px-2 pb-2">
                                  {section.instances.map(inst => (
                                    <TaskItem
                                      key={inst.id}
                                      task={instanceToDisplayTask(inst)}
                                      onComplete={section.key !== 'completed' ? handleInstanceComplete : undefined}
                                      onDelete={handleInstanceDelete}
                                      onClick={() => handleInstanceClick(inst)}
                                      isActive={activeTask?.id === inst.taskId}
                                      showList
                                      lists={lists}
                                      onSetPriority={handleInstanceSetPriority}
                                      onSetDueDate={handleInstanceSetDueDate}
                                      onMoveToList={handleInstanceMoveToList}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()

                  ) : tasks.length === 0 ? (
                    /* ── LIST VIEW EMPTY STATE ───────────────────────────────── */
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center dark:border-gray-700/60 dark:bg-[#1C1F26]">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800">
                        {selected === 'inbox' ? <Inbox className="h-8 w-8 text-sky-500" /> : <CalendarDays className="h-8 w-8 text-indigo-500" />}
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">No tasks here</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tap + to add your first task</p>
                    </div>

                  ) : (
                    /* ── LIST VIEW: flat task list, no completed/overdue sections ── */
                    <div className="space-y-2">
                      {groupedTasks.map((group, gi) => (
                        <div key={group.label} className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700/60 dark:bg-[#1C1F26]">
                          <div className="flex items-center pr-2">
                            <button onClick={() => toggleGroup(group.label)} className="flex flex-1 items-center gap-2 px-4 py-3 text-left">
                              <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${!collapsedGroups.has(group.label) ? 'rotate-90' : ''}`} />
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">{group.label}</span>
                              <span className="ml-1 text-sm text-gray-400">{group.tasks.length}</span>
                            </button>
                            {/* Sort icon — only on first group */}
                            {gi === 0 && (
                              <div className="relative flex-none">
                                <button
                                  onClick={e => { e.stopPropagation(); setShowSortMenu(v => !v); }}
                                  title="Sort tasks"
                                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${showSortMenu || sortBy !== 'custom' ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                                >
                                  <ArrowUpDown className="h-3.5 w-3.5" />
                                </button>
                                {showSortMenu && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                                    <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-[#1C1F26]">
                                      <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Sort by</p>
                                      {SORT_OPTIONS.map(o => (
                                        <button key={o.v} onClick={() => { setSortBy(o.v); setShowSortMenu(false); }}
                                          className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition ${sortBy === o.v ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'}`}
                                        >
                                          <span className="flex-1 text-left">{o.l}</span>
                                          {sortBy === o.v && <Check className="h-3.5 w-3.5 text-blue-500" />}
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          {!collapsedGroups.has(group.label) && (
                            <div className="space-y-0.5 px-2 pb-2">
                              {group.tasks.map(task => (
                                <TaskItem
                                  key={task.id}
                                  task={task}
                                  onComplete={handleComplete}
                                  onDelete={handleDelete}
                                  onClick={() => { setShowFab(false); setActiveTask(task); }}
                                  isActive={activeTask?.id === task.id}
                                  showList={!selected.startsWith('list:')}
                                  lists={lists}
                                  onSetPriority={handleSetPriority}
                                  onSetDueDate={handleSetDueDate}
                                  onMoveToList={handleMoveToList}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
              {/* Drag divider */}
              {activeTask && (
                <div
                  onMouseDown={handleDividerMouseDown}
                  className={`hidden lg:flex w-1.5 flex-none cursor-col-resize items-center justify-center hover:bg-emerald-200 dark:hover:bg-emerald-800 transition ${dragging ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  <div className="h-8 w-0.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                </div>
              )}
              {/* Desktop right panel */}
              <section className="hidden min-w-0 lg:flex" style={{ flexBasis: `${panelWidth}%` }}>
                {activeTask ? <TaskDetail task={activeTask} lists={lists} onClose={() => setActiveTask(null)} onUpdated={handleTaskUpdated} onDeleted={handleTaskDeleted} onCompleted={handleTaskCompleted} /> : null}
              </section>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Mobile task detail bottom sheet — half page, above bottom nav */}
      {activeTask && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setActiveTask(null)} />
          <div className="fixed inset-x-2 z-[65] rounded-2xl bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col" style={{ bottom: '76px', height: '60vh' }}>
            <div className="flex justify-center pt-3 pb-1 flex-none"><div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" /></div>
            <div className="flex-1 overflow-hidden">
              <TaskDetail task={activeTask} lists={lists} onClose={() => setActiveTask(null)} onUpdated={handleTaskUpdated} onDeleted={handleTaskDeleted} onCompleted={handleTaskCompleted} />
            </div>
          </div>
        </div>
      )}

      {showFab && <AddTaskSheet onClose={() => setShowFab(false)} onAdd={handleAddTask} lists={lists} />}

      {!showFab && !activeTask && (
        <button onClick={() => { setActiveTask(null); setShowFab(true); }} className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg active:scale-95 transition md:hidden">
          <Plus className="h-6 w-6" />
        </button>
      )}

      <TasksMobileNav selected={selected} view={view} onSelect={handleSelectList} onViewChange={setView} focusAdd={focusCreateTask} />

      {/* Notification reminder modal — shown when app opens via push notification tap */}
      {reminderTask && (
        <TaskReminderModal
          task={reminderTask}
          onClose={() => setReminderTask(null)}
          onDone={() => {
            handleTaskCompleted(reminderTask.id);
            setReminderTask(null);
          }}
        />
      )}
    </div>
  );
}