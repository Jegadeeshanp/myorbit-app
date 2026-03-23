'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Download, Pencil, Trash2, MoreHorizontal, Upload } from 'lucide-react';
import { useFinance } from '@/lib/financeStore';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import dynamic from 'next/dynamic';
import {
  getAllExpenseCategories,
  getExcludedExpenseCategories,
  setExcludedExpenseCategories,
} from '@/lib/customCategoryStore';
const ImportWizard = dynamic(() => import('@/components/finance/ImportWizard'), { ssr: false });

const TABS = ['Preferences', 'Recurring', 'Data'] as const;
type Tab = typeof TABS[number];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
];

const NUMBER_FORMATS = [
  { id: 'en-IN', label: '1,00,000', example: '₹1,00,000.00' },
  { id: 'en-US', label: '100,000', example: '$100,000.00' },
  { id: 'en-EU', label: '100.000', example: '€100.000,00' },
];

const DEFAULT_VIEWS = [
  { id: 'overview',     label: 'Overview'     },
  { id: 'transactions', label: 'Transactions' },
  { id: 'accounts',     label: 'Accounts'     },
  { id: 'assets',       label: 'Assets'       },
];

export default function FinanceSettingsPage() {
  const { state } = useFinance();
  const [activeTab, setActiveTab] = useState<Tab>('Preferences');
  const [showImport, setShowImport] = useState(false);

  // Preferences state
  const [currency,    setCurrency]    = useState('INR');
  const [numFormat,   setNumFormat]   = useState('en-IN');
  const [defaultView, setDefaultView] = useState('overview');

  // Expense category exclusions
  const [allExpenseCats,      setAllExpenseCats]          = useState<string[]>([]);
  const [excludedExpenseCats, setExcludedExpenseCatsState] = useState<string[]>([]);

  useEffect(() => {
    setAllExpenseCats(getAllExpenseCategories());
    setExcludedExpenseCatsState(getExcludedExpenseCategories());
  }, []);

  function toggleExcludedCat(cat: string) {
    setExcludedExpenseCatsState(prev => {
      const next = prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat];
      setExcludedExpenseCategories(next);
      return next;
    });
  }

  // Mock recurring transactions
  const [recurring] = useState([
    { id: '1', description: 'Netflix',       amount: 649,   frequency: 'Monthly', nextDate: '2026-04-01', category: 'Subscriptions', type: 'expense' as const },
    { id: '2', description: 'Salary',         amount: 95000, frequency: 'Monthly', nextDate: '2026-04-01', category: 'Salary',        type: 'income'  as const },
    { id: '3', description: 'SIP – Nifty 50', amount: 5000,  frequency: 'Monthly', nextDate: '2026-04-05', category: 'Investment',    type: 'expense' as const },
  ]);

  const handleExportJSON = () => {
    const data = {
      exportedAt:   new Date().toISOString(),
      accounts:     state.accounts,
      transactions: state.transactions,
      assets:       state.assets,
      liabilities:  state.liabilities,
      budgets:      state.budgets,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'myorbit-finance.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Description', 'Category', 'Amount', 'Type', 'Account'],
      ...state.transactions.map(t => [
        t.date, t.description, t.category,
        String(t.amount), t.type,
        state.accounts.find(a => a.id === t.accountId)?.name ?? '',
      ]),
    ];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'myorbit-transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <FinanceTopBar />

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-gray-100 bg-gray-50/60 p-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              activeTab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Preferences ── */}
      {activeTab === 'Preferences' && (
        <div className="space-y-5">
          {/* Currency */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Currency</h3>
              <p className="text-xs text-gray-400 mt-0.5">Choose your default display currency</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CURRENCIES.map(c => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                    currency === c.code
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`text-lg font-bold ${currency === c.code ? 'text-emerald-700' : 'text-gray-400'}`}>{c.symbol}</span>
                  <div>
                    <p className={`text-xs font-semibold ${currency === c.code ? 'text-emerald-800' : 'text-gray-700'}`}>{c.code}</p>
                    <p className="text-[10px] text-gray-400">{c.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Number Format */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Number Format</h3>
              <p className="text-xs text-gray-400 mt-0.5">How amounts are displayed</p>
            </div>
            <div className="space-y-2">
              {NUMBER_FORMATS.map(f => (
                <label key={f.id} className={`flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer transition ${numFormat === f.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${numFormat === f.id ? 'border-emerald-500' : 'border-gray-300'}`}>
                      {numFormat === f.id && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                    </div>
                    <span className={`text-sm font-medium ${numFormat === f.id ? 'text-emerald-800' : 'text-gray-700'}`}>{f.label}</span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{f.example}</span>
                  <input type="radio" className="sr-only" checked={numFormat === f.id} onChange={() => setNumFormat(f.id)} />
                </label>
              ))}
            </div>
          </div>

          {/* Default View */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Default View</h3>
              <p className="text-xs text-gray-400 mt-0.5">Which page opens when you visit Finance</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_VIEWS.map(v => (
                <button
                  key={v.id}
                  onClick={() => setDefaultView(v.id)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                    defaultView === v.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Expense Category Exclusions */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Expense Tracking</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Uncheck categories to exclude them from expense totals and vitals (e.g. Investment, SIP)
              </p>
            </div>
            <div className="space-y-1.5">
              {allExpenseCats.map(cat => {
                const excluded = excludedExpenseCats.includes(cat);
                return (
                  <label
                    key={cat}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 cursor-pointer transition ${excluded ? 'border-gray-200 bg-gray-50' : 'border-emerald-100 bg-emerald-50/40'}`}
                  >
                    <div
                      onClick={() => toggleExcludedCat(cat)}
                      className={`h-4 w-4 flex-none rounded border-2 flex items-center justify-center transition ${!excluded ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 bg-white'}`}
                    >
                      {!excluded && (
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm font-medium ${excluded ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{cat}</span>
                    {excluded && <span className="ml-auto text-[10px] text-gray-400 font-medium">excluded</span>}
                  </label>
                );
              })}
            </div>
            {excludedExpenseCats.length > 0 && (
              <p className="text-[11px] text-amber-600">
                {excludedExpenseCats.length} {excludedExpenseCats.length === 1 ? 'category' : 'categories'} excluded from expense calculations
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Recurring ── */}
      {activeTab === 'Recurring' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Recurring Transactions</h3>
                <p className="text-xs text-gray-400 mt-0.5">{recurring.length} active recurring items</p>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition">
                <RefreshCw className="h-3.5 w-3.5" /> Add recurring
              </button>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/60">
                    {['Description', 'Frequency', 'Next Date', 'Amount', ''].map(h => (
                      <th key={h} className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recurring.map(r => (
                    <tr key={r.id} className="group hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-900">{r.description}</p>
                        <p className="text-xs text-gray-400">{r.category}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{r.frequency}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {new Date(r.nextDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-sm font-bold ${r.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {r.type === 'expense' ? '-' : '+'}₹{r.amount.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition"><Pencil className="h-3.5 w-3.5" /></button>
                          <button className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-400 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100">
              {recurring.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className={`h-9 w-9 flex-none rounded-xl flex items-center justify-center ${r.type === 'expense' ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                    <RefreshCw className={`h-4 w-4 ${r.type === 'expense' ? 'text-rose-500' : 'text-emerald-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{r.description}</p>
                    <p className="text-xs text-gray-400">{r.frequency} · {r.category}</p>
                  </div>
                  <div className="text-right flex-none">
                    <p className={`text-sm font-bold ${r.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {r.type === 'expense' ? '-' : '+'}₹{r.amount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-400">Next {new Date(r.nextDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <button className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 flex-none"><MoreHorizontal className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Data ── */}
      {activeTab === 'Data' && (
        <div className="space-y-4">
          {/* Import */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Import Data</h3>
            <p className="mt-1 text-sm text-gray-500 leading-relaxed">
              Import assets and transactions from Excel or CSV files. Supports Zerodha/Groww stock holdings, mutual fund statements, HDFC/SBI/ICICI credit card statements, and custom spreadsheets.
            </p>
            <button
              onClick={() => setShowImport(true)}
              className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Upload className="h-4 w-4" />
              Import from Excel / CSV
            </button>
          </div>
          {/* Export */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Export Data</h3>
            <p className="mt-1 text-sm text-gray-500 leading-relaxed">
              Export all your data (assets, liabilities, snapshots, goals) at any time.{' '}
              <span className="font-medium text-gray-700">Your data is yours and always will be.</span>
            </p>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleExportCSV}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-300"
              >
                <Download className="h-4 w-4 text-gray-400" />
                Export CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                <Download className="h-4 w-4" />
                Export JSON
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500 space-y-1.5">
              <p>📦 <span className="font-medium">CSV</span> — Transactions only, compatible with Excel/Sheets</p>
              <p>🗂 <span className="font-medium">JSON</span> — All data: accounts, assets, liabilities, budgets</p>
            </div>
          </div>
        </div>
      )}
      {showImport && <ImportWizard onClose={() => setShowImport(false)} onSuccess={() => { setShowImport(false); window.location.reload(); }} />}
    </div>
  );
}