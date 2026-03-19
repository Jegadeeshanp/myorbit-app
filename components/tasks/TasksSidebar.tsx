'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Sun, Inbox, CalendarDays, Plus, Settings, Calendar, User,
  MoreHorizontal, Pencil, Pin, Copy, Share2, Trash2, X,
} from 'lucide-react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from '@/components/Toast';

type TaskList = {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  sortOrder?: number;
  _count?: { tasks: number };
};

interface Props {
  selected: string;
  onSelect: (key: string) => void;
  refreshKey?: number;
  view?: 'tasks' | 'calendar';
  onViewChange?: (v: 'tasks' | 'calendar') => void;
}

const LIST_ICONS = ['📋', '📝', '✅', '📌', '💼', '🏠', '🛒', '🎯', '📚', '💡', '💻', '🧾'];
const LIST_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#64748B'];

export default function TasksSidebar({ selected, onSelect, refreshKey, view, onViewChange }: Props) {
  const { data: session } = useSession();
  const [lists, setLists] = useState<TaskList[]>([]);
  const [counts, setCounts] = useState({ today: 0, inbox: 0, next7: 0 });
  const [showListModal, setShowListModal] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [listName, setListName] = useState('');
  const [listIcon, setListIcon] = useState('📋');
  const [listColor, setListColor] = useState('#10B981');

  const fetchLists = useCallback(() => {
    fetch('/api/task-lists')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setLists(d); })
      .catch(() => {});
  }, []);

  const fetchCounts = useCallback(() => {
    const smarts = ['today', 'inbox', 'next7'];
    Promise.all(smarts.map(s =>
      fetch(`/api/tasks?smartList=${s}`).then(r => r.json()).then(d => Array.isArray(d) ? d.length : 0).catch(() => 0)
    )).then(([today, inbox, next7]) => {
      setCounts({ today, inbox, next7 });
    });
  }, []);

  useEffect(() => {
    fetchLists();
    fetchCounts();
  }, [fetchLists, fetchCounts, refreshKey]);

  const selectedList = useMemo(() => {
    if (!selected.startsWith('list:')) return null;
    const listId = selected.replace('list:', '');
    return lists.find(list => list.id === listId) ?? null;
  }, [lists, selected]);

  const resetModal = () => {
    setEditingListId(null);
    setListName('');
    setListIcon('📋');
    setListColor('#10B981');
  };

  const openCreateModal = () => {
    resetModal();
    setShowListModal(true);
    setShowListMenu(false);
  };

  const openEditModal = () => {
    if (!selectedList) return;
    setEditingListId(selectedList.id);
    setListName(selectedList.name);
    setListIcon(selectedList.emoji || '📋');
    setListColor(selectedList.color || '#10B981');
    setShowListModal(true);
    setShowListMenu(false);
  };

  const closeModal = () => {
    setShowListModal(false);
    resetModal();
  };

  const saveList = async () => {
    if (!listName.trim()) return;

    try {
      if (editingListId) {
        const res = await fetch(`/api/task-lists/${editingListId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: listName.trim(), emoji: listIcon, color: listColor }),
        });
        if (!res.ok) throw new Error();
        toast('List updated');
      } else {
        const res = await fetch('/api/task-lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: listName.trim(), emoji: listIcon, color: listColor }),
        });
        if (!res.ok) throw new Error();
        toast('List created');
      }

      closeModal();
      fetchLists();
    } catch {
      toast(editingListId ? 'Failed to update list' : 'Failed to create list', 'error');
    }
  };

  const handlePinList = async () => {
    if (!selectedList) return;
    try {
      const res = await fetch(`/api/task-lists/${selectedList.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: -1 }),
      });
      if (!res.ok) throw new Error();
      toast('List pinned');
      setShowListMenu(false);
      fetchLists();
    } catch {
      toast('Failed to pin list', 'error');
    }
  };

  const handleDuplicateList = async () => {
    if (!selectedList) return;
    try {
      const res = await fetch('/api/task-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${selectedList.name} Copy`,
          emoji: selectedList.emoji || '📋',
          color: selectedList.color || '#10B981',
        }),
      });
      if (!res.ok) throw new Error();
      toast('List duplicated');
      setShowListMenu(false);
      fetchLists();
    } catch {
      toast('Failed to duplicate list', 'error');
    }
  };

  const handleShareList = async () => {
    if (!selectedList) return;
    const shareUrl = `${window.location.origin}/orbit/tasks?list=${selectedList.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast('List link copied');
    } catch {
      toast('Failed to copy link', 'error');
    } finally {
      setShowListMenu(false);
    }
  };

  const handleDeleteList = async () => {
    if (!selectedList) return;
    try {
      const res = await fetch(`/api/task-lists/${selectedList.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('List deleted');
      setShowListMenu(false);
      onSelect('today');
      onViewChange?.('tasks');
      fetchLists();
      fetchCounts();
    } catch {
      toast('Failed to delete list', 'error');
    }
  };

  const navCls = (key: string) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
      (view === 'calendar' ? key === 'calendar' : selected === key)
        ? 'bg-emerald-50 text-emerald-700'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    }`;

  const iconCls = (key: string) =>
    `h-4 w-4 flex-none ${
      (view === 'calendar' ? key === 'calendar' : selected === key) ? 'text-emerald-600' : 'text-gray-400'
    }`;

  const userName = session?.user?.name ?? 'User';
  const initials = userName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-56 flex-none flex-col overflow-y-auto border-r border-gray-100 bg-white px-3 py-5 md:flex">
        <div className="mb-5 px-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <Calendar className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Tasks</div>
              <div className="text-[11px] text-gray-400">Planner workspace</div>
            </div>
          </div>
        </div>

        <nav className="space-y-0.5">
          {[
            { key: 'today', label: 'Today', Icon: Sun, count: counts.today },
            { key: 'next7', label: 'Next 7 Days', Icon: CalendarDays, count: counts.next7 },
            { key: 'inbox', label: 'Inbox', Icon: Inbox, count: counts.inbox },
          ].map(({ key, label, Icon, count }) => (
            <button key={key} onClick={() => { onSelect(key); onViewChange?.('tasks'); }} className={navCls(key)}>
              <Icon className={iconCls(key)} />
              <span className="flex-1 text-left">{label}</span>
              {count > 0 ? <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">{count}</span> : null}
            </button>
          ))}

          <button onClick={() => onViewChange?.('calendar')} className={navCls('calendar')}>
            <Calendar className={iconCls('calendar')} />
            <span className="flex-1 text-left">Calendar</span>
          </button>
        </nav>

        <div className="my-4 border-t border-gray-100" />

        <div className="relative mb-1 flex items-center justify-between px-2 py-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Lists ({lists.length})</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowListMenu(open => !open)}
              disabled={!selectedList}
              className={`rounded-lg p-1 transition ${
                selectedList ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-900' : 'cursor-not-allowed text-gray-300'
              }`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            <button onClick={openCreateModal} className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {showListMenu ? (
            <div className="absolute right-0 top-full z-30 mt-2 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
              <button onClick={openEditModal} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50">
                <Pencil className="h-4 w-4 text-gray-400" />
                Edit
              </button>
              <button onClick={handlePinList} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50">
                <Pin className="h-4 w-4 text-gray-400" />
                Pin
              </button>
              <button onClick={handleDuplicateList} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50">
                <Copy className="h-4 w-4 text-gray-400" />
                Duplicate
              </button>
              <button onClick={handleShareList} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50">
                <Share2 className="h-4 w-4 text-gray-400" />
                Share
              </button>
              <button onClick={handleDeleteList} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50">
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          ) : null}
        </div>

        <nav className="mt-3 flex-1 space-y-0.5 overflow-y-auto">
          {lists.map(list => {
            const count = list._count?.tasks ?? 0;
            const key = `list:${list.id}`;

            return (
              <button key={list.id} onClick={() => { onSelect(key); onViewChange?.('tasks'); setShowListMenu(false); }} className={navCls(key)}>
                <span
                  className="flex h-6 w-6 flex-none items-center justify-center rounded-md text-sm leading-none"
                  style={{ backgroundColor: `${list.color || '#10B981'}18` }}
                >
                  {list.emoji || '📋'}
                </span>
                <span className="flex-1 truncate text-left">{list.name}</span>
                {count > 0 ? <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">{count}</span> : null}
              </button>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-gray-100" />

        <div className="mt-3 space-y-0.5">
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
            <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white select-none">
              {initials || <User className="h-3.5 w-3.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 leading-none">{userName}</p>
              <p className="mt-0.5 truncate text-[11px] text-gray-400">Personal account</p>
            </div>
          </div>

          <Link
            href="/orbit/tasks/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
          >
            <Settings className="h-4 w-4 flex-none text-gray-400" />
            Settings
          </Link>
        </div>
      </aside>

      {showListModal ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[360px] rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{editingListId ? 'Edit list' : 'Create list'}</h3>
                <p className="text-xs text-gray-400">Choose a name, icon, and color.</p>
              </div>
              <button onClick={closeModal} className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900">
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              autoFocus
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="List name..."
              value={listName}
              onChange={e => setListName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') saveList();
                if (e.key === 'Escape') closeModal();
              }}
            />

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Choose icon</p>
            <div className="mt-2 grid grid-cols-4 gap-2.5">
              {LIST_ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setListIcon(icon)}
                  className={`flex h-11 w-full items-center justify-center rounded-xl border text-xl transition ${
                    listIcon === icon
                      ? 'border-emerald-400 bg-emerald-50 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.1)]'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Choose color</p>
            <div className="mt-2 grid grid-cols-4 gap-2.5">
              {LIST_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setListColor(color)}
                  className={`flex h-10 w-full items-center justify-center rounded-xl border transition ${
                    listColor === color ? 'border-gray-900 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {listColor === color ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-white hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={saveList}
                className="flex-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                {editingListId ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
