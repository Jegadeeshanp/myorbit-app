'use client';

import { useState } from 'react';
import { X, RotateCcw, Pin, Clock } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  dueDate?: string;
  dueTime?: string;
  tags: string;
  list?: { id: string; name: string; emoji?: string } | null;
};

function formatReminderDate(dueDate?: string, dueTime?: string): string {
  const parts: string[] = [];
  if (dueDate) {
    const d = new Date(`${dueDate}T00:00:00`);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) parts.push('Today');
    else if (diff === 1) parts.push('Tomorrow');
    else if (diff === -1) parts.push('Yesterday');
    else parts.push(d.toLocaleDateString('default', { day: 'numeric', month: 'short' }));
  }
  if (dueTime) parts.push(formatTime(dueTime));
  return parts.join(', ') || 'No date';
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function hasRepeat(tags: string): boolean {
  try {
    const arr = JSON.parse(tags);
    return Array.isArray(arr) && arr.some((t: string) => t.startsWith('repeat:') && !t.includes('repeat:none'));
  } catch { return false; }
}

const SNOOZE_OPTIONS = [
  { label: 'Snooze 15 minutes', minutes: 15 },
  { label: 'Snooze 30 minutes', minutes: 30 },
  { label: 'Snooze 1 Hour',     minutes: 60 },
];

interface Props {
  task: Task;
  onClose: () => void;
  onDone: () => void;
}

export default function TaskReminderModal({ task, onClose, onDone }: Props) {
  const [showSnooze, setShowSnooze] = useState(false);
  const [loading, setLoading] = useState(false);

  const dateLabel  = formatReminderDate(task.dueDate, task.dueTime);
  const recurring  = hasRepeat(task.tags);
  const listName   = task.list ? `${task.list.emoji || '📋'} ${task.list.name}` : null;

  async function handleSnooze(minutes: number) {
    setLoading(true);
    try {
      await fetch(`/api/tasks/${task.id}/snooze?minutes=${minutes}`, { method: 'POST' });
    } catch { /* non-critical */ }
    setLoading(false);
    onClose();
  }

  async function handleDone() {
    setLoading(true);
    try {
      await fetch(`/api/tasks/${task.id}/complete`, { method: 'PATCH' });
    } catch { /* non-critical */ }
    setLoading(false);
    onDone();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#1C1C1E] shadow-2xl"
        style={{ animation: 'reminderSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        {/* ── Top row: date+repeat (left) · list name (center) · pin+close (right) ── */}
        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
          {/* Date + repeat icon */}
          <div className="flex flex-1 items-center gap-1.5">
            <span className="text-sm font-semibold text-amber-500">{dateLabel}</span>
            {recurring && <RotateCcw className="h-3.5 w-3.5 text-amber-500" />}
          </div>

          {/* List name — center */}
          {listName && (
            <span className="max-w-[110px] truncate text-xs font-medium text-gray-400">{listName}</span>
          )}

          {/* Pin + close */}
          <div className="flex items-center gap-1">
            <button className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition hover:bg-white/10">
              <Pin className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Task title ── */}
        <div className="px-5 pb-8 pt-2">
          <h2 className="text-3xl font-bold leading-tight text-white">{task.title}</h2>
        </div>

        {/* ── Snooze options (shown when Snooze tapped) ── */}
        {showSnooze && (
          <div className="mx-4 mb-3 overflow-hidden rounded-2xl bg-[#2C2C2E]">
            {SNOOZE_OPTIONS.map((opt, i) => (
              <button
                key={opt.minutes}
                disabled={loading}
                onClick={() => handleSnooze(opt.minutes)}
                className={`flex w-full items-center gap-2.5 px-4 py-3.5 text-left text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50 ${i > 0 ? 'border-t border-white/10' : ''}`}
              >
                <Clock className="h-4 w-4 text-amber-500 flex-none" />
                {opt.label}
              </button>
            ))}
            <button
              onClick={() => setShowSnooze(false)}
              className="flex w-full items-center justify-center border-t border-white/10 py-3 text-sm text-gray-400 transition hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── Bottom buttons: Snooze | Done ── */}
        {!showSnooze && (
          <div className="flex gap-3 px-4 pb-5">
            <button
              onClick={() => setShowSnooze(true)}
              className="flex-1 rounded-2xl bg-[#2C2C2E] py-4 text-base font-semibold text-gray-300 transition hover:bg-[#3A3A3C] active:scale-95"
            >
              Snooze
            </button>
            <button
              disabled={loading}
              onClick={handleDone}
              className="flex-1 rounded-2xl bg-amber-900/60 py-4 text-base font-semibold text-amber-500 transition hover:bg-amber-900/80 active:scale-95 disabled:opacity-50"
            >
              Done
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes reminderSlideUp {
          from { opacity: 0; transform: translateY(32px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  );
}
