'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Sun, Inbox, CalendarDays, CheckCircle2, Trash2, Timer, Activity, List, Menu, X } from 'lucide-react';
import TasksSidebar from '@/components/tasks/TasksSidebar';
import TaskItem from '@/components/tasks/TaskItem';
import TaskDetail from '@/components/tasks/TaskDetail';
import PomodoroTimer from '@/components/tasks/PomodoroTimer';
import HabitGrid from '@/components/tasks/HabitGrid';
import CountdownCards from '@/components/tasks/CountdownCard';
import { toast } from '@/components/Toast';

type Subtask  = { id: string; title: string; isDone: boolean };
type TaskList = { id: string; name: string; emoji?: string; color?: string };
type Task = {
  id: string; title: string; notes?: string; status: string; priority: string;
  dueDate?: string; dueTime?: string; tags: string; listId?: string; isActive?: boolean;
  subtasks: Subtask[];
  list?: { id: string; name: string; emoji?: string } | null;
};

const SMART_LABELS: Record<string, string> = {
  today: 'Today',
  inbox: 'Inbox',
  next7: 'Next 7 Days',
  completed: 'Completed',
  trash: 'Trash',
};

const SMART_ICONS: Record<string, React.ReactNode> = {
  today:     <Sun className="h-5 w-5 text-amber-500" />,
  inbox:     <Inbox className="h-5 w-5 text-blue-500" />,
  next7:     <CalendarDays className="h-5 w-5 text-indigo-500" />,
  completed: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  trash:     <Trash2 className="h-5 w-5 text-rose-400" />,
};

const TOOL_TABS = [
  { key: 'pomodoro',   label: 'Pomodoro', Icon: Timer },
  { key: 'habits',     label: 'Habits',   Icon: Activity },
  { key: 'countdowns', label: 'Countdowns', Icon: CalendarDays },
];

export default function TasksPage() {
  const [selected, setSelected]     = useState('today');
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [lists, setLists]           = useState<TaskList[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toolTab, setToolTab]       = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
      const today  = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          listId: listId || null,
          dueDate: selected === 'today' ? today : null,
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

  const isTrash     = selected === 'trash';
  const isCompleted = selected === 'completed';
  const today       = new Date().toISOString().split('T')[0];

  const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < today && t.status === 'active' && t.isActive);
  const normalTasks  = tasks.filter(t => !overdueTasks.includes(t));

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
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <TasksSidebar selected={selected} onSelect={s => { setSelected(s); setToolTab(null); }} refreshKey={refreshKey} />

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative z-10 w-72 h-full bg-white shadow-2xl overflow-y-auto">
            <TasksSidebar selected={selected} onSelect={s => { setSelected(s); setToolTab(null); setMobileSidebarOpen(false); }} refreshKey={refreshKey} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 flex-none">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 md:hidden"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {SMART_ICONS[selected]}
              <h1 className="text-lg font-semibold text-gray-900">{listLabel}</h1>
            </div>
            <p className="text-xs text-gray-400">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Tool tabs */}
          <div className="flex gap-1">
            {TOOL_TABS.map(({ key, label, Icon }) => (
              <button key={key}
                onClick={() => setToolTab(toolTab === key ? null : key)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${toolTab === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {toolTab ? (
            <div className="max-w-2xl mx-auto px-4 py-6">
              {toolTab === 'pomodoro'   && <PomodoroTimer />}
              {toolTab === 'habits'     && <HabitGrid />}
              {toolTab === 'countdowns' && <CountdownCards />}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
              {/* Inline add task */}
              {!isTrash && !isCompleted && (
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <div className="h-5 w-5 rounded-full border-2 border-dashed border-blue-300 flex-none" />
                  <input
                    ref={inputRef}
                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                    placeholder="Add a task... (press Enter)"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                    disabled={addingTask}
                  />
                  {newTaskTitle.trim() && (
                    <button
                      onClick={handleAddTask}
                      disabled={addingTask}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Loading */}
              {loading ? (
                <div className="space-y-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-3 animate-pulse">
                      <div className="h-5 w-5 rounded-full bg-gray-200 flex-none" />
                      <div className="h-4 flex-1 rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                    {SMART_ICONS[selected] || <List className="h-8 w-8 text-blue-300" />}
                  </div>
                  <p className="font-semibold text-gray-900">No tasks here</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isTrash ? 'Trash is empty' : isCompleted ? 'No completed tasks yet' : 'Add your first task above'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Overdue section */}
                  {overdueTasks.length > 0 && !isTrash && !isCompleted && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-rose-500 uppercase tracking-wide px-3 mb-1">
                        Overdue ({overdueTasks.length})
                      </p>
                      <div className="rounded-2xl border border-rose-100 bg-rose-50/50 overflow-hidden">
                        {overdueTasks.map(task => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            onComplete={handleComplete}
                            onDelete={handleDelete}
                            onClick={() => setActiveTask(task)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Main task list */}
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    {normalTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onComplete={!isTrash && !isCompleted ? handleComplete : undefined}
                        onRestore={isTrash ? handleRestore : undefined}
                        onDelete={isTrash ? handleDelete : !isCompleted ? handleDelete : undefined}
                        onClick={() => setActiveTask(task)}
                        showTrashActions={isTrash}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task detail panel */}
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
