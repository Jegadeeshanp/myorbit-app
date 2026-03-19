'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Plus, Sun, Inbox, CalendarDays, CheckCircle2, Trash2,
  Menu, ChevronRight,
} from 'lucide-react';
import TasksSidebar from '@/components/tasks/TasksSidebar';
import TaskItem from '@/components/tasks/TaskItem';
import TaskDetail from '@/components/tasks/TaskDetail';
import TaskCalendar from '@/components/tasks/TaskCalendar';
import CreateTaskFab from '@/components/tasks/CreateTaskFab';
import { toast } from '@/components/Toast';

type Subtask = { id: string; title: string; isDone: boolean };
type TaskList = { id: string; name: string; emoji?: string; color?: string };
type Task = {
  id: string;
  title: string;
  notes?: string;
  status: string;
  priority: string;
  dueDate?: string;
  dueTime?: string;
  tags: string;
  listId?: string;
  isActive?: boolean;
  subtasks: Subtask[];
  list?: { id: string; name: string; emoji?: string; color?: string } | null;
};

type TaskGroup = { label: string; tasks: Task[] };

const SMART_LABELS: Record<string, string> = {
  today: 'Today',
  inbox: 'Inbox',
  next7: 'Next 7 Days',
};

function todayString(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
}

function next7Label(date: string) {
  const today = todayString();
  const tomorrow = todayString(1);
  if (date === today) return 'Today';
  if (date === tomorrow) return 'Tomorrow';
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long' });
}

function belongsToCurrentSelection(task: Task, selected: string) {
  const today = todayString();
  const next7 = todayString(7);
  if (selected === 'today') return task.dueDate === today;
  if (selected === 'inbox') return !task.listId;
  if (selected === 'next7') return !!task.dueDate && task.dueDate >= today && task.dueDate <= next7;
  if (selected.startsWith('list:')) return task.listId === selected.replace('list:', '');
  return true;
}

