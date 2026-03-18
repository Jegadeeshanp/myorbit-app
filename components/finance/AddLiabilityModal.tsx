'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal, { SectionLabel, OptionalBadge, inputCls } from './Modal';
import { toast } from '@/components/Toast';
import { Liability } from '@/lib/financeData';

export type AddLiabilityProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: Omit<Liability, 'id'>) => void;
  initial?: Liability; // when set → edit mode
  accounts?: { id: string; name: string; type?: string }[];
};

function shortAccLabel(a: { name: string; type?: string }) {
  const t = a.type;
  const short = t === 'Credit Card' ? 'Credit' : t === 'Debit Card' ? 'Debit' : t ?? '';
  return short ? a.name + ' – ' + short : a.name;
}

export default function AddLiabilityModal({ open, onClose, onSave, initial, accounts = [] }: AddLiabilityProps) {
  const isEdit = !!initial;

  const [name,               setName]               = useState('');
  const [lender,             setLender]             = useState('');
  const [borrowed,           setBorrowed]           = useState('');
  const [outstanding,        setOutstanding]        = useState('');
  const [totalRepaid,        setTotalRepaid]        = useState('');
  const [emi,                setEmi]                = useState('');
  const [emisLeft,           setEmisLeft]           = useState('');
  const [nextDue,            setNextDue]            = useState('');
  const [repaymentAccountId, setRepaymentAccountId] = useState('');

  // Populate fields when editing
  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setLender(initial.lender ?? '');
      setBorrowed(String(initial.borrowed));
      setOutstanding(String(initial.outstanding));
      setTotalRepaid(String(initial.totalRepaid ?? 0));
      setEmi(String(initial.monthlyEmi));
      setEmisLeft(String(initial.emisLeft ?? ''));
      setNextDue(initial.nextDueDate ?? '');
      setRepaymentAccountId(initial.repaymentAccountId ?? '');
    } else {
      setName(''); setLender(''); setBorrowed(''); setOutstanding('');
      setTotalRepaid('0'); setEmi(''); setEmisLeft(''); setNextDue('');
      setRepaymentAccountId('');
    }
  }, [initial, open]);

  const canSubmit = useMemo(() =>
    !!name.trim() &&
    Number(borrowed) > 0 &&
    Number(outstanding) >= 0 &&
    Number(emi) > 0,
  [name, borrowed, outstanding, emi]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave({
      name:               name.trim(),
      lender:             lender.trim(),
      borrowed:           Number(borrowed),
      outstanding:        Number(outstanding),
      totalRepaid:        Number(totalRepaid) || 0,
      monthlyEmi:         Number(emi),
      emisLeft:           Number(emisLeft) || 0,
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

        <div>
          <SectionLabel>Loan details</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Loan name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Home Loan" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Lender / Bank</label>
              <input value={lender} onChange={e => setLender(e.target.value)} placeholder="SBI Bank" className={inputCls} />
            </div>
          </div>
        </div>

        <div>
          <SectionLabel>Amounts</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Total borrowed (₹)</label>
              <input value={borrowed} onChange={e => setBorrowed(e.target.value)} placeholder="2500000" type="number" min="1" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Outstanding balance (₹)</label>
              <input value={outstanding} onChange={e => setOutstanding(e.target.value)} placeholder="210000" type="number" min="0" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Total repaid (₹)</label>
              <input value={totalRepaid} onChange={e => setTotalRepaid(e.target.value)} placeholder="0" type="number" min="0" className={inputCls} />
            </div>
          </div>
        </div>

        <div>
          <SectionLabel>EMI details</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                EMI <span className="ml-1 text-xs font-normal text-gray-400">(Monthly EMI)</span> (₹)
              </label>
              <input value={emi} onChange={e => setEmi(e.target.value)} placeholder="18500" type="number" min="1" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Left <span className="ml-1 text-xs font-normal text-gray-400">(EMIs Left)</span>
              </label>
              <input value={emisLeft} onChange={e => setEmisLeft(e.target.value)} placeholder="12" type="number" min="0" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Next due date</label>
              <input value={nextDue} onChange={e => setNextDue(e.target.value)} type="date" className={inputCls} />
            </div>
          </div>
        </div>

        {/* ── Repayment account ── */}
        {accounts.length > 0 && (
          <div>
            <SectionLabel>Repayment</SectionLabel>
            <div className="space-y-3">
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