'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Sun, Inbox, CalendarDays, List as ListIcon, MoreHorizontal,
  X, Settings, CalendarCheck, ArrowUpDown, Plus, MoreHorizontal as MoreH,
  Pin, Copy, Share2, Trash2, Pencil,
} from 'lucide-react';
import { toast } from '@/components/Toast';

type TaskList = { id: string; name: string; emoji?: string; color?: string; _count?: { tasks: number } };

interface Props {
  selected: string;
  view: 'tasks' | 'calendar';
  onSelect: (key: string) => void;
  onViewChange: (v: 'tasks' | 'calendar') => void;
  focusAdd: () => void;
}

const LIST_ICONS = ['📋', '📝', '✅', '📌', '💼', '🏠', '🛒', '🎯', '📚', '💡', '💻', '🧾'];
const LIST_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#64748B'];

export default function TasksMobileNav({ selected, view, onSelect, onViewChange, focusAdd }: Props) {
  const { data: session } = useSession();
  const [moreOpen, setMoreOpen]     = useState(false);
  const [listsOpen, setListsOpen]   = useState(false);
  const [lists, setLists]           = useState<TaskList[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [menuListId, setMenuListId] = useState<string | null>(null);
  const [newName, setNewName]       = useState('');
  const [newEmoji, setNewEmoji]     = useState('📋');
  const [newColor, setNewColor]     = useState('#10B981');
  const [saving, setSaving]         = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);

  const userName = session?.user?.name ?? 'User';
  const initials = userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const isActive = (key: string) => view === 'tasks' && selected === key;
  const calActive = view === 'calendar';

  const tab = (active: boolean) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 transition ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`;
  const iconBox = (active: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-xl ${active ? 'bg-emerald-50 dark:bg-emerald-900/40' : ''}`;

  const fetchLists = () => {
    fetch('/api/task-lists')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setLists(d); })
      .catch(() => {});
  };

  useEffect(() => { if (listsOpen) fetchLists(); }, [listsOpen]);

  const resetCreate = () => { setNewName(''); setNewEmoji('📋'); setNewColor('#10B981'); setEditingId(null); };

  const handleSaveList = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await fetch(`/api/task-lists/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), emoji: newEmoji, color: newColor }) });
        toast('List updated');
      } else {
        await fetch('/api/task-lists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), emoji: newEmoji, color: newColor }) });
        toast('List created');
      }
      fetchLists(); setShowCreate(false); resetCreate();
    } catch { toast('Failed', 'error'); } finally { setSaving(false); }
  };

  const handleDeleteList = async (id: string) => {
    try {
      await fetch(`/api/task-lists/${id}`, { method: 'DELETE' });
      toast('List deleted'); fetchLists(); setMenuListId(null);
      if (selected === `list:${id}`) onSelect('today');
    } catch { toast('Failed to delete', 'error'); }
  };

  const handleDuplicateList = async (list: TaskList) => {
    try {
      await fetch('/api/task-lists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `${list.name} Copy`, emoji: list.emoji || '📋', color: list.color || '#10B981' }) });
      toast('Duplicated'); fetchLists(); setMenuListId(null);
    } catch { toast('Failed', 'error'); }
  };

  const openEditList = (list: TaskList) => {
    setEditingId(list.id); setNewName(list.name); setNewEmoji(list.emoji || '📋'); setNewColor(list.color || '#10B981');
    setShowCreate(true); setMenuListId(null);
  };

  return (
    <>
      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-md dark:border-gray-700 dark:bg-[#1C1F26]/95 md:hidden">
        <div className="flex items-center px-1 pb-safe pt-1">
          <button onClick={() => { onViewChange('tasks'); onSelect('today'); }} className={tab(isActive('today'))}>
            <div className={iconBox(isActive('today'))}><Sun className="h-5 w-5" /></div>
            <span className="text-[10px] font-medium">Today</span>
          </button>
          <button onClick={() => { onViewChange('tasks'); onSelect('inbox'); }} className={tab(isActive('inbox'))}>
            <div className={iconBox(isActive('inbox'))}><Inbox className="h-5 w-5" /></div>
            <span className="text-[10px] font-medium">Inbox</span>
          </button>
          <button onClick={() => setListsOpen(true)} className={tab(selected.startsWith('list:'))}>
            <div className={iconBox(selected.startsWith('list:'))}><ListIcon className="h-5 w-5" /></div>
            <span className="text-[10px] font-medium">Lists</span>
          </button>
          <button onClick={() => onViewChange('calendar')} className={tab(calActive)}>
            <div className={iconBox(calActive)}><CalendarDays className="h-5 w-5" /></div>
            <span className="text-[10px] font-medium">Calendar</span>
          </button>
          <button onClick={() => setMoreOpen(true)} className={tab(false)}>
            <div className={iconBox(false)}><MoreHorizontal className="h-5 w-5" /></div>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* ── More sheet ── */}
      {moreOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="w-full overflow-y-auto rounded-t-2xl border-t border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#1C1F26]" style={{ maxHeight: '65vh' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 pt-5 pb-3">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white select-none">{initials || 'U'}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{userName}</p>
                <p className="text-xs text-gray-400">Personal account</p>
              </div>
              <button onClick={() => setMoreOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="mx-4 border-t border-gray-100 dark:border-gray-700" />
            <div className="space-y-0.5 px-3 py-3">
              <button onClick={() => { onViewChange('tasks'); onSelect('next7'); setMoreOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">
                <CalendarCheck className="h-4 w-4 flex-none text-gray-400" />Next 7 Days
              </button>
              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">
                <ArrowUpDown className="h-4 w-4 flex-none text-gray-400" />Sort by
              </button>
            </div>
            <div className="mx-4 border-t border-gray-100 dark:border-gray-700" />
            <div className="space-y-0.5 px-3 py-3 pb-8">
              <Link href="/orbit/tasks/settings" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">
                <Settings className="h-4 w-4 flex-none text-gray-400" />Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Lists page overlay (slides from bottom, full page) ── */}
      {listsOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setListsOpen(false); setShowCreate(false); resetCreate(); setMenuListId(null); }} />
          <div className="absolute inset-x-0 bottom-0 top-0 bg-[#F6F8FB] dark:bg-[#12161D] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-12 pb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lists</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowCreate(true); resetCreate(); }} className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Plus className="h-5 w-5" />
                </button>
                <button onClick={() => { setListsOpen(false); setShowCreate(false); resetCreate(); setMenuListId(null); }} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-200 dark:bg-gray-800">
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* List items */}
            <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-8">
              {lists.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <ListIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="font-medium text-gray-500 dark:text-gray-400">No lists yet</p>
                  <p className="text-sm text-gray-400 mt-1">Tap + to create your first list</p>
                </div>
              )}
              {lists.map(list => {
                const count = list._count?.tasks ?? 0;
                const isMenuOpen = menuListId === list.id;
                return (
                  <div key={list.id} className="relative">
                    <button
                      onClick={() => { onSelect(`list:${list.id}`); onViewChange('tasks'); setListsOpen(false); setMenuListId(null); }}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 transition ${selected === `list:${list.id}` ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20' : 'border-gray-200 bg-white dark:border-gray-700/60 dark:bg-[#1C1F26]'}`}
                    >
                      {/* Emoji icon with color bg */}
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl text-xl" style={{ backgroundColor: `${list.color || '#10B981'}22` }}>
                        {list.emoji || '📋'}
                      </span>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{list.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{count} task{count !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="h-3 w-3 flex-none rounded-full" style={{ backgroundColor: list.color || '#10B981' }} />
                      {/* ... menu trigger */}
                      <button
                        onClick={e => { e.stopPropagation(); setMenuListId(isMenuOpen ? null : list.id); }}
                        className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition"
                      >
                        <MoreH className="h-4 w-4" />
                      </button>
                    </button>

                    {/* Per-list dropdown */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-full z-[100] mt-1 w-44 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-[#252830]">
                        <button onClick={() => openEditList(list)} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">
                          <Pencil className="h-4 w-4 text-gray-400" />Edit
                        </button>
                        <button onClick={async () => { await fetch(`/api/task-lists/${list.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: -1 }) }); fetchLists(); setMenuListId(null); toast('Pinned'); }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">
                          <Pin className="h-4 w-4 text-gray-400" />Pin
                        </button>
                        <button onClick={() => handleDuplicateList(list)} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">
                          <Copy className="h-4 w-4 text-gray-400" />Duplicate
                        </button>
                        <button onClick={async () => { try { await navigator.clipboard.writeText(`${window.location.origin}/orbit/tasks?list=${list.id}`); toast('Link copied'); } catch {} setMenuListId(null); }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">
                          <Share2 className="h-4 w-4 text-gray-400" />Share
                        </button>
                        <button onClick={() => handleDeleteList(list.id)} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                          <Trash2 className="h-4 w-4" />Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit list sheet ── */}
      {showCreate && (
        <div className="fixed inset-0 z-[70] flex items-end md:hidden" onClick={() => { setShowCreate(false); resetCreate(); }}>
          <div className="w-full rounded-t-2xl bg-white dark:bg-[#1C1F26] border-t border-gray-200 dark:border-gray-700 shadow-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{editingId ? 'Edit List' : 'New List'}</h3>
              <button onClick={() => { setShowCreate(false); resetCreate(); }} className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <input
              autoFocus
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 mb-4"
              placeholder="List name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void handleSaveList(); }}
            />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Icon</p>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {LIST_ICONS.map(em => (
                <button key={em} onClick={() => setNewEmoji(em)}
                  className={`flex h-11 items-center justify-center rounded-xl text-xl transition ${newEmoji === em ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-2 ring-emerald-400' : 'bg-gray-100 dark:bg-gray-800'}`}
                >{em}</button>
              ))}
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Color</p>
            <div className="flex gap-2 mb-5">
              {LIST_COLORS.map(c => (
                <button key={c} onClick={() => setNewColor(c)}
                  className={`h-8 w-8 flex-none rounded-full transition ${newColor === c ? 'ring-2 ring-offset-2 ring-gray-500 dark:ring-offset-gray-900' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowCreate(false); resetCreate(); }} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400">Cancel</button>
              <button onClick={() => void handleSaveList()} disabled={!newName.trim() || saving}
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white disabled:opacity-50 hover:bg-emerald-700"
              >{saving ? 'Saving...' : editingId ? 'Save' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
