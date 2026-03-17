'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PreferencesTab from '@/components/settings/PreferencesTab';

export default function FinanceSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/orbit/finance"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Finance Settings</h1>
          <p className="text-sm text-gray-500">Currency, display and category preferences</p>
        </div>
      </div>

      {/* Preferences (currency, theme) */}
      <PreferencesTab />
    </div>
  );
}
