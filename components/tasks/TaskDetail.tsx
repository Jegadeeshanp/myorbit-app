'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  X, Plus, Trash2, CheckCircle2, Circle, Flag, Calendar, Bell,
  RotateCcw, Clock, ChevronRight, Tag, ChevronLeft, Check, List as ListIcon,
} from 'lucide-react';
import { toast } from '@/components/Toast';

// ── Types ─────────────────────────────────────────────────────────────────────
type Subtask = {
  id: string; title: string; isDone: boolean;
  notes?: string; dueDate?: string; dueTime?: string; tags?: string | string[];
};
type TaskList = { id: string; name: string; emoji?: string; color?: string };
type Task = {
  id: string; title: string; notes?: string; status: string; priority: string;
  dueDate?: string; dueTime?: string; tags: string; listId?: string; isActive?: boolean;
  subtasks: Subtask[];
  list?: { id: string; name: string; emoji?: string; color?: string } | null;
};

const PRIORITY_FLAG_COLOR: Record<string, string> = {
  high: 'text-rose-500', medium: 'text-amber-500', low: 'text-blue-500', none: 'text-gray-400 dark:text-gray-500',
};
const PRIORITY_LABEL: Record<string, string> = { high: 'High', medium: 'Medium', low: 'Low', none: 'None' };
const REMINDER_OPTIONS = [
  { value: 'on-time', label: 'On time' }, { value: '5m', label: '5 min early' },
  { value: '30m', label: '30 min early' }, { value: '1h', label: '1 hour early' },
  { value: '1d', label: '1 day early' }, { value: 'custom', label: 'Custom' },
];
const REPEAT_OPTIONS = [
  { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' },
  { value: 'weekdays', label: 'Every Weekday' }, { value: 'custom', label: 'Custom' },
];

function formatDateLabel(d?: string) {
  if (!d) return 'Set date';
  const date = new Date(`${d}T00:00:00`); const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today'; if (diff === 1) return 'Tomorrow'; if (diff === -1) return 'Yesterday';
  return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
}
function parseTags(raw: string | string[] | undefined): string[] {
  if (Array.isArray(raw)) return raw.filter((i): i is string => typeof i === 'string');
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p.filter((i): i is string => typeof i === 'string') : []; } catch { return []; }
}
function buildTag(prefix: string, value: string) { return `${prefix}:${value}`; }
function extractTag(tags: string[], prefix: string, fallback: string) {
  const hit = tags.find(t => t.startsWith(`${prefix}:`)); return hit ? hit.slice(prefix.length + 1) : fallback;
}
function visibleTags(tags: string[]) { return tags.filter(t => !t.startsWith('repeat:') && !t.startsWith('reminder:')); }

// ── Auto-growing textarea ─────────────────────────────────────────────────────
function AutoTextarea({ value, onChange, onBlur, placeholder, className }: {
  value: string; onChange: (v: string) => void; onBlur: () => void; placeholder?: string; className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea ref={ref} rows={1} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)} onBlur={onBlur}
      className={`w-full resize-none overflow-hidden bg-transparent focus:outline-none ${className ?? ''}`}
      style={{ minHeight: '1.5rem' }}
    />
  );
}

