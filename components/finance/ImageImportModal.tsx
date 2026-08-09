'use client';

import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload, Camera, X, Loader2, CheckCircle2, AlertCircle,
  ChevronRight, Images, FileSpreadsheet,
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
type ImportTab = 'screenshot' | 'csv';

const CATEGORY_LABELS = ASSET_CATEGORIES.map(c => c.label);

const fmt = (v: number | null) =>
  v == null ? '—' : v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const fmtNum = (v: number | null) =>
  v == null ? '—' : v.toLocaleString('en-IN', { maximumFractionDigits: 2 });

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSVText(csv: string): ParsedItem[] {
  const lines = csv.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Split a CSV line respecting quoted fields
  const splitLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { result.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    result.push(cur.trim());
    return result;
  };

  // Normalize: lowercase, strip quotes and periods so "Avg. cost" → "avg cost"
  const norm = (s: string) => s.toLowerCase().replace(/['"\.]/g, '').replace(/\s+/g, ' ').trim();

  // Auto-detect the real header row — skip metadata rows at the top
  const NAME_HINTS = ['instrument', 'symbol', 'stock', 'scrip', 'name', 'company'];
  const NUM_HINTS  = ['qty', 'quantity', 'ltp', 'price', 'value', 'units'];
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const cells = splitLine(lines[i]).map(norm);
    const hasName = cells.some(c => NAME_HINTS.some(h => c.includes(h)));
    const hasNum  = cells.some(c => NUM_HINTS.some(h => c.includes(h)));
    if (hasName && hasNum) { headerRowIdx = i; break; }
  }
  if (headerRowIdx === -1) return [];

  const rawHeaders = splitLine(lines[headerRowIdx]);
  const headers = rawHeaders.map(norm);

  const col = (...names: string[]) => {
    for (const n of names) {
      const needle = norm(n);
      const idx = headers.findIndex(h => h.includes(needle));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  // Zerodha: Stock Name, Qty, Avg. cost, LTP, Closing Value, Invested Value, Unrealised P&L, Net chg.
  const nameCol   = col('stock name', 'instrument', 'symbol', 'name', 'scrip', 'company');
  const qtyCol    = col('qty', 'quantity', 'units', 'shares', 'no of');
  const avgCol    = col('avg cost', 'avg price', 'average price', 'average cost', 'buy price', 'cost price');
  const ltpCol    = col('ltp', 'last price', 'current price', 'market price', 'cmp', 'close price');
  const curValCol = col('closing value', 'cur val', 'current value', 'market value', 'present value', 'mkt val');
  const invValCol = col('invested value', 'invested', 'invest val', 'buy value', 'cost value', 'amount invested');
  const pnlCol    = col('unrealised p&l', 'unrealised', 'p&l', 'pnl', 'profit & loss', 'gain/loss', 'returns');
  const pnlPctCol = col('net chg', 'net change', 'returns (%)', 'return %', 'gain %', 'p&l %', '% return', 'returns%');

  if (nameCol === -1) return [];

  const items: ParsedItem[] = [];

  for (let i = headerRowIdx + 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const name = nameCol < cells.length ? cells[nameCol].replace(/['"]/g, '').trim() : '';
    if (!name || name.toLowerCase() === 'total' || name.toLowerCase() === 'grand total') continue;

    // Parse numeric cell: strip currency symbols, commas, spaces, percent signs
    const n = (idx: number): number | null => {
      if (idx < 0 || idx >= cells.length) return null;
      const raw = cells[idx].replace(/[₹,\s"'%]/g, '');
      if (raw === '' || raw === '-' || raw === 'N/A' || raw === '--') return null;
      const v = parseFloat(raw);
      return isNaN(v) ? null : v;
    };

    const qty      = n(qtyCol);
    const avgPrice = n(avgCol);
    const ltp      = n(ltpCol);
    const curVal   = n(curValCol) ?? (qty != null && ltp != null ? qty * ltp : 0);
    const invVal   = n(invValCol) ?? (qty != null && avgPrice != null ? qty * avgPrice : 0);
    const pnl      = n(pnlCol)    ?? (curVal - invVal);
    const pnlPct   = n(pnlPctCol) ?? (invVal > 0 ? (pnl / invVal) * 100 : 0);

    items.push({
      id: `csv-${i}`,
      name,
      units: qty,
      avgPrice,
      currentPrice: ltp,
      currentValue: curVal,
      investedValue: invVal,
      returns: pnl,
      returnsPercent: pnlPct,
      selected: true,
      saveStatus: 'idle',
    });
  }

  return items;
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props { onClose: () => void }

export default function ImageImportModal({ onClose }: Props) {
  const { addAsset } = useFinance();
  const imageRef = useRef<HTMLInputElement>(null);
  const csvRef   = useRef<HTMLInputElement>(null);

  const [step, setStep]           = useState<Step>('upload');
  const [importTab, setImportTab] = useState<ImportTab>('csv');
  const [dragOver, setDragOver]   = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [category, setCategory]   = useState('Stocks & Equity');
  const [items, setItems]         = useState<ParsedItem[]>([]);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [savedCount, setSavedCount]     = useState(0);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const toBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const readText = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsText(file);
    });

  const readArrayBuffer = (file: File): Promise<ArrayBuffer> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as ArrayBuffer);
      r.onerror = rej;
      r.readAsArrayBuffer(file);
    });

  const updateFileStatus = (idx: number, patch: Partial<FileStatus>) =>
    setFileStatuses(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f));

  // ── CSV import ────────────────────────────────────────────────────────────

  const handleCSVFiles = useCallback(async (files: File[]) => {
    const supported = files.filter(f =>
      f.name.endsWith('.csv') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls') ||
      f.type === 'text/csv' ||
      f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      f.type === 'application/vnd.ms-excel'
    );
    if (supported.length === 0) { setError('Please upload a CSV or Excel (.xlsx) file exported from your broker'); return; }

    setError(null);
    const allItems: ParsedItem[] = [];

    for (const file of supported) {
      try {
        let csvText: string;
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const buffer = await readArrayBuffer(file);
          const wb = XLSX.read(buffer, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          csvText = XLSX.utils.sheet_to_csv(ws);
        } else {
          csvText = await readText(file);
        }
        const parsed = parseCSVText(csvText);
        allItems.push(...parsed);
      } catch {
        setError(`Could not read ${file.name}`);
      }
    }

    if (allItems.length === 0) {
      setError('No holdings found. Make sure it is a holdings export (not a transaction report).');
      return;
    }

    setItems(allItems);
    setStep('review');
  }, []);

  // ── Screenshot import (Gemini) ────────────────────────────────────────────

  const parseOne = async (file: File, idx: number): Promise<{ items: ParsedItem[]; error?: string }> => {
    updateFileStatus(idx, { status: 'analyzing' });
    try {
      const imageBase64 = await toBase64(file);
      const res = await fetch('/api/finance/parse-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: file.type || 'image/jpeg' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      if (data.category && CATEGORY_LABELS.includes(data.category)) setCategory(data.category);

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
      return { items: newItems };
    } catch (e: any) {
      const msg = e?.message ?? 'Unknown error';
      updateFileStatus(idx, { status: 'error', error: msg });
      return { items: [], error: msg };
    }
  };

  const parseImageFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) { setError('Please upload image files (JPG, PNG, WEBP)'); return; }

    setStep('analyzing');
    setError(null);
    setFileStatuses(imageFiles.map(f => ({ name: f.name, status: 'pending' })));
    setItems([]);

    const allItems: ParsedItem[] = [];
    let firstError: string | null = null;
    for (let i = 0; i < imageFiles.length; i++) {
      const { items: parsed, error } = await parseOne(imageFiles[i], i);
      allItems.push(...parsed);
      if (error && !firstError) firstError = error;
    }

    if (allItems.length === 0) {
      setError(firstError ?? 'Could not extract any data from the uploaded images');
      setStep('upload');
      return;
    }

    setItems(allItems);
    setStep('review');
  }, []);

  // ── File input handlers ───────────────────────────────────────────────────

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (importTab === 'csv') handleCSVFiles(files);
    else parseImageFiles(files);
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
              <h2 className="text-base font-semibold text-gray-900 dark:text-[#e4eaf4]">Import Holdings</h2>
              <p className="text-xs text-gray-400 dark:text-[#3d5166]">
                {step === 'upload'    && 'Import from CSV export or screenshot'}
                {step === 'analyzing' && `Analyzing ${fileStatuses.length} screenshot${fileStatuses.length !== 1 ? 's' : ''}…`}
                {step === 'review'    && `${items.length} holdings detected — review before saving`}
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
            <div className="p-6 flex flex-col gap-4">

              {/* Import method tabs */}
              <div className="flex rounded-xl border border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.03] p-1 gap-1">
                <button
                  onClick={() => { setImportTab('csv'); setError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
                    importTab === 'csv'
                      ? 'bg-white dark:bg-[#131c2e] text-emerald-700 dark:text-[#00E5A0] shadow-sm'
                      : 'text-gray-500 dark:text-[#8fa3b8] hover:text-gray-700 dark:hover:text-[#e4eaf4]'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV Export
                  <span className="ml-1 rounded-full bg-emerald-100 dark:bg-[#00e5a0]/[0.15] px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-[#00E5A0]">FREE</span>
                </button>
                <button
                  onClick={() => { setImportTab('screenshot'); setError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
                    importTab === 'screenshot'
                      ? 'bg-white dark:bg-[#131c2e] text-emerald-700 dark:text-[#00E5A0] shadow-sm'
                      : 'text-gray-500 dark:text-[#8fa3b8] hover:text-gray-700 dark:hover:text-[#e4eaf4]'
                  }`}
                >
                  <Images className="h-4 w-4" />
                  Screenshot
                </button>
              </div>

              {/* CSV tab content */}
              {importTab === 'csv' && (
                <>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => csvRef.current?.click()}
                    className={`w-full cursor-pointer rounded-2xl border-2 border-dashed p-10 flex flex-col items-center gap-4 transition ${
                      dragOver
                        ? 'border-emerald-400 dark:border-[#00E5A0]/60 bg-emerald-50 dark:bg-[#00e5a0]/[0.08]'
                        : 'border-gray-200 dark:border-white/[0.1] hover:border-emerald-300 dark:hover:border-[#00E5A0]/40 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-[#00e5a0]/[0.1]">
                      <FileSpreadsheet className="h-7 w-7 text-emerald-600 dark:text-[#00E5A0]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700 dark:text-[#e4eaf4]">Drop your CSV file here or click to upload</p>
                      <p className="text-xs text-gray-400 dark:text-[#3d5166] mt-1">Zerodha · Groww · Kuvera · Angel One · Upstox · CSV or Excel (.xlsx)</p>
                    </div>
                  </div>
                  <input ref={csvRef} type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" multiple className="hidden"
                    onChange={e => handleCSVFiles(Array.from(e.target.files ?? []))} />

                  {/* How to export instructions */}
                  <div className="rounded-xl border border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.02] p-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-[#8fa3b8]">How to export from Zerodha</p>
                    <ol className="text-xs text-gray-400 dark:text-[#3d5166] space-y-1 list-decimal list-inside">
                      <li>Open Console → Portfolio → Holdings</li>
                      <li>Click the download icon (↓) at the top right</li>
                      <li>Upload the downloaded CSV here</li>
                    </ol>
                  </div>
                </>
              )}

              {/* Screenshot tab content */}
              {importTab === 'screenshot' && (
                <>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => imageRef.current?.click()}
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
                      <p className="text-xs text-gray-400 dark:text-[#3d5166] mt-1">Select multiple files at once · JPG / PNG / WEBP</p>
                    </div>
                  </div>
                  <input ref={imageRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e => parseImageFiles(Array.from(e.target.files ?? []))} />
                  <p className="text-xs text-gray-400 dark:text-[#3d5166] text-center">
                    Uses Google Gemini AI to read your screenshots. Requires <code className="font-mono">GOOGLE_AI_API_KEY</code> in environment variables.
                  </p>
                </>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 flex-none mt-0.5" /> {error}
                </div>
              )}
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
              {/* File summary chips (screenshot mode only) */}
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
