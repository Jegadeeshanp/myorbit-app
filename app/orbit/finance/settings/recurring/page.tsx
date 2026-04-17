'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Pencil, Calendar, RotateCw } from 'lucide-react';
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

export default function RecurringTransactionsPage() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<RecurringTransaction>>({});

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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recurring transaction?')) return;
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
          <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
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
    </div>
  );
}