// ── Compact Date Picker ────────────────────────────────────────────────────────
function CompactDatePicker({ dueDate, dueTime, reminder, repeat,
  setDueDate, setDueTime, setReminder, setRepeat, onSave, onClose, inline }: {
  dueDate: string; dueTime: string; reminder: string; repeat: string;
  setDueDate: (v:string)=>void; setDueTime: (v:string)=>void;
  setReminder: (v:string)=>void; setRepeat: (v:string)=>void;
  onSave: ()=>void; onClose: ()=>void; inline?: boolean;
}) {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2,'0');
  const todayStr = today.toISOString().split('T')[0];
  const [vYear, setVYear] = useState(() => dueDate ? parseInt(dueDate.split('-')[0]) : today.getFullYear());
  const [vMonth, setVMonth] = useState(() => dueDate ? parseInt(dueDate.split('-')[1])-1 : today.getMonth());
  const [showTime, setShowTime] = useState(false);
  const [showRemind, setShowRemind] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);

  const firstDow = (new Date(vYear, vMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(vYear, vMonth+1, 0).getDate();
  const cells: (number|null)[] = [];
  for (let i=0; i<firstDow; i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(d);

  const QUICK = [
    { label: 'Today',    v: todayStr },
    { label: 'Tomorrow', v: (() => { const d=new Date(today); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; })() },
    { label: 'Next Mon', v: (() => { const d=new Date(today); const day=d.getDay(); d.setDate(d.getDate()+(day===0?1:8-day)); return d.toISOString().split('T')[0]; })() },
    { label: 'No Date',  v: '' },
  ];

  const REMIND_OPTS = [
    {v:'none',l:'None'},{v:'on-time',l:'On time'},{v:'5m',l:'5 min early'},
    {v:'30m',l:'30 min early'},{v:'1h',l:'1 hour early'},{v:'1d',l:'1 day early'},
  ];
  const REPEAT_OPTS = ['none','daily','weekly','monthly','yearly'];
  const remLabel = REMIND_OPTS.find(o=>o.v===reminder)?.l ?? 'None';
  const repLabel = repeat === 'none' ? 'None' : repeat.charAt(0).toUpperCase()+repeat.slice(1);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#1E2128] w-72 flex flex-col overflow-hidden h-full">
      {/* Scrollable content */}
      <div className="overflow-y-auto flex-1 min-h-0">
      {/* Quick chips */}
      <div className="flex gap-1 p-2 border-b border-gray-100 dark:border-gray-700/60">
        {QUICK.map(q => (
          <button key={q.label} type="button" onClick={() => { setDueDate(q.v); if (!q.v) onClose(); }}
            className={`flex-1 whitespace-nowrap rounded-full border py-1 text-[11px] font-medium transition text-center ${dueDate===q.v||(q.v===''&&!dueDate)?'border-emerald-500 bg-emerald-500 text-white':'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400'}`}
          >{q.label}</button>
        ))}
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between px-3 py-2">
        <button type="button" onClick={() => { if(vMonth===0){setVMonth(11);setVYear(y=>y-1);}else setVMonth(m=>m-1); }} className="h-6 w-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 text-base">‹</button>
        <span className="text-sm font-semibold text-gray-800 dark:text-white">{new Date(vYear,vMonth).toLocaleString('default',{month:'long',year:'numeric'})}</span>
        <button type="button" onClick={() => { if(vMonth===11){setVMonth(0);setVYear(y=>y+1);}else setVMonth(m=>m+1); }} className="h-6 w-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 text-base">›</button>
      </div>

      {/* Day grid */}
      <div className="px-2 pb-2">
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['M','T','W','T','F','S','S'].map((l,i)=><div key={i} className="text-center text-[10px] font-medium text-gray-400 py-0.5">{l}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day,idx) => {
            if(!day) return <div key={idx} className="h-8"/>;
            const ds=`${vYear}-${pad(vMonth+1)}-${pad(day)}`;
            const isSel=ds===dueDate; const isTod=ds===todayStr;
            return <button key={ds} type="button" onClick={()=>setDueDate(ds)}
              className={`flex h-8 w-full items-center justify-center rounded-full text-xs transition ${isSel?'bg-emerald-500 text-white font-bold':isTod?'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 font-semibold':'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10'}`}
            >{day}</button>;
          })}
        </div>
      </div>

      </div>{/* end scrollable */}

      {/* Time / Reminder / Repeat — outside the scroll container so overlay is never clipped */}
      <div className="relative flex-none border-t border-gray-100 dark:border-gray-700/60">
        {/* Overlay panel — floats upward over the calendar grid, never overflows downward */}
        {(showTime||showRemind||showRepeat) && (
          <div className="absolute bottom-full left-0 right-0 z-20 rounded-t-2xl border border-b-0 border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-[#1E2128]">
            {showTime && (
              <div className="px-3 py-3">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Set Time</p>
                <input type="time" value={dueTime} onChange={e=>setDueTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            )}
            {showRemind && (
              <div className="py-1">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Reminder</p>
                {REMIND_OPTS.map(o=><button key={o.v} type="button" onClick={()=>{setReminder(o.v);setShowRemind(false);}}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition ${reminder===o.v?'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30':'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'}`}
                >{o.l}{reminder===o.v&&<Check className="ml-auto h-3.5 w-3.5"/>}</button>)}
              </div>
            )}
            {showRepeat && (
              <div className="py-1">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Repeat</p>
                {REPEAT_OPTS.map(o=><button key={o} type="button" onClick={()=>{setRepeat(o);setShowRepeat(false);}}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition ${repeat===o?'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30':'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'}`}
                >{o==='none'?'No repeat':o.charAt(0).toUpperCase()+o.slice(1)}{repeat===o&&<Check className="ml-auto h-3.5 w-3.5"/>}</button>)}
              </div>
            )}
          </div>
        )}
        {/* Three trigger rows */}
        <button type="button" onClick={()=>{setShowTime(v=>!v);setShowRemind(false);setShowRepeat(false);}}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition">
          <Clock className="h-4 w-4 text-gray-400 flex-none"/><span className="flex-1 text-left text-gray-700 dark:text-gray-300">Time</span>
          <span className="text-xs text-gray-400">{dueTime||'None'}</span><ChevronRight className={`h-3.5 w-3.5 text-gray-300 transition-transform ${showTime?'rotate-90':''}`}/>
        </button>
        <button type="button" onClick={()=>{setShowRemind(v=>!v);setShowTime(false);setShowRepeat(false);}}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition border-t border-gray-100 dark:border-gray-700/40">
          <Bell className="h-4 w-4 text-gray-400 flex-none"/><span className="flex-1 text-left text-gray-700 dark:text-gray-300">Reminder</span>
          <span className="text-xs text-gray-400">{remLabel}</span><ChevronRight className={`h-3.5 w-3.5 text-gray-300 transition-transform ${showRemind?'rotate-90':''}`}/>
        </button>
        <button type="button" onClick={()=>{setShowRepeat(v=>!v);setShowTime(false);setShowRemind(false);}}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition border-t border-gray-100 dark:border-gray-700/40">
          <RotateCcw className="h-4 w-4 text-gray-400 flex-none"/><span className="flex-1 text-left text-gray-700 dark:text-gray-300">Repeat</span>
          <span className="text-xs text-gray-400">{repLabel}</span><ChevronRight className={`h-3.5 w-3.5 text-gray-300 transition-transform ${showRepeat?'rotate-90':''}`}/>
        </button>
      </div>

      {/* OK / Clear — always visible at bottom */}
      <div className="flex-none flex gap-2 border-t border-gray-100 p-2 dark:border-gray-700">
        <button type="button" onClick={()=>{setDueDate('');setDueTime('');setReminder('on-time');setRepeat('none');onClose();}}
          className="flex-1 rounded-xl border border-gray-200 py-2 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400">Clear</button>
        <button type="button" onClick={()=>{onSave();onClose();}}
          className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-500">OK</button>
      </div>
    </div>
  );
}


