'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import Modal, { SectionLabel, inputCls } from './Modal';
import { useFinance } from '@/lib/financeStore';

const ALL_CATEGORIES = ['Food','Transport','Shopping','Bills','Healthcare','Entertainment','Education','Travel','Others'];
const PERIODS = ['Monthly', 'Weekly', 'Yearly'] as const;

function Toggle({ value, onChange, label, sub }: { value: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative h-6 w-11 flex-none rounded-full transition ${value ? 'bg-emerald-600' : 'bg-gray-200'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default function AddBudgetModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useFinance();
  const [name, setName]               = useState('');
  const [amount, setAmount]           = useState('');
  const [period, setPeriod]           = useState<typeof PERIODS[number]>('Monthly');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [allAccounts, setAllAccounts] = useState(true);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [overspend, setOverspend]     = useState(true);
  const [warning, setWarning]         = useState(true);

  const canSave = name.trim() && Number(amount) > 0;

  const toggleCat = (c: string) => setSelectedCats(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]);
  const toggleAccount = (id: string) => setSelectedAccounts(as => as.includes(id) ? as.filter(x => x !== id) : [...as, id]);

  const handleSave = () => {
    if (!canSave) return;
    // TODO: dispatch to store
    setName(''); setAmount(''); setSelectedCats([]); setSelectedAccounts([]);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add budget" subtitle="Set a spending limit for a category">
      {/* Scrollable body */}
      <div className="max-h-[65vh] overflow-y-auto space-y-5 pr-1">

        <div>
          <SectionLabel>Budget details</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Budget name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Monthly Groceries" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Amount (₹)</label>
              <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="12000" type="number" className={inputCls} />
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
            <button type="button" onClick={() => setSelectedCats(selectedCats.length === ALL_CATEGORIES.length ? [] : [...ALL_CATEGORIES])}
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
                      {active && <svg viewBox="0 0 10 10" className="fill-white"><path d="M2 5l2.5 2.5L8 3" strokeWidth="1" stroke="white" fill="none"/></svg>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-gray-400" />
            <SectionLabel>Notifications</SectionLabel>
          </div>
          <div className="space-y-3">
            <Toggle value={overspend} onChange={setOverspend} label="Overspend alert" sub="Notified when you exceed the budget" />
            <div className="border-t border-gray-100" />
            <Toggle value={warning} onChange={setWarning} label="75% warning" sub="Early heads-up before hitting the limit" />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <button type="button" onClick={onClose} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={!canSave}
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed">
          Save budget
        </button>
      </div>
    </Modal>
  );
}
