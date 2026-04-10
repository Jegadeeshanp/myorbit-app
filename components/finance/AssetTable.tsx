'use client';

import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { Asset } from '@/lib/financeData';
import { useFinance } from '@/lib/financeStore';
import { getCategoryConfig } from '@/lib/assetCategories';
import { Trash2, Pencil, MoreHorizontal, PlusCircle, MinusCircle, Repeat2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import Modal, { SectionLabel, inputCls } from './Modal';
import { toast } from '@/components/Toast';

function fmt(v: number) {
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

type Props = {
  assets: Asset[];
  totalPortfolioValue?: number;
  onEdit?: (asset: Asset) => void;
};

// ── Invest / Redeem / SIP modal ─────────────────────────────────────────────
type InvestTab = 'invest' | 'redeem';

function InvestModal({
  open, onClose, asset, accounts,
}: {
  open: boolean;
  onClose: () => void;
  asset: Asset | null;
  accounts: { id: string; name: string; type?: string }[];
}) {
  const { investAsset, setupAssetSip } = useFinance();
  const [tab, setTab]           = useState<InvestTab>('invest');
  // invest tab state
  const [recurring, setRecurring] = useState(false);
  const [amount, setAmount]       = useState('');
  const [date, setDate]           = useState(() => new Date().toLocaleDateString('en-CA'));
  const [dayOfMonth, setDay]      = useState<number>(new Date().getDate());
  const [accountId, setAccId]     = useState('');
  const [note, setNote]           = useState('');

  useEffect(() => {
    if (open) {
      setTab('invest'); setRecurring(false);
      setAmount(''); setDate(new Date().toLocaleDateString('en-CA'));
      setDay(new Date().getDate());
      setAccId(accounts[0]?.id ?? ''); setNote('');
    }
  }, [open]);

  const canSave = !!amount && Number(amount) > 0;

  async function handleSave() {
    if (!asset || !canSave) return;
    try {
      if (tab === 'redeem') {
        await investAsset(asset.id, Number(amount), 'REDEMPTION', date, accountId || undefined, note || undefined);
        toast('Withdrawal recorded');
      } else if (recurring) {
        await setupAssetSip(asset.id, Number(amount), dayOfMonth, accountId || undefined, note || undefined);
        toast('Monthly SIP scheduled ✓');
      } else {
        await investAsset(asset.id, Number(amount), 'LUMPSUM', date, accountId || undefined, note || undefined);
        toast('Investment added');
      }
      onClose();
    } catch (e: any) {
      toast(e.message ?? 'Failed to save', 'error');
    }
  }

  const saveLabel = tab === 'redeem' ? 'Record Withdrawal'
    : recurring ? 'Start Monthly SIP'
    : 'Add Investment';
  const saveCls = tab === 'redeem'
    ? 'bg-rose-600 hover:bg-rose-700'
    : 'bg-emerald-700 hover:bg-emerald-800';

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button type="button" onClick={onClose}
        className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
        Cancel
      </button>
      <button type="button" onClick={handleSave} disabled={!canSave}
        className={`rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${saveCls}`}>
        {saveLabel}
      </button>
    </div>
  );

  return (
    <Modal
      open={open} onClose={onClose}
      title={tab === 'redeem' ? 'Withdraw / Redeem' : recurring ? 'Start Monthly SIP' : 'Add Investment'}
      subtitle={asset?.name}
      footer={footer}
    >
      <div className="space-y-4">

        {/* ── Action tabs: Invest | Withdraw ── */}
        <div className="flex gap-2">
          {([
            { key: 'invest' as InvestTab, label: '+ Invest' },
            { key: 'redeem' as InvestTab, label: '− Withdraw' },
          ]).map(opt => (
            <button key={opt.key} type="button" onClick={() => { setTab(opt.key); setRecurring(false); }}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${
                tab === opt.key
                  ? opt.key === 'redeem'
                    ? 'border-rose-400 bg-rose-50 text-rose-700 shadow-sm'
                    : 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* ── Invest tab: One-time / Recurring toggle ── */}
        {tab === 'invest' && (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <Repeat2 className="h-4 w-4 flex-none text-gray-400" />
            <span className="flex-1 text-sm font-medium text-gray-700">Monthly SIP (recurring)</span>
            <button
              type="button"
              onClick={() => setRecurring(v => !v)}
              className={`relative inline-flex h-6 w-10 flex-none items-center rounded-full transition-colors ${
                recurring ? 'bg-emerald-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                recurring ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>
        )}

        {/* ── Amount ── */}
        <div>
          <SectionLabel>Amount (₹)</SectionLabel>
          <input
            type="number" min="1" placeholder="0"
            value={amount} onChange={e => setAmount(e.target.value)}
            className={inputCls} autoFocus
          />
        </div>

        {/* ── One-time: date field | Recurring: day-of-month picker ── */}
        {tab === 'invest' && recurring ? (
          <div>
            <SectionLabel>Debit on day of month</SectionLabel>
            <div className="flex items-center gap-3">
              <input
                type="number" min="1" max="28"
                value={dayOfMonth}
                onChange={e => setDay(Math.min(28, Math.max(1, Number(e.target.value))))}
                className={`${inputCls} w-24`}
              />
              <span className="text-sm text-gray-400">of every month (1 – 28)</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              First debit: {(() => {
                const now = new Date();
                const today = now.getDate();
                let m = now.getMonth(), y = now.getFullYear();
                if (dayOfMonth <= today) { m += 1; if (m > 11) { m = 0; y += 1; } }
                const maxD = new Date(y, m + 1, 0).getDate();
                const d = Math.min(dayOfMonth, maxD);
                return new Date(y, m, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
              })()}
            </p>
          </div>
        ) : (
          <div>
            <SectionLabel>Date</SectionLabel>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
          </div>
        )}

        {/* ── Account ── */}
        {accounts.length > 0 && (
          <div>
            <SectionLabel>
              {tab === 'invest' ? 'Debit Account' : 'Credit Account'}
              <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
            </SectionLabel>
            <select value={accountId} onChange={e => setAccId(e.target.value)} className={inputCls}>
              <option value="">— none —</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}{a.type ? ` – ${a.type}` : ''}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── Note ── */}
        <div>
          <SectionLabel>Note <span className="text-xs font-normal text-gray-400">(optional)</span></SectionLabel>
          <input
            type="text" placeholder={recurring ? 'e.g. Monthly SIP via HDFC' : 'e.g. Q1 top-up'}
            value={note} onChange={e => setNote(e.target.value)}
            className={inputCls}
          />
        </div>

      </div>
    </Modal>
  );
}

// ── Dots menu ───────────────────────────────────────────────────────────────
function CardMenu({
  onEdit, onDelete, onInvest, onRedeem,
}: {
  onEdit?: () => void;
  onDelete: () => void;
  onInvest: () => void;
  onRedeem: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (!(e.target as Element).closest('[data-asset-menu]')) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function handleOpen() {
    if (!btnRef.current) { setOpen(v => !v); return; }
    const rect = btnRef.current.getBoundingClientRect();
    const menuH = 160;
    const style: CSSProperties = { position: 'fixed', zIndex: 9999, width: '160px', right: `${window.innerWidth - rect.right}px` };
    if (window.innerHeight - rect.bottom >= menuH) style.top = `${rect.bottom + 4}px`;
    else style.bottom = `${window.innerHeight - rect.top + 4}px`;
    setMenuStyle(style);
    setOpen(v => !v);
  }

  return (
    <div className="flex-none">
      <button ref={btnRef} onClick={handleOpen}
        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div data-asset-menu style={menuStyle} className="rounded-xl border border-gray-100 bg-white shadow-lg py-1">
          <button onClick={() => { onInvest(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition">
            <PlusCircle className="h-3.5 w-3.5" />Add Investment
          </button>
          <button onClick={() => { onRedeem(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition">
            <MinusCircle className="h-3.5 w-3.5" />Withdraw
          </button>
          {onEdit && (
            <button onClick={() => { onEdit(); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
              <Pencil className="h-3.5 w-3.5 text-gray-400" />Edit
            </button>
          )}
          <button onClick={() => { onDelete(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition border-t border-gray-100">
            <Trash2 className="h-3.5 w-3.5" />Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main table ──────────────────────────────────────────────────────────────
export default function AssetTable({ assets, totalPortfolioValue, onEdit }: Props) {
  const { deleteAsset, state } = useFinance();
  const tableTotal = assets.reduce((s, a) => s + a.value, 0);
  const allocBase  = totalPortfolioValue ?? tableTotal;
  const [confirmTarget, setConfirmTarget] = useState<Asset | null>(null);
  const [investTarget,  setInvestTarget]  = useState<Asset | null>(null);
  const [investAction,  setInvestAction]  = useState<'LUMPSUM' | 'REDEMPTION'>('LUMPSUM');

  const accountList = state.accounts.map(a => ({ id: a.id, name: a.name, type: a.type }));

  // Build a map of assetId → active SIP template for quick lookup
  const sipByAsset = new Map(
    state.recurringTemplates
      .filter(t => t.type === 'SIP' && t.assetId)
      .map(t => [t.assetId!, t])
  );

  function openInvest(asset: Asset, action: 'LUMPSUM' | 'REDEMPTION') {
    setInvestAction(action);
    setInvestTarget(asset);
  }

  if (assets.length === 0) return null;

  return (
    <>
      {/* ── Desktop table ─────────────────────────────────────────────────── */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {['Asset', 'Category', 'Units', 'Per Unit', 'Invested', 'Current Value', 'P&L', 'Alloc', ''].map(h => (
                <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 ${['Units','Per Unit','Invested','Current Value','P&L','Alloc'].includes(h) ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assets.map(asset => {
              const cfg      = getCategoryConfig(asset.category);
              const Icon     = cfg.icon;
              const invested = asset.invested;
              const pnl      = asset.value - invested;
              const allocPct = allocBase > 0 ? Math.round((asset.value / allocBase) * 100) : 0;
              const activeSip = sipByAsset.get(asset.id);

              return (
                <tr key={asset.id} className="group transition hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{asset.name}</p>
                    {activeSip && (
                      <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <Repeat2 className="h-2.5 w-2.5" />
                        SIP {fmt(activeSip.amount)}/mo
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.tagBg} ${cfg.tagText}`}>
                      <Icon className="h-3 w-3" />{asset.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-gray-400">
                    {asset.units != null ? Number(asset.units).toLocaleString('en-IN', { maximumFractionDigits: 3 }) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-gray-400">
                    {asset.units && asset.units > 0 ? fmt(asset.value / asset.units) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-gray-500">{fmt(invested)}</td>
                  <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-900">{fmt(asset.value)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <p className={`text-sm font-bold ${pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {pnl >= 0 ? '+' : ''}{fmt(pnl)}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-gray-500">{allocPct}%</td>
                  <td className="px-3 py-3.5">
                    <CardMenu
                      onInvest={() => openInvest(asset, 'LUMPSUM')}
                      onRedeem={() => openInvest(asset, 'REDEMPTION')}
                      onEdit={onEdit ? () => onEdit(asset) : undefined}
                      onDelete={() => setConfirmTarget(asset)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-100 bg-gray-50/60">
              <td colSpan={2} className="px-5 py-3 text-xs font-semibold text-gray-500">{assets.length} asset{assets.length !== 1 ? 's' : ''}</td>
              <td colSpan={2} className="px-5 py-3" />
              <td className="px-5 py-3 text-right text-xs font-semibold text-gray-500">
                {fmt(assets.reduce((s, a) => s + a.invested, 0))}
              </td>
              <td className="px-5 py-3 text-right text-sm font-bold text-gray-900">{fmt(tableTotal)}</td>
              <td className="px-5 py-3 text-right">
                {(() => {
                  const totalPnl = tableTotal - assets.reduce((s, a) => s + a.invested, 0);
                  return (
                    <span className={`text-sm font-bold ${totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {totalPnl >= 0 ? '+' : ''}{fmt(totalPnl)}
                    </span>
                  );
                })()}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Mobile cards ──────────────────────────────────────────────────── */}
      <div className="sm:hidden rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
        {assets.map(asset => {
          const cfg       = getCategoryConfig(asset.category);
          const Icon      = cfg.icon;
          const pnl       = asset.value - asset.invested;
          const activeSip = sipByAsset.get(asset.id);

          return (
            <div key={asset.id} className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{asset.name}</p>
                  <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.tagBg} ${cfg.tagText}`}>
                    <Icon className="h-2.5 w-2.5" />{asset.category}
                  </span>
                  <div className="mt-1.5 flex items-center gap-3 flex-wrap text-xs text-gray-400">
                    <span>Invested: {fmt(asset.invested)}</span>
                    {activeSip && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <Repeat2 className="h-2.5 w-2.5" />
                        SIP {fmt(activeSip.amount)}/mo · next {new Date(activeSip.nextDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-none">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{fmt(asset.value)}</p>
                    <p className={`text-xs font-medium ${pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {pnl >= 0 ? '+' : ''}{fmt(pnl)}
                    </p>
                  </div>
                  <CardMenu
                    onInvest={() => openInvest(asset, 'LUMPSUM')}
                    onRedeem={() => openInvest(asset, 'REDEMPTION')}
                    onEdit={onEdit ? () => onEdit(asset) : undefined}
                    onDelete={() => setConfirmTarget(asset)}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between px-4 py-3 bg-gray-50/60">
          <p className="text-xs font-semibold text-gray-500">{assets.length} asset{assets.length !== 1 ? 's' : ''}</p>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">{fmt(tableTotal)}</p>
            {(() => {
              const totalPnl = tableTotal - assets.reduce((s, a) => s + a.invested, 0);
              return (
                <p className={`text-xs font-medium ${totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {totalPnl >= 0 ? '+' : ''}{fmt(totalPnl)} total P&L
                </p>
              );
            })()}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete asset"
        description={`This will permanently delete "${confirmTarget?.name ?? ''}" and all associated data. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { if (confirmTarget) deleteAsset(confirmTarget.id); setConfirmTarget(null); }}
        onCancel={() => setConfirmTarget(null)}
      />

      {investTarget && (
        <InvestModal
          open={!!investTarget}
          onClose={() => setInvestTarget(null)}
          asset={investTarget}
          accounts={accountList}
        />
      )}
    </>
  );
}
