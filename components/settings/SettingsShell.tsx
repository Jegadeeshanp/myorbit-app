'use client';

import Link from 'next/link';
import { ArrowLeft, type LucideIcon } from 'lucide-react';

export type TabDef = {
  id: string;
  label: string;
  icon?: LucideIcon;
};

interface SettingsShellProps {
  title: string;
  subtitle?: string;
  backHref: string;
  tabs: TabDef[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
}

/** Shared shell for ALL module-level settings pages.
 *  Provides a consistent header (back button + title) and the emerald tab pill bar.
 *  Used inside each module's existing layout — no extra bg wrapper needed.
 */
export default function SettingsShell({
  title,
  subtitle,
  backHref,
  tabs,
  activeTab,
  onTabChange,
  children,
}: SettingsShellProps) {
  return (
    <div className="min-h-screen bg-[#F7F7F5] text-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Tab pill bar — only rendered when there are 2+ tabs */}
        {tabs.length > 1 && (
          <div className="flex gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex flex-none items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Tab content */}
        <div className="space-y-5">{children}</div>
      </div>
    </div>
  );
}

/** Reusable section card — white rounded-2xl card with title + optional subtitle */
export function SettingsCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>
      {(title || subtitle) && (
        <div className="px-5 py-4 border-b border-gray-100">
          {title && <p className="text-sm font-semibold text-gray-900">{title}</p>}
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

/** Row with label + optional sub-label on the left, control on the right */
export function SettingsRow({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <div className="flex-none">{children}</div>
    </div>
  );
}

/** Emerald toggle switch */
export function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        value ? 'bg-emerald-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
