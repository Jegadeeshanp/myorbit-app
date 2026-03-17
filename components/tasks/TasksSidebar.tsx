'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Sun, Inbox, CalendarDays, CheckCircle2, Trash2,
  Plus, ArrowLeft, Settings, User,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/components/Toast';

type TaskList = { id: string; name: string; emoji?: string; color?: string; _count?: { tasks: number } };

interface Props {
  selected: string;
  onSelect: (key: string) => void;
  refreshKey?: number;
}

export default function TasksSidebar({ selected, onSelect, refreshKey }: Props) {
  const { data: session } = useSession();
  const [lists, setLists]           = useState<TaskList[]>([]);
  const [counts, setCounts]         = useState({ today: 0, inbox: 0, next7: 0, completed: 0, trash: 0 });
  const [addingList, setAddingList] = useState(false);
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

  const userName = session?.user?.name ?? 'User';
  const initials = userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const navItemCls = (key: string) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition cursor-pointer ${
      selected === key
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-64 flex-none flex-col border-r border-white/40 bg-white/50 px-3 py-6 backdrop-blur overflow-y-auto">
      {/* Brand */}
      <div className="mb-6 px-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-xs">
            ✓
          </div>
          <div className="text-base font-semibold text-gray-900">Tasks</div>
        </div>
        <div className="mt-0.5 text-xs text-gray-500 pl-9">Productivity hub</div>
      </div>

      {/* Smart lists */}
      <nav className="space-y-0.5">
        {[
          { key: 'today',     label: 'Today',     Icon: Sun,         count: counts.today },
          { key: 'inbox',     label: 'Inbox',     Icon: Inbox,       count: counts.inbox },
          { key: 'next7',     label: 'Next 7 Days', Icon: CalendarDays, count: counts.next7 },
        ].map(({ key, label, Icon, count }) => (
          <button key={key} onClick={() => onSelect(key)} className={`w-full ${navItemCls(key)}`}>
            <Icon className={`h-4 w-4 flex-none ${selected === key ? 'text-white' : 'text-gray-500'}`} />
            <span className="flex-1 text-left">{label}</span>
            {count > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium ${selected === key ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="my-3 border-t border-gray-100" />

      {/* User lists */}
      <div className="flex items-center justify-between px-3 mb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Lists</p>
        <button onClick={() => setAddingList(true)} className="text-gray-400 hover:text-blue-600 transition">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {addingList && (
        <div className="px-1 mb-2">
          <div className="flex gap-1">
            <input
              autoFocus
              className="flex-1 rounded-lg border border-blue-200 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
              placeholder="List name..."
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddList(); if (e.key === 'Escape') { setAddingList(false); setNewListName(''); } }}
            />
            <button onClick={handleAddList} className="rounded-lg bg-blue-600 px-2 py-1.5 text-white text-xs hover:bg-blue-700">Add</button>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {lists.map(list => {
          const cnt = list._count?.tasks ?? 0;
          return (
            <button key={list.id} onClick={() => onSelect(`list:${list.id}`)} className={`w-full ${navItemCls(`list:${list.id}`)}`}>
              <span className="flex-none text-base">{list.emoji || '📋'}</span>
              <span className="flex-1 text-left truncate">{list.name}</span>
              {cnt > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium ${selected === `list:${list.id}` ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-3 border-t border-gray-100 pt-3 space-y-0.5">
        {[
          { key: 'completed', label: 'Completed', Icon: CheckCircle2, count: counts.completed },
          { key: 'trash',     label: 'Trash',     Icon: Trash2,       count: counts.trash },
        ].map(({ key, label, Icon, count }) => (
          <button key={key} onClick={() => onSelect(key)} className={`w-full ${navItemCls(key)}`}>
            <Icon className={`h-4 w-4 flex-none ${selected === key ? 'text-white' : 'text-gray-500'}`} />
            <span className="flex-1 text-left">{label}</span>
            {count > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium ${selected === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 border-t border-gray-100" />
      <div className="mt-3 space-y-0.5">
        <Link href="/orbit" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 flex-none text-gray-500" />
          My Orbit
        </Link>
        <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white select-none">
            {initials || <User className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 leading-none">{userName}</p>
          </div>
        </div>
        <Link href="/orbit/tasks/settings" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900">
          <Settings className="h-4 w-4 flex-none text-gray-500" />
          Tasks Settings
        </Link>
      </div>
    </aside>
  );
}
