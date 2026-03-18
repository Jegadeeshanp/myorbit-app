'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Eye, EyeOff, Bell, Trash2,
  Sun, Inbox, CalendarDays, User, CheckCircle2, Tag, Filter, List,
} from 'lucide-react';
import { toast } from '@/components/Toast';

type TaskList = {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  _count?: { tasks: number };
};

type Visibility = 'Show' | 'Hide' | 'Show if not empty';

const SMART_ITEMS: ({ key: string; label: string; Icon: React.ComponentType<{ className?: string }> } | null)[] = [
  { key: 'today',    label: 'Today',           Icon: Sun },
  { key: 'next7',    label: 'Next 7 Days',      Icon: CalendarDays },
  { key: 'inbox',    label: 'Inbox',            Icon: Inbox },
  { key: 'assigned', label: 'Assigned to Me',   Icon: User },
  null,
  { key: 'tags',     label: 'Tags',             Icon: Tag },
  { key: 'filters',  label: 'Filters',          Icon: Filter },
  null,
  { key: 'completed', label: 'Completed',       Icon: CheckCircle2 },
  { key: 'trash',    label: 'Trash',            Icon: Trash2 },
];

const DEFAULT_VISIBILITY: Record<string, Visibility> = {
  today:     'Show',
  next7:     'Show',
  inbox:     'Show',
  assigned:  'Show if not empty',
  tags:      'Show',
  filters:   'Show',
  completed: 'Show',
  trash:     'Show',
};

const CYCLE: Visibility[] = ['Show', 'Hide', 'Show if not empty'];

type Tab = 'Smart List' | 'Notifications' | 'Data';

