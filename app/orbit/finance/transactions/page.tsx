'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '@/lib/financeStore';
import AddExpenseModal from '@/components/finance/AddExpenseModal';
import AddIncomeModal from '@/components/finance/AddIncomeModal';
import TransactionSummaryCard from '@/components/finance/TransactionSummaryCard';
import TransactionList from '@/components/finance/TransactionList';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { TransactionsSkeleton } from '@/components/finance/SkeletonLoader';
import { Pencil, Trash2, Calendar, RotateCw } from 'lucide-react';
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

export default function TransactionsPage() {
  const { state, addTransaction } = useFinance();
  const { transactions, accounts } = state;

  const [isExpenseOpen, setExpenseOpen] = useState(false);
  const [isIncomeOpen,  setIncomeOpen]  = useState(false);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [recurringLoading, setRecurringLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<RecurringTransaction>>({});

  useEffect(() => {
    loadRecurring();
  }, []);

  const loadRecurring = async () => {
    try {
      setRecurringLoading(true);
      const res = await fetch('/api/recurring-transactions');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRecurring(Array.isArray(data) ? data : []);
    } catch {
      toast('Failed to load recurring transactions', 'error');
    } finally {
      setRecurringLoading(false);
    }
  };

  const handleDeleteRecurring = async (id: string) => {
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

  if (state.loadState === 'loading') return <TransactionsSkeleton />;

  return (
    <div className="space-y-5">
      <FinanceTopBar action={
        <div className="flex gap-2">
          <button type="button" onClick={() => setIncomeOpen(true)}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
            + Income
          </button>
          <button type="button" onClick={() => setExpenseOpen(true)}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
            + Expense
          </button>
        </div>
      } />

      <TransactionSummaryCard transactions={transactions} />
      
      {/* All Transactions Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">All Transactions</h2>
        <TransactionList transactions={transactions} />
      </div>

      {/* Recurring Transactions Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recurring Transactions</h2>
        {recurringLoading ? (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-100">
            <p className="text-gray-500 text-sm">Loading...</p>
          </div>
        ) : recurring.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center border border-gray-100">
            <RotateCw className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium text-sm">No recurring transactions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recurring.map(r => (
              <div key={r.id} className="rounded-lg bg-white border border-gray-100 p-3 hover:shadow-sm transition">
                {editingId === r.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editData.description || r.description}
                        onChange={e => setEditData(prev => ({ ...prev, description: e.target.value }))}
                        className="rounded-lg border border-gray-200 px-2.5 py-2 text-sm"
                        placeholder="Description"
                      />
                      <input
                        type="number"
                        value={editData.amount !== undefined ? Math.abs(editData.amount) : Math.abs(r.amount)}
                        onChange={e => setEditData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                        className="rounded-lg border border-gray-200 px-2.5 py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(r.id)}
                        className="flex-1 rounded-lg bg-emerald-600 px-2.5 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 rounded-lg border border-gray-200 px-2.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 text-sm truncate">{r.description}</h3>
                        <span className={`text-xs font-semibold flex-none ${r.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                          {r.type === 'expense' ? '−' : '+'} ₹{Math.abs(r.amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-0.5">
                          <Calendar className="h-3 w-3" />
                          {formatDate(r.nextDate)}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <RotateCw className="h-3 w-3" />
                          {r.recurringConfig.frequency}
                        </div>
                        <div>{r.category}</div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-none">
                      <button
                        onClick={() => {
                          setEditingId(r.id);
                          setEditData(r);
                        }}
                        className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecurring(r.id)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AddIncomeModal
        open={isIncomeOpen}
        onClose={() => setIncomeOpen(false)}
        accounts={accounts.map(a => ({ id: a.id, name: a.name }))}
        onSave={addTransaction}
      />
      <AddExpenseModal
        open={isExpenseOpen}
        onClose={() => setExpenseOpen(false)}
        accounts={accounts.map(a => ({ id: a.id, name: a.name }))}
        onSave={addTransaction}
      />
    </div>
  );
}