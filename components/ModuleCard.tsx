'use client';

import Link from 'next/link';
import React from 'react';

export type ModuleCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  enabled: boolean;
  cta?: string;
};

export default function ModuleCard({ title, description, icon, href, enabled, cta }: ModuleCardProps) {
  const card = (
    <div
      className={`group relative h-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
        enabled ? 'cursor-pointer' : 'opacity-90'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
        {!enabled && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            Coming Soon
          </span>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
      </div>

      <div className="mt-6">
        <button
          type="button"
          className={`w-full rounded-full px-4 py-2 text-sm font-semibold transition ${
            enabled
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'cursor-not-allowed bg-gray-100 text-gray-500'
          }`}
          disabled={!enabled}
        >
          {enabled ? (cta ?? 'Open module →') : 'Coming soon'}
        </button>
      </div>
    </div>
  );

  if (enabled && href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }

  return card;
}
