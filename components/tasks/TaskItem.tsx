'use client';

import { useState } from 'react';
import { Check, Clock, RotateCcw, Trash2, ChevronRight, Flag } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  dueTime?: string;
  tags: string;
  subtasks: { id: string; title: string; isDone: boolean }[];
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

interface Props {
  task: Task;
  onComplete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
  showTrashActions?: boolean;
  isActive?: boolean;
  subtasksMode?: 'toggle' | 'expanded';
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
}: Props) {
  const [completing, setCompleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isCompleted = task.status === 'completed';
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate && task.dueDate < todayStr && !isCompleted;
  const showExpandedSubtasks = subtasksMode === 'expanded' || expanded;
  const hasSubtasks = task.subtasks.length > 0;
  const hasRepeat = task.tags.toLowerCase().includes('recurr');
  const accentColor = task.list?.color || PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.none;

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
        className={`group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition ${
          isActive ? 'bg-white/8' : 'hover:bg-white/5'
        }`}
      >
        {hasSubtasks && subtasksMode === 'toggle' ? (
          <button onClick={toggleExpand} className="flex items-center transition">
            <ChevronRight className={`h-3.5 w-3.5 text-slate-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        ) : (
          <span className="h-3.5 w-3.5 flex-none" />
        )}

        <button
          type="button"
          onClick={handleComplete}
          disabled={completing || isCompleted || showTrashActions}
          className="flex-none transition"
        >
          {isCompleted ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-md border-2 bg-emerald-500/15" style={{ borderColor: accentColor }}>
              <Check className="h-3.5 w-3.5" style={{ color: accentColor }} />
            </div>
          ) : (
            <div
              className={`h-5 w-5 rounded-md border-2 bg-[#12161D] transition ${PRIORITY_BORDER[task.priority] || PRIORITY_BORDER.none} ${completing ? 'opacity-50' : ''}`}
              style={{ borderColor: accentColor }}
            />
          )}
        </button>

        <span className={`min-w-0 flex-1 truncate text-sm ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
          {task.title}
        </span>

        <div className="flex flex-none items-center gap-2 text-slate-400">
          {hasRepeat ? <RotateCcw className="h-3.5 w-3.5" /> : null}
          {task.dueTime ? (
            <>
              <Clock className="h-3.5 w-3.5" />
              <span className={`text-xs ${isOverdue ? 'text-rose-400' : 'text-sky-400'}`}>{task.dueTime}</span>
            </>
          ) : null}
          <Flag className={`h-3.5 w-3.5 ${task.priority === 'high' ? 'text-rose-500' : task.priority === 'medium' ? 'text-amber-500' : task.priority === 'low' ? 'text-blue-500' : 'text-slate-600'}`} />
          {task.list ? (
            <span className="hidden max-w-[96px] truncate text-xs text-slate-500 lg:inline">
              {task.list.emoji || '📋'} {task.list.name.slice(0, 8)}
            </span>
          ) : null}
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
          {task.subtasks.map(subtask => (
            <div
              key={subtask.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5"
            >
              <div
                className={`h-4 w-4 flex-none rounded-full border-2 ${
                  subtask.isDone ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600'
                }`}
              />
              <span className={`text-xs ${subtask.isDone ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
