'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">{children}</p>
  );
}

export function OptionalBadge() {
  return <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">Optional</span>;
}

export function FieldGroup({ children }: { children: ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}

export function Divider() {
  return <hr className="border-gray-100" />;
}

const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100';
export { inputCls };

export default function Modal({
  open, title, subtitle, children, onClose, footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 pb-[72px] sm:items-center sm:pb-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header — always visible */}
        <div className="flex flex-none items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>

        {/* Footer — always visible, pinned to bottom */}
        {footer && (
          <div className="flex-none border-t border-gray-100 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}