'use client';

import { useState, useEffect, useRef } from 'react';
import { CalendarDays, Clock, Flag, List as ListIcon, Tag, Check, Send, X } from 'lucide-react';
import { getListIcon } from '@/lib/taskListIcons';

type TaskList = { id: string; name: string; color?: string; emoji?: string };

type AddOpts = {
  dueDate?: string;
  dueTime?: string;
  priority?: string;
  tags?: string[];
  listId?: string;
};

interface Props {
  lists: TaskList[];
  onClose: () => void;
  onAdd: (title: string, opts: AddOpts) => Promise<unknown>;
}

function todayStr(offset = 0) {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-CA');
}

const PRI_OPTS = [
  { v: 'none',   label: 'None',   color: '#9ca3af' },
  { v: 'low',    label: 'Low',    color: '#3b82f6' },
  { v: 'medium', label: 'Medium', color: '#f59e0b' },
  { v: 'high',   label: 'High',   color: '#ef4444' },
];

type ActivePill = 'date' | 'time' | 'priority' | 'list' | 'tag' | null;

export default function AddTaskSheet({ lists, onClose, onAdd }: Props) {
  const [visible, setVisible]         = useState(false);
  const [title, setTitle]             = useState('');
  const [dueDate, setDueDate]         = useState('');
  const [dueTime, setDueTime]         = useState('');
  const [priority, setPriority]       = useState('none');
  const [listId, setListId]           = useState('');
  const [tags, setTags]               = useState<string[]>([]);
  const [tagInput, setTagInput]       = useState('');
  const [activePill, setActivePill]   = useState<ActivePill>(null);
  const [adding, setAdding]           = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (visible) setTimeout(() => inputRef.current?.focus(), 60);
  }, [visible]);

  const handleClose = () => { setVisible(false); setTimeout(onClose, 280); };

  const submit = async () => {
    if (!title.trim() || adding) return;
    setAdding(true);
    try {
      await onAdd(title.trim(), {
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        priority,
        tags: tags.length > 0 ? tags : undefined,
        listId: listId || undefined,
      });
      handleClose();
    } finally { setAdding(false); }
  };

  const togglePill = (pill: ActivePill) => setActivePill(v => v === pill ? null : pill);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(p => [...p, t]);
    setTagInput('');
  };

  const selectedList = lists.find(l => l.id === listId);
  const priColor     = PRI_OPTS.find(p => p.v === priority)?.color ?? '#9ca3af';
  const dateLabel    = dueDate
    ? dueDate === todayStr() ? 'Today'
    : dueDate === todayStr(1) ? 'Tomorrow'
    : new Date(`${dueDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '';

  return (
    <>
      <div className="fixed inset-0 z-[75] bg-black/40" onClick={handleClose} />

      <div
        className={`fixed inset-x-0 z-[80] rounded-t-3xl border-t border-gray-200 bg-white shadow-2xl transition-transform duration-300 dark:border-gray-700 dark:bg-[#1E2128] ${visible ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ bottom: '64px' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Expandable panels */}
        {activePill === 'date' && (
          <div className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-700/60">
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {dueDate && (
              <button onClick={() => setDueDate('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {activePill === 'time' && (
          <div className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-700/60">
            <input
              type="time"
              value={dueTime}
              onChange={e => setDueTime(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {dueTime && (
              <button onClick={() => setDueTime('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {activePill === 'priority' && (
          <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-2.5 dark:border-gray-700/60">
            {PRI_OPTS.map(p => (
              <button
                key={p.v}
                onClick={() => { setPriority(p.v); setActivePill(null); }}
                className={`flex flex-none items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${priority === p.v ? 'ring-1 ring-inset' : 'bg-gray-100 dark:bg-gray-800'}`}
                style={priority === p.v ? { backgroundColor: `${p.color}22`, color: p.color } : { color: p.color }}
              >
                <Flag className="h-3 w-3" />{p.label}
              </button>
            ))}
          </div>
        )}

        {activePill === 'list' && (
          <div className="max-h-44 overflow-y-auto border-t border-gray-100 dark:border-gray-700/60">
            <button
              onClick={() => { setListId(''); setActivePill(null); }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition ${!listId ? 'bg-gray-50 dark:bg-white/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
              <span>📥</span>
              <span className="flex-1 text-left text-gray-700 dark:text-gray-300">Inbox</span>
              {!listId && <Check className="h-3.5 w-3.5 text-emerald-500" />}
            </button>
            {lists.map(l => (
              <button
                key={l.id}
                onClick={() => { setListId(l.id); setActivePill(null); }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition ${listId === l.id ? 'bg-gray-50 dark:bg-white/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg" style={{ backgroundColor: `${l.color || '#10B981'}22` }}>
                  {getListIcon(l.emoji, 'h-4 w-4')}
                </span>
                <span className="flex-1 truncate text-left text-gray-700 dark:text-gray-300">{l.name}</span>
                {listId === l.id && <Check className="h-3.5 w-3.5 text-emerald-500" />}
              </button>
            ))}
          </div>
        )}

        {activePill === 'tag' && (
          <div className="border-t border-gray-100 px-4 py-2 dark:border-gray-700/60">
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') setActivePill(null); }}
                placeholder="Tag name..."
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button onClick={addTag} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Add</button>
            </div>
            {tags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {t}
                    <button onClick={() => setTags(p => p.filter(i => i !== t))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Title input */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-5 w-5 flex-none rounded-full border-2 border-gray-300 dark:border-gray-600" />
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void submit(); if (e.key === 'Escape') handleClose(); }}
            placeholder="New task"
            className="flex-1 bg-transparent text-base text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white dark:placeholder-gray-500"
          />
        </div>

        {/* Pill toolbar */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 pb-4 [scrollbar-width:none]">
          <button
            onClick={() => togglePill('date')}
            className={`flex flex-none items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${dueDate || activePill === 'date' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {dateLabel || 'Date'}
          </button>

          <button
            onClick={() => togglePill('time')}
            className={`flex flex-none items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${dueTime || activePill === 'time' ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            <Clock className="h-3.5 w-3.5" />
            {dueTime || 'Time'}
          </button>

          <button
            onClick={() => togglePill('priority')}
            className={`flex flex-none items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${priority !== 'none' || activePill === 'priority' ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
            style={priority !== 'none' ? { color: priColor } : {}}
          >
            <Flag className="h-3.5 w-3.5" />
            {priority !== 'none' ? PRI_OPTS.find(p => p.v === priority)?.label : 'Priority'}
          </button>

          <button
            onClick={() => togglePill('list')}
            className={`flex flex-none items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${listId || activePill === 'list' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            {selectedList
              ? <>{getListIcon(selectedList.emoji, 'h-3.5 w-3.5')}<span className="max-w-[60px] truncate">{selectedList.name}</span></>
              : <><ListIcon className="h-3.5 w-3.5" />List</>
            }
          </button>

          <button
            onClick={() => togglePill('tag')}
            className={`flex flex-none items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${tags.length > 0 || activePill === 'tag' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            <Tag className="h-3.5 w-3.5" />
            {tags.length > 0 ? `${tags.length} tag${tags.length > 1 ? 's' : ''}` : 'Tag'}
          </button>

          <div className="flex-1" />

          <button
            onClick={() => void submit()}
            disabled={!title.trim() || adding}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-emerald-600 text-white transition disabled:opacity-40 active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
