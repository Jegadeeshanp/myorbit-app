'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload, Camera, X, Loader2, CheckCircle2, AlertCircle,
  ChevronRight, TrendingUp, TrendingDown,
} from 'lucide-react';
import { useFinance } from '@/lib/financeStore';
import { ASSET_CATEGORIES } from '@/lib/assetCategories';

// ── Types ────────────────────────────────────────────────────────────────────

type ParsedItem = {
  id: string;
  name: string;
  units: number | null;
  avgPrice: number | null;
  currentPrice: number | null;
  currentValue: number;
  investedValue: number;
  returns: number | null;
  returnsPercent: number | null;
  selected: boolean;
  saveStatus: 'idle' | 'saving' | 'done' | 'error';
};

type Step = 'upload' | 'analyzing' | 'review' | 'saving' | 'done';

const CATEGORY_LABELS = ASSET_CATEGORIES.map(c => c.label);

const fmt = (v: number | null) =>
  v == null ? '—' : v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const fmtNum = (v: number | null) =>
  v == null ? '—' : v.toLocaleString('en-IN', { maximumFractionDigits: 2 });

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export default function ImageImportModal({ onClose }: Props) {
  const { addAsset } = useFinance();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('Stocks & Equity');
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ── Image → base64 ────────────────────────────────────────────────────────

  const toBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  // ── Parse ─────────────────────────────────────────────────────────────────

  const parseImage = useCallback(async (file: File) => {
    setStep('analyzing');
    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
    try {
      const imageBase64 = await toBase64(file);
      const res = await fetch('/api/finance/parse-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: file.type || 'image/jpeg' }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: 'Failed' }));
        throw new Error(e.error ?? 'Failed to analyze image');
      }
      const data = await res.json();
      setSource(data.source ?? '');
      if (data.category && CATEGORY_LABELS.includes(data.category)) setCategory(data.category);
      setItems(
        (data.items ?? []).map((item: any, i: number) => ({
          id: String(i),
          name: item.name ?? '',
          units: item.units ?? null,
          avgPrice: item.avgPrice ?? null,
          currentPrice: item.currentPrice ?? null,
          currentValue: Number(item.currentValue) || 0,
          investedValue: Number(item.investedValue) || 0,
          returns: item.returns ?? null,
          returnsPercent: item.returnsPercent ?? null,
          selected: true,
          saveStatus: 'idle',
        }))
      );
      setStep('review');
    } catch (e: any) {
      setError(e.message ?? 'Could not analyze image');
      setStep('upload');
    }
  }, []);

  // ── File input handlers ───────────────────────────────────────────────────

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please upload a JPG, PNG, or WEBP image'); return; }
    parseImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  };

  // ── Item editing ──────────────────────────────────────────────────────────

  const updateItem = (id: string, field: keyof ParsedItem, value: any) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const selected = items.filter(i => i.selected);
    setStep('saving');
    let saved = 0;
    for (const item of selected) {
      updateItem(item.id, 'saveStatus', 'saving');
      try {
        await addAsset({
          name: item.name,
          category,
          value: item.currentValue,
          invested: item.investedValue,
          units: item.units ?? undefined,
          investmentType: 'lump_sum',
        } as any);
        updateItem(item.id, 'saveStatus', 'done');
        saved++;
      } catch {
        updateItem(item.id, 'saveStatus', 'error');
      }
    }
    setSavedCount(saved);
    setStep('done');
  };

  const selectedCount = items.filter(i => i.selected).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white dark:bg-[#0e1420] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] flex-none">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-[#00e5a0]/[0.1]">
              <Camera className="h-5 w-5 text-emerald-600 dark:text-[#00E5A0]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-[#e4eaf4]">Scan & Import</h2>
              <p className="text-xs text-gray-400 dark:text-[#3d5166]">
                {step === 'upload'   && 'Upload a portfolio screenshot to auto-import'}
                {step === 'analyzing' && 'Analyzing your screenshot…'}
                {step === 'review'   && `${items.length} items detected${source ? ` · ${source}` : ''}`}
                {step === 'saving'   && `Importing ${selectedCount} assets…`}
                {step === 'done'     && `${savedCount} assets imported successfully`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.07] transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── UPLOAD ── */}
          {(step === 'upload' || step === 'analyzing') && (
            <div className="p-6 flex flex-col items-center gap-5">
              {/* Preview (if re-trying) */}
              {previewUrl && step === 'upload' && (
                <img src={previewUrl} alt="Preview" className="max-h-40 rounded-2xl object-contain border border-gray-100 dark:border-white/[0.07]" />
              )}

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`w-full cursor-pointer rounded-2xl border-2 border-dashed p-10 flex flex-col items-center gap-4 transition ${
                  step === 'analyzing'
                    ? 'border-emerald-300 dark:border-[#00E5A0]/40 bg-emerald-50/50 dark:bg-[#00e5a0]/[0.05]'
                    : dragOver
                    ? 'border-emerald-400 dark:border-[#00E5A0]/60 bg-emerald-50 dark:bg-[#00e5a0]/[0.08]'
                    : 'border-gray-200 dark:border-white/[0.1] hover:border-emerald-300 dark:hover:border-[#00E5A0]/40 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                }`}
              >
                {step === 'analyzing' ? (
                  <>
                    <Loader2 className="h-10 w-10 text-emerald-500 dark:text-[#00E5A0] animate-spin" />
                    <p className="text-sm font-medium text-emerald-700 dark:text-[#00E5A0]">Analyzing your screenshot…</p>
                    <p className="text-xs text-gray-400 dark:text-[#3d5166]">This usually takes 5–10 seconds</p>
                  </>
                ) : (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/[0.07]">
                      <Upload className="h-7 w-7 text-gray-400 dark:text-[#3d5166]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700 dark:text-[#e4eaf4]">Drop screenshot here or click to upload</p>
                      <p className="text-xs text-gray-400 dark:text-[#3d5166] mt-1">Works with Zerodha, Groww, Kuvera, Coin, and more · JPG / PNG / WEBP</p>
                    </div>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

              {error && (
                <div className="w-full flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 flex-none" /> {error}
                </div>
              )}

              <p className="text-xs text-gray-400 dark:text-[#3d5166] text-center max-w-sm">
                Supported: stock portfolios, mutual fund holdings, ETF statements.<br />
                Data is extracted locally — your screenshot is never stored.
              </p>
            </div>
          )}

          {/* ── REVIEW ── */}
          {step === 'review' && (
            <div className="p-4 space-y-4">
              {/* Category selector */}
              <div className="flex items-center gap-3 px-1">
                <span className="text-xs font-semibold text-gray-500 dark:text-[#8fa3b8] whitespace-nowrap">Asset type</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Stocks & Equity', 'Mutual Funds', 'ETF', 'Bonds', 'Fixed Deposit', 'Gold', 'Other'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                        category === cat
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-[#8fa3b8] hover:bg-gray-200 dark:hover:bg-white/[0.1]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select all */}
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={items.every(i => i.selected)}
                    onChange={e => setItems(prev => prev.map(i => ({ ...i, selected: e.target.checked })))}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                  <span className="text-xs font-medium text-gray-600 dark:text-[#8fa3b8]">Select all ({items.length})</span>
                </label>
                <span className="text-xs text-gray-400 dark:text-[#3d5166]">{selectedCount} selected</span>
              </div>

              {/* Items table */}
              <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/[0.07]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-white/[0.04] border-b border-gray-100 dark:border-white/[0.07]">
                      <th className="w-8 px-3 py-2.5" />
                      <th className="text-left px-3 py-2.5 font-semibold text-gray-500 dark:text-[#3d5166]">Name</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-gray-500 dark:text-[#3d5166]">Units</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-gray-500 dark:text-[#3d5166]">Avg Price</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-gray-500 dark:text-[#3d5166]">Cur. Value</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-gray-500 dark:text-[#3d5166]">Invested</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-gray-500 dark:text-[#3d5166]">Returns</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                    {items.map(item => {
                      const pnl = item.returns ?? (item.currentValue - item.investedValue);
                      const pct = item.returnsPercent ?? (item.investedValue > 0 ? ((item.currentValue - item.investedValue) / item.investedValue) * 100 : 0);
                      const positive = pnl >= 0;
                      return (
                        <tr key={item.id} className={`transition ${item.selected ? 'bg-white dark:bg-transparent' : 'opacity-40'}`}>
                          <td className="px-3 py-2.5 text-center">
                            <input type="checkbox" checked={item.selected} onChange={e => updateItem(item.id, 'selected', e.target.checked)} className="h-4 w-4 rounded accent-emerald-600" />
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              value={item.name}
                              onChange={e => updateItem(item.id, 'name', e.target.value)}
                              className="w-32 bg-transparent text-gray-800 dark:text-[#e4eaf4] font-medium focus:outline-none focus:bg-gray-50 dark:focus:bg-white/[0.05] rounded px-1 -mx-1"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-right text-gray-600 dark:text-[#8fa3b8]">{fmtNum(item.units)}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600 dark:text-[#8fa3b8]">{fmt(item.avgPrice)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-gray-800 dark:text-[#e4eaf4]">{fmt(item.currentValue)}</td>
                          <td className="px-3 py-2.5 text-right text-gray-500 dark:text-[#8fa3b8]">{fmt(item.investedValue)}</td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={`flex flex-col items-end ${positive ? 'text-emerald-600 dark:text-[#00E5A0]' : 'text-rose-600 dark:text-[#FF6B6B]'}`}>
                              <span className="font-semibold">{positive ? '+' : ''}{fmt(pnl)}</span>
                              <span className="text-[10px]">{positive ? '+' : ''}{pct.toFixed(1)}%</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SAVING ── */}
          {step === 'saving' && (
            <div className="p-6 space-y-2">
              {items.filter(i => i.selected).map(item => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-white/[0.07] px-4 py-2.5">
                  {item.saveStatus === 'idle'   && <div className="h-4 w-4 flex-none rounded-full border-2 border-gray-300 dark:border-gray-600" />}
                  {item.saveStatus === 'saving' && <Loader2 className="h-4 w-4 flex-none text-emerald-500 animate-spin" />}
                  {item.saveStatus === 'done'   && <CheckCircle2 className="h-4 w-4 flex-none text-emerald-500 dark:text-[#00E5A0]" />}
                  {item.saveStatus === 'error'  && <AlertCircle className="h-4 w-4 flex-none text-rose-500" />}
                  <span className="flex-1 text-sm text-gray-700 dark:text-[#e4eaf4] font-medium truncate">{item.name}</span>
                  <span className="text-xs text-gray-400 dark:text-[#3d5166]">{fmt(item.currentValue)}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── DONE ── */}
          {step === 'done' && (
            <div className="p-10 flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-[#00e5a0]/[0.1]">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-[#00E5A0]" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-[#e4eaf4]">{savedCount} asset{savedCount !== 1 ? 's' : ''} imported!</p>
                <p className="text-sm text-gray-400 dark:text-[#3d5166] mt-1">They now appear in your Assets page and Net Worth.</p>
              </div>
              {items.some(i => i.saveStatus === 'error') && (
                <p className="text-xs text-rose-500">{items.filter(i => i.saveStatus === 'error').length} item(s) failed — you can add them manually.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] flex-none bg-gray-50/50 dark:bg-white/[0.02]">
          {step === 'review' && (
            <>
              <button
                onClick={() => { setStep('upload'); setItems([]); setPreviewUrl(null); }}
                className="text-sm text-gray-500 dark:text-[#8fa3b8] hover:text-gray-700 dark:hover:text-[#e4eaf4] transition"
              >
                ← Re-upload
              </button>
              <button
                onClick={handleSave}
                disabled={selectedCount === 0}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
              >
                Import {selectedCount} asset{selectedCount !== 1 ? 's' : ''}
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          {step === 'done' && (
            <div className="w-full flex justify-center">
              <button
                onClick={onClose}
                className="rounded-xl bg-emerald-600 px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Done
              </button>
            </div>
          )}
          {(step === 'upload' || step === 'analyzing') && (
            <button onClick={onClose} className="text-sm text-gray-500 dark:text-[#8fa3b8] hover:text-gray-700 dark:hover:text-[#e4eaf4] transition">
              Cancel
            </button>
          )}
          {step === 'saving' && (
            <span className="text-sm text-gray-400 dark:text-[#3d5166]">Please wait…</span>
          )}
        </div>
      </div>
    </div>
  );
}
