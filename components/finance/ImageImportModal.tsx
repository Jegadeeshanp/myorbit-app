'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload, Camera, X, Loader2, CheckCircle2, AlertCircle,
  ChevronRight, Images,
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

type FileStatus = {
  name: string;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  error?: string;
  count?: number;
};

type Step = 'upload' | 'analyzing' | 'review' | 'saving' | 'done';

const CATEGORY_LABELS = ASSET_CATEGORIES.map(c => c.label);

const fmt = (v: number | null) =>
  v == null ? '—' : v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const fmtNum = (v: number | null) =>
  v == null ? '—' : v.toLocaleString('en-IN', { maximumFractionDigits: 2 });

// ── Component ────────────────────────────────────────────────────────────────

interface Props { onClose: () => void }

export default function ImageImportModal({ onClose }: Props) {
  const { addAsset } = useFinance();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('Stocks & Equity');
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [savedCount, setSavedCount] = useState(0);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const toBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const updateFileStatus = (idx: number, patch: Partial<FileStatus>) =>
    setFileStatuses(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f));

  // ── Parse one image ───────────────────────────────────────────────────────

  const parseOne = async (file: File, idx: number): Promise<ParsedItem[]> => {
    updateFileStatus(idx, { status: 'analyzing' });
    try {
      const imageBase64 = await toBase64(file);
      const res = await fetch('/api/finance/parse-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: file.type || 'image/jpeg' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');

      if (data.category && CATEGORY_LABELS.includes(data.category)) {
        setCategory(data.category);
      }

      const newItems: ParsedItem[] = (data.items ?? []).map((item: any, i: number) => ({
        id: `${idx}-${i}`,
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
      }));

      updateFileStatus(idx, { status: 'done', count: newItems.length });
      return newItems;
    } catch (e: any) {
      updateFileStatus(idx, { status: 'error', error: e.message });
      return [];
    }
  };

  // ── Parse all images ──────────────────────────────────────────────────────

  const parseFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) { setError('Please upload image files (JPG, PNG, WEBP)'); return; }

    setStep('analyzing');
    setError(null);
    setFileStatuses(imageFiles.map(f => ({ name: f.name, status: 'pending' })));
    setItems([]);

    // Process all files (sequentially to avoid rate limits)
    const allItems: ParsedItem[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const parsed = await parseOne(imageFiles[i], i);
      allItems.push(...parsed);
    }

    if (allItems.length === 0) {
      setError('Could not extract any data from the uploaded images');
      setStep('upload');
      return;
    }

    setItems(allItems);
    setStep('review');
  }, []);

  // ── File input handlers ───────────────────────────────────────────────────

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    parseFiles(Array.from(files));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    handleFiles(e.dataTransfer.files);
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
                {step === 'upload'    && 'Upload one or more portfolio screenshots'}
                {step === 'analyzing' && `Analyzing ${fileStatuses.length} screenshot${fileStatuses.length !== 1 ? 's' : ''}…`}
                {step === 'review'    && `${items.length} holdings detected across ${fileStatuses.length} screenshot${fileStatuses.length !== 1 ? 's' : ''}`}
                {step === 'saving'    && `Importing ${selectedCount} assets…`}
                {step === 'done'      && `${savedCount} assets imported successfully`}
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
          {step === 'upload' && (
            <div className="p-6 flex flex-col items-center gap-5">
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`w-full cursor-pointer rounded-2xl border-2 border-dashed p-10 flex flex-col items-center gap-4 transition ${
                  dragOver
                    ? 'border-emerald-400 dark:border-[#00E5A0]/60 bg-emerald-50 dark:bg-[#00e5a0]/[0.08]'
                    : 'border-gray-200 dark:border-white/[0.1] hover:border-emerald-300 dark:hover:border-[#00E5A0]/40 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/[0.07]">
                  <Images className="h-7 w-7 text-gray-400 dark:text-[#3d5166]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700 dark:text-[#e4eaf4]">Drop screenshots here or click to upload</p>
                  <p className="text-xs text-gray-400 dark:text-[#3d5166] mt-1">
                    Select multiple files at once · Zerodha, Groww, Kuvera, Coin · JPG / PNG / WEBP
                  </p>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />

              {error && (
                <div className="w-full flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 flex-none" /> {error}
                </div>
              )}

              <p className="text-xs text-gray-400 dark:text-[#3d5166] text-center max-w-sm">
                Supports stock portfolios, mutual fund holdings, ETF statements.<br />
                Upload all pages of your portfolio at once.
              </p>
            </div>
          )}

          {/* ── ANALYZING ── */}
          {step === 'analyzing' && (
            <div className="p-6 space-y-3">
              {fileStatuses.map((fs, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-white/[0.07] px-4 py-3">
                  {fs.status === 'pending'   && <div className="h-4 w-4 flex-none rounded-full border-2 border-gray-300 dark:border-gray-600" />}
                  {fs.status === 'analyzing' && <Loader2 className="h-4 w-4 flex-none text-emerald-500 dark:text-[#00E5A0] animate-spin" />}
                  {fs.status === 'done'      && <CheckCircle2 className="h-4 w-4 flex-none text-emerald-500 dark:text-[#00E5A0]" />}
                  {fs.status === 'error'     && <AlertCircle className="h-4 w-4 flex-none text-rose-500" />}
                  <span className="flex-1 text-sm text-gray-700 dark:text-[#e4eaf4] truncate">{fs.name}</span>
                  <span className="text-xs text-gray-400 dark:text-[#3d5166]">
                    {fs.status === 'pending'   && 'Waiting…'}
                    {fs.status === 'analyzing' && 'Analyzing…'}
                    {fs.status === 'done'      && `${fs.count} holding${fs.count !== 1 ? 's' : ''} found`}
                    {fs.status === 'error'     && (fs.error ?? 'Failed')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── REVIEW ── */}
          {step === 'review' && (
            <div className="p-4 space-y-4">
              {/* File summary chips */}
              {fileStatuses.length > 1 && (
                <div className="flex flex-wrap gap-2 px-1">
                  {fileStatuses.map((fs, i) => (
                    <span key={i} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                      fs.status === 'done'
                        ? 'bg-emerald-50 dark:bg-[#00e5a0]/[0.1] text-emerald-700 dark:text-[#00E5A0]'
                        : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                    }`}>
                      {fs.status === 'done' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {fs.name} · {fs.count ?? 0} items
                    </span>
                  ))}
                </div>
              )}

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
                        <tr key={item.id} className={`transition ${item.selected ? '' : 'opacity-40'}`}>
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
                onClick={() => { setStep('upload'); setItems([]); setFileStatuses([]); setError(null); }}
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
              <button onClick={onClose} className="rounded-xl bg-emerald-600 px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
                Done
              </button>
            </div>
          )}
          {(step === 'upload' || step === 'analyzing') && (
            <button onClick={onClose} className="text-sm text-gray-500 dark:text-[#8fa3b8] hover:text-gray-700 dark:hover:text-[#e4eaf4] transition ml-auto">
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
