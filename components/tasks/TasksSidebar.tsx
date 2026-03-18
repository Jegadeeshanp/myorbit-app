'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Sun, Inbox, CalendarDays, CheckCircle2, Trash2,
  Plus, Settings, Calendar,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/components/Toast';

type TaskList = { id: string; name: string; emoji?: string; color?: string; _count?: { tasks: number } };

interface Props {
  selected: string;
  onSelect: (key: string) => void;
  refreshKey?: number;
  view?: 'tasks' | 'calendar';
  onViewChange?: (v: 'tasks' | 'calendar') => void;
}

export default function TasksSidebar({ selected, onSelect, refreshKey, view, onViewChange }: Props) {
  const { data: session } = useSession();
  const [lists, setLists]             = useState<TaskList[]>([]);
  const [counts, setCounts]           = useState({ today: 0, inbox: 0, next7: 0, completed: 0, trash: 0 });
  const [addingList, setAddingList]   = useState(false);
  const [newListName, setNewListName] = useState('');

  const fetchLists = useCallback(() => {
    fetch('/api/task-lists')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setLists(d); })
      .catch(() => {});
  }, []);

  const fetchCounts = useCallback(() => {
    const smarts = ['today', 'inbox', 'next7', 'completed', 'trash'];
    Promise.all(smarts.map(s =>
      fetch(`/api/tasks?smartList=${s}`).then(r => r.json()).then(d => Array.isArray(d) ? d.length : 0).catch(() => 0)
    )).then(([today, inbox, next7, completed, trash]) => {
      setCounts({ today, inbox, next7, completed, trash });
    });
  }, []);

  useEffect(() => {
    fetchLists();
    fetchCounts();
  }, [fetchLists, fetchCounts, refreshKey]);

  const handleAddList = async () => {
    if (!newListName.trim()) return;
    try {
      const res = await fetch('/api/task-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName.trim() }),
      });
      if (!res.ok) throw new Error();
      const list = await res.json();
      setLists(prev => [...prev, list]);
      setNewListName('');
      setAddingList(false);
      toast('List created');
    } catch {
      toast('Failed to create list', 'error');
    }
  };

  const navCls = (key: string) =>
    `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition cursor-pointer ${
      selected === key || (key === 'calendar' && view === 'calendar')
        ? 'bg-white/10 text-white'
        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
    }`;

  return (
    <aside className="w-64 h-screen flex flex-col bg-[#1f1f1f] overflow-y-auto py-3 px-2 flex-none">

      {/* Smart lists */}
      <nav className="space-y-0.5 mb-2">
        {[
          { key: 'today',  label: 'Today',       Icon: Sun,         count: counts.today,  color: 'text-amber-400' },
          { key: 'next7',  label: 'Next 7 Days',  Icon: CalendarDays, count: counts.next7,  color: 'text-indigo-400' },
          { key: 'inbox',  label: 'Inbox',        Icon: Inbox,        count: counts.inbox,  color: 'text-sky-400' },
        ].map(({ key, label, Icon, count, color }) => (
          <button
            key={key}
            onClick={() => { onSelect(key); if (onViewChange) onViewChange('tasks'); }}
            className={navCls(key)}
          >
            <Icon className={`h-4 w-4 flex-none ${selected === key ? color : 'text-gray-500'}`} />
            <span className="flex-1 text-left">{label}</span>
            {count > 0 && (
              <span className="text-xs rounded-full px-2 py-0.5 font-medium bg-white/10 text-gray-300">
                {count}
              </span>
            )}
          </button>
        ))}

        {/* Calendar */}
        <button
          onClick={() => onViewChange?.('calendar')}
          className={navCls('calendar')}
        >
          <Calendar className={`h-4 w-4 flex-none ${view === 'calendar' ? 'text-rose-400' : 'text-gray-500'}`} />
          <span className="flex-1 text-left">Calendar</span>
        </button>
      </nav>

      <div className="border-t border-white/5 my-2" />

      {/* Lists section header */}
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lists</p>
        <button
          onClick={() => setAddingList(true)}
          className="text-gray-500 hover:text-white transition"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {addingList && (
        <div className="px-1 mb-2">
          <div className="flex gap-1">
            <input
              autoFocus
              className="flex-1 rounded-lg bg-white/10 border border-white/10 px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
              placeholder="List name..."
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddList();
                if (e.key === 'Escape') { setAddingList(false); setNewListName(''); }
              }}
            />
            <button
              onClick={handleAddList}
              className="rounded-lg bg-sky-600 px-2 py-1.5 text-white text-xs hover:bg-sky-700 transition"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* User lists */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {lists.map(list => {
          const cnt = list._count?.tasks ?? 0;
          const key = `list:${list.id}`;
          return (
            <button
              key={list.id}
              onClick={() => { onSelect(key); if (onViewChange) onViewChange('tasks'); }}
              className={navCls(key)}
            >
              <span className="flex-none text-base leading-none">{list.emoji || '📋'}</span>
              <span className="flex-1 text-left truncate">{list.name}</span>
              {cnt > 0 && (
                <span className="text-xs rounded-full px-2 py-0.5 font-medium bg-white/10 text-gray-400">
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Bottom section */}
      <div className="border-t border-white/5 pt-2 mt-2 space-y-0.5">
        {[
          { key: 'completed', label: 'Completed', Icon: CheckCircle2, count: counts.completed, color: 'text-emerald-400' },
          { key: 'trash',     label: 'Trash',     Icon: Trash2,       count: counts.trash,     color: 'text-rose-400' },
        ].map(({ key, label, Icon, count, color }) => (
          <button
            key={key}
            onClick={() => { onSelect(key); if (onViewChange) onViewChange('tasks'); }}
            className={navCls(key)}
          >
            <Icon className={`h-4 w-4 flex-none ${selected === key ? color : 'text-gray-500'}`} />
            <span className="flex-1 text-left">{label}</span>
            {count > 0 && (
              <span className="text-xs rounded-full px-2 py-0.5 font-medium bg-white/10 text-gray-400">
                {count}
              </span>
            )}
          </button>
        ))}

        <Link
          href="/orbit/tasks/settings"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-white/5 hover:text-gray-300 transition"
        >
          <Settings className="h-4 w-4 flex-none text-gray-600" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
