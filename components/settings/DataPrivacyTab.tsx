'use client';

import { useState } from 'react';
import { Download, AlertTriangle } from 'lucide-react';

function DangerCard({ title, description, confirmWord, buttonLabel, onConfirm }: {
  title: string; description: string; confirmWord: string; buttonLabel: string; onConfirm: () => void;
}) {
  const [input, setInput] = useState('');
  const ready = input === confirmWord;
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="h-5 w-5 text-rose-500 flex-none mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-rose-800">{title}</p>
          <p className="mt-1 text-xs text-rose-600">{description}</p>
        </div>
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={`Type "${confirmWord}" to confirm`}
        className="w-full rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100 mb-3"
      />
      <button
        disabled={!ready}
        onClick={() => { if (ready) onConfirm(); }}
        className="w-full rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

export default function DataPrivacyTab() {

  const exportData = (format: 'csv' | 'json') => {
    const data = { exported: new Date().toISOString(), format };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `myorbit-export.${format}`; a.click();
  };

  return (
    <div className="space-y-5">
      {/* Export */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-[#1C1F26]">
        <h2 className="mb-5 text-base font-semibold text-gray-900 dark:text-white">Export Data</h2>
        <div className="flex gap-3">
          {(['csv', 'json'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => exportData(fmt)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
              Export {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold text-gray-900">Danger Zone</h2>
        <div className="space-y-4">
          <DangerCard
            title="Reset Financial Data"
            description="Deletes all assets, liabilities, transactions, and goals. This cannot be undone."
            confirmWord="RESET"
            buttonLabel="Reset all data"
            onConfirm={() => { localStorage.removeItem('myorbit_finance_v1'); window.location.reload(); }}
          />
          <DangerCard
            title="Delete Account"
            description="Permanently deletes your account and all associated data."
            confirmWord="DELETE"
            buttonLabel="Delete my account"
            onConfirm={() => alert('Account deletion would be handled server-side.')}
          />
        </div>
      </div>

    </div>
  );
}