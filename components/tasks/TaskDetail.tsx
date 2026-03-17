'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2, Circle, Save } from 'lucide-react';
import { toast } from '@/components/Toast';

type Subtask  = { id: string; title: string; isDone: boolean };
type TaskList = { id: string; name: string; emoji?: string };
type Task = {
  id: string; title: string; notes?: string; status: string; priority: string;
  dueDate?: string; dueTime?: string; tags: string; listId?: string;
  isActive?: boolean;
  subtasks: Subtask[];
  list?: { id: string; name: string; emoji?: string } | null;
};

const PRIORITIES = ['none', 'low', 'medium', 'high'] as const;
const PRIORITY_LABELS: Record<string, string> = { none: 'None', low: '!', medium: '!!', high: '!!!' };
const PRIORITY_COLORS: Record<string, string> = {
  none: 'bg-gray-100 text-gray-600',
  low: 'bg-blue-50 text-blue-600',
  medium: 'bg-amber-50 text-amber-600',
  high: 'bg-rose-50 text-rose-600',
};

const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white';

interface Props {
  task: Task;
  lists: TaskList[];
  onClose: () => void;
  onUpdated: (t: Task) => void;
  onDeleted: (id: string) => void;
  onCompleted: (id: string) => void;
}

export default function TaskDetail({ task, lists, onClose, onUpdated, onDeleted, onCompleted }: Props) {
  const [title, setTitle]     = useState(task.title);
  const [notes, setNotes]     = useState(task.notes || '');
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [dueTime, setDueTime] = useState(task.dueTime || '');
  const [listId, setListId]   = useState(task.listId || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags]       = useState<string[]>(() => { try { return JSON.parse(task.tags || '[]'); } catch { return []; } });
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [saving, setSaving]   = useState(false);
  const [dirty, setDirty]     = useState(false);

  const markDirty = () => setDirty(true);

  const handleSave = async () => {
    if (!title.trim()) { toast('Title required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          notes: notes.trim() || null,
          priority,
          dueDate: dueDate || null,
          dueTime: dueTime || null,
          tags,
          listId: listId || null,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      onUpdated(updated);
      setDirty(false);
      toast('Task saved');
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    await onCompleted(task.id);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm('Move task to trash?')) return;
    await onDeleted(task.id);
    onClose();
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtask.trim() }),
      });
      if (!res.ok) throw new Error();
      const s = await res.json();
      setSubtasks(prev => [...prev, s]);
      setNewSubtask('');
    } catch {
      toast('Failed to add subtask', 'error');
    }
  };

  const toggleSubtask = async (sid: string, isDone: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks/${sid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDone: !isDone }),
      });
      if (!res.ok) throw new Error();
      setSubtasks(prev => prev.map(s => s.id === sid ? { ...s, isDone: !isDone } : s));
    } catch {
      toast('Failed to update', 'error');
    }
  };

  const deleteSubtask = async (sid: string) => {
    try {
      await fetch(`/api/tasks/${task.id}/subtasks/${sid}`, { method: 'DELETE' });
      setSubtasks(prev => prev.filter(s => s.id !== sid));
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t]);
      setTagInput('');
      markDirty();
    }
  };

  const removeTag = (t: string) => { setTags(prev => prev.filter(x => x !== t)); markDirty(); };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-none">
          <div className="flex items-center gap-2">
            {task.status === 'completed'
              ? <CheckCircle2 className="h-5 w-5 text-blue-500" />
              : <Circle className="h-5 w-5 text-gray-300" />
            }
            <span className="text-sm font-medium text-gray-500">Task Details</span>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Title */}
          <textarea
            className="w-full resize-none rounded-xl border border-transparent bg-transparent px-0 py-0 text-lg font-semibold text-gray-900 focus:border-blue-200 focus:bg-blue-50/30 focus:outline-none focus:ring-0 placeholder-gray-300 leading-snug"
            rows={2}
            placeholder="Task title..."
            value={title}
            onChange={e => { setTitle(e.target.value); markDirty(); }}
          />

          {/* Notes */}
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            placeholder="Add notes..."
            value={notes}
            onChange={e => { setNotes(e.target.value); markDirty(); }}
          />

          {/* Due date + time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Due Date</label>
              <input type="date" className={inputCls} value={dueDate} onChange={e => { setDueDate(e.target.value); markDirty(); }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Time</label>
              <input type="time" className={inputCls} value={dueTime} onChange={e => { setDueTime(e.target.value); markDirty(); }} />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button key={p} type="button"
                  onClick={() => { setPriority(p); markDirty(); }}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${priority === p ? PRIORITY_COLORS[p] + ' ring-1 ring-current' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {lists.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">List</label>
              <select className={inputCls} value={listId} onChange={e => { setListId(e.target.value); markDirty(); }}>
                <option value="">Inbox (no list)</option>
                {lists.map(l => (
                  <option key={l.id} value={l.id}>{l.emoji || '📋'} {l.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                  {t}
                  <button onClick={() => removeTag(t)} className="text-blue-400 hover:text-blue-700"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                placeholder="Add tag..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
              />
              <button onClick={addTag} className="rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200">Add</button>
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Subtasks {subtasks.length > 0 && `(${subtasks.filter(s => s.isDone).length}/${subtasks.length})`}
            </label>
            <div className="space-y-1 mb-2">
              {subtasks.map(s => (
                <div key={s.id} className="flex items-center gap-2 group">
                  <button onClick={() => toggleSubtask(s.id, s.isDone)}>
                    {s.isDone ? <CheckCircle2 className="h-4 w-4 text-blue-500" /> : <Circle className="h-4 w-4 text-gray-300 hover:text-blue-400" />}
                  </button>
                  <span className={`flex-1 text-sm ${s.isDone ? 'line-through text-gray-400' : 'text-gray-700'}`}>{s.title}</span>
                  <button onClick={() => deleteSubtask(s.id)} className="opacity-0 group-hover:opacity-100 transition">
                    <X className="h-3.5 w-3.5 text-gray-400 hover:text-rose-500" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                placeholder="Add subtask..."
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSubtask()}
              />
              <button onClick={addSubtask} className="rounded-xl bg-gray-100 px-3 py-2 text-gray-600 hover:bg-gray-200">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5 pt-3 border-t border-gray-100 flex-none">
          <button onClick={handleDelete} className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 transition">
            <Trash2 className="h-4 w-4" />
          </button>
          {task.status !== 'completed' && (
            <button onClick={handleComplete} className="flex-1 rounded-xl border border-blue-200 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Complete
            </button>
          )}
          {dirty && (
            <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
