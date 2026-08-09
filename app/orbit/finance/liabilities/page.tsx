'use client';

import { useMemo, useState } from 'react';
import { PlusCircle, Pencil, Trash2, CreditCard, CheckCircle2, AlertCircle, CalendarDays, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
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
}: {
  liability: Liability | null;
  open: boolean;
  onClose: () => void;
}) {
  const { recordLiabilityPayment } = useFinance();
  const [amount, setAmount] = useState('');

  const suggested = liability?.monthlyEmi ?? 0;
  const max       = liability?.outstanding ?? 0;
  const paid      = Number(amount) || 0;
  const canSave   = paid > 0 && paid <= max;

  // Reducing-balance breakdown for display
  const interestDue = liability?.interestRate && liability.interestRate > 0
    ? Math.round(max * liability.interestRate / 100 / 12)
    : 0;
  const principalPaid = paid > 0 ? Math.max(0, paid - interestDue) : 0;

  const handleSave = () => {
    if (!liability || !canSave) return;
    recordLiabilityPayment(liability.id, paid);
    toast(`Payment of ${fmt(paid)} recorded`);
    setAmount('');
    onClose();
  };

  if (!liability) return null;

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

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-500 space-y-1">
          <div className="flex justify-between"><span>Outstanding before</span><span className="font-semibold text-rose-600">{fmt(max)}</span></div>
          {interestDue > 0 && paid > 0 && (
            <>
              <div className="flex justify-between"><span>Interest (this month)</span><span className="text-orange-500">{fmt(interestDue)}</span></div>
              <div className="flex justify-between"><span>Principal reduction</span><span className="text-emerald-600">{fmt(principalPaid)}</span></div>
            </>
          )}
          <div className="flex justify-between"><span>Outstanding after</span><span className="font-semibold text-emerald-600">{fmt(Math.max(0, max - principalPaid))}</span></div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={!canSave}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed">
            Record payment
          </button>
        </div>
      </div>
    </Modal>
  );
}

type LiabSortKey = 'name' | 'lender' | 'borrowed' | 'outstanding' | 'monthlyEmi' | 'emisLeft' | 'nextDueDate';
const LIAB_COL_SORT: Record<string, LiabSortKey | undefined> = {
  Loan: 'name', Lender: 'lender', Borrowed: 'borrowed', Outstanding: 'outstanding',
  'Monthly EMI': 'monthlyEmi', 'EMIs Left': 'emisLeft', 'Next Due': 'nextDueDate',
};
const LIAB_RIGHT_COLS = new Set(['Borrowed', 'Outstanding', 'Monthly EMI']);

