'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, RotateCcw, Trash2, ChevronDown } from 'lucide-react';

type Task = {
  id: string; title: string; status: string; priority: string;
  dueDate?: string; dueTime?: string; tags: string;
  subtasks: { id: string; title: string; isDone: boolean }[];
  list?: { name: string; color?: string; emoji?: string } | null;
  isActive?: boolean;
};

const PRIORITY_BORDER: Record<string, string> = {
  high:   'border-rose-500',
  medium: 'border-amber-400',
  low:    'border-blue-400',
  none:   'border-gray-600',
};

interface Props {
  task: Task;
  onComplete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
  showTrashActions?: boolean;
  isActive?: boolean;
}

export default function TaskItem({
  task, onComplete, onRestore, onDelete, onClick, showTrashActions, isActive,
}: Props) {
  const [completing, setCompleting]   = useState(false);
  const [expanded, setExpanded]       = useState(false);
  const isCompleted = task.status === 'completed';
  const todayStr    = new Date().toISOString().split('T')[0];
  const isOverdue   = task.dueDate && task.dueDate < todayStr && !isCompleted;

  const hasSubtasks  = task.subtasks && task.subtasks.length > 0;
  const hasRepeat    = false; // placeholder — extend when repeat field available

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

  return (
    <div>
      <div
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2 group cursor-pointer transition rounded-lg ${
          isActive ? 'bg-white/10' : 'hover:bg-white/5'
        }`}
      >
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleComplete}
          disabled={completing || isCompleted || showTrashActions}
          className="flex-none transition"
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-sky-400" />
          ) : (
            <div className={`h-5 w-5 rounded-full border-2 ${PRIORITY_BORDER[task.priority] || PRIORITY_BORDER.none} ${completing ? 'opacity-50' : ''} transition`} />
          )}
        </button>

        {/* Title */}
        <span className={`flex-1 text-sm min-w-0 truncate ${isCompleted ? 'line-through text-gray-500' : 'text-gray-100'}`}>
          {task.title}
        </span>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-none text-gray-500">
          {hasRepeat && <RotateCcw className="h-3.5 w-3.5" />}
          {task.dueTime && (
            <>
              <Clock className="h-3.5 w-3.5" />
              <span className={`text-xs ${isOverdue ? 'text-rose-400' : 'text-sky-400'}`}>
                {task.dueTime}
              </span>
            </>
          )}
          {task.list && (
            <span className="text-xs text-gray-500 hidden lg:inline truncate max-w-[80px]">
              {task.list.emoji || '📋'} {task.list.name.slice(0, 8)}
            </span>
          )}
          {hasSubtasks && (
            <button
              onClick={toggleExpand}
              className="flex items-center transition"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Trash actions */}
        {showTrashActions && (
          <div className="flex-none flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            {onRestore && (
              <button
                onClick={e => { e.stopPropagation(); onRestore(task.id); }}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-sky-500/20 text-sky-400"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(task.id); }}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-rose-500/20 text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Subtasks (expanded) */}
      {expanded && hasSubtasks && (
        <div className="pl-10 space-y-0.5 pb-1">
          {task.subtasks.map(st => (
            <div
              key={st.id}
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              <div
                className={`h-4 w-4 rounded-full border-2 flex-none ${
                  st.isDone ? 'border-sky-400 bg-sky-400/20' : 'border-gray-600'
                }`}
              />
              <span className={`text-xs ${st.isDone ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                {st.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
