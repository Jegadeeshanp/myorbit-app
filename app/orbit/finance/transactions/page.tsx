'use client';

import { useState } from 'react';
import { useFinance, RecurringTemplate } from '@/lib/financeStore';
import TransactionList from '@/components/finance/TransactionList';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import AddTransactionSheet from '@/components/finance/AddTransactionSheet';
import { TransactionsSkeleton } from '@/components/finance/SkeletonLoader';
import { Asset, Liability } from '@/lib/financeData';
import {
  RefreshCw, TrendingUp, Landmark, CalendarDays, ChevronRight,
  PiggyBank, ArrowUpRight, ArrowDownLeft,
} from 'lucide-react';

// ── Recurring tab ──────────────────────────────────────────────────────────

function fmt(v: number) {
  return Math.abs(v).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

function FreqBadge({ freq }: { freq: string }) {
  const map: Record<string, string> = {
    daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly', custom: 'Custom',
  };
  return (
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
      {map[freq] ?? freq}
    </span>
  );
}

function RecurringTransactionRow({ tmpl, accounts }: { tmpl: RecurringTemplate; accounts: { id: string; name: string }[] }) {
  const acc = accounts.find(a => a.id === tmpl.accountId);
  const isIncome = tmpl.type === 'income';
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-3">
      <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${isIncome ? 'bg-emerald-50' : 'bg-red-50'}`}>
        {isIncome
          ? <ArrowUpRight className="h-4 w-4 text-emerald-600" />
          : <ArrowDownLeft className="h-4 w-4 text-red-500" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">{tmpl.description}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-400">{tmpl.category}</span>
          {acc && <span className="text-xs text-gray-400">· {acc.name}</span>}
          <FreqBadge freq={tmpl.recurringConfig.frequency} />
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>
          {isIncome ? '+' : '-'}{fmt(tmpl.amount)}
        </p>
        <p className="text-[11px] text-gray-400">Next: {tmpl.nextDate}</p>
      </div>
    </div>
  );
}

function SipRow({ asset, accounts }: { asset: Asset; accounts: { id: string; name: string }[] }) {
  const acc = accounts.find(a => a.id === asset.accountId);
  const freq = asset.sipConfig?.frequency ?? 'monthly';
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-3">
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-teal-50">
        <PiggyBank className="h-4 w-4 text-teal-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">{asset.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-400">{asset.category}</span>
          {acc
            ? <span className="text-xs text-gray-400">· {acc.name}</span>
            : <span className="text-xs text-gray-400">· External</span>}
          <FreqBadge freq={freq} />
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-teal-700">
          {fmt(asset.invested)}
        </p>
        {asset.sipConfig?.startDate && (
          <p className="text-[11px] text-gray-400">Since {asset.sipConfig.startDate}</p>
        )}
      </div>
    </div>
  );
}

function LiabilityRow({ liab, accounts }: { liab: Liability; accounts: { id: string; name: string }[] }) {
  const acc = accounts.find(a => a.id === liab.repaymentAccountId);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-3">
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-orange-50">
        <Landmark className="h-4 w-4 text-orange-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">{liab.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {liab.lender && <span className="text-xs text-gray-400">{liab.lender}</span>}
          {acc && <span className="text-xs text-gray-400">· {acc.name}</span>}
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Monthly</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-orange-600">{fmt(liab.monthlyEmi)}/mo</p>
        {liab.nextDueDate && (
          <p className="text-[11px] text-gray-400">Due {liab.nextDueDate}</p>
        )}
      </div>
    </div>
  );
}

function RecurringTab() {
  const { state } = useFinance();
  const { recurringTemplates, assets, liabilities, accounts } = state;

  const accList = accounts.map(a => ({ id: a.id, name: a.name }));

  // A. Regular recurring income/expense templates
  const regularTemplates = recurringTemplates.filter(t => t.type === 'income' || t.type === 'expense');

  // B. SIP assets
  const sipAssets = assets.filter(a => a.investmentType === 'sip');

  // C. Liabilities (EMIs)
  const activeEMIs = liabilities.filter(l => l.emisLeft > 0);

  const empty = regularTemplates.length === 0 && sipAssets.length === 0 && activeEMIs.length === 0;

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
        <RefreshCw className="mb-3 h-8 w-8 text-gray-300" />
        <p className="text-sm font-medium text-gray-400">No recurring entries yet</p>
        <p className="mt-1 text-xs text-gray-300">Add recurring transactions, SIP investments, or loans to see them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* A. Recurring transactions */}
      {regularTemplates.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-600">Transactions</h3>
            <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">{regularTemplates.length}</span>
          </div>
          <div className="space-y-2">
            {regularTemplates.map(t => (
              <RecurringTransactionRow key={t.id} tmpl={t} accounts={accList} />
            ))}
          </div>
        </section>
      )}

      {/* B. SIP investments */}
      {sipAssets.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-teal-500" />
            <h3 className="text-sm font-semibold text-gray-600">Investments (SIP)</h3>
            <span className="ml-auto rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-600">{sipAssets.length}</span>
          </div>
          <div className="space-y-2">
            {sipAssets.map(a => (
              <SipRow key={a.id} asset={a} accounts={accList} />
            ))}
          </div>
        </section>
      )}

      {/* C. Liabilities / EMIs */}
      {activeEMIs.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <Landmark className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-gray-600">Liabilities (EMI)</h3>
            <span className="ml-auto rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">{activeEMIs.length}</span>
          </div>
          <div className="space-y-2">
            {activeEMIs.map(l => (
              <LiabilityRow key={l.id} liab={l} accounts={accList} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

type Tab = 'all' | 'recurring';

export default function TransactionsPage() {
  const { state, addTransaction } = useFinance();
  const { transactions, accounts } = state;

  const [tab, setTab]           = useState<Tab>('all');
  const [sheetOpen, setSheetOpen] = useState(false);

  if (state.loadState === 'loading') return <TransactionsSkeleton />;

  const accountList = accounts.map(a => ({ id: a.id, name: a.name, type: a.type }));

  return (
    <div className="space-y-5">
      <FinanceTopBar />

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setTab('all')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${
            tab === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          All Transactions
        </button>
        <button
          onClick={() => setTab('recurring')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${
            tab === 'recurring' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Recurring
        </button>
      </div>

      {tab === 'all' ? (
        <>
          <TransactionList transactions={transactions} onAdd={() => setSheetOpen(true)} />
          <AddTransactionSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            accounts={accountList}
            onSaveExpense={addTransaction}
            onSaveIncome={addTransaction}
            onSaveTransfer={(tx1, tx2) => { addTransaction(tx1); addTransaction(tx2); }}
          />
        </>
      ) : (
        <RecurringTab />
      )}
    </div>
  );
}
