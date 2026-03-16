'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal, { SectionLabel, inputCls } from './Modal';
import { toast } from '@/components/Toast';
import { Liability } from '@/lib/financeData';

export type AddLiabilityProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: Omit<Liability, 'id'>) => Promise<void> | void;
  initial?: Liability; // when set → edit mode
};

export default function AddLiabilityModal({ open, onClose, onSave, initial }: AddLiabilityProps) {
  const isEdit = !!initial;

  const [name,        setName]        = useState('');
  const [lender,      setLender]      = useState('');
  const [borrowed,    setBorrowed]    = useState('');
  const [outstanding, setOutstanding] = useState('');
  const [totalRepaid, setTotalRepaid] = useState('');
  const [emi,         setEmi]         = useState('');
  const [emisLeft,    setEmisLeft]    = useState('');
  const [nextDue,     setNextDue]     = useState('');

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
    } else {
      setName(''); setLender(''); setBorrowed(''); setOutstanding('');
      setTotalRepaid('0'); setEmi(''); setEmisLeft(''); setNextDue('');
    }
  }, [initial, open]);

  const canSubmit = useMemo(() =>
    !!name.trim() &&
    Number(borrowed) > 0 &&
    Number(outstanding) >= 0 &&
    Number(emi) > 0,
  [name, borrowed, outstanding, emi]);

  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await onSave({
        name:         name.trim(),
        lender:       lender.trim(),
        borrowed:     Number(borrowed),
        outstanding:  Number(outstanding),
        totalRepaid:  Number(totalRepaid) || 0,
        monthlyEmi:   Number(emi),
        emisLeft:     Number(emisLeft) || 0,
        nextDueDate:  nextDue,
      });
      toast(isEdit ? 'Liability updated' : 'Liability added');
      onClose();
    } catch {
      toast('Failed to save liability. Please try again.');
    } finally {
      setSaving(false);
    }
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
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Monthly EMI (₹)</label>
              <input value={emi} onChange={e => setEmi(e.target.value)} placeholder="18500" type="number" min="1" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">EMIs remaining</label>
              <input value={emisLeft} onChange={e => setEmisLeft(e.target.value)} placeholder="12" type="number" min="0" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Next due date</label>
              <input value={nextDue} onChange={e => setNextDue(e.target.value)} type="date" className={inputCls} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <button type="button" onClick={onClose} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} disabled={!canSubmit || saving}
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? 'Saving…' : isEdit ? 'Update' : 'Save liability'}
        </button>
      </div>
    </Modal>
  );
}