export default function TasksPage() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<'tasks' | 'calendar'>('tasks');
  const [selected, setSelected] = useState('today');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<TaskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [completedOpen, setCompletedOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchTasks = useCallback(() => {
    setLoading(true);

    let activeUrl = '';
    if (view === 'calendar') {
      activeUrl = '/api/tasks?smartList=all';
    } else if (selected.startsWith('list:')) {
      activeUrl = `/api/tasks?listId=${selected.replace('list:', '')}`;
    } else {
      activeUrl = `/api/tasks?smartList=${selected}`;
    }

    Promise.all([
      fetch(activeUrl).then(r => r.json()).catch(() => []),
      fetch('/api/tasks?smartList=completed').then(r => r.json()).catch(() => []),
    ])
      .then(([activeData, completedData]) => {
        const activeList = Array.isArray(activeData) ? activeData : [];
        const completedList = Array.isArray(completedData) ? completedData.filter((task: Task) => belongsToCurrentSelection(task, selected)) : [];
        setTasks(activeList);
        setCompletedTasks(completedList);
      })
      .catch(() => toast('Failed to load tasks', 'error'))
      .finally(() => setLoading(false));
  }, [selected, view]);

  const fetchLists = useCallback(() => {
    fetch('/api/task-lists')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setLists(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchLists();
  }, [fetchTasks, fetchLists]);

  useEffect(() => {
    if (searchParams.get('create') !== '1') return;
    focusCreateTask();
  }, [searchParams]);

  const handleAddTask = async (forcedDate?: string | null) => {
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      const listId = selected.startsWith('list:') ? selected.replace('list:', '') : null;
      const dueDate = forcedDate !== undefined ? forcedDate : selected === 'today' ? todayString() : null;
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          listId: listId || null,
          dueDate,
        }),
      });
      if (!res.ok) throw new Error();
      const task = await res.json();
      setTasks(prev => [task, ...prev]);
      setNewTaskTitle('');
      setRefreshKey(key => key + 1);
      setActiveTask(task);
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
      const completedTask = tasks.find(task => task.id === id);
      setTasks(prev => prev.filter(task => task.id !== id));
      if (completedTask && belongsToCurrentSelection(completedTask, selected)) {
        setCompletedTasks(prev => [{ ...completedTask, status: 'completed' }, ...prev]);
      }
      setRefreshKey(key => key + 1);
      toast('Task completed!');
    } catch {
      toast('Failed to complete', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(task => task.id !== id));
      setCompletedTasks(prev => prev.filter(task => task.id !== id));
      setRefreshKey(key => key + 1);
      toast('Moved to deleted');
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  const handleTaskUpdated = (updated: Task) => {
    if (updated.status === 'completed') {
      setTasks(prev => prev.filter(task => task.id !== updated.id));
      if (belongsToCurrentSelection(updated, selected)) {
        setCompletedTasks(prev => [updated, ...prev.filter(task => task.id !== updated.id)]);
      }
    } else {
      setTasks(prev => prev.map(task => task.id === updated.id ? updated : task));
      setCompletedTasks(prev => prev.filter(task => task.id !== updated.id));
    }
    setActiveTask(updated);
    setRefreshKey(key => key + 1);
  };

  const handleTaskDeleted = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    setCompletedTasks(prev => prev.filter(task => task.id !== id));
    setActiveTask(null);
    setRefreshKey(key => key + 1);
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

  const todayStr = todayString();

  const groupedTasks = useMemo((): TaskGroup[] => {
    if (selected === 'inbox') return [{ label: 'Inbox', tasks }];

    if (selected === 'next7') {
      const order = [todayString(), todayString(1), todayString(2), todayString(3), todayString(4), todayString(5), todayString(6), todayString(7)];
      const grouped = new Map<string, Task[]>();
      for (const task of tasks) {
        const key = task.dueDate || todayStr;
        const bucket = grouped.get(key) ?? [];
        bucket.push(task);
        grouped.set(key, bucket);
      }

      return order
        .filter(date => grouped.has(date))
        .map(date => ({
          label: next7Label(date),
          tasks: grouped.get(date) ?? [],
        }));
    }

    const overdue: Task[] = [];
    const todayTasks: Task[] = [];
    const upcoming: Task[] = [];

    for (const task of tasks) {
      if (!task.dueDate || task.dueDate === todayStr) todayTasks.push(task);
      else if (task.dueDate < todayStr) overdue.push(task);
      else upcoming.push(task);
    }

    const groups: TaskGroup[] = [];
    if (overdue.length) groups.push({ label: 'Overdue', tasks: overdue });
    if (todayTasks.length) groups.push({ label: `Today ${todayTasks.length}`, tasks: todayTasks });
    if (upcoming.length) groups.push({ label: 'Upcoming', tasks: upcoming });
    if (groups.length === 0) groups.push({ label: 'Today', tasks: [] });
    return groups;
  }, [tasks, selected, todayStr]);

  const getListName = (value: string) => {
    if (value.startsWith('list:')) {
      const id = value.replace('list:', '');
      const list = lists.find(item => item.id === id);
      return list ? `${list.emoji || '📋'} ${list.name}` : 'List';
    }
    return SMART_LABELS[value] || value;
  };

  const listLabel = getListName(selected);
  const listSubtitle = selected === 'today'
    ? 'Only tasks due today are shown here.'
    : selected === 'next7'
    ? 'Tasks are grouped from today through the next seven days.'
    : selected === 'inbox'
    ? 'Tasks waiting to be scheduled.'
    : 'Tasks inside the selected list.';

  const focusCreateTask = () => {
    setView('tasks');
    setActiveTask(null);
    window.setTimeout(() => inputRef.current?.focus(), 80);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#12161D] text-white">
      <div className="hidden md:flex">
        <TasksSidebar
          selected={selected}
          onSelect={value => setSelected(value)}
          refreshKey={refreshKey}
          view={view}
          onViewChange={setView}
        />
      </div>

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative z-10 h-full overflow-y-auto">
            <TasksSidebar
              selected={selected}
              onSelect={value => { setSelected(value); setMobileSidebarOpen(false); }}
              refreshKey={refreshKey}
              view={view}
              onViewChange={value => { setView(value); setMobileSidebarOpen(false); }}
            />
          </div>
        </div>
      ) : null}

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#12161D] p-4 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold text-white">{view === 'calendar' ? 'Calendar' : listLabel}</h1>
              <p className="mt-0.5 hidden text-sm text-slate-400 sm:block">
                {view === 'calendar' ? 'Plan and review tasks across calendar views.' : listSubtitle}
              </p>
            </div>
          </div>
          <Link
            href="/orbit"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <div className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 text-sm font-bold leading-none text-white shadow-sm">
              ★
            </div>
            <span className="text-base font-semibold text-white">MyOrbit</span>
          </Link>
        </div>

        {view === 'calendar' ? (
          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#1A2029] shadow-sm">
            <TaskCalendar
              tasks={[...tasks, ...completedTasks]}
              onOpenSidebar={() => setMobileSidebarOpen(true)}
              onTaskClick={task => setActiveTask(task)}
            />
          </div>
        ) : (
          <div className="min-h-0 flex flex-1 gap-3">
            <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1A2029] shadow-sm xl:basis-[60%] xl:flex-none">
              <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
                <div
                  className="group mb-5 flex cursor-text items-center gap-3 rounded-xl border border-white/10 bg-[#12161D] px-4 py-3 transition hover:border-white/20 hover:bg-[#161B23]"
                  onClick={() => inputRef.current?.focus()}
                >
                  <Plus className="h-5 w-5 flex-none text-slate-500 transition group-hover:text-emerald-400" />
                  <input
                    ref={inputRef}
                    className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
                    placeholder="Add task"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                    disabled={addingTask}
                  />
                </div>

                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(index => (
                      <div key={index} className="flex animate-pulse items-center gap-3 rounded-2xl border border-white/10 px-4 py-3">
                        <div className="h-5 w-5 flex-none rounded-full bg-white/10" />
                        <div className="h-4 flex-1 rounded bg-white/10" />
                      </div>
                    ))}
                  </div>
                ) : tasks.length === 0 && completedTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#12161D] py-20 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 shadow-sm">
                      {selected === 'today' ? <Sun className="h-8 w-8 text-amber-500" /> : null}
                      {selected === 'inbox' ? <Inbox className="h-8 w-8 text-sky-500" /> : null}
                      {!['today', 'inbox'].includes(selected) ? <CalendarDays className="h-8 w-8 text-indigo-500" /> : null}
                    </div>
                    <p className="font-semibold text-white">No tasks here</p>
                    <p className="mt-1 text-sm text-slate-400">Add your first task above</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-[#12161D]">
                    {groupedTasks.map((group, index) => (
                      <div key={group.label} className={index > 0 ? 'border-t border-white/10' : ''}>
                        <button
                          onClick={() => toggleGroup(group.label)}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left"
                        >
                          <ChevronRight
                            className={`h-4 w-4 text-slate-500 transition-transform ${!collapsedGroups.has(group.label) ? 'rotate-90' : ''}`}
                          />
                          <span className="text-sm font-semibold text-white">{group.label}</span>
                          <span className="ml-1 text-sm text-slate-500">{group.tasks.length}</span>
                        </button>

                        {!collapsedGroups.has(group.label) ? (
                          <div className="space-y-0.5 px-2 pb-2">
                            {group.tasks.map(task => (
                              <TaskItem
                                key={task.id}
                                task={task}
                                onComplete={handleComplete}
                                onDelete={handleDelete}
                                onClick={() => setActiveTask(task)}
                                isActive={activeTask?.id === task.id}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}

                    {completedTasks.length > 0 ? (
                      <div className="border-t border-white/10">
                        <button
                          onClick={() => setCompletedOpen(open => !open)}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left"
                        >
                          <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform ${completedOpen ? 'rotate-90' : ''}`} />
                          <span className="text-sm font-semibold text-white">Completed</span>
                          <span className="ml-1 text-sm text-slate-500">{completedTasks.length}</span>
                        </button>

                        {completedOpen ? (
                          <div className="space-y-0.5 px-2 pb-2">
                            {completedTasks.map(task => (
                              <TaskItem
                                key={task.id}
                                task={task}
                                onDelete={handleDelete}
                                onClick={() => setActiveTask(task)}
                                isActive={activeTask?.id === task.id}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </section>

            <section className="hidden min-w-0 xl:flex xl:basis-[40%]">
              {activeTask ? (
                <TaskDetail
                  task={activeTask}
                  lists={lists}
                  onClose={() => setActiveTask(null)}
                  onUpdated={handleTaskUpdated}
                  onDeleted={handleTaskDeleted}
                  onCompleted={handleTaskCompleted}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#1A2029] px-8 text-center text-sm text-slate-400 shadow-sm">
                  Select a task from the list to edit its details here.
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {activeTask ? (
        <div className="fixed inset-0 z-40 bg-black/40 xl:hidden">
          <div className="ml-auto h-full w-full max-w-[420px]">
            <TaskDetail
              task={activeTask}
              lists={lists}
              onClose={() => setActiveTask(null)}
              onUpdated={handleTaskUpdated}
              onDeleted={handleTaskDeleted}
              onCompleted={handleTaskCompleted}
            />
          </div>
        </div>
      ) : null}

      <CreateTaskFab
        onClick={focusCreateTask}
        className={activeTask ? 'xl:right-[calc(40%+2rem)]' : ''}
      />
    </div>
  );
}
