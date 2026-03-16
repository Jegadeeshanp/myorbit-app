'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import Modal, { SectionLabel, inputCls } from './Modal';
import { toast } from '@/components/Toast';
import { useFinance } from '@/lib/financeStore';
import { BudgetCategory } from '@/lib/financeData';
import { EXPENSE_CATEGORIES } from './CategoryPicker';
import { getCustomExpenseCategories } from '@/lib/customCategoryStore';

const PERIODS = ['Monthly', 'Weekly', 'Yearly'] as const;

function Toggle({ value, onChange, label, sub }: { value: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative h-6 w-11 flex-none rounded-full transition-colors ${value ? 'bg-emerald-600' : 'bg-gray-200'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default function AddBudgetModal({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: BudgetCategory }) {
  const { state, addBudget, updateBudget } = useFinance();
  const [name, setName]                 = useState('');
  const [amount, setAmount]             = useState('');
  const [period, setPeriod]             = useState<typeof PERIODS[number]>('Monthly');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [allAccounts, setAllAccounts]   = useState(true);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [overspend, setOverspend]       = useState(true);
  const [warning, setWarning]           = useState(true);

  // Build full category list: built-in + user's custom categories
  const ALL_CATEGORIES = [
    ...EXPENSE_CATEGORIES.map(c => c.name),
    ...getCustomExpenseCategories(),
  ];

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setAmount(initial ? String(initial.budget) : '');
      setSelectedCats([]); setSelectedAccounts([]);
    }
  }, [open]);

  const isEdit = !!initial;
  const canSave = !!name.trim() && Number(amount) > 0;

  const toggleCat = (c: string) =>
    setSelectedCats(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]);
  const toggleAccount = (id: string) =>
    setSelectedAccounts(as => as.includes(id) ? as.filter(x => x !== id) : [...as, id]);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const categoryStr = selectedCats.join(',');
    try {
      if (isEdit) {
        await updateBudget({ ...initial, name: name.trim(), budget: Number(amount), category: categoryStr });
        toast('Budget updated');
      } else {
        await addBudget({ name: name.trim(), budget: Number(amount), spent: 0, category: categoryStr });
        toast('Budget created');
      }
      onClose();
    } catch (err: any) {
      toast(err.message ?? 'Failed to save budget. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button type="button" onClick={onClose} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
        Cancel
      </button>
      <button type="button" onClick={handleSave} disabled={!canSave || saving}
        className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed">
        {saving ? 'Saving…' : isEdit ? 'Update budget' : 'Save budget'}
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit budget' : 'Add budget'} subtitle="Set a spending limit for a category" footer={footer}>
      <div className="space-y-5">

        <div>
          <SectionLabel>Budget details</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Budget name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Monthly Groceries"
                onKeyDown={e => { if (e.key === 'Enter' && canSave) handleSave(); }}
                className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Amount (₹)</label>
              <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="12000" type="number" min="1"
                onKeyDown={e => { if (e.key === 'Enter' && canSave) handleSave(); }}
                className={inputCls} />
            </div>
          </div>
        </div>

        <div>
          <SectionLabel>Period</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            {PERIODS.map(p => (
              <button key={p} type="button" onClick={() => setPeriod(p)}
                className={`rounded-xl border py-2 text-sm font-semibold transition ${period === p ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <SectionLabel>Categories</SectionLabel>
            <button type="button"
              onClick={() => setSelectedCats(selectedCats.length === ALL_CATEGORIES.length ? [] : [...ALL_CATEGORIES])}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
              {selectedCats.length === ALL_CATEGORIES.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map(c => {
              const active = selectedCats.includes(c);
              return (
                <button key={c} type="button" onClick={() => toggleCat(c)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${active ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionLabel>Accounts</SectionLabel>
          <div className="mb-2 flex gap-2">
            {['All accounts', 'Specific'].map(opt => (
              <button key={opt} type="button" onClick={() => setAllAccounts(opt === 'All accounts')}
                className={`flex-1 rounded-xl border py-2 text-sm font-medium transition ${(allAccounts && opt === 'All accounts') || (!allAccounts && opt === 'Specific') ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {opt}
              </button>
            ))}
          </div>
          {!allAccounts && (
            <div className="space-y-1.5">
              {state.accounts.map(a => {
                const active = selectedAccounts.includes(a.id);
                return (
                  <button key={a.id} type="button" onClick={() => toggleAccount(a.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 transition ${active ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
                    <span className="text-sm font-medium text-gray-900">{a.name}</span>
                    <div className={`h-4 w-4 rounded border-2 transition ${active ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'}`}>
                      {active && <svg viewBox="0 0 10 10" className="fill-white"><path d="M2 5l2.5 2.5L8 3" strokeWidth="1.5" stroke="white" fill="none" /></svg>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5 text-gray-400" />
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Notifications</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 divide-y divide-gray-100">
            <div className="px-4 py-3">
              <Toggle value={overspend} onChange={setOverspend} label="Overspend alert" sub="Notified when you exceed the budget" />
            </div>
            <div className="px-4 py-3">
              <Toggle value={warning} onChange={setWarning} label="75% warning" sub="Early heads-up before hitting the limit" />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