// ── Main page ──────────────────────────────────────────────────────────────
export default function LiabilitiesPage() {
  const { state, addLiability, updateLiability, deleteLiability } = useFinance();
  const liabilities = state.liabilities;

  const [addOpen,     setAddOpen]     = useState(false);
  const [editTarget,  setEditTarget]  = useState<Liability | null>(null);
  const [payTarget,   setPayTarget]   = useState<Liability | null>(null);
  const [sortKey,     setSortKey]     = useState<LiabSortKey | null>(null);
  const [sortDir,     setSortDir]     = useState<'asc' | 'desc'>('asc');

  const summary = useMemo(() => {
    const borrowed    = liabilities.reduce((s, l) => s + l.borrowed, 0);
    const outstanding = liabilities.reduce((s, l) => s + l.outstanding, 0);
    const repaid      = liabilities.reduce((s, l) => s + (l.totalRepaid ?? 0), 0);
    return { borrowed, outstanding, repaid };
  }, [liabilities]);

  const sortedLiabilities = useMemo(() => {
    if (!sortKey) return liabilities;
    return [...liabilities].sort((a, b) => {
      let av: number | string, bv: number | string;
      switch (sortKey) {
        case 'name':        av = a.name.toLowerCase();            bv = b.name.toLowerCase();           break;
        case 'lender':      av = (a.lender ?? '').toLowerCase();  bv = (b.lender ?? '').toLowerCase(); break;
        case 'borrowed':    av = a.borrowed;                      bv = b.borrowed;                     break;
        case 'outstanding': av = a.outstanding;                   bv = b.outstanding;                  break;
        case 'monthlyEmi':  av = a.monthlyEmi;                    bv = b.monthlyEmi;                   break;
        case 'emisLeft':    av = a.emisLeft;                      bv = b.emisLeft;                     break;
        case 'nextDueDate': av = a.nextDueDate ?? '';             bv = b.nextDueDate ?? '';            break;
        default:            av = 0;                               bv = 0;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [liabilities, sortKey, sortDir]);

  function handleSort(key: LiabSortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  const repaidPct = summary.borrowed > 0
    ? Math.round((summary.repaid / summary.borrowed) * 100)
    : 0;

  if (state.loadState === 'loading') return <LiabilitiesSkeleton />;

  return (
    <div className="space-y-6">
      <FinanceTopBar />

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-blue-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-4 shadow-sm">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-blue-50 dark:bg-[#5BE4FF]/[0.1]">
            <CreditCard className="h-5 w-5 text-blue-600 dark:text-[#5BE4FF]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 dark:text-[#3d5166]">Total Borrowed</p>
            <p className="text-lg font-bold text-blue-600 dark:text-[#5BE4FF] truncate">{fmt(summary.borrowed)}</p>
            <p className="text-xs text-gray-400 dark:text-[#3d5166]">{liabilities.length} loan{liabilities.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-4 shadow-sm">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-emerald-50 dark:bg-[#00e5a0]/[0.1]">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-[#00E5A0]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 dark:text-[#3d5166]">Total Repaid</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-[#00E5A0] truncate">{fmt(summary.repaid)}</p>
            <p className="text-xs text-gray-400 dark:text-[#3d5166]">{repaidPct}% of borrowed</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-rose-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-4 shadow-sm">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-rose-50 dark:bg-[#FF6B6B]/[0.1]">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-[#FF6B6B]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 dark:text-[#3d5166]">Outstanding Balance</p>
            <p className="text-lg font-bold text-rose-600 dark:text-[#FF6B6B] truncate">{fmt(summary.outstanding)}</p>
            <p className="text-xs text-gray-400 dark:text-[#3d5166]">{100 - repaidPct}% remaining</p>
          </div>
        </div>
      </div>

      {/* ── Add button ── */}
      <div className="flex justify-end">
        <button type="button" onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 dark:bg-[#00E5A0] px-4 py-2 text-sm font-semibold text-white dark:text-black shadow-sm transition hover:bg-emerald-700 dark:hover:bg-[#00c990]">
          <PlusCircle className="h-4 w-4" /> Add liability
        </button>
      </div>

      {/* ── Overall repayment progress ── */}
      {liabilities.length > 0 && (
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] px-5 py-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-gray-600 dark:text-[#8fa3b8]">Overall repayment progress</span>
            <span className="font-semibold text-emerald-600 dark:text-[#00E5A0]">{repaidPct}% paid</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
            <div className="h-2 rounded-full bg-emerald-500 dark:bg-[#00E5A0] transition-all" style={{ width: `${repaidPct}%` }} />
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {liabilities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.1] bg-gray-50/50 dark:bg-white/[0.02] py-14 text-center">
          <CreditCard className="mb-3 h-8 w-8 text-gray-300 dark:text-[#3d5166]" />
          <p className="text-sm text-gray-500 dark:text-[#8fa3b8]">No liabilities added yet</p>
          <button onClick={() => setAddOpen(true)} className="mt-3 text-xs font-medium text-emerald-600 dark:text-[#00E5A0] hover:text-emerald-700 dark:hover:text-[#00c990]">
            + Add your first loan
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.07] bg-gray-50/60 dark:bg-white/[0.02]">
                {['Loan', 'Lender', 'Borrowed', 'Outstanding', 'Monthly EMI', 'EMIs Left', 'Next Due', 'Actions'].map(h => {
                  const key = LIAB_COL_SORT[h];
                  const active = !!key && sortKey === key;
                  const Icon = active ? (sortDir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
                  return (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${active ? 'text-emerald-600 dark:text-[#00E5A0]' : 'text-gray-400 dark:text-[#3d5166]'} ${LIAB_RIGHT_COLS.has(h) ? 'text-right' : ''}`}>
                      {key ? (
                        <button
                          onClick={() => handleSort(key)}
                          className="inline-flex items-center gap-1 hover:text-gray-600 dark:hover:text-[#e4eaf4] transition"
                        >
                          {h}<Icon className={`h-3 w-3 flex-none ${active ? 'opacity-100' : 'opacity-40'}`} />
                        </button>
                      ) : h}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
              {sortedLiabilities.map(l => {
                const days        = daysUntil(l.nextDueDate);
                const dueSoon     = days !== null && days <= 7 && days >= 0;
                const overdue     = days !== null && days < 0;
                const paidPct     = l.borrowed > 0 ? Math.round((l.totalRepaid / l.borrowed) * 100) : 0;

                return (
                  <tr key={l.id} className="group transition hover:bg-gray-50/50 dark:hover:bg-white/[0.03]">
                    {/* Loan name + mini progress */}
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-[#e4eaf4] whitespace-nowrap">{l.name}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                          <div className="h-1 rounded-full bg-emerald-500 dark:bg-[#00E5A0]" style={{ width: `${paidPct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 dark:text-[#3d5166]">{paidPct}%</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-[#8fa3b8] whitespace-nowrap">{l.lender || '—'}</td>
                    <td className="px-4 py-3.5 text-right text-sm text-gray-500 dark:text-[#8fa3b8] whitespace-nowrap">{fmt(l.borrowed)}</td>
                    <td className="px-4 py-3.5 text-right text-sm font-bold text-rose-600 dark:text-[#FF6B6B] whitespace-nowrap">{fmt(l.outstanding)}</td>
                    <td className="px-4 py-3.5 text-right text-sm text-gray-600 dark:text-[#8fa3b8] whitespace-nowrap">{fmt(l.monthlyEmi)}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${l.emisLeft <= 3 ? 'bg-rose-50 dark:bg-[#FF6B6B]/[0.1] text-rose-600 dark:text-[#FF6B6B]' : l.emisLeft <= 6 ? 'bg-amber-50 dark:bg-[#F9A44A]/[0.1] text-amber-600 dark:text-[#F9A44A]' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-[#8fa3b8]'}`}>
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
                      <div className="flex items-center gap-1">
                        {/* Record payment */}
                        <button
                          onClick={() => { setPayTarget(l); }}
                          title="Record payment"
                          className="flex h-7 items-center gap-1 rounded-lg bg-emerald-50 px-2 text-xs font-medium text-emerald-600 transition hover:bg-emerald-100"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Pay
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => setEditTarget(l)}
                          title="Edit"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => { deleteLiability(l.id); toast('Liability removed'); }}
                          title="Delete"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition hover:bg-rose-50 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-100 dark:border-white/[0.07] bg-gray-50/60 dark:bg-white/[0.02]">
                <td colSpan={2} className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-[#8fa3b8]">{liabilities.length} loan{liabilities.length !== 1 ? 's' : ''}</td>
                <td className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-[#8fa3b8]">{fmt(summary.borrowed)}</td>
                <td className="px-4 py-3 text-right text-sm font-bold text-rose-600 dark:text-[#FF6B6B]">{fmt(summary.outstanding)}</td>
                <td className="px-4 py-3 text-right text-xs text-gray-400 dark:text-[#3d5166]">{fmt(liabilities.reduce((s, l) => s + l.monthlyEmi, 0))}/mo</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Modals ── */}
      <AddLiabilityModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={payload => { addLiability(payload); }}
      />

      <AddLiabilityModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        initial={editTarget ?? undefined}
        onSave={payload => {
          if (!editTarget) return;
          updateLiability({ ...payload, id: editTarget.id });
        }}
      />

      <RecordPaymentModal
        liability={payTarget}
        open={!!payTarget}
        onClose={() => setPayTarget(null)}
      />
    </div>
  );
}