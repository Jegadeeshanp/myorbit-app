'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Plus, Sun, Inbox, CalendarDays,
  Menu, ChevronRight,
} from 'lucide-react';
import TasksSidebar from '@/components/tasks/TasksSidebar';
import TaskItem from '@/components/tasks/TaskItem';
import TaskDetail from '@/components/tasks/TaskDetail';
import TaskCalendar from '@/components/tasks/TaskCalendar';
import { toast } from '@/components/Toast';
import TasksMobileNav from '@/components/tasks/TasksMobileNav';

type Subtask = { id: string; title: string; isDone: boolean };
type TaskList = { id: string; name: string; emoji?: string; color?: string };
type Task = {
  id: string; title: string; notes?: string; status: string; priority: string;
  dueDate?: string; dueTime?: string; tags: string; listId?: string; isActive?: boolean;
  subtasks: Subtask[];
  list?: { id: string; name: string; emoji?: string; color?: string } | null;
};
type TaskGroup = { label: string; tasks: Task[] };

const SMART_LABELS: Record<string, string> = { today: 'Today', inbox: 'Inbox', next7: 'Next 7 Days' };

function todayString(offset = 0) {
  const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().split('T')[0];
}
function next7Label(date: string) {
  const today = todayString(); const tomorrow = todayString(1);
  if (date === today) return 'Today'; if (date === tomorrow) return 'Tomorrow';
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long' });
}
function belongsToCurrentSelection(task: Task, selected: string) {
  const today = todayString(); const next7 = todayString(7);
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
    let activeUrl = view === 'calendar' ? '/api/tasks?smartList=all' : selected.startsWith('list:') ? `/api/tasks?listId=${selected.replace('list:', '')}` : `/api/tasks?smartList=${selected}`;
    Promise.all([fetch(activeUrl).then(r => r.json()).catch(() => []), fetch('/api/tasks?smartList=completed').then(r => r.json()).catch(() => [])])
      .then(([active, completed]) => {
        setTasks(Array.isArray(active) ? active : []);
        setCompletedTasks(Array.isArray(completed) ? completed.filter((t: Task) => belongsToCurrentSelection(t, selected)) : []);
      }).catch(() => toast('Failed to load tasks', 'error')).finally(() => setLoading(false));
  }, [selected, view]);

  const fetchLists = useCallback(() => {
    fetch('/api/task-lists').then(r => r.json()).then(d => { if (Array.isArray(d)) setLists(d); }).catch(() => {});
  }, []);

  useEffect(() => { fetchTasks(); fetchLists(); }, [fetchTasks, fetchLists]);
  useEffect(() => { if (searchParams.get('create') === '1') focusCreateTask(); }, [searchParams]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      const listId = selected.startsWith('list:') ? selected.replace('list:', '') : null;
      const dueDate = selected === 'today' ? todayString() : null;
      const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTaskTitle.trim(), listId: listId || null, dueDate }) });
      if (!res.ok) throw new Error();
      const task = await res.json();
      setTasks(prev => [task, ...prev]); setNewTaskTitle(''); setRefreshKey(k => k + 1); setActiveTask(task);
    } catch { toast('Failed to add task', 'error'); } finally { setAddingTask(false); }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}/complete`, { method: 'PATCH' }); if (!res.ok) throw new Error();
      const ct = tasks.find(t => t.id === id);
      setTasks(prev => prev.filter(t => t.id !== id));
      if (ct && belongsToCurrentSelection(ct, selected)) setCompletedTasks(prev => [{ ...ct, status: 'completed' }, ...prev]);
      setRefreshKey(k => k + 1); toast('Task completed!');
    } catch { toast('Failed to complete', 'error'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== id)); setCompletedTasks(prev => prev.filter(t => t.id !== id));
      setRefreshKey(k => k + 1); toast('Moved to deleted');
    } catch { toast('Failed to delete', 'error'); }
  };

  const handleTaskUpdated = (updated: Task) => {
    if (updated.status === 'completed') {
      setTasks(prev => prev.filter(t => t.id !== updated.id));
      if (belongsToCurrentSelection(updated, selected)) setCompletedTasks(prev => [updated, ...prev.filter(t => t.id !== updated.id)]);
    } else {
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      setCompletedTasks(prev => prev.filter(t => t.id !== updated.id));
    }
    setActiveTask(updated); setRefreshKey(k => k + 1);
  };
  const handleTaskDeleted = (id: string) => { setTasks(prev => prev.filter(t => t.id !== id)); setCompletedTasks(prev => prev.filter(t => t.id !== id)); setActiveTask(null); setRefreshKey(k => k + 1); };
  const handleTaskCompleted = (id: string) => { handleComplete(id); setActiveTask(null); };
  const toggleGroup = (label: string) => { setCollapsedGroups(prev => { const next = new Set(prev); if (next.has(label)) next.delete(label); else next.add(label); return next; }); };

  const todayStr = todayString();
  const groupedTasks = useMemo((): TaskGroup[] => {
    if (selected === 'inbox') return [{ label: 'Inbox', tasks }];
    if (selected === 'next7') {
      const order = [0, 1, 2, 3, 4, 5, 6, 7].map(i => todayString(i));
      const grouped = new Map<string, Task[]>();
      for (const t of tasks) { const key = t.dueDate || todayStr; grouped.set(key, [...(grouped.get(key) ?? []), t]); }
      return order.filter(d => grouped.has(d)).map(d => ({ label: next7Label(d), tasks: grouped.get(d) ?? [] }));
    }
    const overdue: Task[] = [], todayTasks: Task[] = [], upcoming: Task[] = [];
    for (const t of tasks) {
      if (!t.dueDate || t.dueDate === todayStr) todayTasks.push(t);
      else if (t.dueDate < todayStr) overdue.push(t);
      else upcoming.push(t);
    }
    const groups: TaskGroup[] = [];
    if (overdue.length) groups.push({ label: 'Overdue', tasks: overdue });
    if (todayTasks.length) groups.push({ label: `Today ${todayTasks.length}`, tasks: todayTasks });
    if (upcoming.length) groups.push({ label: 'Upcoming', tasks: upcoming });
    if (groups.length === 0) groups.push({ label: 'Today', tasks: [] });
    return groups;
  }, [tasks, selected, todayStr]);

  const getListName = (value: string) => {
    if (value.startsWith('list:')) { const l = lists.find(i => i.id === value.replace('list:', '')); return l ? `${l.emoji || '📋'} ${l.name}` : 'List'; }
    return SMART_LABELS[value] || value;
  };
  const listLabel = getListName(selected);
  const listSubtitle = selected === 'today' ? 'Only tasks due today are shown here.' : selected === 'next7' ? 'Tasks are grouped from today through the next seven days.' : selected === 'inbox' ? 'Tasks waiting to be scheduled.' : 'Tasks inside the selected list.';
  const focusCreateTask = () => { setView('tasks'); setActiveTask(null); window.setTimeout(() => inputRef.current?.focus(), 80); };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F8FB] text-gray-900 dark:bg-[#12161D] dark:text-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex">
        <TasksSidebar selected={selected} onSelect={v => setSelected(v)} refreshKey={refreshKey} view={view} onViewChange={setView} />
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative z-10 h-full overflow-y-auto">
            <TasksSidebar selected={selected} onSelect={v => { setSelected(v); setMobileSidebarOpen(false); }} refreshKey={refreshKey} view={view} onViewChange={v => { setView(v); setMobileSidebarOpen(false); }} />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-4 pb-20 md:p-5 md:pb-5">
        {/* Page header */}
        <div className="mb-4 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700/60">
          {/* Mobile: MyOrbit back link */}
          <Link href="/orbit" className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 text-sm font-bold text-white shadow-sm md:hidden">★</Link>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-white">{view === 'calendar' ? 'Calendar' : listLabel}</h1>
            <p className="mt-0.5 hidden text-sm text-gray-500 dark:text-gray-400 sm:block">{view === 'calendar' ? 'Plan and review tasks across calendar views.' : listSubtitle}</p>
          </div>

          {/* Desktop sidebar toggle */}
          <button onClick={() => setMobileSidebarOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-white hover:text-gray-900 dark:hover:bg-gray-800 md:hidden">
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop MyOrbit link */}
          <Link href="/orbit" className="hidden md:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800">
            <div className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 text-sm font-bold leading-none text-white shadow-sm">★</div>
            <span className="text-base font-semibold text-gray-900 dark:text-white">MyOrbit</span>
          </Link>
        </div>

        {view === 'calendar' ? (
          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#1A2029] shadow-sm">
            <TaskCalendar tasks={[...tasks, ...completedTasks]} onOpenSidebar={() => setMobileSidebarOpen(true)} onTaskClick={t => setActiveTask(t)} />
          </div>
        ) : (
          // Main content row — left list + right detail panel, both as peer cards with same gap
          <div className="min-h-0 flex flex-1 gap-2 overflow-hidden">

            {/* Left — task list */}
            <section className="flex min-w-0 flex-1 flex-col overflow-hidden xl:basis-[58%] xl:flex-none">
              <div className="flex-1 space-y-2 overflow-y-auto">

                {/* Add task card */}
                <div
                  className="group flex cursor-text items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:border-gray-300 dark:border-gray-700/60 dark:bg-[#1C1F26] dark:hover:border-gray-600"
                  onClick={() => inputRef.current?.focus()}
                >
                  <Plus className="h-5 w-5 flex-none text-gray-400 transition group-hover:text-emerald-500" />
                  <input
                    ref={inputRef}
                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white dark:placeholder-gray-600"
                    placeholder="Add task" value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                    disabled={addingTask}
                  />
                </div>

                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700/60 dark:bg-[#1C1F26]">
                        <div className="h-5 w-5 flex-none rounded-md bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 flex-1 rounded bg-gray-200 dark:bg-gray-700" />
                      </div>
                    ))}
                  </div>
                ) : tasks.length === 0 && completedTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center dark:border-gray-700/60 dark:bg-[#1C1F26]">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800">
                      {selected === 'today' ? <Sun className="h-8 w-8 text-amber-500" /> : selected === 'inbox' ? <Inbox className="h-8 w-8 text-sky-500" /> : <CalendarDays className="h-8 w-8 text-indigo-500" />}
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">No tasks here</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add your first task above</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groupedTasks.map(group => (
                      <div key={group.label} className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700/60 dark:bg-[#1C1F26]">
                        <button onClick={() => toggleGroup(group.label)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
                          <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${!collapsedGroups.has(group.label) ? 'rotate-90' : ''}`} />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{group.label}</span>
                          <span className="ml-1 text-sm text-gray-400">{group.tasks.length}</span>
                        </button>
                        {!collapsedGroups.has(group.label) && (
                          <div className="space-y-0.5 px-2 pb-2">
                            {group.tasks.map(task => (
                              <TaskItem key={task.id} task={task} onComplete={handleComplete} onDelete={handleDelete} onClick={() => setActiveTask(task)} isActive={activeTask?.id === task.id} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {completedTasks.length > 0 && (
                      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700/60 dark:bg-[#1C1F26]">
                        <button onClick={() => setCompletedOpen(v => !v)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
                          <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${completedOpen ? 'rotate-90' : ''}`} />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">Completed</span>
                          <span className="ml-1 text-sm text-gray-400">{completedTasks.length}</span>
                        </button>
                        {completedOpen && (
                          <div className="space-y-0.5 px-2 pb-2">
                            {completedTasks.map(task => (
                              <TaskItem key={task.id} task={task} onDelete={handleDelete} onClick={() => setActiveTask(task)} isActive={activeTask?.id === task.id} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Right — detail panel, rounded-2xl matching left cards, with gap not border */}
            <section className="hidden min-w-0 xl:flex xl:basis-[42%]">
              {activeTask ? (
                <TaskDetail
                  task={activeTask} lists={lists}
                  onClose={() => setActiveTask(null)}
                  onUpdated={handleTaskUpdated}
                  onDeleted={handleTaskDeleted}
                  onCompleted={handleTaskCompleted}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-8 text-center text-sm text-gray-400 dark:border-gray-700/60 dark:bg-[#1C1F26] dark:text-gray-500">
                  Select a task to edit its details
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Mobile detail overlay */}
      {activeTask && (
        <div className="fixed inset-0 z-40 bg-black/40 xl:hidden">
          <div className="ml-auto h-full w-full max-w-[420px] p-3">
            <TaskDetail task={activeTask} lists={lists} onClose={() => setActiveTask(null)} onUpdated={handleTaskUpdated} onDeleted={handleTaskDeleted} onCompleted={handleTaskCompleted} />
          </div>
        </div>
      )}


      {/* Mobile bottom nav with More sheet */}
      <TasksMobileNav
        selected={selected}
        view={view}
        onSelect={v => setSelected(v)}
        onViewChange={setView}
        focusAdd={focusCreateTask}
      />
    </div>
  );
}