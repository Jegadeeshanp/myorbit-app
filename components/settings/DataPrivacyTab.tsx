'use client';

import { useState } from 'react';
import { Download, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/authStore';

function DangerCard({ title, description, confirmWord, buttonLabel, onConfirm, loading }: {
  title: string; description: string; confirmWord: string; buttonLabel: string;
  onConfirm: () => void; loading?: boolean;
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
        disabled={!ready || loading}
        onClick={() => { if (ready && !loading) onConfirm(); }}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {buttonLabel}
      </button>
    </div>
  );
}

export default function DataPrivacyTab() {
  const { signOut } = useAuth();
  const [exportingCsv,  setExportingCsv]  = useState(false);
  const [exportingJson, setExportingJson] = useState(false);
  const [resettingFinance, setResettingFinance] = useState(false);
  const [deletingAccount,  setDeletingAccount]  = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const exportData = async (format: 'csv' | 'json') => {
    const setLoading = format === 'csv' ? setExportingCsv : setExportingJson;
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/settings/export?format=${format}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const ext  = format === 'csv' ? 'csv' : 'json';
      const date = new Date().toISOString().split('T')[0];
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = format === 'csv'
        ? `myorbit-transactions-${date}.csv`
        : `myorbit-export-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setStatusMsg({ ok: false, text: 'Export failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetFinance = async () => {
    setResettingFinance(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/settings/reset-finance', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setStatusMsg({ ok: true, text: 'Financial data has been reset. Refresh to see changes.' });
    } catch {
      setStatusMsg({ ok: false, text: 'Reset failed. Please try again.' });
    } finally {
      setResettingFinance(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/settings/delete-account', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      // Sign out and redirect after account deletion
      signOut();
    } catch {
      setStatusMsg({ ok: false, text: 'Account deletion failed. Please contact support.' });
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Export */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-[#1C1F26]">
        <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">Export Data</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          CSV exports your transactions. JSON exports all your data (finance, habits, tasks, goals, health).
        </p>
        <div className="flex gap-3">
          {(['csv', 'json'] as const).map(fmt => {
            const loading = fmt === 'csv' ? exportingCsv : exportingJson;
            return (
              <button
                key={fmt}
                onClick={() => exportData(fmt)}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export {fmt.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {statusMsg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${statusMsg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {statusMsg.text}
        </div>
      )}

      {/* Danger Zone */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold text-gray-900">Danger Zone</h2>
        <div className="space-y-4">
          <DangerCard
            title="Reset Financial Data"
            description="Permanently deletes all accounts, transactions, budgets, assets, and liabilities from our servers. This cannot be undone."
            confirmWord="RESET"
            buttonLabel="Reset all financial data"
            loading={resettingFinance}
            onConfirm={handleResetFinance}
          />
          <DangerCard
            title="Delete Account"
            description="Permanently deletes your account and ALL associated data from our servers. You will be signed out immediately. This cannot be undone."
            confirmWord="DELETE"
            buttonLabel="Permanently delete my account"
            loading={deletingAccount}
            onConfirm={handleDeleteAccount}
          />
        </div>
      </div>
    </div>
  );
}