export default function TasksSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Smart List');
  const [visibility, setVisibility] = useState<Record<string, Visibility>>(DEFAULT_VISIBILITY);
  const [lists, setLists] = useState<TaskList[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Notification toggles
  const [notifReminder, setNotifReminder] = useState(true);
  const [notifOverdue, setNotifOverdue]   = useState(true);
  const [notifDigest, setNotifDigest]     = useState(false);

  const fetchLists = useCallback(() => {
    setLoadingLists(true);
    fetch('/api/task-lists')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setLists(d); })
      .catch(() => {})
      .finally(() => setLoadingLists(false));
  }, []);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  const cycleVisibility = (key: string) => {
    setVisibility(prev => {
      const cur = prev[key] || 'Show';
      const next = CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length];
      return { ...prev, [key]: next };
    });
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm('Delete this list and all its tasks?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/task-lists/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setLists(prev => prev.filter(l => l.id !== id));
      toast('List deleted');
    } catch {
      toast('Failed to delete list', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const getVisibilityIcon = (vis: Visibility) => {
    if (vis === 'Show')            return <Eye className="h-4 w-4 text-sky-400" />;
    if (vis === 'Hide')            return <EyeOff className="h-4 w-4 text-gray-600" />;
    return <Eye className="h-4 w-4 text-amber-400" />;
  };

  const visibilityLabel = (vis: Visibility) => {
    if (vis === 'Show')            return 'Show';
    if (vis === 'Hide')            return 'Hide';
    return 'If not empty';
  };

  const tabCls = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition ${
      activeTab === t
        ? 'bg-white/10 text-white'
        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
    }`;

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/orbit/tasks"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gray-400 hover:text-white hover:bg-white/15 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Tasks Settings</h1>
            <p className="text-sm text-gray-500">Manage your lists and preferences</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-white/5 p-1">
          {(['Smart List', 'Notifications', 'Data'] as Tab[]).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={tabCls(t)}>
              {t}
            </button>
          ))}
        </div>

        {/* Smart List tab */}
        {activeTab === 'Smart List' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h2 className="text-sm font-semibold text-gray-200">Smart Lists</h2>
                <p className="text-xs text-gray-500 mt-0.5">Choose which lists appear in the sidebar</p>
              </div>
              <div>
                {SMART_ITEMS.map((item, idx) => {
                  if (!item) {
                    return <div key={`div-${idx}`} className="border-t border-white/5 mx-5" />;
                  }
                  const { key, label, Icon } = item;
                  const vis = visibility[key] || 'Show';
                  return (
                    <div key={key} className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition">
                      <Icon className="h-4 w-4 text-gray-400 flex-none" />
                      <span className="flex-1 text-sm text-gray-200">{label}</span>
                      <button
                        onClick={() => cycleVisibility(key)}
                        className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition px-2 py-1"
                      >
                        {getVisibilityIcon(vis)}
                        <span className="text-xs text-gray-300">{visibilityLabel(vis)}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My Lists management */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div>
                  <h2 className="text-sm font-semibold text-gray-200">My Lists</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lists.length} list{lists.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Link
                  href="/orbit/tasks"
                  className="text-xs font-medium text-sky-400 hover:text-sky-300 transition"
                >
                  + Add List
                </Link>
              </div>

              {loadingLists ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 rounded-xl bg-white/10 animate-pulse" />
                  ))}
                </div>
              ) : lists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <List className="h-8 w-8 text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500">No custom lists yet</p>
                </div>
              ) : (
                <div>
                  {lists.map(list => {
                    const taskCount = list._count?.tasks ?? 0;
                    return (
                      <div key={list.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition border-b border-white/5 last:border-0">
                        <span className="text-lg flex-none">{list.emoji || '📋'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">{list.name}</p>
                          <p className="text-xs text-gray-500">{taskCount} active task{taskCount !== 1 ? 's' : ''}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteList(list.id)}
                          disabled={deletingId === list.id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-rose-500/20 hover:text-rose-400 transition disabled:opacity-50"
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
        )}

        {/* Notifications tab */}
        {activeTab === 'Notifications' && (
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-gray-200">Notifications</h2>
              <p className="text-xs text-gray-500 mt-0.5">Configure when you receive reminders</p>
            </div>
            <div className="divide-y divide-white/5">
              {[
                { label: 'Task reminders',   sub: 'Get notified when tasks are due',           value: notifReminder, set: setNotifReminder },
                { label: 'Overdue alerts',   sub: 'Get notified when tasks become overdue',    value: notifOverdue,  set: setNotifOverdue },
                { label: 'Daily digest',     sub: 'Morning summary of today\'s tasks',         value: notifDigest,   set: setNotifDigest },
              ].map(({ label, sub, value, set }) => (
                <div key={label} className="flex items-center gap-4 px-5 py-4">
                  <Bell className="h-5 w-5 text-gray-500 flex-none" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-200">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                  </div>
                  <button
                    onClick={() => set(v => !v)}
                    className={`relative inline-flex h-6 w-11 flex-none cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                      value ? 'bg-sky-600' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        value ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data tab */}
        {activeTab === 'Data' && (
          <div className="space-y-4">
            {/* Import */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h2 className="text-sm font-semibold text-gray-200">Import</h2>
                <p className="text-xs text-gray-500 mt-0.5">Import tasks from other apps</p>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { label: 'Import from Google Tasks',      icon: '🔵' },
                  { label: 'Import from Apple Reminders',   icon: '🍎' },
                  { label: 'Import from Todoist (CSV)',      icon: '🔴' },
                  { label: 'Import from any app (CSV)',      icon: '📄' },
                ].map(({ label, icon }) => (
                  <button
                    key={label}
                    className="w-full flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition text-left"
                  >
                    <span className="text-lg flex-none">{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Export */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h2 className="text-sm font-semibold text-gray-200">Export</h2>
                <p className="text-xs text-gray-500 mt-0.5">Download your task data</p>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { label: 'Export as CSV',  icon: '📊', format: 'csv' },
                  { label: 'Export as JSON', icon: '🗃️', format: 'json' },
                ].map(({ label, icon, format }) => (
                  <button
                    key={format}
                    className="w-full flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition text-left"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/tasks?smartList=all`);
                        const data = await res.json();
                        let content = '';
                        let mime = 'text/plain';
                        if (format === 'json') {
                          content = JSON.stringify(data, null, 2);
                          mime = 'application/json';
                        } else {
                          const rows = [['id', 'title', 'status', 'priority', 'dueDate', 'dueTime', 'tags']];
                          for (const t of data) {
                            rows.push([t.id, t.title, t.status, t.priority, t.dueDate || '', t.dueTime || '', t.tags || '']);
                          }
                          content = rows.map(r => r.join(',')).join('\n');
                          mime = 'text/csv';
                        }
                        const blob = new Blob([content], { type: mime });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `tasks-export.${format}`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast(`Exported as ${format.toUpperCase()}`);
                      } catch {
                        toast('Export failed', 'error');
                      }
                    }}
                  >
                    <span className="text-lg flex-none">{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
