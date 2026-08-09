'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal, { SectionLabel, OptionalBadge, inputCls } from './Modal';
import { toast } from '@/components/Toast';
import { Asset, SipConfig } from '@/lib/financeData';
import { ASSET_CATEGORIES, AssetCategory } from '@/lib/assetCategories';

export type AddAssetProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: Omit<Asset, 'id'>) => void | Promise<void>;
  initial?: Asset;
  accounts?: { id: string; name: string; type?: string }[];
};

type InvestmentType = 'lump_sum' | 'sip';
type SipFrequency  = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
type SipEndType    = 'forever' | 'after' | 'on_date';

const FREQ_OPTS: { value: SipFrequency; label: string }[] = [
  { value: 'daily',   label: 'Daily'   },
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly'  },
  { value: 'custom',  label: 'Custom'  },
];

function shortAccLabel(a: { name: string; type?: string }) {
  const t = a.type;
  const s = t === 'Credit Card' ? 'Credit' : t === 'Debit Card' ? 'Debit' : t ?? '';
  return s ? `${a.name} – ${s}` : a.name;
}

export default function AddAssetModal({ open, onClose, onSave, initial, accounts = [] }: AddAssetProps) {
  const [name,          setName]          = useState('');
  const [category,      setCategory]      = useState<AssetCategory>('Stocks & Equity');
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [value,         setValue]         = useState('');
  const [invested,      setInvested]      = useState('');
  const [units,         setUnits]         = useState('');
  const [perUnit,       setPerUnit]       = useState('');
  const [accountId,     setAccountId]     = useState('');
  const [invType,       setInvType]       = useState<InvestmentType>('lump_sum');
  const [symbol,        setSymbol]        = useState('');

  // SIP-specific
  const [sipFreq,       setSipFreq]       = useState<SipFrequency>('monthly');
  const [sipStart,      setSipStart]      = useState(() => new Date().toISOString().slice(0, 10));
  const [sipEndType,    setSipEndType]    = useState<SipEndType>('forever');
  const [sipEndAfter,   setSipEndAfter]   = useState('');
  const [sipEndDate,    setSipEndDate]    = useState('');
  const [sipAmount,     setSipAmount]     = useState('');

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      const validCat = ASSET_CATEGORIES.find(c => c.label === initial.category);
      setCategory(validCat ? (initial.category as AssetCategory) : 'Other');
      setValue(initial.value > 0 ? String(initial.value) : '');
      setInvested(String(initial.invested));
      setUnits(initial.units != null ? String(initial.units) : '');
      setPerUnit(initial.units && initial.units > 0 && initial.value > 0 ? String(Math.round((initial.value / initial.units) * 100) / 100) : '');
      setSymbol(initial.symbol ?? '');
      setAccountId(initial.accountId ?? '');
      setInvType((initial.investmentType ?? 'lump_sum') as InvestmentType);
      if (initial.sipConfig) {
        setSipFreq(initial.sipConfig.frequency as SipFrequency);
        setSipStart(initial.sipConfig.startDate);
        setSipEndType(initial.sipConfig.endType as SipEndType);
        setSipEndAfter(initial.sipConfig.endAfterTimes != null ? String(initial.sipConfig.endAfterTimes) : '');
        setSipEndDate(initial.sipConfig.endDate ?? '');
        setSipAmount(initial.sipConfig.amount != null ? String(initial.sipConfig.amount) : '');
      } else {
        setSipFreq('monthly');
        setSipStart(new Date().toISOString().slice(0, 10));
        setSipEndType('forever');
        setSipEndAfter('');
        setSipEndDate('');
        setSipAmount('');
      }
    } else {
      setName(''); setCategory('Stocks & Equity'); setValue(''); setInvested('');
      setUnits(''); setPerUnit(''); setSymbol('');
      setAccountId(''); setInvType('lump_sum');
      setSipFreq('monthly'); setSipStart(new Date().toISOString().slice(0, 10));
      setSipEndType('forever'); setSipEndAfter(''); setSipEndDate(''); setSipAmount('');
    }
  }, [open]);

  const canSubmit = useMemo(() =>
    !!name.trim() && (invType === 'sip' ? Number(sipAmount) > 0 : Number(invested) > 0),
  [name, invested, invType, sipAmount]);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const numUnits = Number(units) > 0 ? Number(units) : undefined;
      const numPerUnit = Number(perUnit) > 0 ? Number(perUnit) : undefined;
      const computedValue = numUnits && numPerUnit ? numUnits * numPerUnit : Number(value) > 0 ? Number(value) : Number(invested);
      const sipCfg: SipConfig | null = invType === 'sip' ? {
        frequency: sipFreq,
        startDate: sipStart,
        endType: sipEndType,
        endAfterTimes: sipEndType === 'after' && sipEndAfter ? Number(sipEndAfter) : undefined,
        endDate: sipEndType === 'on_date' && sipEndDate ? sipEndDate : undefined,
        amount: Number(sipAmount) > 0 ? Number(sipAmount) : undefined,
      } : null;

      await onSave({
        name: name.trim(),
        category,
        value: computedValue,
        invested: Number(invested),
        units: numUnits ?? null,
        symbol: symbol.trim() || null,
        accountId: accountId || undefined,
        investmentType: invType,
        sipConfig: sipCfg,
      } as any);
      toast(initial ? 'Asset updated' : 'Asset added');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const selected = ASSET_CATEGORIES.find(c => c.label === category) ?? ASSET_CATEGORIES[ASSET_CATEGORIES.length - 1];
  const isEdit = !!initial;

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button type="button" onClick={onClose} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
        Cancel
      </button>
      <button type="button" onClick={handleSubmit} disabled={!canSubmit || isSubmitting}
        className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
        {isSubmitting ? 'Saving…' : isEdit ? 'Update asset' : 'Save asset'}
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit asset' : 'Add asset'} subtitle="Track an investment or asset" footer={footer}>
      <div className="max-h-[70vh] overflow-y-auto space-y-5 pr-0.5">

        {/* ── Asset class ── */}
        <div>
          <SectionLabel>Asset class</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {ASSET_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = category === cat.label;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setCategory(cat.label)}
                  title={cat.label}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition active:scale-95 ${
                    isSelected
                      ? `border-2 ${cat.color.replace('text-', 'border-')} ${cat.bg}`
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cat.bg}`}>
                    <Icon className={`h-4 w-4 ${cat.color}`} />
                  </div>
                  <span className={`text-[10px] font-medium leading-tight ${isSelected ? cat.color : 'text-gray-500'}`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Selected badge */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-400">Selected:</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${selected.tagBg} ${selected.tagText}`}>
              <selected.icon className="h-3 w-3" />
              {selected.label}
            </span>
          </div>
        </div>

        {/* ── Asset details ── */}
        <div>
          <SectionLabel>Asset details</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Asset name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }}
                placeholder={`e.g. ${category === 'Stocks & Equity' ? 'Reliance Industries' : category === 'Real Estate' ? 'Mumbai Apartment' : 'My ' + category}`}
                className={inputCls}
              />
            </div>

            {/* Account */}
            {accounts.length > 0 && (
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                  Account <OptionalBadge />
                </label>
                <select value={accountId} onChange={e => setAccountId(e.target.value)} className={inputCls}>
                  <option value="">— none —</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{shortAccLabel(a)}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Amount invested (₹)</label>
              <input value={invested} onChange={e => setInvested(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }} placeholder="0" type="number" min="1" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                  Units <OptionalBadge />
                </label>
                <input value={units} onChange={e => setUnits(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }} placeholder="e.g. 50" type="number" min="0" step="any" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                  Per Unit (₹) <OptionalBadge />
                </label>
                <input value={perUnit} onChange={e => { setPerUnit(e.target.value); if (Number(units) > 0 && Number(e.target.value) > 0) setValue(String(Number(units) * Number(e.target.value))); }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }} placeholder="e.g. 2500" type="number" min="0" step="any" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                Current value (₹) <OptionalBadge />
              </label>
              <input value={value} onChange={e => { setValue(e.target.value); if (Number(units) > 0 && Number(e.target.value) > 0) setPerUnit(String(Math.round((Number(e.target.value) / Number(units)) * 100) / 100)); }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }} placeholder="Auto-computed from units × per unit, or enter directly" type="number" min="0" className={inputCls} />
            </div>
            {(['Stocks & Equity', 'Mutual Funds', 'Gold & Silver'] as AssetCategory[]).includes(category) && (
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                  Market ticker / Scheme code <OptionalBadge />
                </label>
                <input
                  value={symbol}
                  onChange={e => setSymbol(e.target.value)}
                  placeholder={
                    category === 'Mutual Funds'
                      ? '119551  (AMFI scheme code)'
                      : category === 'Gold & Silver'
                      ? 'GOLDBEES.NS'
                      : 'RELIANCE.NS'
                  }
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-gray-400">
                  {category === 'Stocks & Equity' && 'NSE: RELIANCE.NS · BSE: 500325.BO — value auto-updates daily at 10 AM & 4 PM'}
                  {category === 'Mutual Funds' && 'Find your code at mfapi.in — NAV auto-updates daily — requires Units to be set'}
                  {category === 'Gold & Silver' && 'NSE ETF ticker e.g. GOLDBEES.NS — value auto-updates daily — requires Units to be set'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Investment type toggle ── */}
        <div>
          <SectionLabel>Investment type</SectionLabel>
          <div className="flex gap-2">
            {(['lump_sum', 'sip'] as InvestmentType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setInvType(t)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${
                  invType === t
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {t === 'lump_sum' ? 'Lump sum' : 'SIP'}
              </button>
            ))}
          </div>
        </div>

        {/* ── SIP details (shown only when SIP is selected) ── */}
        {invType === 'sip' && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 space-y-4">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">SIP Schedule</p>

            {/* SIP Amount */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                SIP Amount per installment (₹)
              </label>
              <input
                value={sipAmount}
                onChange={e => setSipAmount(e.target.value)}
                placeholder="e.g. 5000"
                type="number"
                min="1"
                className={inputCls}
              />
              <p className="mt-1 text-xs text-gray-400">Deducted from the linked account each installment</p>
            </div>

            {/* Frequency */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-500">Frequency</label>
              <div className="flex flex-wrap gap-1.5">
                {FREQ_OPTS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSipFreq(opt.value)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      sipFreq === opt.value
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start date */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">Start date</label>
              <input type="date" value={sipStart} onChange={e => setSipStart(e.target.value)} className={inputCls} />
            </div>

            {/* Duration */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-500">Duration</label>
              <div className="space-y-2">
                {/* Forever */}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition hover:border-emerald-400">
                  <input type="radio" name="sipEndType" checked={sipEndType === 'forever'} onChange={() => setSipEndType('forever')} className="accent-emerald-500" />
                  <span className="text-sm font-medium text-gray-700">Forever</span>
                </label>
                {/* After N times */}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition hover:border-emerald-400">
                  <input type="radio" name="sipEndType" checked={sipEndType === 'after'} onChange={() => setSipEndType('after')} className="accent-emerald-500" />
                  <span className="flex flex-1 items-center gap-2 text-sm font-medium text-gray-700">
                    After
                    <input
                      type="number" min="1"
                      value={sipEndAfter}
                      onChange={e => { setSipEndAfter(e.target.value); setSipEndType('after'); }}
                      onClick={e => e.stopPropagation()}
                      placeholder="12"
                      className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-center text-sm focus:border-emerald-400 focus:outline-none"
                    />
                    times
                  </span>
                </label>
                {/* On date */}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition hover:border-emerald-400">
                  <input type="radio" name="sipEndType" checked={sipEndType === 'on_date'} onChange={() => setSipEndType('on_date')} className="accent-emerald-500" />
                  <span className="flex flex-1 items-center gap-2 text-sm font-medium text-gray-700">
                    On date
                    <input
                      type="date"
                      value={sipEndDate}
                      onChange={e => { setSipEndDate(e.target.value); setSipEndType('on_date'); }}
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
    </Modal>
  );
}