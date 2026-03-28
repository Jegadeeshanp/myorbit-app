'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PlusCircle, Pencil, Trash2, CreditCard, CheckCircle2, AlertCircle, CalendarDays, Search, MoreHorizontal } from 'lucide-react';
import Modal, { SectionLabel, inputCls } from '@/components/finance/Modal';
import AddLiabilityModal from '@/components/finance/AddLiabilityModal';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { useFinance } from '@/lib/financeStore';
import { Liability } from '@/lib/financeData';
import { toast } from '@/components/Toast';
import { LiabilitiesSkeleton } from '@/components/finance/SkeletonLoader';

function fmt(v: number | undefined | null) {
  if (v == null || isNaN(v)) return '₹0';
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(2)}L`;
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

function fmtDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(iso: string | undefined) {
  if (!iso) return null;
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
}

// ── Record Payment modal ───────────────────────────────────────────────────
function RecordPaymentModal({
  liability,
  open,
  onClose,
  accounts,
}: {
  liability: Liability | null;
  open: boolean;
  onClose: () => void;
  accounts: { id: string; name: string; type?: string }[];
}) {
  const { recordLiabilityPayment } = useFinance();
  const [amount,     setAmount]     = useState('');
  const [accountId,  setAccountId]  = useState('');

  const suggested = liability?.monthlyEmi ?? 0;
  const max       = liability?.outstanding ?? 0;
  const canSave   = Number(amount) > 0 && Number(amount) <= max;

  // Pre-fill repayment account when modal opens
  useEffect(() => {
    if (liability) {
      setAmount('');
      setAccountId(liability.repaymentAccountId ?? '');
    }
  }, [liability?.id, open]);

  function shortLabel(a: { name: string; type?: string }) {
    const t = a.type;
    const s = t === 'Credit Card' ? 'Credit' : t === 'Debit Card' ? 'Debit' : t ?? '';
    return s ? a.name + ' – ' + s : a.name;
  }

  const handleSave = () => {
    if (!liability || !canSave) return;
    recordLiabilityPayment(liability.id, Number(amount), accountId || undefined);
    toast(`Payment of ${fmt(Number(amount))} recorded`);
    setAmount('');
    onClose();
  };

  if (!liability) return null;

  const selectedAcc = accounts.find(a => a.id === accountId);

  return (
    <Modal open={open} onClose={onClose} title="Record payment" subtitle={`${liability.name} · ${liability.lender}`}>
      <div className="space-y-5">
        <div>
          <SectionLabel>Payment amount</SectionLabel>
          <div className="space-y-2">
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              type="number"
              min="1"
              max={max}
              placeholder={String(suggested)}
              className={inputCls}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAmount(String(suggested))}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                EMI {fmt(suggested)}
              </button>
              <button
                type="button"
                onClick={() => setAmount(String(max))}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                Full {fmt(max)}
              </button>
            </div>
          </div>
        </div>

        {/* Repayment account */}
        {accounts.length > 0 && (
          <div>
            <SectionLabel>Debit from account</SectionLabel>
            <select value={accountId} onChange={e => setAccountId(e.target.value)} className={inputCls}>
              <option value="">— none / manual —</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{shortLabel(a)}</option>)}
            </select>
            {selectedAcc && (
              <p className="mt-1.5 text-xs text-gray-400">
                {fmt(Number(amount) || 0)} will be deducted from <span className="font-medium text-gray-600">{selectedAcc.name}</span>
              </p>
            )}
          </div>
        )}

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-500 space-y-1">
          <div className="flex justify-between"><span>Outstanding before</span><span className="font-semibold text-rose-600">{fmt(max)}</span></div>
          <div className="flex justify-between"><span>After payment</span><span className="font-semibold text-emerald-600">{fmt(Math.max(0, max - Number(amount || 0)))}</span></div>
          <div className="flex justify-between"><span>Next due date</span><span className="font-semibold text-gray-600">{
            (() => {
              if (!liability.nextDueDate) return '—';
              const d = new Date(liability.nextDueDate);
              d.setMonth(d.getMonth() + 1);
              return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            })()
          } (after payment)</span></div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={!canSave}
            className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed">
            Record payment
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Per-row dots menu ──────────────────────────────────────────────────────
function LiabilityDotsMenu({
  onPay, onEdit, onDelete,
}: { onPay: () => void; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropUp(window.innerHeight - rect.bottom < 150);
    }
    setOpen(v => !v);
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className={`absolute right-0 ${dropUp ? 'bottom-9' : 'top-9'} z-30 w-36 rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg py-1`}>
          <button
            onClick={() => { onPay(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Pay
          </button>
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <Pencil className="h-3.5 w-3.5 text-gray-400" /> Edit
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function LiabilitiesPage() {
  const { state, addLiability, updateLiability, deleteLiability } = useFinance();
  const liabilities = state.liabilities;
  const accountList = state.accounts.map(a => ({ id: a.id, name: a.name, type: a.type }));

  const [addOpen,     setAddOpen]     = useState(false);
  const [editTarget,  setEditTarget]  = useState<Liability | null>(null);
  const [payTarget,   setPayTarget]   = useState<Liability | null>(null);
  const [search,      setSearch]      = useState('');
  const [mobileSearch, setMobileSearch] = useState(false);

  const summary = useMemo(() => {
    const borrowed    = liabilities.reduce((s, l) => s + l.borrowed, 0);
    const outstanding = liabilities.reduce((s, l) => s + l.outstanding, 0);
    const repaid      = liabilities.reduce((s, l) => s + (l.totalRepaid ?? 0), 0);
    return { borrowed, outstanding, repaid };
  }, [liabilities]);

  const repaidPct = summary.borrowed > 0
    ? Math.round((summary.repaid / summary.borrowed) * 100)
    : 0;

  if (state.loadState === 'loading') return <LiabilitiesSkeleton />;

  const filteredLiabilities = search.trim()
    ? liabilities.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.lender?.toLowerCase().includes(search.toLowerCase())
      )
    : liabilities;

  return (
    <div className="space-y-6">
      <FinanceTopBar />

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-blue-50">
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Total Borrowed</p>
            <p className="text-lg font-bold text-blue-600 truncate">{fmt(summary.borrowed)}</p>
            <p className="text-xs text-gray-400">{liabilities.length} loan{liabilities.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-emerald-50">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Total Repaid</p>
            <p className="text-lg font-bold text-emerald-600 truncate">{fmt(summary.repaid)}</p>
            <p className="text-xs text-gray-400">{repaidPct}% of borrowed</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-rose-50">
            <AlertCircle className="h-5 w-5 text-rose-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Outstanding Balance</p>
            <p className="text-lg font-bold text-rose-600 truncate">{fmt(summary.outstanding)}</p>
            <p className="text-xs text-gray-400">{100 - repaidPct}% remaining</p>
          </div>
        </div>
      </div>

      {/* ── Overall repayment progress ── */}
      {liabilities.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-gray-600">Overall repayment progress</span>
            <span className="font-semibold text-emerald-600">{repaidPct}% paid</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${repaidPct}%` }} />
          </div>
        </div>
      )}

      {/* ── Search (left) + Add liability (right) ── */}
      <div className="flex items-center gap-2">
        {mobileSearch ? (
          <div className="flex sm:hidden flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              onBlur={() => { if (!search) setMobileSearch(false); }}
              placeholder="Search liabilities…"
              className="w-full rounded-full border border-gray-200 bg-white py-2 pl-8 pr-4 text-sm focus:border-emerald-400 focus:outline-none" />
          </div>
        ) : (
          <button onClick={() => setMobileSearch(true)}
            className="flex sm:hidden h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm text-gray-500 hover:bg-gray-50">
            <Search className="h-4 w-4" />
          </button>
        )}
        <div className="relative hidden sm:flex w-64 flex-none">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search liabilities…"
            className="w-full rounded-full border border-gray-200 bg-white py-2 pl-8 pr-4 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </div>
        <div className="ml-auto">
          <button type="button" onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800">
            <PlusCircle className="h-4 w-4" /> Add liability
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      {liabilities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-14 text-center">
          <CreditCard className="mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">No liabilities added yet</p>
          <button onClick={() => setAddOpen(true)} className="mt-3 text-xs font-medium text-emerald-600 hover:text-emerald-700">
            + Add your first loan
          </button>
        </div>
      ) : (
        <>
        {/* Mobile card list */}
        <div className="sm:hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-100 overflow-hidden">
          {filteredLiabilities.map(l => (
            <div key={l.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-rose-50">
                <CreditCard className="h-4 w-4 text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 leading-snug">{l.name}</p>
                {l.lender && <p className="text-xs text-gray-400 mt-0.5">{l.lender}</p>}
              </div>
              <div className="text-right flex-none">
                <p className="text-sm font-bold text-rose-600">{fmt(l.outstanding)}</p>
                <p className="text-xs text-gray-400">{fmt(l.monthlyEmi)}/mo</p>
              </div>
              <LiabilityDotsMenu
                onPay={() => setPayTarget(l)}
                onEdit={() => setEditTarget(l)}
                onDelete={() => { deleteLiability(l.id); toast('Liability removed'); }}
              />
            </div>
          ))}
          {/* Mobile footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50/60">
            <p className="text-xs font-semibold text-gray-500">{liabilities.length} loan{liabilities.length !== 1 ? 's' : ''}</p>
            <p className="text-sm font-bold text-rose-600">{fmt(summary.outstanding)}</p>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {[
                  { label: 'Loan',       right: false },
                  { label: 'Lender',     right: false },
                  { label: 'Total Loan', right: true  },
                  { label: 'Outstanding',right: true  },
                  { label: 'EMI',        right: true  },
                  { label: 'Left',       right: false },
                  { label: 'Next Due',   right: false },
                  { label: '',           right: false },
                ].map(h => (
                  <th key={h.label} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap ${h.right ? 'text-right' : ''}`}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/30">
              {filteredLiabilities.map(l => {
                const days        = daysUntil(l.nextDueDate);
                const dueSoon     = days !== null && days <= 7 && days >= 0;
                const overdue     = days !== null && days < 0;
                const paidPct     = l.borrowed > 0 ? Math.round((l.totalRepaid / l.borrowed) * 100) : 0;

                return (
                  <tr key={l.id} className="group transition hover:bg-gray-50/50">
                    {/* Loan name + mini progress */}
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{l.name}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1 w-20 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-1 rounded-full bg-emerald-500" style={{ width: `${paidPct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{paidPct}%</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">{l.lender || '—'}</td>
                    <td className="px-4 py-3.5 text-right text-sm text-gray-500 whitespace-nowrap">{fmt(l.borrowed)}</td>
                    <td className="px-4 py-3.5 text-right text-sm font-bold text-rose-600 whitespace-nowrap">{fmt(l.outstanding)}</td>
                    <td className="px-4 py-3.5 text-right text-sm text-gray-600 whitespace-nowrap">{fmt(l.monthlyEmi)}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${l.emisLeft <= 3 ? 'bg-rose-50 text-rose-600' : l.emisLeft <= 6 ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>
                        {l.emisLeft} left
                      </span>
                    </td>

                    {/* Next due */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${overdue ? 'text-rose-600' : dueSoon ? 'text-amber-600' : 'text-gray-500'}`}>
                        <CalendarDays className="h-3.5 w-3.5" />
                        {fmtDate(l.nextDueDate)}
                        {overdue  && <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-rose-600">Overdue</span>}
                        {dueSoon  && !overdue && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-600">Soon</span>}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <LiabilityDotsMenu
                        onPay={() => setPayTarget(l)}
                        onEdit={() => setEditTarget(l)}
                        onDelete={() => { deleteLiability(l.id); toast('Liability removed'); }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-100 bg-gray-50/60">
                <td colSpan={2} className="px-4 py-3 text-xs font-semibold text-gray-500">{liabilities.length} loan{liabilities.length !== 1 ? 's' : ''}</td>
                <td className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{fmt(summary.borrowed)}</td>
                <td className="px-4 py-3 text-right text-sm font-bold text-rose-600">{fmt(summary.outstanding)}</td>
                <td className="px-4 py-3 text-right text-xs text-gray-400">{fmt(liabilities.reduce((s, l) => s + l.monthlyEmi, 0))}/mo</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
        </>
      )}

      {/* ── Modals ── */}
      <AddLiabilityModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        accounts={accountList}
        onSave={payload => { addLiability(payload); }}
      />

      <AddLiabilityModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        initial={editTarget ?? undefined}
        accounts={accountList}
        onSave={payload => {
          if (!editTarget) return;
          updateLiability({ ...payload, id: editTarget.id });
        }}
      />

      <RecordPaymentModal
        liability={payTarget}
        open={!!payTarget}
        onClose={() => setPayTarget(null)}
        accounts={accountList}
      />
    </div>
  );
}