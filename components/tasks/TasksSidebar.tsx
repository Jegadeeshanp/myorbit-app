'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Sun, Inbox, CalendarDays, Plus, Settings, Calendar,
  MoreHorizontal, Pencil, Pin, Copy, Share2, Trash2, X, CheckSquare,
} from 'lucide-react';

const MODULE_ICON_BG    = 'linear-gradient(135deg,rgba(91,228,255,0.22),rgba(91,228,255,0.07))';
const MODULE_ICON_BORD  = 'rgba(91,228,255,0.28)';
const MODULE_ICON_GLOW  = '0 0 14px rgba(91,228,255,0.2)';
const MODULE_ICON_COLOR = '#5BE4FF';
import { LIST_ICONS, getListIcon } from '@/lib/taskListIcons';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
  mobile?: boolean;
}


const LIST_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#64748B'];

export default function TasksSidebar({ selected, onSelect, refreshKey, view, onViewChange, mobile }: Props) {
  const { data: session } = useSession();
  const [lists, setLists] = useState<TaskList[]>([]);
  const [counts, setCounts] = useState({ today: 0, inbox: 0, next7: 0 });
  const [showListModal, setShowListModal] = useState(false);
  // FIX: per-list menu — stores the list id whose menu is open (not a boolean)
  const [openMenuListId, setOpenMenuListId] = useState<string | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [listName, setListName] = useState('');
  const [listIcon, setListIcon] = useState('ClipboardList');
  const [listColor, setListColor] = useState('#10B981');

  const fetchLists = useCallback(() => {
    fetch('/api/task-lists')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setLists(d); })
      .catch(() => {});
  }, []);

  const fetchCounts = useCallback(() => {
    Promise.all([
      fetch('/api/tasks/today').then(r => r.json()).then((d: { today?: unknown[] }) => d.today?.length ?? 0).catch(() => 0),
      fetch('/api/tasks?smartList=inbox').then(r => r.json()).then(d => Array.isArray(d) ? d.length : 0).catch(() => 0),
      fetch('/api/tasks?smartList=next7').then(r => r.json()).then(d => Array.isArray(d) ? d.length : 0).catch(() => 0),
    ]).then(([today, inbox, next7]) => setCounts({ today, inbox, next7 }));
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

  const resetModal = () => { setEditingListId(null); setListName(''); setListIcon('ClipboardList'); setListColor('#10B981'); };
  const closeModal = () => { setShowListModal(false); resetModal(); };

  const openCreateModal = () => { resetModal(); setShowListModal(true); setOpenMenuListId(null); };

  const openEditModal = (list: TaskList) => {
    setEditingListId(list.id);
    setListName(list.name);
    setListIcon(list.emoji || 'ClipboardList');
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
      const res = await fetch('/api/task-lists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `${openList.name} Copy`, emoji: openList.emoji || 'ClipboardList', color: openList.color || '#10B981' }) });
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


  const userName = session?.user?.name ?? 'User';
  const initials = userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <aside style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0, flexDirection: 'column', overflowY: 'auto', background: '#0a0f1e', borderRight: '1px solid #1a2a3a', display: mobile ? 'flex' : undefined, width: mobile ? '100%' : undefined }} className={mobile ? '' : 'hidden w-56 md:flex'}>
        {/* Header */}
        <div style={{ padding: '20px 18px', borderBottom: '1px solid #1a2a3a', display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: MODULE_ICON_BG, border: `1px solid ${MODULE_ICON_BORD}`, boxShadow: MODULE_ICON_GLOW, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckSquare size={17} color={MODULE_ICON_COLOR} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em' }}>Tasks</div>
            <div style={{ fontSize: 9, color: '#3a5060', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 1 }}>Planner workspace</div>
          </div>
        </div>

        {/* Smart lists */}
        <nav style={{ padding: '16px 10px 0' }}>
          <div style={{ fontSize: 9, color: '#3a5060', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, padding: '0 10px', marginBottom: 6 }}>Smart Lists</div>
          {[
            { key: 'today', label: 'Today', Icon: Sun, count: counts.today },
            { key: 'next7', label: 'Next 7 Days', Icon: CalendarDays, count: counts.next7 },
            { key: 'inbox', label: 'Inbox', Icon: Inbox, count: counts.inbox },
          ].map(({ key, label, Icon, count }) => {
            const isActive = view !== 'calendar' && selected === key;
            return (
              <button key={key} onClick={() => { onSelect(key); onViewChange?.('tasks'); }} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, marginBottom: 2, border: `1px solid ${isActive ? 'rgba(0,229,160,0.25)' : 'transparent'}`, background: isActive ? 'rgba(0,229,160,0.1)' : 'transparent', color: isActive ? '#00E5A0' : '#7a8ba0', fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: 'pointer' }}>
                <Icon size={15} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
                {count > 0 && <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, padding: '1px 8px', fontSize: 11, color: '#7a8ba0' }}>{count}</span>}
              </button>
            );
          })}
          {(() => { const isActive = view === 'calendar'; return (
            <button onClick={() => onViewChange?.('calendar')} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, marginBottom: 2, border: `1px solid ${isActive ? 'rgba(0,229,160,0.25)' : 'transparent'}`, background: isActive ? 'rgba(0,229,160,0.1)' : 'transparent', color: isActive ? '#00E5A0' : '#7a8ba0', fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: 'pointer' }}>
              <Calendar size={15} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, textAlign: 'left' }}>Calendar</span>
            </button>
          ); })()}
        </nav>

        <div style={{ height: 1, background: '#1a2a3a', margin: '12px 18px' }} />

        {/* Lists header */}
        <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 0 20px' }}>
          <p style={{ fontSize: 9, color: '#3a5060', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>Lists ({lists.length})</p>
          <button onClick={openCreateModal} style={{ borderRadius: 6, padding: 4, color: '#7a8ba0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Plus size={14} />
          </button>
        </div>

        {/* List rows */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'visible', padding: '0 10px' }}>
          {lists.map(list => {
            const count = list._count?.tasks ?? 0;
            const key = `list:${list.id}`;
            const isSelected = (view !== 'calendar') && selected === key;
            const isMenuOpen = openMenuListId === list.id;

            return (
              <div key={list.id} style={{ position: 'relative' }} className="group">
                <button
                  onClick={() => { onSelect(key); onViewChange?.('tasks'); setOpenMenuListId(null); }}
                  style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, marginBottom: 2, border: `1px solid ${isSelected ? 'rgba(0,229,160,0.25)' : 'transparent'}`, background: isSelected ? 'rgba(0,229,160,0.1)' : 'transparent', color: isSelected ? '#00E5A0' : '#7a8ba0', fontSize: 13, fontWeight: isSelected ? 600 : 400, cursor: 'pointer' }}
                >
                  <span style={{ display: 'flex', width: 22, height: 22, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: `${list.color || '#10B981'}22` }}>
                    {getListIcon(list.emoji)}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{list.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: list.color || '#10B981' }} />
                    {count > 0 && <span style={{ fontSize: 11, color: '#3a5060' }}>{count}</span>}
                  </span>
                </button>

                <button
                  data-menu-trigger
                  onClick={e => {
                    e.stopPropagation();
                    if (!isMenuOpen) {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const popupH = 230;
                      const spaceBelow = window.innerHeight - rect.bottom;
                      const style: React.CSSProperties = { position: 'fixed', zIndex: 200, width: '160px', right: `${window.innerWidth - rect.right}px` };
                      if (spaceBelow >= popupH) { style.top = `${rect.bottom + 4}px`; } else { style.bottom = `${window.innerHeight - rect.top + 4}px`; }
                      setMenuStyle(style);
                    }
                    setOpenMenuListId(isMenuOpen ? null : list.id);
                  }}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: isMenuOpen ? 'rgba(255,255,255,0.1)' : 'none', border: 'none', color: '#7a8ba0', cursor: 'pointer', opacity: isMenuOpen ? 1 : 0 }}
                  className={isMenuOpen ? '' : 'group-hover:opacity-100'}
                >
                  <MoreHorizontal size={13} />
                </button>
              </div>
            );
          })}
        </nav>

        <div style={{ height: 1, background: '#1a2a3a', margin: '12px 18px' }} />

        {/* User + Settings */}
        <div style={{ padding: '0 10px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link href="/orbit/tasks/settings" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: '1px solid transparent', color: '#7a8ba0', fontSize: 13, textDecoration: 'none' }}>
            <Settings size={15} />
            Settings
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, background: '#0e1623', border: '1px solid #1a2a3a' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#6366F1,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{userName}</div>
              <div style={{ fontSize: 10, color: '#3a5060', marginTop: 1 }}>Personal account</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Fixed-position list menu */}
      {openMenuListId && openList && (
        <div data-menu-dropdown style={{ ...menuStyle, background: '#0e1623', border: '1px solid #1a2a3a', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {[
            { label: 'Edit', Icon: Pencil, action: () => openEditModal(openList) },
            { label: 'Pin', Icon: Pin, action: handlePinList },
            { label: 'Duplicate', Icon: Copy, action: handleDuplicateList },
            { label: 'Share', Icon: Share2, action: handleShareList },
          ].map(({ label, Icon, action }) => (
            <button key={label} onClick={action} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 13, color: '#7a8ba0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <Icon size={13} />
              {label}
            </button>
          ))}
          <button onClick={handleDeleteList} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 13, color: '#FF6B6B', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderTop: '1px solid #1a2a3a' }}>
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      )}

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
            <div className="mt-2 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto pr-0.5">
              {LIST_ICONS.map(({ name, icon: Icon, color }) => (
                <button key={name} type="button" title={name} onClick={() => setListIcon(name)}
                  className={`flex h-9 w-full items-center justify-center rounded-xl transition ${
                    listIcon === name
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-1 ring-emerald-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${color}`} />
                </button>
              ))}
            </div>

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Choose color</p>
            <div className="mt-2 flex gap-2.5 flex-wrap">
              {LIST_COLORS.map(color => (
                <button key={color} type="button" onClick={() => setListColor(color)}
                  className={`h-7 w-7 flex-none rounded-full transition ${listColor === color ? 'ring-2 ring-offset-2 ring-gray-500 dark:ring-offset-gray-900' : 'opacity-80 hover:opacity-100'}`}
                  style={{ backgroundColor: color }}
                />
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