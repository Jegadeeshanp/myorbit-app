// components/ConfirmDialog.tsx
// Drop-in confirmation dialog for destructive actions.
//
// Usage:
//   <ConfirmDialog
//     open={showConfirm}
//     title="Delete account"
//     description="This will permanently delete HDFC Savings and all associated data. This cannot be undone."
//     confirmLabel="Delete"
//     onConfirm={() => { deleteAccount(id); setShowConfirm(false); }}
//     onCancel={() => setShowConfirm(false)}
//   />

'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open:           boolean;
  title:          string;
  description:    string;
  confirmLabel?:  string;   // default: "Delete"
  cancelLabel?:   string;   // default: "Cancel"
  variant?:       'danger' | 'warning';  // default: "danger"
  onConfirm:      () => void;
  onCancel:       () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel  = 'Cancel',
  variant      = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus confirm button on open — keyboard accessible
  useEffect(() => {
    if (open) {
      setTimeout(() => confirmRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger  = variant === 'danger';
  const iconBg    = isDanger ? 'bg-red-100'    : 'bg-amber-100';
  const iconColor = isDanger ? 'text-red-600'  : 'text-amber-600';
  const btnColor  = isDanger
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    : 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400';

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-title"
    >
      {/* Dialog panel — stop click propagation so backdrop click closes, not panel click */}
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Icon + title */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${iconBg}`}>
            <AlertTriangle className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div>
            <h2 id="confirm-title" className="text-base font-semibold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{description}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-1 ${btnColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
