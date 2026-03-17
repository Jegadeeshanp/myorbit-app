'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Trash2, List } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/Toast';

type TaskList = {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  _count?: { tasks: number };
};

export default function TasksSettingsPage() {
  const [lists, setLists] = useState<TaskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLists = useCallback(() => {
    setLoading(true);
    fetch('/api/task-lists')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setLists(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  const handleDelete = async (id: string) => {
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/orbit/tasks"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tasks Settings</h1>
          <p className="text-sm text-gray-500">Manage your lists and task preferences</p>
        </div>
      </div>

      {/* Lists management */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">My Lists</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {lists.length} list{lists.length !== 1 ? 's' : ''} · Manage or remove lists
            </p>
          </div>
          <Link
            href="/orbit/tasks"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition"
          >
            + Add List
          </Link>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 mb-3">
              <List className="h-6 w-6 text-blue-400" />
            </div>
            <p className="text-sm text-gray-500">No custom lists yet</p>
            <p className="text-xs text-gray-400 mt-1">Create lists from the Tasks page</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {lists.map(list => {
              const taskCount = list._count?.tasks ?? 0;
              return (
                <div key={list.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-lg flex-none">{list.emoji || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{list.name}</p>
                    <p className="text-xs text-gray-400">{taskCount} active task{taskCount !== 1 ? 's' : ''}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(list.id)}
                    disabled={deletingId === list.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition disabled:opacity-50"
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
  );
}
