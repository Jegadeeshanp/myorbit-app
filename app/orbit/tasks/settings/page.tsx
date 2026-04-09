'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  List, Bell, Download,
  Eye, EyeOff, Sun, Inbox, CalendarDays, User, Tag, Filter,
  Trash2, CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/Toast';
import SettingsShell, { SettingsCard, SettingsRow, Toggle } from '@/components/settings/SettingsShell';
import EnableNotifications from '@/components/EnableNotifications';
import { getListIcon } from '@/lib/taskListIcons';

const TABS = [
  { id: 'lists',         label: 'Lists',         icon: List     },
  { id: 'notifications', label: 'Notifications',  icon: Bell     },
  { id: 'data',          label: 'Data',           icon: Download },
];

type TaskList = {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  _count?: { tasks: number };
};

type Visibility = 'Show' | 'Hide' | 'Show if not empty';

const SMART_ITEMS: ({ key: string; label: string; Icon: React.ComponentType<{ className?: string }> } | null)[] = [
  { key: 'today',    label: 'Today',         Icon: Sun        },
  { key: 'next7',    label: 'Next 7 Days',   Icon: CalendarDays },
  { key: 'inbox',    label: 'Inbox',         Icon: Inbox      },
  { key: 'assigned', label: 'Assigned to Me', Icon: User      },
  null,
  { key: 'tags',     label: 'Tags',          Icon: Tag        },
  { key: 'filters',  label: 'Filters',       Icon: Filter     },
];

const DEFAULT_VISIBILITY: Record<string, Visibility> = {
  today:    'Show',
  next7:    'Show',
  inbox:    'Show',
  assigned: 'Show if not empty',
  tags:     'Show',
  filters:  'Show',
};

const CYCLE: Visibility[] = ['Show', 'Hide', 'Show if not empty'];

function VisibilityBadge({ vis }: { vis: Visibility }) {
  if (vis === 'Show')
    return (
      <span className="flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <Eye className="h-3.5 w-3.5" /> Show
      </span>
    );
  if (vis === 'Hide')
    return (
      <span className="flex items-center gap-1 rounded-lg bg-gray-100 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500">
        <EyeOff className="h-3.5 w-3.5" /> Hide
      </span>
    );
  return (
    <span className="flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700">
      <Eye className="h-3.5 w-3.5" /> If not empty
    </span>
  );
}

export default function TasksSettingsPage() {
  const [activeTab,   setActiveTab]   = useState('lists');
  const [visibility,  setVisibility]  = useState<Record<string, Visibility>>(DEFAULT_VISIBILITY);
  const [lists,       setLists]       = useState<TaskList[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [counts,      setCounts]      = useState({ completed: 0, deleted: 0 });

  // Notification toggles
  const [notifReminder, setNotifReminder] = useState(true);
  const [notifOverdue,  setNotifOverdue]  = useState(true);
  const [notifDigest,   setNotifDigest]   = useState(false);

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
        deleted:   Array.isArray(deleted)   ? deleted.length   : 0,
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
      const next    = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
      return { ...prev, [key]: next };
    });
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm('Delete this list and move its tasks to Inbox?')) return;
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

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const res  = await fetch('/api/tasks?smartList=all');
      const data = await res.json();
      let content: string;
      let mime: string;
      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        mime    = 'application/json';
      } else {
        const rows = [['id', 'title', 'status', 'priority', 'dueDate', 'dueTime', 'tags']];
        for (const t of (Array.isArray(data) ? data : [])) {
          rows.push([t.id, t.title, t.status, t.priority, t.dueDate ?? '', t.dueTime ?? '', t.tags ?? '']);
        }
        content = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        mime    = 'text/csv';
      }
      const blob = new Blob([content], { type: mime });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `tasks-export.${format}`; a.click();
      URL.revokeObjectURL(url);
      toast(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast('Export failed', 'error');
    }
  };

  return (
    <SettingsShell
      title="Tasks Settings"
      subtitle="Manage lists, notifications, and data"
      backHref="/orbit/tasks"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* ── Lists ── */}
      {activeTab === 'lists' && (
        <>
          {/* Smart lists visibility */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Smart Lists</p>
              <p className="text-xs text-gray-500 mt-0.5">Choose which lists appear in the sidebar</p>
            </div>
            <div className="divide-y divide-gray-100">
              {SMART_ITEMS.map((item, idx) => {
                if (!item) return <div key={`divider-${idx}`} className="mx-5 border-t border-gray-50" />;
                const vis = visibility[item.key] || 'Show';
                return (
                  <div key={item.key} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
                    <item.Icon className="h-4 w-4 flex-none text-gray-400" />
                    <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
                    <button onClick={() => cycleVisibility(item.key)}>
                      <VisibilityBadge vis={vis} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom lists */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">My Lists</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {loadingLists ? '…' : `${lists.length} list${lists.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <Link
                href="/orbit/tasks"
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition"
              >
                + New List
              </Link>
            </div>

            {loadingLists ? (
              <div className="p-5 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />)}
              </div>
            ) : lists.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <List className="h-8 w-8 text-gray-200 mb-2" />
                <p className="text-sm text-gray-500">No custom lists yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {lists.map(list => {
                  const taskCount = list._count?.tasks ?? 0;
                  return (
                    <div key={list.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
                      <span
                        className="flex h-8 w-8 flex-none items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${list.color || '#10B981'}22` }}
                      >
                        {getListIcon(list.emoji, 'h-4 w-4')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{list.name}</p>
                        <p className="text-xs text-gray-400">{taskCount} active task{taskCount !== 1 ? 's' : ''}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteList(list.id)}
                        disabled={deletingId === list.id}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-300 hover:bg-rose-50 hover:text-rose-400 disabled:opacity-50 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Notifications ── */}
      {activeTab === 'notifications' && (
        <>
          <SettingsCard>
            <EnableNotifications />
          </SettingsCard>

          <SettingsCard title="Notification Preferences" subtitle="Configure when you receive reminders">
            <div className="space-y-4">
              {[
                { label: 'Task reminders',  sub: 'Get notified when tasks are due',         value: notifReminder, set: setNotifReminder },
                { label: 'Overdue alerts',  sub: 'Get notified when tasks become overdue',  value: notifOverdue,  set: setNotifOverdue  },
                { label: 'Daily digest',    sub: "Morning summary of today's tasks",         value: notifDigest,   set: setNotifDigest   },
              ].map(({ label, sub, value, set }) => (
                <SettingsRow key={label} label={label} sub={sub}>
                  <Toggle value={value} onChange={set} />
                </SettingsRow>
              ))}
            </div>
          </SettingsCard>
        </>
      )}

      {/* ── Data ── */}
      {activeTab === 'data' && (
        <>
          <SettingsCard title="Completed & Deleted" subtitle="Task counts for archived items">
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Completed
                </span>
                <span className="text-sm font-semibold text-gray-900">{counts.completed}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-gray-700">
                  <Trash2 className="h-4 w-4 text-rose-400" /> Deleted
                </span>
                <span className="text-sm font-semibold text-gray-900">{counts.deleted}</span>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard title="Export Tasks" subtitle="Download your task data">
            <div className="flex gap-3">
              {(['csv', 'json'] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  <Download className="h-4 w-4" />
                  Export {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </SettingsCard>
        </>
      )}
    </SettingsShell>
  );
}
