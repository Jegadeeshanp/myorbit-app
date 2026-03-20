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
  // FIX: per-list menu — stores the list id whose menu is open (not a boolean)
  const [openMenuListId, setOpenMenuListId] = useState<string | null>(null);
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
    Promise.all(['today', 'inbox', 'next7'].map(s =>
      fetch(`/api/tasks?smartList=${s}`).then(r => r.json()).then(d => Array.isArray(d) ? d.length : 0).catch(() => 0)
    )).then(([today, inbox, next7]) => setCounts({ today, inbox, next7 }));
  }, []);

  useEffect(() => { fetchLists(); fetchCounts(); }, [fetchLists, fetchCounts, refreshKey]);

  // Close menu on outside click — no ref needed, just close on any click outside the sidebar
  useEffect(() => {
    if (!openMenuListId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      // Close if clicking outside a menu dropdown or its trigger button
      if (!target.closest('[data-menu-dropdown]') && !target.closest('[data-menu-trigger]')) {
        setOpenMenuListId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuListId]);

  const openList = useMemo(() => lists.find(l => l.id === openMenuListId) ?? null, [lists, openMenuListId]);

  const resetModal = () => { setEditingListId(null); setListName(''); setListIcon('📋'); setListColor('#10B981'); };
  const closeModal = () => { setShowListModal(false); resetModal(); };

  const openCreateModal = () => { resetModal(); setShowListModal(true); setOpenMenuListId(null); };

  const openEditModal = (list: TaskList) => {
    setEditingListId(list.id);
    setListName(list.name);
    setListIcon(list.emoji || '📋');
    setListColor(list.color || '#10B981');
    setShowListModal(true);
    setOpenMenuListId(null);
  };

  const saveList = async () => {
    if (!listName.trim()) return;
    try {
      if (editingListId) {
        const res = await fetch(`/api/task-lists/${editingListId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: listName.trim(), emoji: listIcon, color: listColor }) });
        if (!res.ok) throw new Error();
        toast('List updated');
      } else {
        const res = await fetch('/api/task-lists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: listName.trim(), emoji: listIcon, color: listColor }) });
        if (!res.ok) throw new Error();
        toast('List created');
      }
      closeModal(); fetchLists();
    } catch { toast(editingListId ? 'Failed to update list' : 'Failed to create list', 'error'); }
  };

  const handlePinList = async () => {
    if (!openList) return;
    try {
      const res = await fetch(`/api/task-lists/${openList.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: -1 }) });
      if (!res.ok) throw new Error();
      toast('List pinned'); setOpenMenuListId(null); fetchLists();
    } catch { toast('Failed to pin list', 'error'); }
  };

  const handleDuplicateList = async () => {
    if (!openList) return;
    try {
      const res = await fetch('/api/task-lists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `${openList.name} Copy`, emoji: openList.emoji || '📋', color: openList.color || '#10B981' }) });
      if (!res.ok) throw new Error();
      toast('List duplicated'); setOpenMenuListId(null); fetchLists();
    } catch { toast('Failed to duplicate list', 'error'); }
  };

  const handleShareList = async () => {
    if (!openList) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}/orbit/tasks?list=${openList.id}`); toast('List link copied'); }
    catch { toast('Failed to copy link', 'error'); }
    finally { setOpenMenuListId(null); }
  };

  const handleDeleteList = async () => {
    if (!openList) return;
    try {
      const res = await fetch(`/api/task-lists/${openList.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('List deleted'); setOpenMenuListId(null); onSelect('today'); onViewChange?.('tasks'); fetchLists(); fetchCounts();
    } catch { toast('Failed to delete list', 'error'); }
  };

  const navCls = (key: string) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
      (view === 'calendar' ? key === 'calendar' : selected === key)
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-100'
    }`;

  const iconCls = (key: string) =>
    `h-4 w-4 flex-none ${
      (view === 'calendar' ? key === 'calendar' : selected === key) ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
    }`;

  const userName = session?.user?.name ?? 'User';
  const initials = userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-56 flex-none flex-col overflow-y-auto border-r border-gray-100 bg-white px-3 py-5 dark:border-gray-700/60 dark:bg-[#161920] md:flex">
        {/* Header */}
        <div className="mb-5 px-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Tasks</div>
              <div className="text-[11px] text-gray-400">Planner workspace</div>
            </div>
          </div>
        </div>

        {/* Smart lists */}
        <nav className="space-y-0.5">
          {[
            { key: 'today', label: 'Today', Icon: Sun, count: counts.today },
            { key: 'next7', label: 'Next 7 Days', Icon: CalendarDays, count: counts.next7 },
            { key: 'inbox', label: 'Inbox', Icon: Inbox, count: counts.inbox },
          ].map(({ key, label, Icon, count }) => (
            <button key={key} onClick={() => { onSelect(key); onViewChange?.('tasks'); }} className={navCls(key)}>
              <Icon className={iconCls(key)} />
              <span className="flex-1 text-left">{label}</span>
              {count > 0 && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">{count}</span>}
            </button>
          ))}
          <button onClick={() => onViewChange?.('calendar')} className={navCls('calendar')}>
            <Calendar className={iconCls('calendar')} />
            <span className="flex-1 text-left">Calendar</span>
          </button>
        </nav>

        <div className="my-4 border-t border-gray-100 dark:border-gray-700/60" />

        {/* Lists header — only + button, no global ... */}
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Lists ({lists.length})</p>
          <button onClick={openCreateModal} className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* FIX: list rows with per-row ... button */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-visible">
          {lists.map(list => {
            const count = list._count?.tasks ?? 0;
            const key = `list:${list.id}`;
            const isSelected = (view !== 'calendar') && selected === key;
            const isMenuOpen = openMenuListId === list.id;

            return (
              <div key={list.id} className="relative group">
                <button
                  onClick={() => { onSelect(key); onViewChange?.('tasks'); setOpenMenuListId(null); }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-100'
                  }`}
                >
                  {/* List emoji icon */}
                  <span
                    className="flex h-6 w-6 flex-none items-center justify-center rounded-md text-sm leading-none"
                    style={{ backgroundColor: `${list.color || '#10B981'}22` }}
                  >
                    {list.emoji || '📋'}
                  </span>

                  {/* List name — left aligned, truncated */}
                  <span className="flex-1 truncate text-left">{list.name}</span>

                  {/* Right side: color dot + count */}
                  <span className="flex items-center gap-1.5 flex-none">
                    <span
                      className="h-2 w-2 rounded-full flex-none"
                      style={{ backgroundColor: list.color || '#10B981' }}
                    />
                    {count > 0 && (
                      <span className="text-xs text-gray-400 tabular-nums">{count}</span>
                    )}
                  </span>
                </button>

                {/* Per-row ... edit button — appears on hover */}
                <button
                  data-menu-trigger
                  onClick={e => { e.stopPropagation(); setOpenMenuListId(isMenuOpen ? null : list.id); }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md transition ${
                    isMenuOpen
                      ? 'bg-gray-200 text-gray-700 opacity-100 dark:bg-gray-700 dark:text-gray-200'
                      : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>

                {/* Per-row dropdown menu — closes on outside click */}
                {isMenuOpen && (
                  <div
                    data-menu-dropdown
                    className="absolute right-0 top-full z-[100] mt-1 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-[#252830]"
                  >
                    <button onClick={() => openEditModal(list)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">
                      <Pencil className="h-3.5 w-3.5 text-gray-400" />Edit
                    </button>
                    <button onClick={handlePinList} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">
                      <Pin className="h-3.5 w-3.5 text-gray-400" />Pin
                    </button>
                    <button onClick={handleDuplicateList} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">
                      <Copy className="h-3.5 w-3.5 text-gray-400" />Duplicate
                    </button>
                    <button onClick={handleShareList} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">
                      <Share2 className="h-3.5 w-3.5 text-gray-400" />Share
                    </button>
                    <button onClick={handleDeleteList} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/30">
                      <Trash2 className="h-3.5 w-3.5" />Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-gray-100 dark:border-gray-700/60" />

        {/* User + Settings */}
        <div className="mt-3 space-y-0.5">
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
            <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white select-none">
              {initials || <User className="h-3.5 w-3.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-none text-gray-900 dark:text-white">{userName}</p>
              <p className="mt-0.5 truncate text-[11px] text-gray-400">Personal account</p>
            </div>
          </div>
          <Link href="/orbit/tasks/settings" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5">
            <Settings className="h-4 w-4 flex-none text-gray-400" />Settings
          </Link>
        </div>
      </aside>

      {/* Create / Edit list modal */}
      {showListModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[360px] rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-[#1C1F26]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{editingListId ? 'Edit list' : 'Create list'}</h3>
                <p className="text-xs text-gray-400">Choose a name, icon, and color.</p>
              </div>
              <button onClick={closeModal} className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            <input autoFocus
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-600"
              placeholder="List name..."
              value={listName}
              onChange={e => setListName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveList(); if (e.key === 'Escape') closeModal(); }}
            />

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Choose icon</p>
            <div className="mt-2 grid grid-cols-4 gap-2.5">
              {LIST_ICONS.map(icon => (
                <button key={icon} type="button" onClick={() => setListIcon(icon)}
                  className={`flex h-11 w-full items-center justify-center rounded-xl border text-xl transition ${
                    listIcon === icon ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' : 'border-gray-200 bg-gray-50 hover:bg-white dark:border-gray-700 dark:bg-gray-800'
                  }`}
                >{icon}</button>
              ))}
            </div>

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Choose color</p>
            <div className="mt-2 grid grid-cols-4 gap-2.5">
              {LIST_COLORS.map(color => (
                <button key={color} type="button" onClick={() => setListColor(color)}
                  className={`flex h-10 w-full items-center justify-center rounded-xl border transition ${listColor === color ? 'border-gray-900 shadow-sm dark:border-white' : 'border-transparent hover:border-gray-300'}`}
                  style={{ backgroundColor: color }}
                >
                  {listColor === color && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button type="button" onClick={closeModal}
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >Cancel</button>
              <button onClick={saveList}
                className="flex-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >{editingListId ? 'Save' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}