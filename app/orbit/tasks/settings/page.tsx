'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Eye, EyeOff, Bell, Trash2,
  Sun, Inbox, CalendarDays, User, Tag, Filter, List, CheckCircle2,
} from 'lucide-react';
import { toast } from '@/components/Toast';
import CreateTaskFab from '@/components/tasks/CreateTaskFab';
import EnableNotifications from '@/components/EnableNotifications';
import { getListIcon } from '@/lib/taskListIcons';

type TaskList = {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  _count?: { tasks: number };
};

type Visibility = 'Show' | 'Hide' | 'Show if not empty';
type Tab = 'Smart List' | 'Notifications' | 'Data';

const SMART_ITEMS: ({ key: string; label: string; Icon: React.ComponentType<{ className?: string }> } | null)[] = [
  { key: 'today', label: 'Today', Icon: Sun },
  { key: 'next7', label: 'Next 7 Days', Icon: CalendarDays },
  { key: 'inbox', label: 'Inbox', Icon: Inbox },
  { key: 'assigned', label: 'Assigned to Me', Icon: User },
  null,
  { key: 'tags', label: 'Tags', Icon: Tag },
  { key: 'filters', label: 'Filters', Icon: Filter },
];

const DEFAULT_VISIBILITY: Record<string, Visibility> = {
  today: 'Show',
  next7: 'Show',
  inbox: 'Show',
  assigned: 'Show if not empty',
  tags: 'Show',
  filters: 'Show',
};

const CYCLE: Visibility[] = ['Show', 'Hide', 'Show if not empty'];

