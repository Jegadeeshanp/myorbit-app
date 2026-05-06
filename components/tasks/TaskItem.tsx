'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Check, Clock, RotateCcw, Trash2, ChevronRight, Flag, Calendar, Layers,
  MoreHorizontal, Bell, Pencil, FolderOpen, ChevronLeft,
} from 'lucide-react';
import { toast } from '@/components/Toast';

type TaskList = { id: string; name: string; color?: string; emoji?: string };

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  dueTime?: string;
  tags: string;
  subtasks: { id: string; title: string; isDone: boolean; dueDate?: string; dueTime?: string; tags?: string }[];
  list?: { name: string; color?: string; emoji?: string } | null;
  isActive?: boolean;
};

const PRIORITY_BORDER: Record<string, string> = {
  high: 'border-rose-500',
  medium: 'border-amber-400',
  low: 'border-blue-400',
  none: 'border-slate-600',
};

const PRIORITY_COLOR: Record<string, string> = {
  high: '#F43F5E',
  medium: '#F59E0B',
  low: '#3B82F6',
  none: '#64748B',
};

const PRIORITY_BAR: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-orange-400',
  low: 'bg-blue-400',
  none: 'bg-transparent',
};

const PRIORITY_OPTS = [
  { v: 'high',   label: 'High',   cls: 'text-rose-500' },
  { v: 'medium', label: 'Medium', cls: 'text-amber-500' },
  { v: 'low',    label: 'Low',    cls: 'text-blue-500' },
  { v: 'none',   label: 'None',   cls: 'text-slate-400' },
];

function parseTags(raw: string): string[] {
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

function smartDateLabel(dueDate?: string, dueTime?: string): { label: string; isTime: boolean } | null {
  if (!dueDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const date  = new Date(`${dueDate}T00:00:00`);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return dueTime ? { label: dueTime, isTime: true } : { label: 'Today', isTime: false };
  if (diffDays === 1) return { label: 'Tomorrow', isTime: false };
  if (diffDays === -1) return { label: 'Yesterday', isTime: false };
  if (diffDays > 1 && diffDays <= 6) return { label: date.toLocaleDateString('en-IN', { weekday: 'short' }), isTime: false };
  const thisYear = today.getFullYear();
  if (date.getFullYear() === thisYear) return { label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), isTime: false };
  return { label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), isTime: false };
}

type MenuStep = 'main' | 'date' | 'priority' | 'list';

interface Props {
  task: Task;
  onComplete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
  showTrashActions?: boolean;
  isActive?: boolean;
  subtasksMode?: 'toggle' | 'expanded';
  showList?: boolean;
  lists?: TaskList[];
  onSetPriority?: (id: string, priority: string) => void;
  onSetDueDate?: (id: string, date: string) => void;
  onMoveToList?: (id: string, listId: string | null) => void;
}

