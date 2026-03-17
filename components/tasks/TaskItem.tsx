'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, RotateCcw, Trash2 } from 'lucide-react';

type Task = {
  id: string; title: string; status: string; priority: string;
  dueDate?: string; dueTime?: string; tags: string;
  subtasks: { id: string; isDone: boolean }[];
  list?: { name: string; color?: string; emoji?: string } | null;
  isActive?: boolean;
};

const PRIORITY_COLORS: Record<string, string> = {
  high:   'text-rose-500',
  medium: 'text-amber-500',
  low:    'text-blue-400',
  none:   'text-transparent',
};
const PRIORITY_LABELS: Record<string, string> = {
  high: '!!!', medium: '!!', low: '!', none: '',
};

interface Props {
  task: Task;
  onComplete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
  showTrashActions?: boolean;
}

export default function TaskItem({ task, onComplete, onRestore, onDelete, onClick, showTrashActions }: Props) {
  const [completing, setCompleting] = useState(false);
  const isCompleted = task.status === 'completed';
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate && task.dueDate < today && !isCompleted;

  let tags: string[] = [];
  try { tags = JSON.parse(task.tags || '[]'); } catch {}

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onComplete || completing || isCompleted) return;
    setCompleting(true);
    await onComplete(task.id);
    setCompleting(false);
  };

  return (
    <div
      onClick={onClick}
      className={`group flex items-start gap-3 rounded-xl px-3 py-2.5 transition cursor-pointer hover:bg-gray-50 ${!task.isActive ? 'opacity-60' : ''}`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={handleComplete}
        disabled={completing || isCompleted || showTrashActions}
        className="mt-0.5 flex-none transition"
      >
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-blue-500" />
        ) : (
          <Circle className={`h-5 w-5 ${completing ? 'text-blue-300 animate-spin' : 'text-gray-300 hover:text-blue-400'} transition`} />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {task.title}
        </p>
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {task.dueDate && (
            <span className={`text-xs ${isOverdue ? 'text-rose-500 font-medium' : 'text-gray-400'}`}>
              {isOverdue ? '⚠ ' : ''}{task.dueDate}
              {task.dueTime && ` ${task.dueTime}`}
            </span>
          )}
          {task.list && (
            <span className="text-xs text-gray-400 flex items-center gap-0.5">
              {task.list.emoji || '📋'} {task.list.name}
            </span>
          )}
          {tags.map((tag: string) => (
            <span key={tag} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{tag}</span>
          ))}
          {task.subtasks.length > 0 && (
            <span className="text-xs text-gray-400">
              {task.subtasks.filter(s => s.isDone).length}/{task.subtasks.length} subtasks
            </span>
          )}
        </div>
      </div>

      {/* Priority */}
      {task.priority !== 'none' && (
        <span className={`flex-none text-xs font-bold ${PRIORITY_COLORS[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
      )}

      {/* Trash actions */}
      {showTrashActions && (
        <div className="flex-none flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          {onRestore && (
            <button onClick={e => { e.stopPropagation(); onRestore(task.id); }}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-blue-50 text-blue-500">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button onClick={e => { e.stopPropagation(); onDelete(task.id); }}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-rose-50 text-rose-400">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