export default function TasksSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Smart List');
  const [visibility, setVisibility] = useState<Record<string, Visibility>>(DEFAULT_VISIBILITY);
  const [lists, setLists] = useState<TaskList[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [counts, setCounts] = useState({ completed: 0, deleted: 0 });
  const [notifReminder, setNotifReminder] = useState(true);
  const [notifOverdue, setNotifOverdue] = useState(true);
  const [notifDigest, setNotifDigest] = useState(false);

  const fetchLists = useCallback(() => {
    setLoadingLists(true);
    fetch('/api/task-lists')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setLists(d); })
      .catch(() => {})
      .finally(() => setLoadingLists(false));
  }, []);

  const fetchCounts = useCallback(() => {
    Promise.all([
      fetch('/api/tasks?smartList=completed').then(r => r.json()).catch(() => []),
      fetch('/api/tasks?smartList=trash').then(r => r.json()).catch(() => []),
    ]).then(([completed, deleted]) => {
      setCounts({
        completed: Array.isArray(completed) ? completed.length : 0,
        deleted: Array.isArray(deleted) ? deleted.length : 0,
      });
    });
  }, []);

  useEffect(() => {
    fetchLists();
    fetchCounts();
  }, [fetchLists, fetchCounts]);

  const cycleVisibility = (key: string) => {
    setVisibility(prev => {
      const current = prev[key] || 'Show';
      const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
      return { ...prev, [key]: next };
    });
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm('Delete this list and move its tasks to Inbox?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/task-lists/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setLists(prev => prev.filter(list => list.id !== id));
      toast('List deleted');
    } catch {
      toast('Failed to delete list', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const getVisibilityIcon = (vis: Visibility) => {
    if (vis === 'Show') return <Eye className="h-4 w-4 text-sky-400" />;
    if (vis === 'Hide') return <EyeOff className="h-4 w-4 text-gray-600" />;
    return <Eye className="h-4 w-4 text-amber-400" />;
  };

  const visibilityLabel = (vis: Visibility) => {
    if (vis === 'Show') return 'Show';
    if (vis === 'Hide') return 'Hide';
    return 'If not empty';
  };

  const tabCls = (tab: Tab) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition ${
      activeTab === tab ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
    }`;

  return (
    <div className="min-h-screen bg-[#12161D] text-white">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <div className="flex items-center gap-3">
          <Link
            href="/orbit/tasks"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gray-400 transition hover:bg-white/15 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Tasks Settings</h1>
            <p className="text-sm text-gray-500">Manage your lists and preferences</p>
          </div>
        </div>

        <div className="flex gap-1 rounded-xl bg-white/5 p-1">
          {(['Smart List', 'Notifications', 'Data'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={tabCls(tab)}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Smart List' ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="border-b border-white/5 px-5 py-4">
                <h2 className="text-sm font-semibold text-gray-200">Smart Lists</h2>
                <p className="mt-0.5 text-xs text-gray-500">Choose which lists appear in the sidebar</p>
              </div>
              <div>
                {SMART_ITEMS.map((item, idx) => {
                  if (!item) return <div key={`divider-${idx}`} className="mx-5 border-t border-white/5" />;
                  const vis = visibility[item.key] || 'Show';
                  return (
                    <div key={item.key} className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/5">
                      <item.Icon className="h-4 w-4 flex-none text-gray-400" />
                      <span className="flex-1 text-sm text-gray-200">{item.label}</span>
                      <button
                        onClick={() => cycleVisibility(item.key)}
                        className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 transition hover:bg-white/15"
                      >
                        {getVisibilityIcon(vis)}
                        <span className="text-xs text-gray-300">{visibilityLabel(vis)}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-200">My Lists</h2>
                  <p className="mt-0.5 text-xs text-gray-500">{lists.length} list{lists.length !== 1 ? 's' : ''}</p>
                </div>
                <Link href="/orbit/tasks" className="text-xs font-medium text-sky-400 transition hover:text-sky-300">
                  + Add List
                </Link>
              </div>

              {loadingLists ? (
                <div className="space-y-3 p-5">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse rounded-xl bg-white/10" />)}
                </div>
              ) : lists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <List className="mb-2 h-8 w-8 text-gray-600" />
                  <p className="text-sm text-gray-500">No custom lists yet</p>
                </div>
              ) : (
                <div>
                  {lists.map(list => {
                    const taskCount = list._count?.tasks ?? 0;
                    return (
                      <div key={list.id} className="flex items-center gap-3 border-b border-white/5 px-5 py-3 transition last:border-0 hover:bg-white/5">
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg" style={{ backgroundColor: `${list.color || '#10B981'}22` }}>
                          {getListIcon(list.emoji, 'h-4 w-4')}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-200">{list.name}</p>
                          <p className="text-xs text-gray-500">{taskCount} active task{taskCount !== 1 ? 's' : ''}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteList(list.id)}
                          disabled={deletingId === list.id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-rose-500/20 hover:text-rose-400 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === 'Notifications' ? (
          <div className="space-y-4">
            <EnableNotifications />
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="border-b border-white/5 px-5 py-4">
                <h2 className="text-sm font-semibold text-gray-200">Notifications</h2>
                <p className="mt-0.5 text-xs text-gray-500">Configure when you receive reminders</p>
              </div>
              <div className="divide-y divide-white/5">
                {[
                  { label: 'Task reminders', sub: 'Get notified when tasks are due', value: notifReminder, set: setNotifReminder },
                  { label: 'Overdue alerts', sub: 'Get notified when tasks become overdue', value: notifOverdue, set: setNotifOverdue },
                  { label: 'Daily digest', sub: "Morning summary of today's tasks", value: notifDigest, set: setNotifDigest },
                ].map(({ label, sub, value, set }) => (
                  <div key={label} className="flex items-center gap-4 px-5 py-4">
                    <Bell className="h-5 w-5 flex-none text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-200">{label}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{sub}</p>
                    </div>
                    <button
                      onClick={() => set(v => !v)}
                      className={`relative inline-flex h-6 w-11 flex-none rounded-full border-2 border-transparent transition-colors ${value ? 'bg-sky-600' : 'bg-white/10'}`}
                    >
                      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'Data' ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="border-b border-white/5 px-5 py-4">
                <h2 className="text-sm font-semibold text-gray-200">Completed & Deleted</h2>
                <p className="mt-0.5 text-xs text-gray-500">These sections were moved out of the sidebar</p>
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="flex-1 text-sm text-gray-200">Completed</span>
                  <span className="text-sm text-gray-400">{counts.completed}</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                  <Trash2 className="h-4 w-4 text-rose-400" />
                  <span className="flex-1 text-sm text-gray-200">Deleted</span>
                  <span className="text-sm text-gray-400">{counts.deleted}</span>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="border-b border-white/5 px-5 py-4">
                <h2 className="text-sm font-semibold text-gray-200">Export</h2>
                <p className="mt-0.5 text-xs text-gray-500">Download your task data</p>
              </div>
              <div className="space-y-2 p-4">
                {[
                  { label: 'Export as CSV', icon: '📊', format: 'csv' },
                  { label: 'Export as JSON', icon: '🗃️', format: 'json' },
                ].map(({ label, icon, format }) => (
                  <button
                    key={format}
                    className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-left text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/tasks?smartList=all');
                        const data = await res.json();
                        let content = '';
                        let mime = 'text/plain';
                        if (format === 'json') {
                          content = JSON.stringify(data, null, 2);
                          mime = 'application/json';
                        } else {
                          const rows = [['id', 'title', 'status', 'priority', 'dueDate', 'dueTime', 'tags']];
                          for (const task of data) rows.push([task.id, task.title, task.status, task.priority, task.dueDate || '', task.dueTime || '', task.tags || '']);
                          content = rows.map(row => row.join(',')).join('\n');
                          mime = 'text/csv';
                        }
                        const blob = new Blob([content], { type: mime });
                        const url = URL.createObjectURL(blob);
                        const anchor = document.createElement('a');
                        anchor.href = url;
                        anchor.download = `tasks-export.${format}`;
                        anchor.click();
                        URL.revokeObjectURL(url);
                        toast(`Exported as ${format.toUpperCase()}`);
                      } catch {
                        toast('Export failed', 'error');
                      }
                    }}
                  >
                    <span className="flex-none text-lg">{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <CreateTaskFab href="/orbit/tasks?create=1" />
    </div>
  );
}
