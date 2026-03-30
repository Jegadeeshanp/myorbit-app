'use client';

import { useState } from 'react';
import { Check, Clock, RotateCcw, Trash2, ChevronRight, Flag, Calendar, Layers } from 'lucide-react';
import { getListIcon } from '@/lib/taskListIcons';

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

/** Smart date label: today → just time (or "Today"), tomorrow → "Tomorrow", etc. */
function smartDateLabel(dueDate?: string, dueTime?: string): { label: string; isTime: boolean } | null {
  if (!dueDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const date  = new Date(`${dueDate}T00:00:00`);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);

  if (diffDays === 0) {
    // Today — show time if available, else "Today"
    return dueTime
      ? { label: dueTime, isTime: true }
      : { label: 'Today', isTime: false };
  }
  if (diffDays === 1) return { label: 'Tomorrow', isTime: false };
  if (diffDays === -1) return { label: 'Yesterday', isTime: false };
  if (diffDays > 1 && diffDays <= 6) {
    // This week — day name
    return { label: date.toLocaleDateString('en-IN', { weekday: 'short' }), isTime: false };
  }
  const thisYear = today.getFullYear();
  if (date.getFullYear() === thisYear) {
    return { label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), isTime: false };
  }
  return { label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), isTime: false };
}

interface Props {
  task: Task;
  onComplete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
  showTrashActions?: boolean;
  isActive?: boolean;
  subtasksMode?: 'toggle' | 'expanded';
  /** Show the list chip (disable on list pages where it's redundant) */
  showList?: boolean;
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
}: Props) {
  const [completing, setCompleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isCompleted = task.status === 'completed';
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate && task.dueDate < todayStr && !isCompleted;
  const showExpandedSubtasks = subtasksMode === 'expanded' || expanded;
  const hasSubtasks = task.subtasks.length > 0;
  const hasRepeat = task.tags.toLowerCase().includes('recurr') || task.tags.includes('repeat:');
  const accentColor = task.list?.color || PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.none;

  const dateInfo = smartDateLabel(task.dueDate, task.dueTime);
  // On non-today dates, also show time separately if available
  const showSeparateTime = dateInfo && !dateInfo.isTime && task.dueTime && task.dueDate === todayStr;

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onComplete || completing || isCompleted) return;
    setCompleting(true);
    await onComplete(task.id);
    setCompleting(false);
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(value => !value);
  };

  return (
    <div>
      <div
        onClick={onClick}
        className={`group flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition ${
          isActive ? 'bg-emerald-50 dark:bg-white/8' : 'hover:bg-gray-50 dark:hover:bg-white/5'
        }`}
      >
        {hasSubtasks && subtasksMode === 'toggle' ? (
          <button onClick={toggleExpand} className="mt-0.5 flex items-center transition">
            <ChevronRight className={`h-3.5 w-3.5 text-slate-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        ) : (
          <span className="mt-0.5 h-3.5 w-3.5 flex-none" />
        )}

        <button
          type="button"
          onClick={handleComplete}
          disabled={completing || isCompleted || showTrashActions}
          className="mt-0.5 flex-none transition"
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

        {/* Two-line content: title on top, metadata below */}
        <div className="min-w-0 flex-1">
          <p className={`text-sm leading-snug ${isCompleted ? 'text-gray-400 line-through dark:text-slate-500' : 'text-gray-900 dark:text-slate-100'}`}>
            {task.title}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {/* Date/time label */}
            {dateInfo && (
              <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-rose-400' : dateInfo.isTime ? 'text-sky-400' : 'text-gray-400 dark:text-slate-500'}`}>
                {dateInfo.isTime ? <Clock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                {dateInfo.label}
                {!dateInfo.isTime && task.dueTime && (
                  <span className="text-sky-400">· {task.dueTime}</span>
                )}
              </span>
            )}

            {/* Repeat */}
            {hasRepeat && <RotateCcw className="h-3 w-3 text-emerald-500" />}

            {/* Subtask indicator */}
            {hasSubtasks && (
              <span className="flex items-center gap-0.5 text-gray-400 dark:text-slate-500">
                <Layers className="h-3 w-3" />
                <span className="text-[10px] leading-none">{task.subtasks.length}</span>
              </span>
            )}

            {/* Priority flag */}
            {task.priority !== 'none' && (
              <Flag className={`h-3 w-3 ${task.priority === 'high' ? 'text-rose-500' : task.priority === 'medium' ? 'text-amber-500' : 'text-blue-500'}`} />
            )}

            {/* List chip */}
            {showList && task.list && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-500">
                {getListIcon(task.list.emoji, 'h-3 w-3 flex-none')}
                <span className="max-w-[80px] truncate">{task.list.name}</span>
              </span>
            )}
          </div>
        </div>

        {showTrashActions ? (
          <div className="flex flex-none items-center gap-1 opacity-0 transition group-hover:opacity-100">
            {onRestore ? (
              <button
                onClick={e => { e.stopPropagation(); onRestore(task.id); }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-sky-400 hover:bg-sky-500/10"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            ) : null}
            {onDelete ? (
              <button
                onClick={e => { e.stopPropagation(); onDelete(task.id); }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-rose-400 hover:bg-rose-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}
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