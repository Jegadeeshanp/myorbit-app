'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Plus, Sun, Inbox, CalendarDays,
  ChevronRight, Search, X, Flag, Tag, Menu,
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

function AddTaskOverlay({ onClose, onAdd, lists }: {
  onClose: () => void;
  onAdd: (title: string, opts: { dueDate?: string; priority?: string; tags?: string[]; listId?: string }) => Promise<void>;
  lists: TaskList[];
}) {
  const [title, setTitle]       = useState('');
  const [dueDate, setDueDate]   = useState('');
  const [priority, setPriority] = useState('none');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags]         = useState<string[]>([]);
  const [listId, setListId]     = useState('');
  const [adding, setAdding]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);
  const addTag = () => { const t = tagInput.trim().toLowerCase(); if (t && !tags.includes(t)) setTags(p => [...p, t]); setTagInput(''); };
  const submit = async () => {
    if (!title.trim() || adding) return; setAdding(true);
    try { await onAdd(title.trim(), { dueDate: dueDate || undefined, priority, tags, listId: listId || undefined }); onClose(); }
    finally { setAdding(false); }
  };
  const QUICK = [{ label: 'Today', v: todayString() }, { label: 'Tomorrow', v: todayString(1) }, { label: 'Next week', v: todayString(7) }];
  const PRI = [{ v: 'none', label: 'None', cls: 'text-gray-400' }, { v: 'low', label: 'Low', cls: 'text-blue-500' }, { v: 'medium', label: 'Med', cls: 'text-amber-500' }, { v: 'high', label: 'High', cls: 'text-rose-500' }];
  return (
    <>
      <div className="fixed inset-0 z-[75] bg-black/40 md:hidden" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 z-[80] rounded-t-2xl bg-white dark:bg-[#1C1F26] border-t border-gray-200 dark:border-gray-700 shadow-2xl md:hidden" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <div className="flex justify-center pt-3 pb-1"><div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" /></div>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="mt-0.5 h-5 w-5 flex-none rounded border-2 border-gray-300 dark:border-gray-600" />
          <input ref={inputRef} className="flex-1 bg-transparent text-base font-medium text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white dark:placeholder-gray-500" placeholder="New task..." value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void submit(); if (e.key === 'Escape') onClose(); }} />
          <button onClick={() => void submit()} disabled={!title.trim() || adding} className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-emerald-600 text-white disabled:opacity-40 active:scale-95 transition"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto">
          {QUICK.map(d => (<button key={d.v} onClick={() => setDueDate(p => p === d.v ? '' : d.v)} className={`flex-none rounded-full border px-3 py-1 text-xs font-medium transition ${dueDate === d.v ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'}`}>{d.label}</button>))}
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="flex-none rounded-full border border-gray-200 bg-transparent px-2 py-1 text-xs text-gray-500 focus:outline-none dark:border-gray-700 dark:text-gray-400 [color-scheme:light] dark:[color-scheme:dark]" />
        </div>
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto border-t border-gray-100 dark:border-gray-700/60 pt-3">
          {PRI.map(p => (<button key={p.v} onClick={() => setPriority(p.v)} className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${priority === p.v ? `border-current ${p.cls} bg-gray-50 dark:bg-gray-800` : 'border-gray-200 text-gray-400 dark:border-gray-700'}`}><Flag className="h-3 w-3" />{p.label}</button>))}
          <select value={listId} onChange={e => setListId(e.target.value)} className="ml-auto rounded-full border border-gray-200 bg-transparent px-2 py-1 text-xs text-gray-500 focus:outline-none dark:border-gray-700 dark:text-gray-400">
            <option value="">Inbox</option>
            {lists.map(l => <option key={l.id} value={l.id}>{l.emoji} {l.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 px-4 pb-3">
          <Tag className="h-3.5 w-3.5 flex-none text-gray-400" />
          <input className="flex-1 bg-transparent text-xs text-gray-600 placeholder-gray-400 focus:outline-none dark:text-gray-400" placeholder="Add tag and press Enter..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addTag(); }} />
          {tags.map(t => (<span key={t} className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{t}<button onClick={() => setTags(p => p.filter(i => i !== t))}><X className="h-2.5 w-2.5" /></button></span>))}
        </div>
        <div className="h-2" />
      </div>
    </>
  );
}

export default function TasksPage() {
  const searchParams = useSearchParams();
  const [view, setView]               = useState<'tasks' | 'calendar'>('tasks');
  const [selected, setSelected]       = useState('today');
  const [tasks, setTasks]             = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [lists, setLists]             = useState<TaskList[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTask, setActiveTask]   = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask]   = useState(false);
  const [refreshKey, setRefreshKey]   = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [completedOpen, setCompletedOpen] = useState(false);
  const [showFab, setShowFab]         = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    const url = view === 'calendar' ? '/api/tasks?smartList=all' : selected.startsWith('list:') ? `/api/tasks?listId=${selected.replace('list:', '')}` : `/api/tasks?smartList=${selected}`;
    Promise.all([fetch(url).then(r => r.json()).catch(() => []), fetch('/api/tasks?smartList=completed').then(r => r.json()).catch(() => [])])
      .then(([active, completed]) => { setTasks(Array.isArray(active) ? active : []); setCompletedTasks(Array.isArray(completed) ? completed.filter((t: Task) => belongsToCurrentSelection(t, selected)) : []); })
      .catch(() => toast('Failed to load tasks', 'error')).finally(() => setLoading(false));
  }, [selected, view]);

  const fetchLists = useCallback(() => { fetch('/api/task-lists').then(r => r.json()).then(d => { if (Array.isArray(d)) setLists(d); }).catch(() => {}); }, []);
  useEffect(() => { fetchTasks(); fetchLists(); }, [fetchTasks, fetchLists]);
  useEffect(() => { if (searchParams.get('create') === '1') setShowFab(true); }, [searchParams]);

  const handleAddTask = async (titleArg?: string, opts?: { dueDate?: string; priority?: string; tags?: string[]; listId?: string }) => {
    const t = (titleArg ?? newTaskTitle).trim(); if (!t) return;
    setAddingTask(true);
    try {
      const listId = opts?.listId ?? (selected.startsWith('list:') ? selected.replace('list:', '') : null);
      const dueDate = opts?.dueDate ?? (selected === 'today' ? todayString() : null);
      const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t, listId: listId || null, dueDate, priority: opts?.priority ?? 'none', tags: JSON.stringify(opts?.tags ?? []) }) });
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
    try { await fetch(`/api/tasks/${id}`, { method: 'DELETE' }); setTasks(p => p.filter(t => t.id !== id)); setCompletedTasks(p => p.filter(t => t.id !== id)); setRefreshKey(k => k + 1); toast('Moved to deleted'); }
    catch { toast('Failed to delete', 'error'); }
  };
  const handleTaskUpdated = (updated: Task) => {
    if (updated.status === 'completed') { setTasks(p => p.filter(t => t.id !== updated.id)); if (belongsToCurrentSelection(updated, selected)) setCompletedTasks(p => [updated, ...p.filter(t => t.id !== updated.id)]); }
    else { setTasks(p => p.map(t => t.id === updated.id ? updated : t)); setCompletedTasks(p => p.filter(t => t.id !== updated.id)); }
    setActiveTask(updated); setRefreshKey(k => k + 1);
  };
  const handleTaskDeleted = (id: string) => { setTasks(p => p.filter(t => t.id !== id)); setCompletedTasks(p => p.filter(t => t.id !== id)); setActiveTask(null); setRefreshKey(k => k + 1); };
  const handleTaskCompleted = (id: string) => { handleComplete(id); setActiveTask(null); };
  const toggleGroup = (label: string) => { setCollapsedGroups(p => { const n = new Set(p); n.has(label) ? n.delete(label) : n.add(label); return n; }); };

  const todayStr = todayString();
  const groupedTasks = useMemo((): TaskGroup[] => {
    const filtered = searchQuery ? tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())) : tasks;
    if (selected === 'inbox') return [{ label: 'Inbox', tasks: filtered }];
    if (selected === 'next7') {
      const order = [0,1,2,3,4,5,6,7].map(i => todayString(i));
      const grouped = new Map<string, Task[]>();
      for (const t of filtered) { const key = t.dueDate || todayStr; grouped.set(key, [...(grouped.get(key) ?? []), t]); }
      return order.filter(d => grouped.has(d)).map(d => ({ label: next7Label(d), tasks: grouped.get(d) ?? [] }));
    }
    const overdue: Task[] = [], todayTasks: Task[] = [], upcoming: Task[] = [];
    for (const t of filtered) { if (!t.dueDate || t.dueDate === todayStr) todayTasks.push(t); else if (t.dueDate < todayStr) overdue.push(t); else upcoming.push(t); }
    const groups: TaskGroup[] = [];
    if (overdue.length) groups.push({ label: 'Overdue', tasks: overdue });
    if (todayTasks.length) groups.push({ label: `Today ${todayTasks.length}`, tasks: todayTasks });
    if (upcoming.length) groups.push({ label: 'Upcoming', tasks: upcoming });
    if (groups.length === 0) groups.push({ label: 'Today', tasks: [] });
    return groups;
  }, [tasks, selected, todayStr, searchQuery]);

  const getListName = (v: string) => { if (v.startsWith('list:')) { const l = lists.find(i => i.id === v.replace('list:', '')); return l ? `${l.emoji || '📋'} ${l.name}` : 'List'; } return SMART_LABELS[v] || v; };
  const listLabel = getListName(selected);
  const listSubtitle = selected === 'today' ? 'Only tasks due today are shown here.' : selected === 'next7' ? 'Tasks grouped from today through next seven days.' : selected === 'inbox' ? 'Tasks waiting to be scheduled.' : 'Tasks inside the selected list.';
  const focusCreateTask = () => { setView('tasks'); setActiveTask(null); if (typeof window !== 'undefined' && window.innerWidth < 768) setShowFab(true); else window.setTimeout(() => inputRef.current?.focus(), 80); };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F8FB] text-gray-900 dark:bg-[#12161D] dark:text-gray-100">
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

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden md:p-5">

        {/* MOBILE HEADER */}
        <div className="flex-none md:hidden px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="flex items-center gap-2">
              <Menu className="h-5 w-5 text-gray-400" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">Tasks</span>
            </button>
            <Link href="/orbit" className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-semibold text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-gray-800 transition">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 text-xs font-bold text-white shadow-sm">★</div>
              <span>MyOrbit</span>
            </Link>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{view === 'calendar' ? 'Calendar' : listLabel}</h2>
          {searchOpen ? (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-gray-700/60 dark:bg-[#1C1F26] mb-2">
              <Search className="h-4 w-4 flex-none text-gray-400" />
              <input autoFocus className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white" placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)} />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }}><X className="h-4 w-4 text-gray-400" /></button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-400 shadow-sm mb-2 dark:border-gray-700/60 dark:bg-[#1C1F26]">
              <Search className="h-4 w-4" /><span>Search tasks...</span>
            </button>
          )}
        </div>

        {/* DESKTOP HEADER */}
        <div className="mb-4 hidden items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700/60 md:flex">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-white">{view === 'calendar' ? 'Calendar' : listLabel}</h1>
            <p className="mt-0.5 hidden text-sm text-gray-500 dark:text-gray-400 sm:block">{view === 'calendar' ? 'Plan and review tasks across calendar views.' : listSubtitle}</p>
          </div>
          <Link href="/orbit" className="hidden md:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800">
            <div className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 text-sm font-bold leading-none text-white shadow-sm">★</div>
            <span className="text-base font-semibold text-gray-900 dark:text-white">MyOrbit</span>
          </Link>
        </div>

        {/* CONTENT */}
        <div className="flex min-h-0 flex-1 gap-2 overflow-hidden px-4 pb-24 md:px-0 md:pb-0">
          {view === 'calendar' ? (
            <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#1A2029] shadow-sm">
              <TaskCalendar tasks={[...tasks, ...completedTasks]} onOpenSidebar={() => setMobileSidebarOpen(true)} onTaskClick={t => setActiveTask(t)} />
            </div>
          ) : (
            <>
              <section className="flex min-w-0 flex-1 flex-col overflow-hidden xl:basis-[58%] xl:flex-none">
                <div className="flex-1 space-y-2 overflow-y-auto">
                  <div className="group hidden md:flex cursor-text items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:border-gray-300 dark:border-gray-700/60 dark:bg-[#1C1F26]" onClick={() => inputRef.current?.focus()}>
                    <Plus className="h-5 w-5 flex-none text-gray-400 transition group-hover:text-emerald-500" />
                    <input ref={inputRef} className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white dark:placeholder-gray-600" placeholder="Add task" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTask()} disabled={addingTask} />
                  </div>
                  {loading ? (
                    <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700/60 dark:bg-[#1C1F26]"><div className="h-5 w-5 flex-none rounded-md bg-gray-200 dark:bg-gray-700" /><div className="h-4 flex-1 rounded bg-gray-200 dark:bg-gray-700" /></div>)}</div>
                  ) : tasks.length === 0 && completedTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center dark:border-gray-700/60 dark:bg-[#1C1F26]">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800">
                        {selected === 'today' ? <Sun className="h-8 w-8 text-amber-500" /> : selected === 'inbox' ? <Inbox className="h-8 w-8 text-sky-500" /> : <CalendarDays className="h-8 w-8 text-indigo-500" />}
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">No tasks here</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tap + to add your first task</p>
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
                          {!collapsedGroups.has(group.label) && <div className="space-y-0.5 px-2 pb-2">{group.tasks.map(task => <TaskItem key={task.id} task={task} onComplete={handleComplete} onDelete={handleDelete} onClick={() => setActiveTask(task)} isActive={activeTask?.id === task.id} />)}</div>}
                        </div>
                      ))}
                      {completedTasks.length > 0 && (
                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700/60 dark:bg-[#1C1F26]">
                          <button onClick={() => setCompletedOpen(v => !v)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
                            <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${completedOpen ? 'rotate-90' : ''}`} />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">Completed</span>
                            <span className="ml-1 text-sm text-gray-400">{completedTasks.length}</span>
                          </button>
                          {completedOpen && <div className="space-y-0.5 px-2 pb-2">{completedTasks.map(task => <TaskItem key={task.id} task={task} onDelete={handleDelete} onClick={() => setActiveTask(task)} isActive={activeTask?.id === task.id} />)}</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
              <section className="hidden min-w-0 xl:flex xl:basis-[42%]">
                {activeTask ? <TaskDetail task={activeTask} lists={lists} onClose={() => setActiveTask(null)} onUpdated={handleTaskUpdated} onDeleted={handleTaskDeleted} onCompleted={handleTaskCompleted} /> : <div className="flex h-full w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-8 text-center text-sm text-gray-400 dark:border-gray-700/60 dark:bg-[#1C1F26] dark:text-gray-500">Select a task to edit its details</div>}
              </section>
            </>
          )}
        </div>
      </main>

      {/* Mobile task detail bottom sheet */}
      {activeTask && (
        <div className="xl:hidden">
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setActiveTask(null)} />
          <div className="fixed inset-x-0 bottom-0 z-[65] rounded-t-2xl bg-white dark:bg-[#1C1F26] border-t border-gray-200 dark:border-gray-700 shadow-2xl" style={{ maxHeight: '90vh' }}>
            <div className="flex justify-center pt-3 pb-1"><div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" /></div>
            <TaskDetail task={activeTask} lists={lists} onClose={() => setActiveTask(null)} onUpdated={handleTaskUpdated} onDeleted={handleTaskDeleted} onCompleted={handleTaskCompleted} />
          </div>
        </div>
      )}

      {showFab && <AddTaskOverlay onClose={() => setShowFab(false)} onAdd={handleAddTask} lists={lists} />}

      {!showFab && !activeTask && (
        <button onClick={() => setShowFab(true)} className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg active:scale-95 transition md:hidden">
          <Plus className="h-6 w-6" />
        </button>
      )}

      <TasksMobileNav selected={selected} view={view} onSelect={v => setSelected(v)} onViewChange={setView} focusAdd={focusCreateTask} />
    </div>
  );
}