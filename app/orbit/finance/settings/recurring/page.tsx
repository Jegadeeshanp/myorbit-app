'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Pencil, Calendar, RotateCw, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/Toast';

type RecurringTransaction = {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: 'expense' | 'income' | 'SIP';
  recurringConfig: {
    frequency: string;
    startDate: string;
    endType: 'never' | 'on_date' | 'after';
    endDate?: string;
    endAfterTimes?: number;
  };
  nextDate: string;
  accountId?: string;
  assetId?: string;
  occurrenceCount: number;
};

type NewRecurring = {
  description: string;
  category: string;
  amount: string;
  type: 'expense' | 'income' | 'SIP';
  frequency: string;
  startDate: string;
};

const FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

function AddRecurringModal({ onClose, onCreated }: { onClose: () => void; onCreated: (r: RecurringTransaction) => void }) {
  const [form, setForm] = useState<NewRecurring>({
    description: '',
    category: '',
    amount: '',
    type: 'expense',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof NewRecurring, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.description.trim()) { toast('Description is required', 'error'); return; }
    if (!form.amount || isNaN(parseFloat(form.amount))) { toast('Valid amount is required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/recurring-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: form.description.trim(),
          category: form.category.trim() || 'Other',
          amount: parseFloat(form.amount),
          type: form.type,
          recurringConfig: {
            frequency: form.frequency,
            startDate: form.startDate,
            endType: 'never',
          },
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      toast('Recurring transaction created', 'success');
      onCreated(created);
    } catch {
      toast('Failed to create recurring transaction', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="font-semibold text-gray-900">New Recurring Transaction</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description *</label>
            <input
              autoFocus
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="e.g. Netflix, SIP, Salary..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Type</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none"
                value={form.type}
                onChange={e => set('type', e.target.value)}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="SIP">SIP</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Amount *</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="0"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Frequency</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none capitalize"
                value={form.frequency}
                onChange={e => set('frequency', e.target.value)}
              >
                {FREQUENCIES.map(f => (
                  <option key={f} value={f} className="capitalize">{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Start Date</label>
              <input
                type="date"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="e.g. Subscriptions, SIP, Salary..."
              value={form.category}
              onChange={e => set('category', e.target.value)}
            />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecurringTransactionsPage() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<RecurringTransaction>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadRecurring();
  }, []);

  const loadRecurring = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/recurring-transactions');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRecurring(Array.isArray(data) ? data : []);
    } catch {
      toast('Failed to load recurring transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/recurring-transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setRecurring(prev => prev.filter(r => r.id !== id));
      toast('Deleted recurring transaction', 'success');
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/recurring-transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setRecurring(prev => prev.map(r => r.id === id ? updated : r));
      setEditingId(null);
      toast('Updated recurring transaction', 'success');
    } catch {
      toast('Failed to update', 'error');
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN');

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <Link href="/orbit/finance/settings"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recurring Transactions</h1>
            <p className="text-sm text-gray-600 mt-1">Manage automatic payments and income</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add Recurring
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : recurring.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center border border-gray-100">
            <RotateCw className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No recurring transactions yet</p>
            <p className="text-sm text-gray-500 mt-1">Create automatic payments to save time</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Add First Recurring
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recurring.map(r => (
              <div key={r.id} className="rounded-2xl bg-white border border-gray-100 p-5 hover:shadow-sm transition">
                {editingId === r.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={editData.description || r.description}
                        onChange={e => setEditData(prev => ({ ...prev, description: e.target.value }))}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Description"
                      />
                      <input
                        type="number"
                        value={editData.amount !== undefined ? Math.abs(editData.amount) : Math.abs(r.amount)}
                        onChange={e => setEditData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(r.id)}
                        className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">{r.description}</h3>
                        <span className={`text-sm font-medium flex-none ${r.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                          {r.type === 'expense' ? '−' : '+'} ₹{Math.abs(r.amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(r.nextDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <RotateCw className="h-3.5 w-3.5" />
                          {r.recurringConfig.frequency}
                        </div>
                        <div>{r.category}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-none">
                      <button
                        onClick={() => {
                          setEditingId(r.id);
                          setEditData(r);
                        }}
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddRecurringModal
          onClose={() => setShowAddModal(false)}
          onCreated={r => { setRecurring(prev => [...prev, r]); setShowAddModal(false); }}
        />
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xs rounded-2xl bg-white shadow-2xl p-6 text-center">
            <p className="font-semibold text-gray-900 mb-2">Delete this recurring transaction?</p>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
