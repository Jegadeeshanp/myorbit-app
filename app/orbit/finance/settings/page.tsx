'use client';

import { useState, useEffect, useMemo } from 'react';
import { Download, Trash2, Upload, Plus, Lock, Package, X, ArrowLeft, Settings2, List, LayoutGrid, Database } from 'lucide-react';
import Link from 'next/link';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, ICON_OPTIONS } from '@/components/finance/CategoryPicker';
import { useFinance } from '@/lib/financeStore';
import dynamic from 'next/dynamic';
import {
  getAllExpenseCategories,
  getExcludedExpenseCategories,
  setExcludedExpenseCategories,
  addCustomExpenseCategory,
  addCustomIncomeCategory,
  removeCustomExpenseCategory,
  removeCustomIncomeCategory,
} from '@/lib/customCategoryStore';

const ImportWizard = dynamic(() => import('@/components/finance/ImportWizard'), { ssr: false });

const TABS = [
  { id: 'Preferences' as const, label: 'Preferences', icon: Settings2  },
  { id: 'Categories'  as const, label: 'Categories',  icon: LayoutGrid },
  { id: 'Data'        as const, label: 'Data',        icon: Database   },
] as const;
type Tab = typeof TABS[number]['id'];

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
  const [activeTab, setActiveTab] = useState<Tab>('Preferences' as Tab);
  const [showImport, setShowImport] = useState(false);

  // Preferences state
  const [currency,    setCurrency]    = useState('INR');
  const [numFormat,   setNumFormat]   = useState('en-IN');
  const [defaultView, setDefaultView] = useState('overview');

  // Expense category exclusions
  // Combine stored categories + categories used in actual transactions
  const allExpenseCats = useMemo(() => {
    const stored = getAllExpenseCategories();
    const SYSTEM = ['Opening Balance', 'Balance Adjustment'];
    const fromTxns = state.transactions
      .filter(t => t.type === 'expense' && !SYSTEM.includes(t.category))
      .map(t => t.category);
    const merged = [...stored, ...fromTxns];
    const seen = new Set<string>();
    return merged.filter(c => seen.has(c) ? false : (seen.add(c), true));
  }, [state.transactions]);

  const [excludedExpenseCats, setExcludedExpenseCatsState] = useState<string[]>([]);

  useEffect(() => {
    setExcludedExpenseCatsState(getExcludedExpenseCategories());
  }, []);

  function toggleExcludedCat(cat: string) {
    setExcludedExpenseCatsState(prev => {
      const next = prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat];
      setExcludedExpenseCategories(next);
      return next;
    });
  }

  // Categories state
  const [catType, setCatType] = useState<'expense' | 'income'>('expense');
  const [dbCats, setDbCats] = useState<{ id: string; name: string; type: string; icon: string }[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Package');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [catLoading, setCatLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'Categories') {
      fetch('/api/categories').then(r => r.json()).then(d => { if (Array.isArray(d)) setDbCats(d); });
    }
  }, [activeTab]);

  const handleAddCat = async () => {
    const name = newCatName.trim();
    if (!name) return;
    setCatLoading(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type: catType, icon: newCatIcon }),
      });
      if (res.ok) {
        const cat = await res.json();
        setDbCats(prev => [...prev.filter(c => !(c.name === name && c.type === catType)), cat]);
        setNewCatName('');
        setNewCatIcon('Package');
        setShowIconPicker(false);
        // also update localStorage
        if (catType === 'expense') addCustomExpenseCategory(name, newCatIcon);
        else addCustomIncomeCategory(name, newCatIcon);
      }
    } finally { setCatLoading(false); }
  };

  const handleDeleteCat = async (cat: { id: string; name: string; type: string }) => {
    await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
    setDbCats(prev => prev.filter(c => c.id !== cat.id));
    if (cat.type === 'expense') removeCustomExpenseCategory(cat.name);
    else removeCustomIncomeCategory(cat.name);
  };

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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/orbit/finance"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Finance Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your finance preferences and data</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-none items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
              activeTab === id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
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
                Check a category to exempt it from expense totals and vitals (e.g. Investment, SIP)
              </p>
            </div>
            <div className="space-y-1.5">
              {allExpenseCats.map(cat => {
                const exempted = excludedExpenseCats.includes(cat);
                return (
                  <label
                    key={cat}
                    onClick={() => toggleExcludedCat(cat)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 cursor-pointer transition ${
                      exempted
                        ? 'border-amber-200 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-900/20'
                        : 'border-gray-100 bg-white hover:border-gray-200 dark:border-gray-700 dark:bg-gray-800/40'
                    }`}
                  >
                    <div className={`h-4 w-4 flex-none rounded border-2 flex items-center justify-center transition ${
                      exempted ? 'border-amber-500 bg-amber-500' : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700'
                    }`}>
                      {exempted && (
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className={`flex-1 text-sm font-medium ${exempted ? 'text-amber-700 dark:text-amber-400' : 'text-gray-800 dark:text-gray-200'}`}>{cat}</span>
                    {exempted && (
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">exempt</span>
                    )}
                  </label>
                );
              })}
            </div>
            {excludedExpenseCats.length > 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                {excludedExpenseCats.length} {excludedExpenseCats.length === 1 ? 'category' : 'categories'} exempt from expense calculations
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Categories ── */}
      {activeTab === 'Categories' && (
        <div className="space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60 p-1">
            {(['expense', 'income'] as const).map(t => (
              <button key={t} onClick={() => setCatType(t)}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold capitalize transition ${catType === t ? t === 'expense' ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Add category */}
          <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Add New Category</p>
            <div className="flex gap-2 items-start">
              {/* Icon picker */}
              <div className="relative">
                <button type="button" onClick={() => setShowIconPicker(v => !v)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  {(() => {
                    const opt = ICON_OPTIONS.find(o => o.name === newCatIcon);
                    const I = opt?.icon ?? Package;
                    return <I className={`h-5 w-5 ${opt?.color ?? 'text-gray-400'}`} />;
                  })()}
                </button>
                {showIconPicker && (
                  <div className="absolute top-full left-0 mt-1 z-50 w-64 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-2">
                    <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
                      {ICON_OPTIONS.map(opt => {
                        const Icon = opt.icon;
                        const isSelected = newCatIcon === opt.name;
                        return (
                          <button key={opt.name} type="button"
                            onClick={() => { setNewCatIcon(opt.name); setShowIconPicker(false); }}
                            title={opt.name}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                              isSelected
                                ? 'bg-emerald-100 dark:bg-emerald-900/50 ring-1 ring-emerald-400'
                                : `hover:bg-gray-100 dark:hover:bg-gray-700`
                            }`}>
                            <Icon className={`h-4 w-4 ${opt.color}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCat()}
                placeholder="Category name…"
                className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white px-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/50" />
              <button onClick={handleAddCat} disabled={!newCatName.trim() || catLoading}
                className="flex items-center gap-1.5 h-10 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40">
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
          </div>

          {/* Full category list: defaults + custom */}
          <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60 px-5 py-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                {catType === 'expense' ? 'Expense' : 'Income'} Categories
              </p>
              <span className="rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                {(catType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).length + dbCats.filter(c => c.type === catType).length} total
              </span>
            </div>

            {/* Default (built-in) categories */}
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {(catType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(catDef => {
                const name = catDef.name;
                const CatIcon = catDef?.icon ?? Package;
                const iconColor = catDef?.color ?? 'text-gray-500';
                const iconBg = catDef?.bg ?? 'bg-gray-100';
                return (
                  <div key={name} className="flex items-center gap-3 px-5 py-3 bg-gray-50/30 dark:bg-gray-800/20">
                    <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg ${iconBg}`}>
                      <CatIcon className={`h-3.5 w-3.5 ${iconColor}`} />
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">{name}</span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      <Lock className="h-2.5 w-2.5" /> built-in
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Custom (user-added) categories */}
            {dbCats.filter(c => c.type === catType).length > 0 && (
              <>
                <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60 px-5 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Custom</p>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {dbCats.filter(c => c.type === catType).map(cat => {
                    const iconOpt = ICON_OPTIONS.find(o => o.name === cat.icon);
                    const CatIcon = iconOpt?.icon ?? Package;
                    const iconColor = iconOpt?.color ?? 'text-gray-400';
                    return (
                      <div key={cat.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition">
                        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                          <CatIcon className={`h-3.5 w-3.5 ${iconColor}`} />
                        </span>
                        <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{cat.name}</span>
                        <button onClick={() => handleDeleteCat(cat)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-400 transition">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {dbCats.filter(c => c.type === catType).length === 0 && (
              <div className="py-4 text-center text-xs text-gray-400 dark:text-gray-500 border-t border-gray-50 dark:border-gray-700">
                No custom categories yet — add one above
              </div>
            )}
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