export default function TaskItem({
  task,
  onComplete,
  onRestore,
  onDelete,
  onClick,
  showTrashActions,
  isActive,
  subtasksMode = 'toggle',
  showList = true,
  lists,
  onSetPriority,
  onSetDueDate,
  onMoveToList,
}: Props) {
  const [completing, setCompleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuStep, setMenuStep] = useState<MenuStep>('main');
  const menuRef = useRef<HTMLDivElement>(null);

  const isCompleted = task.status === 'completed';
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate && task.dueDate < todayStr && !isCompleted;
  const showExpandedSubtasks = subtasksMode === 'expanded' || expanded;
  const hasSubtasks = task.subtasks.length > 0;
  const hasRepeat = task.tags.toLowerCase().includes('recurr') || task.tags.includes('repeat:');
  const accentColor = task.list?.color || PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.none;
  const dateInfo = smartDateLabel(task.dueDate, task.dueTime);
  const tags = parseTags(task.tags).filter(t => !t.startsWith('repeat:'));

  useEffect(() => {
    if (!showMenu) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setMenuStep('main');
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showMenu]);

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onComplete || completing || isCompleted) return;
    setCompleting(true);
    await onComplete(task.id);
    setCompleting(false);
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(v => !v);
  };

  const closeMenu = () => { setShowMenu(false); setMenuStep('main'); };

  return (
    <div>
      <div
        onClick={onClick}
        className={`group relative flex cursor-pointer items-start sm:items-center gap-3 rounded-xl px-3 py-2.5 transition ${
          isActive ? 'bg-emerald-50 dark:bg-white/8' : 'hover:bg-gray-50 dark:hover:bg-white/5'
        }`}
      >
        <div className={`absolute inset-y-0 left-0 w-[3px] rounded-l-xl ${PRIORITY_BAR[task.priority] ?? 'bg-transparent'}`} />

        {hasSubtasks && subtasksMode === 'toggle' ? (
          <button onClick={toggleExpand} className="mt-0.5 sm:mt-0 flex items-center transition">
            <ChevronRight className={`h-3.5 w-3.5 text-slate-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        ) : (
          <span className="mt-0.5 sm:mt-0 h-3.5 w-3.5 flex-none" />
        )}

        <button
          type="button"
          onClick={handleComplete}
          disabled={completing || isCompleted || showTrashActions}
          className="mt-0.5 sm:mt-0 flex-none transition"
        >
          {isCompleted ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-md border-2 bg-emerald-500/15" style={{ borderColor: accentColor }}>
              <Check className="h-3.5 w-3.5" style={{ color: accentColor }} />
            </div>
          ) : (
            <div
              className={`h-5 w-5 rounded-md border-2 bg-white dark:bg-[#12161D] transition ${PRIORITY_BORDER[task.priority] || PRIORITY_BORDER.none} ${completing ? 'opacity-50' : ''}`}
              style={{ borderColor: accentColor }}
            />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="sm:flex sm:items-center sm:gap-2">
            <p className={`text-sm leading-snug sm:flex-1 sm:truncate ${isCompleted ? 'text-gray-400 line-through dark:text-slate-500' : 'text-gray-900 dark:text-slate-100'}`}>
              {task.title}
            </p>
            <div className="mt-0.5 sm:mt-0 flex flex-wrap sm:flex-nowrap items-center gap-x-2 gap-y-0.5 sm:flex-none">
              {hasRepeat && <RotateCcw className="h-3 w-3 text-emerald-500" />}
              {hasSubtasks && (
                <span className="flex items-center gap-0.5 text-gray-400 dark:text-slate-500">
                  <Layers className="h-3 w-3" />
                  <span className="text-[10px] leading-none">{task.subtasks.length}</span>
                </span>
              )}
              {task.priority !== 'none' && (
                <Flag className={`h-3 w-3 ${task.priority === 'high' ? 'text-rose-500' : task.priority === 'medium' ? 'text-amber-500' : 'text-blue-500'}`} />
              )}
            </div>
          </div>

          {/* Secondary meta: list dot · tag pills · date */}
          {(showList && task.list || tags.length > 0 || task.dueDate) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {showList && task.list && (
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                  <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ backgroundColor: task.list.color || '#10B981' }} />
                  <span className="max-w-[80px] truncate">{task.list.name}</span>
                </span>
              )}
              {tags.map(tag => (
                <span key={tag} className="rounded-full bg-slate-100 px-2 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {tag}
                </span>
              ))}
              {dateInfo && (
                <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500' : dateInfo.isTime ? 'text-sky-400' : 'text-gray-400 dark:text-slate-500'}`}>
                  {dateInfo.isTime ? <Clock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                  {dateInfo.label}
                  {!dateInfo.isTime && task.dueTime && <span className="text-sky-400">· {task.dueTime}</span>}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Trash mode */}
        {showTrashActions ? (
          <div className="flex flex-none items-center gap-1 opacity-0 transition group-hover:opacity-100">
            {onRestore && (
              <button
                onClick={e => { e.stopPropagation(); onRestore(task.id); }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-sky-400 hover:bg-sky-500/10"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(task.id); }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-rose-400 hover:bg-rose-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          /* ••• context menu */
          <div
            ref={menuRef}
            className="relative flex-none"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { setShowMenu(v => !v); if (showMenu) setMenuStep('main'); }}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 ${showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-[#1C1F26]">

                {menuStep === 'main' && (
                  <>
                    <button onClick={() => setMenuStep('date')} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-white/5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Set due date
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-400" />
                    </button>
                    <button onClick={() => setMenuStep('priority')} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-white/5">
                      <Flag className="h-3.5 w-3.5 text-slate-400" />
                      Set priority
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={() => { toast('Reminder set – notifications coming soon'); closeMenu(); }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                      <Bell className="h-3.5 w-3.5 text-slate-400" />
                      Set reminder
                    </button>
                    {lists && lists.length > 0 && (
                      <button onClick={() => setMenuStep('list')} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-white/5">
                        <FolderOpen className="h-3.5 w-3.5 text-slate-400" />
                        Move to list
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-400" />
                      </button>
                    )}
                    <button
                      onClick={() => { onClick?.(); closeMenu(); }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                      <Pencil className="h-3.5 w-3.5 text-slate-400" />
                      Edit
                    </button>
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                    {onDelete && (
                      <button
                        onClick={() => { onDelete(task.id); closeMenu(); }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    )}
                  </>
                )}

                {menuStep === 'date' && (
                  <>
                    <button onClick={() => setMenuStep('main')} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-gray-50 dark:hover:bg-white/5">
                      <ChevronLeft className="h-3.5 w-3.5" /> Due date
                    </button>
                    <div className="px-3 pb-2">
                      <input
                        type="date"
                        defaultValue={task.dueDate || ''}
                        onChange={e => { onSetDueDate?.(task.id, e.target.value); closeMenu(); }}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-[#12161D] dark:text-slate-200"
                      />
                    </div>
                  </>
                )}

                {menuStep === 'priority' && (
                  <>
                    <button onClick={() => setMenuStep('main')} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-gray-50 dark:hover:bg-white/5">
                      <ChevronLeft className="h-3.5 w-3.5" /> Priority
                    </button>
                    {PRIORITY_OPTS.map(opt => (
                      <button
                        key={opt.v}
                        onClick={() => { onSetPriority?.(task.id, opt.v); closeMenu(); }}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 ${opt.cls}`}
                      >
                        <Flag className="h-3.5 w-3.5" />
                        {opt.label}
                        {task.priority === opt.v && <Check className="ml-auto h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </>
                )}

                {menuStep === 'list' && (
                  <>
                    <button onClick={() => setMenuStep('main')} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-gray-50 dark:hover:bg-white/5">
                      <ChevronLeft className="h-3.5 w-3.5" /> Move to list
                    </button>
                    <button
                      onClick={() => { onMoveToList?.(task.id, null); closeMenu(); }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                      <span className="h-2 w-2 flex-none rounded-full bg-slate-300" />
                      No List
                      {!task.list && <Check className="ml-auto h-3.5 w-3.5 text-emerald-500" />}
                    </button>
                    {lists?.map(list => (
                      <button
                        key={list.id}
                        onClick={() => { onMoveToList?.(task.id, list.id); closeMenu(); }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-white/5"
                      >
                        <span className="h-2 w-2 flex-none rounded-full" style={{ backgroundColor: list.color || '#10B981' }} />
                        <span className="truncate">{list.name}</span>
                        {task.list?.name === list.name && <Check className="ml-auto h-3.5 w-3.5 text-emerald-500" />}
                      </button>
                    ))}
                  </>
                )}

              </div>
            )}
          </div>
        )}
      </div>

      {showExpandedSubtasks && hasSubtasks ? (
        <div className="space-y-0.5 pb-1 pl-12">
          {task.subtasks.map(subtask => {
            const stTags = typeof subtask.tags === 'string'
              ? (() => { try { return JSON.parse(subtask.tags); } catch { return []; } })()
              : (subtask.tags ?? []);
            const stRepeat = stTags.find((t: string) => t.startsWith('repeat:'))?.replace('repeat:', '');
            const stDate = smartDateLabel(subtask.dueDate, subtask.dueTime);
            const todayS = new Date().toISOString().split('T')[0];
            const stOverdue = subtask.dueDate && subtask.dueDate < todayS && !subtask.isDone;
            return (
              <div key={subtask.id} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5">
                <div className={`flex h-4 w-4 flex-none items-center justify-center rounded-md border-2 ${subtask.isDone ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-300 dark:border-slate-600'}`}>
                  {subtask.isDone ? <Check className="h-3 w-3 text-emerald-600" /> : null}
                </div>
                <span className={`flex-1 truncate text-xs ${subtask.isDone ? 'text-gray-400 line-through dark:text-slate-500' : 'text-gray-600 dark:text-slate-300'}`}>
                  {subtask.title}
                </span>
                <div className="flex flex-none items-center gap-1">
                  {stRepeat && stRepeat !== 'none' && <RotateCcw className="h-3 w-3 text-emerald-500" />}
                  {stDate && (
                    <span className={`flex items-center gap-0.5 text-[10px] ${stOverdue ? 'text-rose-400' : stDate.isTime ? 'text-sky-400' : 'text-gray-400'}`}>
                      {stDate.isTime ? <Clock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                      {stDate.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
