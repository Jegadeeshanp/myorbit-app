'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal, { SectionLabel, OptionalBadge, inputCls } from './Modal';
import { toast } from '@/components/Toast';
import { Liability } from '@/lib/financeData';

export type AddLiabilityProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: Omit<Liability, 'id'>) => void;
  initial?: Liability;
  accounts?: { id: string; name: string; type?: string }[];
};

function shortAccLabel(a: { name: string; type?: string }) {
  const t = a.type;
  const short = t === 'Credit Card' ? 'Credit' : t === 'Debit Card' ? 'Debit' : t ?? '';
  return short ? a.name + ' – ' + short : a.name;
}

// EMI = P × r × (1+r)^n / ((1+r)^n − 1)
function calcEmi(principal: number, annualRatePct: number, totalMonths: number): number {
  if (!principal || !totalMonths) return 0;
  if (!annualRatePct) return Math.round(principal / totalMonths);
  const r = annualRatePct / 100 / 12;
  return Math.round(principal * r * Math.pow(1 + r, totalMonths) / (Math.pow(1 + r, totalMonths) - 1));
}

// Outstanding = EMI × (1 − (1+r)^(−n)) / r
function calcOutstanding(emi: number, annualRatePct: number, remainingMonths: number): number {
  if (!emi || !remainingMonths) return 0;
  if (!annualRatePct) return Math.round(emi * remainingMonths);
  const r = annualRatePct / 100 / 12;
  return Math.round(emi * (1 - Math.pow(1 + r, -remainingMonths)) / r);
}

