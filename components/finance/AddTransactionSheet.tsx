'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  X, Plus, Check, Package, ChevronRight, RotateCcw,
  Minus, TrendingUp, ArrowLeftRight, RepeatIcon,
} from 'lucide-react';
import { toast } from '@/components/Toast';
import { Transaction, RecurringConfig } from '@/lib/financeData';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, ICON_OPTIONS, type CategoryDef } from './CategoryPicker';
import { addCustomExpenseCategory, addCustomIncomeCategory, getCustomExpenseCategoryDefs, getCustomIncomeCategoryDefs } from '@/lib/customCategoryStore';

type TabType = 'expense' | 'income' | 'transfer';

// ── Shared input style ────────────────────────────────────────────────────
const inp = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100';

// ── Section label ─────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">{children}</p>;
}

// ── Category chip grid (expense, with add-new) ────────────────────────────
function ExpenseCategoryGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [addMode, setAddMode]       = useState(false);
  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState<ComponentType<{ className?: string }>>(Package);
  const [extras, setExtras]         = useState<CategoryDef[]>([]);

  // Load persisted custom categories (with their saved icons) on mount
  useEffect(() => {
    const defaultNames = EXPENSE_CATEGORIES.map(c => c.name);
    const saved = getCustomExpenseCategoryDefs().filter(c => !defaultNames.includes(c.name));
    setExtras(saved.map(({ name, icon: iconName }) => {
      const iconDef = ICON_OPTIONS.find(o => o.name === iconName);
      return { name, icon: iconDef?.icon ?? Package, color: 'text-gray-700', bg: 'bg-gray-100' };
    }));
  }, []);

  const allCats = [...EXPENSE_CATEGORIES, ...extras]
    .filter((cat, idx, arr) => arr.findIndex(c => c.name === cat.name) === idx);

  function confirm() {
    if (!customName.trim()) return;
    const cat: CategoryDef = { name: customName.trim(), icon: customIcon, color: 'text-gray-700', bg: 'bg-gray-100' };
    setExtras(p => p.find(c => c.name === cat.name) ? p : [...p, cat]);
    const iconName = ICON_OPTIONS.find(o => o.icon === customIcon)?.name ?? 'Package';
    addCustomExpenseCategory(cat.name, iconName);
    onChange(cat.name);
    setCustomName(''); setCustomIcon(Package); setAddMode(false);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1.5">
        {allCats.map(cat => {
          const Icon = cat.icon;
          const active = cat.name === value;
          return (
            <button key={cat.name} type="button" onClick={() => onChange(cat.name)}
              className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium transition ${
                active ? `${cat.bg} ${cat.color} ring-1 ring-current/30` : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-lg ${active ? 'bg-white/60' : cat.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${cat.color}`} />
              </span>
              <span className="truncate leading-tight">{cat.name}</span>
            </button>
          );
        })}
        {!addMode && (
          <button type="button" onClick={() => setAddMode(true)}
            className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-2.5 py-2 text-xs font-medium text-gray-400 transition hover:border-emerald-400 hover:text-emerald-600">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-gray-100"><Plus className="h-3.5 w-3.5" /></span>
            <span className="truncate">Add new</span>
          </button>
        )}
      </div>
      {addMode && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">New category</p>
            <button type="button" onClick={() => setAddMode(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-200"><X className="h-3.5 w-3.5" /></button>
          </div>
          <input value={customName} onChange={e => setCustomName(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirm()} placeholder="Category name…" autoFocus className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
          <div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">Icon</p>
            <div className="grid grid-cols-9 gap-1">
              {ICON_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const sel = customIcon === opt.icon;
                return (
                  <button key={opt.name} type="button" onClick={() => setCustomIcon(() => opt.icon)} title={opt.name}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${sel ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-400' : `${opt.color} hover:bg-gray-200`}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {customName && (
              <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700">
                {(() => { const I = customIcon; return <I className="h-3 w-3" />; })()}
                {customName}
              </div>
            )}
            <button type="button" onClick={confirm} disabled={!customName.trim()}
              className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40">
              <Check className="h-3 w-3" /> Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Category chip grid (income, with add-new) ────────────────────────────
function IncomeCategoryGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [addMode, setAddMode]       = useState(false);
  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState<ComponentType<{ className?: string }>>(Package);
  const [extras, setExtras]         = useState<CategoryDef[]>([]);

  // Load persisted custom categories (with their saved icons) on mount
  useEffect(() => {
    const defaultNames = INCOME_CATEGORIES.map(c => c.name);
    const saved = getCustomIncomeCategoryDefs().filter(c => !defaultNames.includes(c.name));
    setExtras(saved.map(({ name, icon: iconName }) => {
      const iconDef = ICON_OPTIONS.find(o => o.name === iconName);
      return { name, icon: iconDef?.icon ?? Package, color: 'text-gray-700', bg: 'bg-gray-100' };
    }));
  }, []);

  const allCats = [...INCOME_CATEGORIES, ...extras]
    .filter((cat, idx, arr) => arr.findIndex(c => c.name === cat.name) === idx);

  function confirm() {
    if (!customName.trim()) return;
    const cat: CategoryDef = { name: customName.trim(), icon: customIcon, color: 'text-gray-700', bg: 'bg-gray-100' };
    setExtras(p => p.find(c => c.name === cat.name) ? p : [...p, cat]);
    const iconName = ICON_OPTIONS.find(o => o.icon === customIcon)?.name ?? 'Package';
    addCustomIncomeCategory(cat.name, iconName);
    onChange(cat.name);
    setCustomName(''); setCustomIcon(Package); setAddMode(false);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1.5">
        {allCats.map(cat => {
          const Icon = cat.icon;
          const active = cat.name === value;
          return (
            <button key={cat.name} type="button" onClick={() => onChange(cat.name)}
              className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium transition ${
                active ? `${cat.bg} ${cat.color} ring-1 ring-current/30` : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-lg ${active ? 'bg-white/60' : cat.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${cat.color}`} />
              </span>
              <span className="truncate leading-tight">{cat.name}</span>
            </button>
          );
        })}
        {!addMode && (
          <button type="button" onClick={() => setAddMode(true)}
            className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-2.5 py-2 text-xs font-medium text-gray-400 transition hover:border-emerald-400 hover:text-emerald-600">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-gray-100"><Plus className="h-3.5 w-3.5" /></span>
            <span className="truncate">Add new</span>
          </button>
        )}
      </div>
      {addMode && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">New category</p>
            <button type="button" onClick={() => setAddMode(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-200"><X className="h-3.5 w-3.5" /></button>
          </div>
          <input value={customName} onChange={e => setCustomName(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirm()} placeholder="Category name…" autoFocus className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
          <div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">Icon</p>
            <div className="grid grid-cols-9 gap-1">
              {ICON_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const sel = customIcon === opt.icon;
                return (
                  <button key={opt.name} type="button" onClick={() => setCustomIcon(() => opt.icon)} title={opt.name}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${sel ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-400' : `${opt.color} hover:bg-gray-200`}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {customName && (
              <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700">
                {(() => { const I = customIcon; return <I className="h-3 w-3" />; })()}
                {customName}
              </div>
            )}
            <button type="button" onClick={confirm} disabled={!customName.trim()}
              className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40">
              <Check className="h-3 w-3" /> Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Recurring section ─────────────────────────────────────────────────────
type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
type EndType   = 'never' | 'after' | 'on_date';

const FREQ_OPTS: { value: Frequency; label: string }[] = [
  { value: 'daily',   label: 'Daily'   },
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly'  },
  { value: 'custom',  label: 'Custom'  },
];

type RecurringState = {
  on: boolean;
  frequency: Frequency;
  customInterval: string;
  startDate: string;
  endType: EndType;
  endAfterTimes: string;
  endDate: string;
};

function RecurringSection({ state, set }: {
  state: RecurringState;
  set: (patch: Partial<RecurringState>) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/60 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
            <RepeatIcon className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <span className="text-sm font-semibold text-gray-800">Recurring</span>
        </div>
        {/* Toggle */}
        <button
          type="button"
          onClick={() => set({ on: !state.on })}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            state.on ? 'bg-emerald-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              state.on ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Expanded options */}
      {state.on && (
        <div className="border-t border-gray-200 px-4 py-4 space-y-4">

          {/* Frequency pills */}
          <div>
            <p className="mb-2 text-xs font-semibold text-gray-500">Frequency</p>
            <div className="flex flex-wrap gap-1.5">
              {FREQ_OPTS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set({ frequency: opt.value })}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    state.frequency === opt.value
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {state.frequency === 'custom' && (
              <input
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                placeholder="e.g. Every 2 weeks, every 3 months…"
                value={state.customInterval}
                onChange={e => set({ customInterval: e.target.value })}
              />
            )}
          </div>

          {/* Start date */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500">Start Date</label>
            <input
              type="date"
              value={state.startDate}
              onChange={e => set({ startDate: e.target.value })}
              className={inp}
            />
          </div>

          {/* End / Expires */}
          <div>
            <p className="mb-2 text-xs font-semibold text-gray-500">Ends</p>
            <div className="space-y-2">

              {/* Never */}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-3 py-2.5 transition hover:border-emerald-200">
                <input
                  type="radio"
                  name="endType"
                  checked={state.endType === 'never'}
                  onChange={() => set({ endType: 'never' })}
                  className="accent-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">Never</span>
              </label>

              {/* After X times */}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-3 py-2.5 transition hover:border-emerald-200">
                <input
                  type="radio"
                  name="endType"
                  checked={state.endType === 'after'}
                  onChange={() => set({ endType: 'after' })}
                  className="accent-emerald-500"
                />
                <span className="flex flex-1 items-center gap-2 text-sm font-medium text-gray-700">
                  After
                  <input
                    type="number"
                    min="1"
                    value={state.endAfterTimes}
                    onChange={e => set({ endAfterTimes: e.target.value, endType: 'after' })}
                    onClick={e => e.stopPropagation()}
                    placeholder="12"
                    className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-center text-sm focus:border-emerald-400 focus:outline-none"
                  />
                  times
                </span>
              </label>

              {/* On Date */}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-3 py-2.5 transition hover:border-emerald-200">
                <input
                  type="radio"
                  name="endType"
                  checked={state.endType === 'on_date'}
                  onChange={() => set({ endType: 'on_date' })}
                  className="accent-emerald-500"
                />
                <span className="flex flex-1 items-center gap-2 text-sm font-medium text-gray-700">
                  On Date
                  <input
                    type="date"
                    value={state.endDate}
                    onChange={e => set({ endDate: e.target.value, endType: 'on_date' })}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs focus:border-emerald-400 focus:outline-none"
                  />
                </span>
              </label>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab config ────────────────────────────────────────────────────────────
const TAB_CONFIG: Record<TabType, { label: string; icon: typeof Minus; color: string; activeBg: string; btnCls: string }> = {
  expense:  { label: 'Expense',  icon: Minus,          color: 'text-rose-600',    activeBg: 'bg-rose-50',    btnCls: 'bg-rose-500 hover:bg-rose-600' },
  income:   { label: 'Income',   icon: TrendingUp,     color: 'text-emerald-600', activeBg: 'bg-emerald-50', btnCls: 'bg-emerald-600 hover:bg-emerald-700' },
  transfer: { label: 'Transfer', icon: ArrowLeftRight, color: 'text-blue-600',    activeBg: 'bg-blue-50',    btnCls: 'bg-blue-600 hover:bg-blue-700' },
};

// ── Props ─────────────────────────────────────────────────────────────────
type Props = {
  open: boolean;
  onClose: () => void;
  accounts: { id: string; name: string; type?: string }[];
  onSaveExpense: (tx: Omit<Transaction, 'id'>) => void;
  onSaveIncome:  (tx: Omit<Transaction, 'id'>) => void;
  onSaveTransfer: (tx1: Omit<Transaction, 'id'>, tx2: Omit<Transaction, 'id'>) => void;
};


function shortAccLabel(a: { name: string; type?: string }) {
  const t = a.type;
  const short = t === 'Credit Card' ? 'Credit' : t === 'Debit Card' ? 'Debit' : t ?? '';
  return short ? a.name + ' – ' + short : a.name;
}
// ── Main sheet component ──────────────────────────────────────────────────
export default function AddTransactionSheet({
  open, onClose, accounts,
  onSaveExpense, onSaveIncome, onSaveTransfer,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [tab,          setTab]          = useState<TabType>('expense');

  // Expense fields
  const [expCat,  setExpCat]  = useState(EXPENSE_CATEGORIES[0].name);
  const [expDesc, setExpDesc] = useState('');
  const [expAmt,  setExpAmt]  = useState('');
  const [expAcc,  setExpAcc]  = useState(accounts[0]?.id ?? '');
  const [expDate, setExpDate] = useState(today);
  const [expNote, setExpNote] = useState('');

  // Income fields
  const [incCat,  setIncCat]  = useState(INCOME_CATEGORIES[0].name);
  const [incDesc, setIncDesc] = useState('');
  const [incAmt,  setIncAmt]  = useState('');
  const [incAcc,  setIncAcc]  = useState(accounts[0]?.id ?? '');
  const [incDate, setIncDate] = useState(today);
  const [incNote, setIncNote] = useState('');

  // Transfer fields
  const [trFromId, setTrFromId] = useState(accounts[0]?.id ?? '');
  const [trToId,   setTrToId]   = useState(accounts[1]?.id ?? accounts[0]?.id ?? '');
  const [trAmt,    setTrAmt]    = useState('');
  const [trDate,   setTrDate]   = useState(today);
  const [trNote,   setTrNote]   = useState('');

  // Recurring (shared across tabs, resets on tab change)
  const defaultRecurring = (): RecurringState => ({
    on: false, frequency: 'monthly', customInterval: '',
    startDate: today, endType: 'never', endAfterTimes: '', endDate: '',
  });
  const [recurring, setRecurringRaw] = useState<RecurringState>(defaultRecurring);
  const setRecurring = (patch: Partial<RecurringState>) =>
    setRecurringRaw(prev => ({ ...prev, ...patch }));

  // Reset all state when sheet opens
  useEffect(() => {
    if (open) {
      const t = new Date().toISOString().slice(0, 10);
      setTab('expense');
      setExpCat(EXPENSE_CATEGORIES[0].name); setExpDesc(''); setExpAmt('');
      setExpAcc(accounts[0]?.id ?? ''); setExpDate(t); setExpNote('');
      setIncCat(INCOME_CATEGORIES[0].name); setIncDesc(''); setIncAmt('');
      setIncAcc(accounts[0]?.id ?? ''); setIncDate(t); setIncNote('');
      setTrFromId(accounts[0]?.id ?? '');
      setTrToId(accounts[1]?.id ?? accounts[0]?.id ?? '');
      setTrAmt(''); setTrDate(t); setTrNote('');
      setRecurringRaw(defaultRecurring());
    }
  }, [open]);

  // Build recurring config from state
  function buildRecurring(): RecurringConfig | undefined {
    if (!recurring.on) return undefined;
    return {
      frequency: recurring.frequency,
      customInterval: recurring.frequency === 'custom' ? recurring.customInterval : undefined,
      startDate: recurring.startDate,
      endType: recurring.endType,
      endAfterTimes: recurring.endType === 'after' ? Number(recurring.endAfterTimes) || undefined : undefined,
      endDate: recurring.endType === 'on_date' ? recurring.endDate || undefined : undefined,
    };
  }

  // canSubmit per tab
  const canExpense  = useMemo(() => !!expCat && !!expDesc.trim() && Number(expAmt) > 0 && !!expAcc && !!expDate, [expCat, expDesc, expAmt, expAcc, expDate]);
  const canIncome   = useMemo(() => !!incCat && !!incDesc.trim() && Number(incAmt) > 0 && !!incAcc && !!incDate, [incCat, incDesc, incAmt, incAcc, incDate]);
  const canTransfer = useMemo(() => Number(trAmt) > 0 && !!trFromId && !!trToId && trFromId !== trToId, [trAmt, trFromId, trToId]);
  const canSubmit   = tab === 'expense' ? canExpense : tab === 'income' ? canIncome : canTransfer;

  function handleSave() {
    const rec = buildRecurring();
    if (tab === 'expense' && canExpense) {
      const desc = expNote.trim() ? `${expDesc.trim()}\n${expNote.trim()}` : expDesc.trim();
      onSaveExpense({ date: expDate, category: expCat, description: desc, amount: -Math.abs(Number(expAmt)), type: 'expense', accountId: expAcc, recurring: rec });
      toast('Expense recorded');
    } else if (tab === 'income' && canIncome) {
      const desc = incNote.trim() ? `${incDesc.trim()}\n${incNote.trim()}` : incDesc.trim();
      onSaveIncome({ date: incDate, category: incCat, description: desc, amount: Math.abs(Number(incAmt)), type: 'income', accountId: incAcc, recurring: rec });
      toast('Income recorded');
    } else if (tab === 'transfer' && canTransfer) {
      const desc = trNote.trim() || 'Transfer';
      onSaveTransfer(
        { date: trDate, category: 'Transfer', description: desc, amount: -Number(trAmt), type: 'expense', accountId: trFromId, recurring: rec },
        { date: trDate, category: 'Transfer', description: desc, amount:  Number(trAmt), type: 'income',  accountId: trToId,   recurring: rec },
      );
      toast('Transfer recorded');
    } else return;
    onClose();
  }

  const cfg = TAB_CONFIG[tab];

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
    >
      <div className="relative flex w-full flex-col overflow-hidden bg-white shadow-2xl rounded-t-3xl sm:max-w-lg sm:rounded-2xl max-h-[92vh]">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-none items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Add Transaction</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <div className="flex flex-none border-b border-gray-100">
          {(Object.entries(TAB_CONFIG) as [TabType, typeof cfg][]).map(([key, c]) => {
            const Icon = c.icon;
            const isActive = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setTab(key); setRecurringRaw(defaultRecurring()); }}
                className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-semibold transition ${
                  isActive
                    ? `border-current ${c.color} ${c.activeBg}`
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {c.label}
              </button>
            );
          })}
        </div>

        {/* ── Scrollable body ────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* ── EXPENSE FORM ── */}
          {tab === 'expense' && (
            <>
              <div>
                <Label>Category</Label>
                <ExpenseCategoryGrid value={expCat} onChange={setExpCat} />
              </div>
              <div>
                <Label>Details</Label>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
                    <input value={expDesc} onChange={e => setExpDesc(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }} placeholder="Lunch at cafe" className={inp} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Amount (₹)</label>
                    <input value={expAmt} onChange={e => setExpAmt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }} placeholder="250" type="number" min="0" onWheel={e => e.currentTarget.blur()} className={inp} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Account</label>
                    <select value={expAcc} onChange={e => setExpAcc(e.target.value)} className={inp}>
                      {accounts.map(a => <option key={a.id} value={a.id}>{shortAccLabel(a)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Note <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">Optional</span>
                    </label>
                    <input value={expNote} onChange={e => setExpNote(e.target.value)} placeholder="Add a note…" className={inp} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── INCOME FORM ── */}
          {tab === 'income' && (
            <>
              <div>
                <Label>Category</Label>
                <IncomeCategoryGrid value={incCat} onChange={setIncCat} />
              </div>
              <div>
                <Label>Details</Label>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
                    <input value={incDesc} onChange={e => setIncDesc(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }} placeholder="March paycheck" className={inp} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Amount (₹)</label>
                    <input value={incAmt} onChange={e => setIncAmt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }} placeholder="85000" type="number" min="0" onWheel={e => e.currentTarget.blur()} className={inp} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Account</label>
                    <select value={incAcc} onChange={e => setIncAcc(e.target.value)} className={inp}>
                      {accounts.map(a => <option key={a.id} value={a.id}>{shortAccLabel(a)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" value={incDate} onChange={e => setIncDate(e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Note <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">Optional</span>
                    </label>
                    <input value={incNote} onChange={e => setIncNote(e.target.value)} placeholder="Add a note…" className={inp} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── TRANSFER FORM ── */}
          {tab === 'transfer' && (
            <div>
              <Label>Transfer Details</Label>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">From account</label>
                    <select value={trFromId} onChange={e => setTrFromId(e.target.value)} className={inp}>
                      {accounts.map(a => <option key={a.id} value={a.id}>{shortAccLabel(a)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">To account</label>
                    <select value={trToId} onChange={e => setTrToId(e.target.value)} className={inp}>
                      {accounts.map(a => <option key={a.id} value={a.id}>{shortAccLabel(a)}</option>)}
                    </select>
                  </div>
                </div>
                {trFromId === trToId && trFromId !== '' && (
                  <p className="text-xs text-rose-500">From and To accounts must be different.</p>
                )}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Amount (₹)</label>
                  <input value={trAmt} onChange={e => setTrAmt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }} placeholder="0" type="number" min="1" onWheel={e => e.currentTarget.blur()} className={inp} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Date</label>
                  <input type="date" value={trDate} onChange={e => setTrDate(e.target.value)} className={inp} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Note <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">Optional</span>
                  </label>
                  <input value={trNote} onChange={e => setTrNote(e.target.value)} placeholder="e.g. Monthly savings transfer" className={inp} />
                </div>
              </div>
            </div>
          )}

          {/* ── RECURRING SECTION (all tabs) ── */}
          <RecurringSection state={recurring} set={setRecurring} />

          {/* bottom padding so last field isn't hidden behind the footer */}
          <div className="h-2" />
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="flex flex-none items-center justify-end gap-3 border-t border-gray-100 px-5 py-4">
          <button type="button" onClick={onClose}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={!canSubmit}
            className={`rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${cfg.btnCls}`}>
            Save {cfg.label}
          </button>
        </div>

      </div>
    </div>
  );
}
