'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Plus, Sun, Inbox, CalendarDays, CheckCircle2, Trash2,
  Menu, SortAsc, MoreHorizontal, ChevronRight,
} from 'lucide-react';
import TasksSidebar from '@/components/tasks/TasksSidebar';
import TaskItem from '@/components/tasks/TaskItem';
import TaskDetail from '@/components/tasks/TaskDetail';
import TaskCalendar from '@/components/tasks/TaskCalendar';
import { toast } from '@/components/Toast';

type Subtask  = { id: string; title: string; isDone: boolean };
type TaskList = { id: string; name: string; emoji?: string; color?: string };
type Task = {
  id: string; title: string; notes?: string; status: string; priority: string;
  dueDate?: string; dueTime?: string; tags: string; listId?: string; isActive?: boolean;
  subtasks: Subtask[];
  list?: { id: string; name: string; emoji?: string } | null;
};

type TaskGroup = { label: string; tasks: Task[] };

const SMART_LABELS: Record<string, string> = {
  today: 'Today',
  inbox: 'Inbox',
  next7: 'Next 7 Days',
  completed: 'Completed',
  trash: 'Trash',
};

export default function TasksPage() {
  const [view, setView]             = useState<'tasks' | 'calendar'>('tasks');
  const [selected, setSelected]     = useState('today');
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [lists, setLists]           = useState<TaskList[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    let url = '';
    if (selected.startsWith('list:')) {
      const listId = selected.replace('list:', '');
      url = `/api/tasks?listId=${listId}`;
    } else {
      url = `/api/tasks?smartList=${selected}`;
    }
    fetch(url)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setTasks(d); })
      .catch(() => toast('Failed to load tasks', 'error'))
      .finally(() => setLoading(false));
  }, [selected]);

  const fetchLists = useCallback(() => {
    fetch('/api/task-lists')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setLists(d); })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchTasks(); fetchLists(); }, [fetchTasks, fetchLists]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      const listId = selected.startsWith('list:') ? selected.replace('list:', '') : null;
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          listId: listId || null,
          dueDate: selected === 'today' ? todayStr : null,
        }),
      });
      if (!res.ok) throw new Error();
      const task = await res.json();
      setTasks(prev => [task, ...prev]);
      setNewTaskTitle('');
      setRefreshKey(k => k + 1);
    } catch {
      toast('Failed to add task', 'error');
    } finally {
      setAddingTask(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}/complete`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      setTasks(prev => prev.filter(t => t.id !== id));
      setRefreshKey(k => k + 1);
      toast('Task completed!');
    } catch {
      toast('Failed to complete', 'error');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}/restore`, { method: 'PATCH' });
      setTasks(prev => prev.filter(t => t.id !== id));
      setRefreshKey(k => k + 1);
      toast('Task restored');
    } catch {
      toast('Failed to restore', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== id));
      setRefreshKey(k => k + 1);
      toast('Moved to trash');
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  const handleTaskUpdated = (updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setActiveTask(updated);
    setRefreshKey(k => k + 1);
  };

  const handleTaskDeleted = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setActiveTask(null);
    setRefreshKey(k => k + 1);
  };

  const handleTaskCompleted = (id: string) => {
    handleComplete(id);
    setActiveTask(null);
  };

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const isTrash     = selected === 'trash';
  const isCompleted = selected === 'completed';
  const todayStr    = new Date().toISOString().split('T')[0];

  const groupedTasks = useMemo((): TaskGroup[] => {
    if (isTrash || isCompleted || selected === 'inbox') {
      const label = isTrash ? 'Trash' : isCompleted ? 'Completed' : 'Inbox';
      return [{ label, tasks }];
    }
    const overdue: Task[]   = [];
    const todayTasks: Task[] = [];
    const upcoming: Task[]  = [];
    const noDate: Task[]    = [];
    for (const t of tasks) {
      if (!t.dueDate) { noDate.push(t); }
      else if (t.dueDate < todayStr) { overdue.push(t); }
      else if (t.dueDate === todayStr) { todayTasks.push(t); }
      else { upcoming.push(t); }
    }
    const groups: TaskGroup[] = [];
    if (overdue.length)    groups.push({ label: 'Overdue', tasks: overdue });
    if (todayTasks.length) groups.push({ label: `Today ${todayTasks.length}`, tasks: todayTasks });
    if (upcoming.length)   groups.push({ label: 'Upcoming', tasks: upcoming });
    if (noDate.length)     groups.push({ label: 'No Date', tasks: noDate });
    if (groups.length === 0) groups.push({ label: 'Tasks', tasks: [] });
    return groups;
  }, [tasks, isTrash, isCompleted, selected, todayStr]);

  const getListName = (s: string) => {
    if (s.startsWith('list:')) {
      const lid  = s.replace('list:', '');
      const list = lists.find(l => l.id === lid);
      return list ? `${list.emoji || '📋'} ${list.name}` : 'List';
    }
    return SMART_LABELS[s] || s;
  };

  const listLabel = getListName(selected);

  return (
    <div className="flex h-screen overflow-hidden bg-[#1f1f1f]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <TasksSidebar
          selected={selected}
          onSelect={s => setSelected(s)}
          refreshKey={refreshKey}
          view={view}
          onViewChange={setView}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative z-10 h-full overflow-y-auto">
            <TasksSidebar
              selected={selected}
              onSelect={s => { setSelected(s); setMobileSidebarOpen(false); }}
              refreshKey={refreshKey}
              view={view}
              onViewChange={v => { setView(v); setMobileSidebarOpen(false); }}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden border-l border-white/5 bg-[#252525]">
        {view === 'calendar' ? (
          <TaskCalendar tasks={tasks} />
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 flex-none">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold text-white flex-1">{listLabel}</h1>
              <button className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
                <SortAsc className="h-4 w-4" />
              </button>
              <button className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {/* Quick add task */}
              {!isTrash && !isCompleted && (
                <div
                  className="flex items-center gap-3 mb-4 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-text group"
                  onClick={() => inputRef.current?.focus()}
                >
                  <Plus className="h-5 w-5 text-gray-600 group-hover:text-sky-400 transition flex-none" />
                  <input
                    ref={inputRef}
                    className="flex-1 bg-transparent text-sm text-gray-400 placeholder-gray-600 focus:outline-none focus:placeholder-gray-400"
                    placeholder="Add task"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                    disabled={addingTask}
                  />
                </div>
              )}

              {/* Loading */}
              {loading ? (
                <div className="space-y-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
                      <div className="h-5 w-5 rounded-full bg-white/10 flex-none" />
                      <div className="h-4 flex-1 rounded bg-white/10" />
                    </div>
                  ))}
                </div>
              ) : tasks.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                    {selected === 'today' ? (
                      <Sun className="h-8 w-8 text-amber-400" />
                    ) : selected === 'inbox' ? (
                      <Inbox className="h-8 w-8 text-blue-400" />
                    ) : selected === 'trash' ? (
                      <Trash2 className="h-8 w-8 text-gray-500" />
                    ) : selected === 'completed' ? (
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                    ) : (
                      <CalendarDays className="h-8 w-8 text-indigo-400" />
                    )}
                  </div>
                  <p className="font-semibold text-gray-300">No tasks here</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isTrash ? 'Trash is empty' : isCompleted ? 'No completed tasks yet' : 'Add your first task above'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedTasks.map(group => (
                    <div key={group.label}>
                      <button
                        onClick={() => toggleGroup(group.label)}
                        className="flex items-center gap-2 mb-1.5 w-full text-left"
                      >
                        <ChevronRight
                          className={`h-4 w-4 text-gray-500 transition-transform ${
                            !collapsedGroups.has(group.label) ? 'rotate-90' : ''
                          }`}
                        />
                        <span className="text-sm font-semibold text-gray-300">{group.label}</span>
                        <span className="text-sm text-gray-500 ml-1">{group.tasks.length}</span>
                      </button>
                      {!collapsedGroups.has(group.label) && (
                        <div className="space-y-0.5">
                          {group.tasks.map(task => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              onComplete={!isTrash && !isCompleted ? handleComplete : undefined}
                              onRestore={isTrash ? handleRestore : undefined}
                              onDelete={isTrash ? handleDelete : !isCompleted ? handleDelete : undefined}
                              onClick={() => setActiveTask(task)}
                              showTrashActions={isTrash}
                              isActive={activeTask?.id === task.id}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Right panel — task detail */}
      {activeTask && (
        <TaskDetail
          task={activeTask}
          lists={lists}
          onClose={() => setActiveTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
          onCompleted={handleTaskCompleted}
        />
      )}
    </div>
  );
}