const fmtInr = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function AddLiabilityModal({ open, onClose, onSave, initial, accounts = [] }: AddLiabilityProps) {
  const isEdit = !!initial;

  // Core inputs — always visible
  const [name,               setName]               = useState('');
  const [lender,             setLender]             = useState('');
  const [borrowed,           setBorrowed]           = useState('');
  const [interestRate,       setInterestRate]       = useState('');

  // Timeline inputs — drive auto-calculation when both are filled
  const [totalTenure,  setTotalTenure]  = useState(''); // original loan tenure, months
  const [monthsPaid,   setMonthsPaid]   = useState(''); // months already paid

  // Manual-override fields — shown only when auto-calc is not active
  const [manualOutstanding,  setManualOutstanding]  = useState('');
  const [manualEmi,          setManualEmi]          = useState('');
  const [manualEmisLeft,     setManualEmisLeft]     = useState('');
  const [manualTotalRepaid,  setManualTotalRepaid]  = useState('');

  const [nextDue,            setNextDue]            = useState('');
  const [repaymentAccountId, setRepaymentAccountId] = useState('');

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setLender(initial.lender ?? '');
      setBorrowed(String(initial.borrowed));
      setInterestRate(String(initial.interestRate ?? ''));
      // totalTenure / monthsPaid are not stored — user re-enters for auto-calc
      setTotalTenure('');
      setMonthsPaid('');
      setManualOutstanding(String(initial.outstanding));
      setManualEmi(String(initial.monthlyEmi));
      setManualEmisLeft(String(initial.emisLeft ?? ''));
      setManualTotalRepaid(String(initial.totalRepaid ?? 0));
      setNextDue(initial.nextDueDate ?? '');
      setRepaymentAccountId(initial.repaymentAccountId ?? '');
    } else {
      setName(''); setLender(''); setBorrowed(''); setInterestRate('');
      setTotalTenure(''); setMonthsPaid('');
      setManualOutstanding(''); setManualEmi(''); setManualEmisLeft('');
      setManualTotalRepaid('0');
      setNextDue(''); setRepaymentAccountId('');
    }
  }, [initial, open]);

  // Auto-calc activates when original tenure + months paid are both given
  const autoCalc = useMemo(() => {
    const P = Number(borrowed);
    const N = Number(totalTenure);
    const K = Number(monthsPaid);
    if (!P || !N || K < 0 || K >= N) return null;
    const r = Number(interestRate);
    const remaining = N - K;
    const emi = calcEmi(P, r, N);
    const outstanding = calcOutstanding(emi, r, remaining);
    const principalRepaid = Math.max(0, P - outstanding);
    return { emi, outstanding, remaining, principalRepaid };
  }, [borrowed, interestRate, totalTenure, monthsPaid]);

  const effective = {
    emi:          autoCalc?.emi          ?? Number(manualEmi)          ?? 0,
    outstanding:  autoCalc?.outstanding  ?? Number(manualOutstanding)  ?? 0,
    emisLeft:     autoCalc?.remaining    ?? Number(manualEmisLeft)     ?? 0,
    totalRepaid:  autoCalc?.principalRepaid ?? Number(manualTotalRepaid) ?? 0,
  };

  const canSubmit =
    !!name.trim() &&
    Number(borrowed) > 0 &&
    effective.outstanding >= 0 &&
    effective.emi > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave({
      name:               name.trim(),
      lender:             lender.trim() || undefined,
      borrowed:           Number(borrowed),
      outstanding:        effective.outstanding,
      totalRepaid:        effective.totalRepaid,
      monthlyEmi:         effective.emi,
      emisLeft:           effective.emisLeft,
      interestRate:       Number(interestRate) || undefined,
      nextDueDate:        nextDue || undefined,
      repaymentAccountId: repaymentAccountId || undefined,
    });
    toast(isEdit ? 'Liability updated' : 'Liability added');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit liability' : 'Add liability'}
      subtitle={isEdit ? 'Update loan details' : 'Track a loan or outstanding debt'}
    >
      <div className="max-h-[70vh] overflow-y-auto space-y-5 pr-0.5">

        {/* ── Loan identity ── */}
        <div>
          <SectionLabel>Loan details</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Loan name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Home Loan" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                Lender / Bank <OptionalBadge />
              </label>
              <input value={lender} onChange={e => setLender(e.target.value)} placeholder="SBI Bank" className={inputCls} />
            </div>
          </div>
        </div>

        {/* ── Loan parameters ── */}
        <div>
          <SectionLabel>Loan parameters</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Original loan amount (₹)</label>
              <input value={borrowed} onChange={e => setBorrowed(e.target.value)} placeholder="3000000" type="number" min="1" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                Interest rate <OptionalBadge />
                <span className="ml-1 text-xs font-normal text-gray-400">% per annum</span>
              </label>
              <input value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="8.5" type="number" min="0" max="100" step="0.01" className={inputCls} />
            </div>
          </div>
        </div>

        {/* ── Timeline (drives auto-calc) ── */}
        <div>
          <SectionLabel>Repayment timeline</SectionLabel>
          <p className="mb-2 text-xs text-gray-400">
            Fill both fields and everything else is auto-calculated. Leave blank to enter manually.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Original tenure
                <span className="ml-1 text-xs font-normal text-gray-400">(months)</span>
              </label>
              <input
                value={totalTenure}
                onChange={e => setTotalTenure(e.target.value)}
                placeholder="240 = 20 yrs"
                type="number" min="1"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Months paid so far
              </label>
              <input
                value={monthsPaid}
                onChange={e => setMonthsPaid(e.target.value)}
                placeholder="96 = 8 yrs"
                type="number" min="0"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* ── Auto-calculated preview ── */}
        {autoCalc && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 space-y-2">
            <p className="text-xs font-semibold text-emerald-700">Auto-calculated from your inputs</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <span className="text-gray-600">Monthly EMI</span>
              <span className="font-semibold text-emerald-700 text-right">{fmtInr(autoCalc.emi)}</span>
              <span className="text-gray-600">Current outstanding</span>
              <span className="font-semibold text-rose-600 text-right">{fmtInr(autoCalc.outstanding)}</span>
              <span className="text-gray-600">Months remaining</span>
              <span className="font-semibold text-right">{autoCalc.remaining}</span>
              <span className="text-gray-600">Principal repaid</span>
              <span className="font-semibold text-right">{fmtInr(autoCalc.principalRepaid)}</span>
            </div>
          </div>
        )}

        {/* ── Manual fields (hidden when auto-calc is active) ── */}
        {!autoCalc && (
          <div>
            <SectionLabel>Current loan status</SectionLabel>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Outstanding balance (₹)</label>
                <input value={manualOutstanding} onChange={e => setManualOutstanding(e.target.value)} placeholder="1500000" type="number" min="0" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Monthly EMI (₹)</label>
                <input value={manualEmi} onChange={e => setManualEmi(e.target.value)} placeholder="26000" type="number" min="1" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">EMIs left</label>
                  <input value={manualEmisLeft} onChange={e => setManualEmisLeft(e.target.value)} placeholder="144" type="number" min="0" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                    Total repaid (₹) <OptionalBadge />
                  </label>
                  <input value={manualTotalRepaid} onChange={e => setManualTotalRepaid(e.target.value)} placeholder="0" type="number" min="0" className={inputCls} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Schedule ── */}
        <div>
          <SectionLabel>Schedule</SectionLabel>
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
              Next due date <OptionalBadge />
            </label>
            <input value={nextDue} onChange={e => setNextDue(e.target.value)} type="date" className={inputCls} />
          </div>
        </div>

        {/* ── Repayment account ── */}
        {accounts.length > 0 && (
          <div>
            <SectionLabel>Repayment</SectionLabel>
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                Repayment account <OptionalBadge />
              </label>
              <select value={repaymentAccountId} onChange={e => setRepaymentAccountId(e.target.value)} className={inputCls}>
                <option value="">— select account —</option>
                {accounts.map(a => (<option key={a.id} value={a.id}>{shortAccLabel(a)}</option>))}
              </select>
              <p className="mt-1.5 text-xs text-gray-400">
                EMI will be debited from this account each time you record a payment.
              </p>
            </div>
          </div>
        )}

      </div>

      <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <button type="button" onClick={onClose} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} disabled={!canSubmit}
          className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
          {isEdit ? 'Update' : 'Save liability'}
        </button>
      </div>
    </Modal>
  );
}
