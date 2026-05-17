'use client';

import { useState } from 'react';
import { Download, Upload, User, Key, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [secret,       setSecret]       = useState('');
  const [exportUserId, setExportUserId] = useState('');
  const [importUserId, setImportUserId] = useState('');
  const [importJson,   setImportJson]   = useState('');
  const [exporting,    setExporting]    = useState(false);
  const [importing,    setImporting]    = useState(false);
  const [result,       setResult]       = useState<{ ok: boolean; msg: string } | null>(null);

  // ── List all users ─────────────────────────────────────────────────────
  const [users, setUsers] = useState<{ id: string; email: string; name: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res  = await fetch(`/api/admin/users?secret=${encodeURIComponent(secret)}`);
      const data = await res.json();
      if (res.ok) setUsers(data);
      else setResult({ ok: false, msg: data.error ?? 'Failed to load users' });
    } catch {
      setResult({ ok: false, msg: 'Network error' });
    } finally {
      setLoadingUsers(false);
    }
  };

  // ── Export ─────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (!exportUserId.trim() || !secret.trim()) return;
    setExporting(true);
    setResult(null);
    try {
      const res = await fetch(
        `/api/admin/export?userId=${encodeURIComponent(exportUserId)}&secret=${encodeURIComponent(secret)}`,
      );
      if (!res.ok) {
        const d = await res.json();
        setResult({ ok: false, msg: d.error ?? 'Export failed' });
        return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `myorbit-export-${exportUserId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setResult({ ok: true, msg: 'Export downloaded.' });
    } catch {
      setResult({ ok: false, msg: 'Export failed — check secret and userId.' });
    } finally {
      setExporting(false);
    }
  };

  // ── Import ─────────────────────────────────────────────────────────────
  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImportJson(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importUserId.trim() || !secret.trim() || !importJson.trim()) return;
    setImporting(true);
    setResult(null);
    try {
      let data: any;
      try { data = JSON.parse(importJson); }
      catch { setResult({ ok: false, msg: 'Invalid JSON — could not parse file.' }); return; }

      const res = await fetch(`/api/admin/import?secret=${encodeURIComponent(secret)}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ targetUserId: importUserId, data }),
      });
      const json = await res.json();
      if (res.ok) {
        const counts = Object.entries(json.imported as Record<string, number>)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        setResult({ ok: true, msg: `Import complete. ${counts}` });
      } else {
        setResult({ ok: false, msg: json.error ?? 'Import failed' });
      }
    } catch {
      setResult({ ok: false, msg: 'Import failed — check your connection.' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MyOrbit Admin</h1>
          <p className="mt-1 text-sm text-gray-500">Export / import user data. Requires ADMIN_SECRET.</p>
        </div>

        {/* Secret */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Key className="h-4 w-4 text-gray-400" /> Admin Secret
          </label>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="ADMIN_SECRET value from .env"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        {/* User list */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <User className="h-4 w-4 text-gray-400" /> All Users
            </h2>
            <button
              onClick={fetchUsers}
              disabled={!secret.trim() || loadingUsers}
              className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-40"
            >
              {loadingUsers ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Load users
            </button>
          </div>
          {users.length > 0 && (
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 text-sm">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <div>
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">{u.id}</code>
                    <button
                      onClick={() => setExportUserId(u.id)}
                      className="text-[11px] text-emerald-600 hover:underline"
                    >use for export</button>
                    <button
                      onClick={() => setImportUserId(u.id)}
                      className="text-[11px] text-blue-600 hover:underline"
                    >use for import</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Download className="h-4 w-4 text-emerald-500" /> Export User Data
          </h2>
          <label className="mb-1 block text-xs text-gray-500">Source User ID</label>
          <input
            value={exportUserId}
            onChange={e => setExportUserId(e.target.value)}
            placeholder="cuid of the user to export"
            className="mb-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-400 focus:outline-none"
          />
          <button
            onClick={handleExport}
            disabled={!exportUserId.trim() || !secret.trim() || exporting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? 'Exporting…' : 'Download JSON'}
          </button>
        </div>

        {/* Import */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Upload className="h-4 w-4 text-blue-500" /> Import Into User
          </h2>
          <label className="mb-1 block text-xs text-gray-500">Target User ID</label>
          <input
            value={importUserId}
            onChange={e => setImportUserId(e.target.value)}
            placeholder="cuid of the user to import data into"
            className="mb-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-400 focus:outline-none"
          />
          <label className="mb-1 block text-xs text-gray-500">Export JSON file</label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileLoad}
            className="mb-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-200 file:px-3 file:py-1 file:text-xs file:font-medium"
          />
          {importJson && (
            <p className="mb-3 text-xs text-emerald-600">
              ✓ File loaded ({(importJson.length / 1024).toFixed(1)} KB)
            </p>
          )}
          <button
            onClick={handleImport}
            disabled={!importUserId.trim() || !secret.trim() || !importJson.trim() || importing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {importing ? 'Importing…' : 'Import Data'}
          </button>
        </div>

        {/* Result banner */}
        {result && (
          <div className={`flex items-start gap-3 rounded-2xl px-5 py-4 text-sm font-medium ${
            result.ok
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {result.ok
              ? <CheckCircle className="mt-0.5 h-4 w-4 flex-none text-emerald-500" />
              : <XCircle    className="mt-0.5 h-4 w-4 flex-none text-rose-500" />
            }
            {result.msg}
          </div>
        )}
      </div>
    </div>
  );
}
