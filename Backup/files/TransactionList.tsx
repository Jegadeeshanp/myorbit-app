'use client';

import { useState, useMemo } from 'react';
import { Coffee, CreditCard, FileText, Film, ShoppingBag, Truck, Search } from 'lucide-react';
import { Transaction } from '@/lib/financeData';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Food: Coffee, Transport: Truck, Shopping: ShoppingBag,
  Bills: FileText, Entertainment: Film, Default: CreditCard,
};

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  Food:          { bg: 'bg-orange-100',  text: 'text-orange-700' },
  Transport:     { bg: 'bg-blue-100',    text: 'text-blue-700' },
  Shopping:      { bg: 'bg-purple-100',  text: 'text-purple-700' },
  Bills:         { bg: 'bg-yellow-100',  text: 'text-yellow-700' },
  Entertainment: { bg: 'bg-pink-100',    text: 'text-pink-700' },
  Salary:        { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  Adjustment:    { bg: 'bg-gray-100',    text: 'text-gray-600' },
  Default:       { bg: 'bg-gray-100',    text: 'text-gray-600' },
};

const PERIODS = ['This Week', 'This Month', 'Last Month', '6M', '12M'] as const;
type Period = typeof PERIODS[number];

function filterByPeriod(txs: Transaction[], period: Period): Transaction[] {
  const now = new Date();
  return txs.filter(tx => {
    const d = new Date(tx.date);
    if (period === 'This Week') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    }
    if (period === 'This Month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === 'Last Month') {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    }
    if (period === '6M')  { const p = new Date(now); p.setMonth(now.getMonth() - 6);  return d >= p; }
    if (period === '12M') { const p = new Date(now); p.setMonth(now.getMonth() - 12); return d >= p; }
    return true;
  });
}

function groupByMonth(txs: Transaction[]): { label: string; transactions: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  [...txs].sort((a,b) => b.date.localeCompare(a.date)).forEach(tx => {
    const d = new Date(tx.date);
    const key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  });
  return Array.from(map.entries()).map(([label, transactions]) => ({ label, transactions }));
}

export default function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const [period, setPeriod] = useState<Period>('This Month');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let txs = filterByPeriod(transactions, period);
    if (search.trim()) txs = txs.filter(tx => tx.description.toLowerCase().includes(search.toLowerCase()) || tx.category.toLowerCase().includes(search.toLowerCase()));
    return txs;
  }, [transactions, period, search]);

  const groups = useMemo(() => groupByMonth(filtered), [filtered]);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Period pills */}
        <div className="flex gap-1.5 overflow-x-auto">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`flex-none rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${period === p ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {p}
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions…"
            className="w-full rounded-full border border-gray-200 bg-white py-1.5 pl-8 pr-4 text-sm focus:border-emerald-400 focus:outline-none sm:w-52" />
        </div>
      </div>

      {/* Grouped transaction list */}
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center">
          <p className="text-sm text-gray-400">No transactions found</p>
        </div>
      ) : (
        groups.map(group => {
          const total = group.transactions.reduce((s, tx) => tx.type === 'expense' ? s - Math.abs(tx.amount) : s + tx.amount, 0);
          return (
            <div key={group.label} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              {/* Month header */}
              <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/50 px-5 py-3">
                <p className="text-xs font-semibold text-gray-700">{group.label}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{group.transactions.length} transactions</span>
                  <span className={`font-semibold ${total >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {total >= 0 ? '+' : ''}₹{Math.abs(total).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50">
                {group.transactions.map(tx => {
                  const Icon = ICON_MAP[tx.category] ?? ICON_MAP.Default;
                  const catColor = CAT_COLORS[tx.category] ?? CAT_COLORS.Default;
                  const isExpense = tx.type === 'expense';
                  return (
                    <div key={tx.id} className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-gray-50/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gray-50">
                          <Icon className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{tx.description}</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${catColor.bg} ${catColor.text}`}>{tx.category}</span>
                            <span className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        </div>
                      </div>
                      <p className={`flex-none text-sm font-bold ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isExpense ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
