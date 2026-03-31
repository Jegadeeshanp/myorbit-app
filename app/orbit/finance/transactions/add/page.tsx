'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, Calendar, Tag, FileText, ArrowRight } from 'lucide-react';
import { useFinance } from '@/lib/financeStore';

type TxType = 'expense' | 'income' | 'transfer';

const EXPENSE_CATEGORIES = ['Food & Dining','Transport','Shopping','Bills & Utilities','Healthcare','Entertainment','Education','Travel','Others'];
const INCOME_CATEGORIES  = ['Salary','Freelance','Investments','Dividends','Gifts','Others'];

const ACCOUNT_ICONS: Record<string, string> = {
  Bank: '🏦', 'Credit Card': '💳', 'Debit Card': '💳', Cash: '💵', Wallet: '📱',
};

function AmountDisplay({ amount, type }: { amount: string; type: TxType }) {
  const color = type === 'income' ? 'text-emerald-600' : type === 'expense' ? 'text-rose-500' : 'text-blue-600';
  const prefix = type === 'income' ? '+' : type === 'expense' ? '-' : '';
  return (
    <div className={`text-center py-8 ${color}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Amount</p>
      <p className="text-5xl font-bold tracking-tight">
        {prefix}₹{amount || '0'}
      </p>
    </div>
  );
}

function NumPad({ onKey }: { onKey: (k: string) => void }) {
  const keys = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map(k => (
        <button
          key={k}
          onClick={() => onKey(k)}
          className="rounded-2xl border border-gray-100 bg-white py-4 text-lg font-semibold text-gray-800 shadow-sm transition active:bg-gray-50 hover:bg-gray-50"
        >
          {k}
        </button>
      ))}
    </div>
  );
}

function SelectField({ label, icon: Icon, value, children }: { label: string; icon: any; value: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-gray-300"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 text-gray-400" />
          <div className="text-left">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm font-medium text-gray-900">{value || `Select ${label}`}</p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && children && (
        <div className="absolute z-20 mt-1 w-full rounded-2xl border border-gray-200 bg-white shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

export default function AddTransactionPage() {
  const router = useRouter();
  const { state, addTransaction } = useFinance();
  const [type, setType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [toAccountId, setToAccountId] = useState('');

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const selectedAccount = state.accounts.find(a => a.id === accountId);
  const selectedToAccount = state.accounts.find(a => a.id === toAccountId);

  const handleKey = (k: string) => {
    if (k === '⌫') { setAmount(a => a.slice(0, -1)); return; }
    if (k === '.' && amount.includes('.')) return;
    if (amount.length >= 10) return;
    setAmount(a => a + k);
  };

  const handleSave = () => {
    if (!amount || !accountId) return;
    if (type === 'transfer') {
      if (!toAccountId) return;
      addTransaction({ date, category: 'Transfer', description: notes || 'Transfer', amount: -Number(amount), type: 'transfer', accountId });
      addTransaction({ date, category: 'Transfer', description: notes || 'Transfer', amount:  Number(amount), type: 'transfer', accountId: toAccountId });
    } else {
      addTransaction({
        date,
        category: category || 'Others',
        description: notes || category || type,
        amount: type === 'income' ? Number(amount) : -Number(amount),
        type,
        accountId,
      });
    }
    router.back();
  };

  const canSave = amount && Number(amount) > 0 && accountId && (type === 'transfer' ? toAccountId : true);

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="mx-auto max-w-md px-4 pb-8 pt-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Add Transaction</h1>
        </div>

        {/* Type selector */}
        <div className="mb-6 flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
          {(['expense', 'income', 'transfer'] as TxType[]).map(t => (
            <button
              key={t}
              onClick={() => { setType(t); setCategory(''); }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize transition ${
                type === t
                  ? t === 'expense' ? 'bg-rose-500 text-white'
                  : t === 'income' ? 'bg-emerald-600 text-white'
                  : 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="mb-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <AmountDisplay amount={amount} type={type} />
        </div>

        {/* Fields */}
        <div className="mb-4 space-y-3">
          {/* Account */}
          <SelectField label="Account" icon={Tag} value={selectedAccount ? `${ACCOUNT_ICONS[selectedAccount.type] || '🏦'} ${selectedAccount.name}` : ''}>
            <div className="p-2">
              {state.accounts.map(a => (
                <button key={a.id} onClick={() => setAccountId(a.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-gray-50 ${accountId === a.id ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'}`}>
                  <span>{ACCOUNT_ICONS[a.type] || '🏦'}</span>
                  <div className="text-left">
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.type}</p>
                  </div>
                </button>
              ))}
            </div>
          </SelectField>

          {/* To account (transfer only) */}
          {type === 'transfer' && (
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 flex-none text-blue-400" />
              <div className="flex-1">
                <SelectField label="To Account" icon={Tag} value={selectedToAccount ? `${ACCOUNT_ICONS[selectedToAccount.type] || '🏦'} ${selectedToAccount.name}` : ''}>
                  <div className="p-2">
                    {state.accounts.filter(a => a.id !== accountId).map(a => (
                      <button key={a.id} onClick={() => setToAccountId(a.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-gray-50 ${toAccountId === a.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}>
                        <span>{ACCOUNT_ICONS[a.type] || '🏦'}</span>
                        <p className="font-medium">{a.name}</p>
                      </button>
                    ))}
                  </div>
                </SelectField>
              </div>
            </div>
          )}

          {/* Category */}
          {type !== 'transfer' && (
            <SelectField label="Category" icon={Tag} value={category}>
              <div className="p-2 grid grid-cols-2 gap-1">
                {categories.map(c => (
                  <button key={c} onClick={() => setCategory(c)} className={`rounded-xl px-3 py-2 text-sm text-left transition hover:bg-gray-50 ${category === c ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </SelectField>
          )}

          {/* Date */}
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
            <Calendar className="h-4 w-4 text-gray-400 flex-none" />
            <div className="flex-1">
              <p className="text-xs text-gray-400">Date</p>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="text-sm font-medium text-gray-900 bg-transparent focus:outline-none w-full" />
            </div>
          </div>

          {/* Notes */}
          <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
            <FileText className="h-4 w-4 text-gray-400 flex-none mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-400">Notes</p>
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add a note..."
                className="text-sm font-medium text-gray-900 bg-transparent focus:outline-none w-full placeholder-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Numpad */}
        <div className="mb-6">
          <NumPad onKey={handleKey} />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`w-full rounded-full py-4 text-base font-bold text-white shadow-lg transition ${
            type === 'expense' ? 'bg-rose-500 hover:bg-rose-600' :
            type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' :
            'bg-blue-500 hover:bg-blue-600'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          Save {type.charAt(0).toUpperCase() + type.slice(1)}
        </button>
      </div>
    </div>
  );
}