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

// ── MiniCalendar ──────────────────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onChange }: { selectedDate: string; onChange: (d: string) => void }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) { const [y,m] = selectedDate.split('-').map(Number); return new Date(y, m-1, 1); }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  useEffect(() => {
    if (!selectedDate) return;
    const [y,m] = selectedDate.split('-').map(Number); setViewDate(new Date(y, m-1, 1));
  }, [selectedDate]);
  const year = viewDate.getFullYear(); const month = viewDate.getMonth();
  const pad = (n: number) => String(n).padStart(2,'0');
  const todayStr = today.toISOString().split('T')[0];
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const cells: (number|null)[] = [];
  for (let i=0; i<firstDow; i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => setViewDate(new Date(year,month-1,1))} className="rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><ChevronLeft className="h-3.5 w-3.5"/></button>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{viewDate.toLocaleString('default',{month:'short',year:'numeric'})}</span>
        <button type="button" onClick={() => setViewDate(new Date(year,month+1,1))} className="rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><ChevronRight className="h-3.5 w-3.5"/></button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {['M','T','W','T','F','S','S'].map((l,i) => <div key={`${l}-${i}`} className="text-center text-[9px] font-medium text-gray-400">{l}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className="h-7"/>;
          const ds = `${year}-${pad(month+1)}-${pad(day)}`;
          const isSel = ds === selectedDate; const isTod = ds === todayStr;
          return (
            <button key={ds} type="button" onClick={() => onChange(ds)}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] transition ${isSel?'bg-emerald-500 text-white':isTod?'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400':'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
            >{day}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── Date popup ────────────────────────────────────────────────────────────────
function DatePopup({ btnRef, dueDate, dueTime, reminder, repeat, visibleTagList,
  setDueDate, setDueTime, setReminder, setRepeat, onSave, onClose }: {
  btnRef: React.RefObject<HTMLButtonElement | null>;
  dueDate: string; dueTime: string; reminder: string; repeat: string; visibleTagList: string[];
  setDueDate: (v:string)=>void; setDueTime: (v:string)=>void;
  setReminder: (v:string)=>void; setRepeat: (v:string)=>void;
  onSave: ()=>void; onClose: ()=>void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [showRem, setShowRem] = useState(false);
  const [showRep, setShowRep] = useState(false);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [btnRef, onClose]);

  const remLabel = REMINDER_OPTIONS.find(o=>o.value===reminder)?.label ?? 'On time';
  const repLabel = repeat === 'none' ? 'No repeat' : REPEAT_OPTIONS.find(o=>o.value===repeat)?.label ?? 'Custom';

  return (
    <div ref={ref} className="absolute left-4 right-4 top-[52px] z-50 flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#252830]" style={{maxHeight:'calc(100% - 64px)'}}>
      <div className="flex-1 overflow-y-auto p-4">
        <MiniCalendar selectedDate={dueDate || new Date().toISOString().split('T')[0]} onChange={setDueDate}/>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
          <Clock className="h-3.5 w-3.5 text-sky-500"/>
          <span className="text-xs text-gray-500 dark:text-gray-400">Time</span>
          <input type="time" value={dueTime} onChange={e=>setDueTime(e.target.value)} className="ml-auto bg-transparent text-xs text-sky-500 focus:outline-none"/>
        </div>
        <button type="button" onClick={()=>setShowRem(v=>!v)} className="mt-2 flex w-full items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-left hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60">
          <Bell className="h-3.5 w-3.5 text-sky-500"/>
          <span className="flex-1 text-xs text-gray-600 dark:text-gray-300">Reminder</span>
          <span className="text-xs text-gray-400">{remLabel}</span>
          <ChevronRight className={`h-3.5 w-3.5 text-gray-400 transition-transform ${showRem?'rotate-90':''}`}/>
        </button>
        {showRem && <div className="mt-1 overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-[#252830]">
          {REMINDER_OPTIONS.map(o=>(
            <button key={o.value} type="button" onClick={()=>{setReminder(o.value);setShowRem(false);}} className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition ${reminder===o.value?'text-sky-500':'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/40'}`}>
              {o.label}{reminder===o.value&&<Check className="ml-auto h-3 w-3 text-sky-500"/>}
            </button>
          ))}
        </div>}
        <button type="button" onClick={()=>setShowRep(v=>!v)} className="mt-2 flex w-full items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-left hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60">
          <RotateCcw className="h-3.5 w-3.5 text-sky-500"/>
          <span className="flex-1 text-xs text-gray-600 dark:text-gray-300">Repeat</span>
          <span className="text-xs text-gray-400">{repLabel}</span>
          <ChevronRight className={`h-3.5 w-3.5 text-gray-400 transition-transform ${showRep?'rotate-90':''}`}/>
        </button>
        {showRep && <div className="mt-1 overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-[#252830]">
          <button type="button" onClick={()=>{setRepeat('none');setShowRep(false);}} className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition ${repeat==='none'?'text-sky-500':'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/40'}`}>
            No repeat{repeat==='none'&&<Check className="ml-auto h-3 w-3 text-sky-500"/>}
          </button>
          {REPEAT_OPTIONS.map(o=>(
            <button key={o.value} type="button" onClick={()=>{setRepeat(o.value);setShowRep(false);}} className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition ${repeat===o.value?'text-sky-500':'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/40'}`}>
              {o.label}{repeat===o.value&&<Check className="ml-auto h-3 w-3 text-sky-500"/>}
            </button>
          ))}
        </div>}
      </div>
      <div className="flex gap-2 border-t border-gray-100 p-3 dark:border-gray-700">
        <button type="button" onClick={()=>{setDueDate('');setDueTime('');setReminder('on-time');setRepeat('none');onClose();}} className="flex-1 rounded-xl border border-gray-200 py-2 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400">Clear</button>
        <button type="button" onClick={()=>{onSave();onClose();}} className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-500">OK</button>
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
  const [showPri,     setShowPri]     = useState(false);
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
    <div className="relative flex h-full flex-col overflow-hidden">

      {/* Date popup */}
      {showDate && (
        <DatePopup btnRef={dateBtnRef}
          dueDate={localDueDate} dueTime={localDueTime}
          reminder={localReminder} repeat={localRepeat} visibleTagList={vTags}
          setDueDate={setLocalDueDate} setDueTime={setLocalDueTime}
          setReminder={setLocalReminder} setRepeat={setLocalRepeat}
          onSave={() => {
            onDueDateChange(localDueDate); onDueTimeChange(localDueTime);
            const full = buildFull(); onTagsChange(full);
            void onSave({dueDate:localDueDate, dueTime:localDueTime, tags:full});
          }}
          onClose={() => setShowDate(false)}
        />
      )}

      {/* ── Top bar: status + date + priority + close ── */}
      <div className="flex flex-none items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700/60">
        {status === 'completed'
          ? <CheckCircle2 className="h-4 w-4 flex-none text-emerald-500"/>
          : <Circle className="h-4 w-4 flex-none text-gray-400 dark:text-gray-500"/>
        }
        <button ref={dateBtnRef} onClick={() => setShowDate(v=>!v)}
          className={`flex flex-1 items-center gap-1.5 truncate text-xs transition ${hasDate?'text-sky-500 hover:text-sky-400':'text-gray-400 hover:text-gray-600 dark:text-gray-500'}`}
        >
          <Calendar className="h-3.5 w-3.5 flex-none"/>
          <span className="truncate">{topLabel}</span>
          {localRepeat!=='none' && <RotateCcw className="h-3 w-3 text-emerald-500"/>}
        </button>

        {/* Priority */}
        <div className="relative">
          <button ref={priBtnRef} onClick={() => setShowPri(v=>!v)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-gray-100 dark:hover:bg-gray-700 ${PRIORITY_FLAG_COLOR[priority]}`}
          >
            <Flag className="h-4 w-4"/>
          </button>
          {showPri && (
            <div ref={priRef} className="absolute right-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-[#252830]">
              {(['high','medium','low','none'] as const).map(level => (
                <button key={level} type="button"
                  onClick={() => { onPriorityChange(level); void onSave({priority:level}); setShowPri(false); }}
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

        {/* Icon row */}
        <div className="flex items-center gap-1 px-3 py-2">
          {/* List picker — bottom left */}
          {!isSubtask && (
            <div className="relative">
              <button ref={listBtnRef} onClick={() => setShowList(v=>!v)}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${showList ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : listId ? 'text-blue-500 hover:bg-gray-100 dark:hover:bg-white/5' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                title="Move to list"
              >
                <ListIcon className="h-4 w-4"/>
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

          {/* Complete button for subtask */}
          {isSubtask && status !== 'completed' && onComplete && (
            <button onClick={onComplete}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <CheckCircle2 className="h-4 w-4"/>
              <span>Done</span>
            </button>
          )}

          <div className="flex-1"/>

          {/* Add subtask — main task only */}
          {!isSubtask && (
            <button onClick={() => setOpenAction(v => v==='subtask' ? null : 'subtask')}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${openAction==='subtask'?'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40':'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
              title="Add subtask"
            ><Plus className="h-4 w-4"/></button>
          )}

          {/* Tag */}
          <button onClick={() => setOpenAction(v => v==='tag' ? null : 'tag')}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${openAction==='tag'?'bg-sky-100 text-sky-600 dark:bg-sky-900/40':'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
            title="Add tag"
          ><Tag className="h-4 w-4"/></button>

          {/* Delete */}
          <button onClick={() => setOpenAction(v => v==='delete' ? null : 'delete')}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${openAction==='delete'?'bg-rose-100 text-rose-600 dark:bg-rose-900/40':'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
            title="Delete"
          ><Trash2 className="h-4 w-4"/></button>
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