// ── Single panel (used for both main task and subtask) ────────────────────────
interface PanelProps {
  id: string; isSubtask?: boolean;
  title: string; notes: string; priority: string; dueDate: string; dueTime: string;
  status: string; tags: string[]; lists: TaskList[]; listId?: string;
  subtasks?: Subtask[];
  saving: boolean;
  onTitleChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
  onDueDateChange: (v: string) => void;
  onDueTimeChange: (v: string) => void;
  onTagsChange: (tags: string[]) => void;
  onListChange?: (listId: string) => void;
  onSave: (overrides?: Record<string, unknown>) => Promise<void>;
  onDelete: () => void;
  onComplete?: () => void;
  onSubtaskClick?: (st: Subtask) => void;
  onAddSubtask?: (title: string) => Promise<void>;
  onClose: () => void;
}

function TaskPanel({
  id, isSubtask, title, notes, priority, dueDate, dueTime, status, tags,
  lists, listId, subtasks, saving,
  onTitleChange, onNotesChange, onPriorityChange, onDueDateChange, onDueTimeChange,
  onTagsChange, onListChange, onSave, onDelete, onComplete, onSubtaskClick, onAddSubtask, onClose,
}: PanelProps) {
  const vTags = useMemo(() => visibleTags(tags), [tags]);
  const reminder = useMemo(() => extractTag(tags, 'reminder', 'on-time'), [tags]);
  const repeat   = useMemo(() => extractTag(tags, 'repeat',   'none'),    [tags]);

  const [localReminder, setLocalReminder] = useState(reminder);
  const [localRepeat,   setLocalRepeat]   = useState(repeat);
  const [localDueDate,  setLocalDueDate]  = useState(dueDate);
  const [localDueTime,  setLocalDueTime]  = useState(dueTime);
  const [showDate,    setShowDate]    = useState(false);
  const [calPos,      setCalPos]      = useState<React.CSSProperties | null>(null);
  const [showPri,     setShowPri]     = useState(false);
  const [priDropUp,   setPriDropUp]   = useState(false);
  const [showList,    setShowList]    = useState(false);
  const [openAction,  setOpenAction]  = useState<null|'subtask'|'tag'|'delete'|'moveto'>(null);
  const [newStTitle,  setNewStTitle]  = useState('');
  const [tagInput,    setTagInput]    = useState('');

  const dateBtnRef = useRef<HTMLButtonElement>(null);
  const priRef     = useRef<HTMLDivElement>(null);
  const priBtnRef  = useRef<HTMLButtonElement>(null);
  const listRef    = useRef<HTMLDivElement>(null);
  const listBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setLocalReminder(extractTag(tags,'reminder','on-time'));
    setLocalRepeat(extractTag(tags,'repeat','none'));
    setLocalDueDate(dueDate); setLocalDueTime(dueTime);
    setShowDate(false); setShowPri(false); setOpenAction(null);
  }, [id, dueDate, dueTime, tags]);

  // Close priority on outside click
  useEffect(() => {
    if (!showPri) return;
    const h = (e: MouseEvent) => {
      if (priRef.current && !priRef.current.contains(e.target as Node) && priBtnRef.current && !priBtnRef.current.contains(e.target as Node)) setShowPri(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showPri]);

  // Close list picker on outside click
  useEffect(() => {
    if (!showList) return;
    const h = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node) && listBtnRef.current && !listBtnRef.current.contains(e.target as Node)) setShowList(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showList]);

  const buildFull = useCallback(() => {
    const next = [...vTags];
    if (localReminder) next.push(buildTag('reminder', localReminder));
    if (localRepeat && localRepeat !== 'none') next.push(buildTag('repeat', localRepeat));
    return next;
  }, [vTags, localReminder, localRepeat]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase(); if (!t || vTags.includes(t)) return;
    const full = [...vTags, t, buildTag('reminder',localReminder), ...(localRepeat!=='none'?[buildTag('repeat',localRepeat)]:[])];
    onTagsChange(full); void onSave({tags:full}); setTagInput('');
  };
  const removeTag = (tag: string) => {
    const full = [...vTags.filter(i=>i!==tag), buildTag('reminder',localReminder), ...(localRepeat!=='none'?[buildTag('repeat',localRepeat)]:[])];
    onTagsChange(full); void onSave({tags:full});
  };

  const topLabel = `${formatDateLabel(localDueDate)}${localDueTime?`, ${localDueTime}`:''}`;
  const hasDate  = !!localDueDate;

  // FIX: handle Enter in subtask input
  const handleAddSubtask = async () => {
    if (!newStTitle.trim()) return;
    await onAddSubtask?.(newStTitle.trim());
    setNewStTitle('');
    setOpenAction(null);
  };

  return (
    <div data-task-panel className="relative flex h-full flex-col">

      {/* Date popup — same MiniCalendar style as AddTask, smart positioned */}
      {showDate && calPos && (
        <>
          <div className="fixed inset-0 z-[199]" onClick={() => { setShowDate(false); setCalPos(null); }} />
          <div className="fixed z-[200]" style={calPos} onClick={e => e.stopPropagation()}>
            <CompactDatePicker
              dueDate={localDueDate} dueTime={localDueTime}
              reminder={localReminder} repeat={localRepeat}
              setDueDate={setLocalDueDate} setDueTime={setLocalDueTime}
              setReminder={setLocalReminder} setRepeat={setLocalRepeat}
              onSave={() => {
                onDueDateChange(localDueDate); onDueTimeChange(localDueTime);
                const full = buildFull(); onTagsChange(full);
                void onSave({dueDate:localDueDate, dueTime:localDueTime, tags:full});
              }}
              onClose={() => { setShowDate(false); setCalPos(null); }}
            />
          </div>
        </>
      )}

      {/* ── Top bar: status + date + priority + close ── */}
      <div className="flex flex-none items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700/60">
        {status === 'completed'
          ? <CheckCircle2 className="h-4 w-4 flex-none text-emerald-500"/>
          : <Circle className="h-4 w-4 flex-none text-gray-400 dark:text-gray-500"/>
        }
        <button ref={dateBtnRef} onClick={() => {
            if (dateBtnRef.current) {
              const rect = dateBtnRef.current.getBoundingClientRect();
              const calH = 560;
              const spaceAbove = rect.top - 16;
              const spaceBelow = window.innerHeight - rect.bottom - 16;
              const left = Math.min(Math.max(rect.left - 8, 8), window.innerWidth - 328);
              const style: React.CSSProperties = { width: '320px', left };
              // Always prefer opening above if there's meaningful space, otherwise below
              if (spaceAbove >= 320) {
                style.bottom = window.innerHeight - rect.top + 8;
                style.maxHeight = `${Math.min(spaceAbove, calH)}px`;
              } else {
                style.top = rect.bottom + 8;
                style.maxHeight = `${Math.min(spaceBelow, calH)}px`;
              }
              setCalPos(style as React.CSSProperties);
            }
            setShowDate(v => !v);
          }}
          className={`flex flex-1 items-center gap-1.5 truncate text-xs transition ${hasDate?'text-sky-500 hover:text-sky-400':'text-gray-400 hover:text-gray-600 dark:text-gray-500'}`}
        >
          <Calendar className="h-3.5 w-3.5 flex-none"/>
          <span className="truncate">{topLabel}</span>
          {localRepeat!=='none' && <RotateCcw className="h-3 w-3 text-emerald-500"/>}
        </button>

        {/* Priority */}
        <div className="relative">
          <button ref={priBtnRef} onClick={() => {
            if (!showPri && priBtnRef.current) {
              const rect = priBtnRef.current.getBoundingClientRect();
              setPriDropUp(window.innerHeight - rect.bottom < 160);
            }
            setShowPri(v=>!v);
          }}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-gray-100 dark:hover:bg-gray-700 ${PRIORITY_FLAG_COLOR[priority]}`}
          >
            <Flag className="h-4 w-4"/>
          </button>
          {showPri && (
            <div ref={priRef} className={`absolute right-0 ${priDropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} z-50 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-[#252830]`}>
              {(['high','medium','low','none'] as const).map(level => (
                <button key={level} type="button"
                  onClick={() => { onPriorityChange(level); void onSave({priority:level, dueDate:localDueDate, dueTime:localDueTime}); setShowPri(false); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <Flag className={`h-3.5 w-3.5 ${PRIORITY_FLAG_COLOR[level]}`}/>
                  <span className="flex-1 text-gray-700 dark:text-gray-200">{PRIORITY_LABEL[level]}</span>
                  {priority===level && <Check className="h-3.5 w-3.5 text-sky-500"/>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Close button — right next to priority */}
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-700">
          <X className="h-4 w-4"/>
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Title */}
        <div className="px-5 pt-4 pb-1">
          <input
            className="w-full bg-transparent text-base font-bold text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white dark:placeholder-gray-600"
            value={title} placeholder={isSubtask ? 'Subtask title...' : 'Task title...'}
            onChange={e => onTitleChange(e.target.value)}
            onBlur={() => void onSave({title})}
            onKeyDown={e => e.key==='Enter' && onSave({title})}
          />
          {saving && <p className="mt-0.5 text-[10px] text-gray-400">Saving...</p>}
        </div>

        {/* Notes — auto-grow, pushes content down */}
        <div className="px-5 pb-3">
          <AutoTextarea value={notes} onChange={onNotesChange} onBlur={() => void onSave({notes})}
            placeholder="Add notes..."
            className="text-sm text-gray-500 placeholder-gray-400 dark:text-gray-400 dark:placeholder-gray-600"
          />
        </div>

        {/* Subtasks list — FIX: clickable rows, no chevron */}
        {!isSubtask && subtasks && subtasks.length > 0 && (
          <div className="px-4 pb-3 space-y-0.5">
            {subtasks.map(st => {
              const stTags = parseTags(st.tags);
              const stRepeat = extractTag(stTags, 'repeat', 'none');
              return (
                <div key={st.id} role="button" tabIndex={0}
                  onClick={() => onSubtaskClick?.(st)}
                  onKeyDown={e => e.key==='Enter' && onSubtaskClick?.(st)}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left transition hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <div
                    className={`flex h-4 w-4 flex-none items-center justify-center rounded border ${st.isDone?'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30':'border-gray-300 dark:border-gray-600'}`}
                  >
                    {st.isDone && <Check className="h-3 w-3 text-emerald-600"/>}
                  </div>
                  <span className={`flex-1 text-sm ${st.isDone?'line-through text-gray-400':'text-gray-700 dark:text-gray-300'}`}>{st.title}</span>
                  {(st.dueDate || st.dueTime) && (
                    <span className="flex items-center gap-1 text-[10px] text-sky-500">
                      {st.dueTime && <><Clock className="h-3 w-3"/><span>{st.dueTime}</span></>}
                      {!st.dueTime && st.dueDate && <span>{formatDateLabel(st.dueDate)}</span>}
                      {stRepeat!=='none' && <RotateCcw className="h-2.5 w-2.5 text-emerald-400"/>}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tags chips */}
        {vTags.length > 0 && (
          <div className="flex flex-wrap gap-1 px-5 pb-3">
            {vTags.map(tag => (
              <span key={tag} className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                {tag}<button onClick={() => removeTag(tag)}><X className="h-2.5 w-2.5"/></button>
              </span>
            ))}
          </div>
        )}

        <div className="h-16"/>
      </div>

      {/* ── Bottom action bar ── */}
      <div className="flex-none border-t border-gray-200 dark:border-gray-700/60">

        {/* Action popovers */}
        {openAction === 'subtask' && !isSubtask && (
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700/60">
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Add subtask</p>
            <div className="flex gap-2">
              <input autoFocus
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-600"
                placeholder="Subtask title..."
                value={newStTitle}
                onChange={e => setNewStTitle(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter') void handleAddSubtask(); if (e.key==='Escape') setOpenAction(null); }}
              />
              <button onClick={() => void handleAddSubtask()}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
              >Add</button>
            </div>
          </div>
        )}

        {openAction === 'tag' && (
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700/60">
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Add tag</p>
            <div className="flex gap-2">
              <input autoFocus
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-600"
                placeholder="Tag name..." value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter') { addTag(); setOpenAction(null); } if (e.key==='Escape') setOpenAction(null); }}
              />
              <button onClick={() => { addTag(); setOpenAction(null); }}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
              >Add</button>
            </div>
          </div>
        )}

        {openAction === 'delete' && (
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700/60">
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              {isSubtask ? 'Delete subtask?' : 'Delete task?'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setOpenAction(null)} className="flex-1 rounded-xl border border-gray-200 py-2 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400">Cancel</button>
              <button onClick={onDelete} className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-500">Delete</button>
            </div>
          </div>
        )}

        {/* Icon row — bigger icons for mobile */}
        <div className="flex items-center gap-0.5 px-2 py-2.5">
          {/* List picker — bottom left */}
          {!isSubtask && (
            <div className="relative">
              <button ref={listBtnRef} onClick={() => setShowList(v=>!v)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${showList ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : listId ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'} hover:bg-gray-100 dark:hover:bg-white/5`}
                title="Move to list"
              >
                <ListIcon className="h-5 w-5"/>
              </button>
              {showList && (
                <div ref={listRef} className="absolute left-0 bottom-full z-50 mb-1.5 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-[#252830]">
                  <button type="button"
                    onClick={() => { onListChange?.(''); void onSave({listId:''}); setShowList(false); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <span>📥</span>
                    <span className="flex-1 text-gray-700 dark:text-gray-200">Inbox</span>
                    {!listId && <Check className="h-3.5 w-3.5 text-sky-500"/>}
                  </button>
                  {lists.map(l => (
                    <button key={l.id} type="button"
                      onClick={() => { onListChange?.(l.id); void onSave({listId:l.id}); setShowList(false); }}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <span>{l.emoji||'📋'}</span>
                      <span className="flex-1 truncate text-gray-700 dark:text-gray-200">{l.name}</span>
                      {listId===l.id && <Check className="h-3.5 w-3.5 text-sky-500"/>}
                      {l.color && <span className="h-2 w-2 flex-none rounded-full" style={{backgroundColor:l.color}}/>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tag */}
          <button onClick={() => setOpenAction(v => v==='tag' ? null : 'tag')}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${openAction==='tag' ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/40' : 'text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-white/5'}`}
            title="Add tag"
          ><Tag className="h-5 w-5"/></button>

          {/* Complete button for subtask */}
          {isSubtask && status !== 'completed' && onComplete && (
            <button onClick={onComplete}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-emerald-600 transition hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <CheckCircle2 className="h-5 w-5"/>
            </button>
          )}

          <div className="flex-1"/>

          {/* Add subtask — main task only */}
          {!isSubtask && (
            <button onClick={() => setOpenAction(v => v==='subtask' ? null : 'subtask')}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${openAction==='subtask' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40' : 'text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-white/5'}`}
              title="Add subtask"
            ><Plus className="h-5 w-5"/></button>
          )}

          {/* Delete */}
          <button onClick={() => setOpenAction(v => v==='delete' ? null : 'delete')}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${openAction==='delete' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40' : 'text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-white/5'}`}
            title="Delete"
          ><Trash2 className="h-5 w-5"/></button>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
interface Props {
  task: Task; lists: TaskList[]; onClose: () => void;
  onUpdated: (t: Task) => void; onDeleted: (id: string) => void; onCompleted: (id: string) => void;
}

export default function TaskDetail({ task, lists, onClose, onUpdated, onDeleted, onCompleted }: Props) {
  const [title,    setTitle]    = useState(task.title);
  const [notes,    setNotes]    = useState(task.notes || '');
  const [priority, setPriority] = useState(task.priority);
  const [dueDate,  setDueDate]  = useState(task.dueDate || '');
  const [dueTime,  setDueTime]  = useState(task.dueTime || '');
  const [listId,   setListId]   = useState(task.listId || '');
  const [tags,     setTags]     = useState<string[]>(parseTags(task.tags));
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [saving,   setSaving]   = useState(false);

  // Active subtask state
  const [activeSt, setActiveSt] = useState<Subtask | null>(null);
  const [stTitle,    setStTitle]    = useState('');
  const [stNotes,    setStNotes]    = useState('');
  const [stPriority, setStPriority] = useState('none');
  const [stDueDate,  setStDueDate]  = useState('');
  const [stDueTime,  setStDueTime]  = useState('');
  const [stTags,     setStTags]     = useState<string[]>([]);
  const [stSaving,   setStSaving]   = useState(false);

  useEffect(() => {
    setTitle(task.title); setNotes(task.notes||''); setPriority(task.priority);
    setDueDate(task.dueDate||''); setDueTime(task.dueTime||''); setListId(task.listId||'');
    setTags(parseTags(task.tags)); setSubtasks(task.subtasks||[]);
    setActiveSt(null);
  }, [task]);

  useEffect(() => {
    if (!activeSt) return;
    const t = parseTags(activeSt.tags);
    setStTitle(activeSt.title); setStNotes(activeSt.notes||'');
    setStPriority(extractTag(t,'priority','none'));
    setStDueDate(activeSt.dueDate||''); setStDueTime(activeSt.dueTime||'');
    setStTags(t);
  }, [activeSt?.id]);

  const handleSave = async (overrides?: Record<string, unknown>) => {
    const p = { title:(overrides?.title as string)??title, notes:(overrides?.notes as string)??notes, priority:(overrides?.priority as string)??priority, dueDate:(overrides?.dueDate as string)??dueDate, dueTime:(overrides?.dueTime as string)??dueTime, listId:(overrides?.listId as string)??listId, tags:(overrides?.tags as string[])??tags };
    if (!p.title.trim()) { toast('Title required','error'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:p.title.trim(),notes:p.notes,priority:p.priority,dueDate:p.dueDate||null,dueTime:p.dueTime||null,tags:p.tags,listId:p.listId||null})});
      if (!res.ok) throw new Error();
      onUpdated(await res.json());
    } catch { toast('Failed to save','error'); } finally { setSaving(false); }
  };

  const handleStSave = async (overrides?: Record<string, unknown>) => {
    if (!activeSt) return;
    const p = { title:(overrides?.title as string)??stTitle, notes:(overrides?.notes as string)??stNotes, dueDate:(overrides?.dueDate as string)??stDueDate, dueTime:(overrides?.dueTime as string)??stDueTime, tags:(overrides?.tags as string[])??stTags };
    setStSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks/${activeSt.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:p.title.trim()||activeSt.title,notes:p.notes,dueDate:p.dueDate||null,dueTime:p.dueTime||null,tags:p.tags})});
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSubtasks(prev=>prev.map(s=>s.id===activeSt.id?{...s,...updated}:s));
      setActiveSt(prev=>prev?{...prev,...updated}:prev);
    } catch { toast('Failed to save subtask','error'); } finally { setStSaving(false); }
  };

  // FIX: handleAddSubtask now accepts title param and adds it correctly
  const handleAddSubtask = async (stTitle: string) => {
    if (!stTitle.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:stTitle.trim()})});
      if (!res.ok) throw new Error();
      const created = await res.json();
      setSubtasks(prev=>[...prev,created]);
    } catch { toast('Failed to add subtask','error'); }
  };

  const handleDeleteSubtask = async () => {
    if (!activeSt) return;
    try {
      await fetch(`/api/tasks/${task.id}/subtasks/${activeSt.id}`,{method:'DELETE'});
      setSubtasks(prev=>prev.filter(s=>s.id!==activeSt.id));
      setActiveSt(null);
    } catch { toast('Failed to delete subtask','error'); }
  };

  const handleToggleSt = async (st: Subtask) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks/${st.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({isDone:!st.isDone})});
      if (!res.ok) throw new Error();
      setSubtasks(prev=>prev.map(s=>s.id===st.id?{...s,isDone:!s.isDone}:s));
      if (activeSt?.id===st.id) setActiveSt(prev=>prev?{...prev,isDone:!prev.isDone}:prev);
    } catch { toast('Failed to update','error'); }
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-900 dark:border-gray-700/60 dark:bg-[#1C1F26] dark:text-gray-100">

      {!activeSt ? (
        /* ── Main task — full width ── */
        <div className="flex w-full flex-col">
          <TaskPanel
            id={task.id} title={title} notes={notes} priority={priority}
            dueDate={dueDate} dueTime={dueTime} status={task.status}
            tags={tags} lists={lists} listId={listId} subtasks={subtasks} saving={saving}
            onTitleChange={setTitle} onNotesChange={setNotes} onPriorityChange={setPriority}
            onDueDateChange={setDueDate} onDueTimeChange={setDueTime}
            onTagsChange={setTags}
            onListChange={id=>{setListId(id);void handleSave({listId:id});}}
            onSave={handleSave}
            onDelete={()=>onDeleted(task.id)}
            onComplete={()=>onCompleted(task.id)}
            onSubtaskClick={st=>setActiveSt(st)}
            onAddSubtask={handleAddSubtask}
            onClose={onClose}
          />
        </div>
      ) : (
        /* ── Subtask — full width, back chevron returns to task ── */
        <div className="flex w-full flex-col">
          <div className="flex items-center px-3 pt-2">
            <button onClick={()=>setActiveSt(null)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            >
              <ChevronLeft className="h-3.5 w-3.5"/>
              <span className="max-w-[120px] truncate">{task.title}</span>
            </button>
          </div>
          <TaskPanel
            id={activeSt.id} isSubtask
            title={stTitle} notes={stNotes} priority={stPriority}
            dueDate={stDueDate} dueTime={stDueTime}
            status={activeSt.isDone?'completed':'active'}
            tags={stTags} lists={lists}
            saving={stSaving}
            onTitleChange={setStTitle} onNotesChange={setStNotes} onPriorityChange={setStPriority}
            onDueDateChange={setStDueDate} onDueTimeChange={setStDueTime}
            onTagsChange={setStTags}
            onSave={handleStSave}
            onDelete={handleDeleteSubtask}
            onComplete={()=>handleToggleSt(activeSt)}
            onClose={onClose}
          />
        </div>
      )}
    </div>
  );
}