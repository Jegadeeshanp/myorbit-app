'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell } from 'lucide-react';
import { useFinance } from '@/lib/financeStore';
import { toast } from '@/components/Toast';

const ALL_CATEGORIES = ['Food & Dining','Transport','Shopping','Bills & Utilities','Healthcare','Entertainment','Education','Travel','Others'];
const PERIODS = ['Monthly', 'Weekly', 'Yearly'] as const;

function Toggle({ value, onChange, label, sub }: { value: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
      <button onClick={() => onChange(!value)} className={`relative h-6 w-11 rounded-full transition ${value ? 'bg-emerald-600' : 'bg-gray-200'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default function AddBudgetPage() {
  const router = useRouter();
  const { state } = useFinance();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<typeof PERIODS[number]>('Monthly');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [allAccounts, setAllAccounts] = useState(true);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [overspendAlert, setOverspendAlert] = useState(true);
  const [warningAlert, setWarningAlert] = useState(true);

  const toggleCat = (c: string) => setSelectedCats(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]);
  const toggleAccount = (id: string) => setSelectedAccounts(as => as.includes(id) ? as.filter(x => x !== id) : [...as, id]);

  const [saving, setSaving] = useState(false);
  const canSave = name.trim() && Number(amount) > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          budget: Number(amount),
          category: selectedCats.join(',') || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to save budget');
      }
      toast('Budget created!', 'success');
      router.push('/orbit/finance/budget');
    } catch (e: any) {
      toast(e?.message ?? 'Failed to save budget', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="mx-auto max-w-lg px-4 pb-32 pt-6">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Add Budget</h1>
        </div>

        <div className="space-y-5">
          {/* Amount */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-400">Budget Amount</label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-400">₹</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="flex-1 text-4xl font-bold text-gray-900 bg-transparent focus:outline-none placeholder-gray-200"
              />
            </div>
          </div>

          {/* Name */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-400">Budget Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Monthly Groceries"
              className="w-full text-sm font-medium text-gray-900 bg-transparent focus:outline-none placeholder-gray-300"
            />
          </div>

          {/* Period */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-gray-400">Period</label>
            <div className="grid grid-cols-3 gap-2">
              {PERIODS.map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-xl border py-2.5 text-sm font-semibold transition ${period === p ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Categories</label>
              <button onClick={() => setSelectedCats(selectedCats.length === ALL_CATEGORIES.length ? [] : [...ALL_CATEGORIES])} className="text-xs font-medium text-emerald-600">
                {selectedCats.length === ALL_CATEGORIES.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map(c => {
                const active = selectedCats.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleCat(c)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accounts */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-gray-400">Accounts</label>
            <div className="mb-3 flex gap-2">
              {['All accounts', 'Specific'].map(opt => (
                <button
                  key={opt}
                  onClick={() => setAllAccounts(opt === 'All accounts')}
                  className={`flex-1 rounded-xl border py-2 text-sm font-medium transition ${(allAccounts && opt === 'All accounts') || (!allAccounts && opt === 'Specific') ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {!allAccounts && (
              <div className="space-y-2">
                {state.accounts.map(a => {
                  const active = selectedAccounts.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleAccount(a.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition ${active ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                    >
                      <span className="text-sm font-medium text-gray-900">{a.name}</span>
                      <div className={`h-4 w-4 rounded border-2 transition ${active ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'}`}>
                        {active && <svg viewBox="0 0 10 10" className="fill-white"><path d="M2 5l2.5 2.5L8 3"/></svg>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-gray-400" />
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Notifications</label>
            </div>
            <div className="space-y-4">
              <Toggle value={overspendAlert} onChange={setOverspendAlert} label="Budget overspend alert" sub="Get notified when you exceed your budget" />
              <div className="border-t border-gray-100" />
              <Toggle value={warningAlert} onChange={setWarningAlert} label="75% budget warning" sub="Early warning before you hit the limit" />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed save button */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full rounded-full bg-emerald-600 py-4 text-base font-bold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Budget
          </button>
        </div>
      </div>
    </div>
  );
}
