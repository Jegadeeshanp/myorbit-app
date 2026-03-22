'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Check, AlertCircle, FileSpreadsheet, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

// ── Types ──────────────────────────────────────────────────────────────────
type FileType = 'stocks' | 'mutual_funds' | 'credit_card' | 'generic_assets' | 'generic_tx' | null;
type ImportStep = 'upload' | 'preview' | 'done';
interface ParsedRow { [key: string]: any; }
interface MappedAsset { name: string; category: string; units?: number; invested: number; currentValue: number; pnl?: number; }
interface MappedTransaction { date: string; description: string; amount: number; type: 'debit' | 'credit'; category: string; }

// ── Helpers ────────────────────────────────────────────────────────────────
function cleanNum(v: any): number {
  if (v == null || v === '' || v === '-') return 0;
  return parseFloat(String(v).replace(/[₹,\s%]/g, '')) || 0;
}

// ── Category Mappers ─────────────────────────────────────────────────────
// Maps imported category strings to valid AssetCategory labels
function mapAssetCategory(raw: string): string {
  const s = raw.toLowerCase();
  // Check mutual fund FIRST before equity (MF sub-categories contain 'equity' as sub-type)
  if (s.includes('mutual') || s.includes(' fund') || s.includes('mf ') || s.startsWith('mf')) {
    if (s.includes('debt') || s.includes('bond') || s.includes('income')) return 'Debt Funds';
    if (s.includes('arbitrage')) return 'Arbitrage Funds';
    if (s.includes('liquid')) return 'Liquid Funds';
    return 'Mutual Funds';
  }
  if (s.includes('stock') || s.includes('equity') || s.includes('share')) return 'Stocks & Equity';
  if (s.includes('real estate') || s.includes('property') || s.includes('land')) return 'Real Estate';
  if (s.includes('gold') || s.includes('silver') || s.includes('precious')) return 'Gold & Silver';
  if (s.includes('fd') || s.includes('rd') || s.includes('fixed deposit') || s.includes('recurring')) return 'FD & RD';
  if (s.includes('bond') || s.includes('debenture') || s.includes('ncd')) return 'Bonds';
  if (s.includes('epf') || s.includes('ppf') || s.includes('nps') || s.includes('provident')) return 'EPF / PPF / NPS';
  if (s.includes('crypto') || s.includes('bitcoin') || s.includes('ethereum')) return 'Crypto';
  if (s.includes('ulip') || s.includes('insurance') || s.includes('policy')) return 'ULIP';
  if (s.includes('cash') || s.includes('saving') || s.includes('bank')) return 'Cash & Savings';
  if (s.includes('international') || s.includes('global') || s.includes('us ') || s.includes('foreign')) return 'International';
  if (s.includes('employer') || s.includes('esop') || s.includes('rsu')) return 'Employer Stock';
  if (s.includes('commodity') || s.includes('commodities')) return 'Commodities';
  return 'Other';
}

// Maps imported transaction description/category to standard finance categories
function mapTxCategory(raw: string): string {
  const d = raw.toLowerCase();
  if (/food|restaurant|cafe|eat|swiggy|zomato|pizza|burger|dine/.test(d)) return 'Food & Dining';
  if (/amazon|flipkart|shop|store|mall|mart|retail|fashion|cloth|shoe/.test(d)) return 'Shopping';
  if (/uber|ola|petrol|fuel|metro|bus|train|irctc|cab|taxi/.test(d)) return 'Transport';
  if (/netflix|spotify|prime|youtube|entertainment|movie|cinema/.test(d)) return 'Entertainment';
  if (/payment|credit|transfer|neft|imps|upi|refund/.test(d)) return 'Transfer';
  if (/electricity|water|gas|bill|telecom|mobile|broadband|wifi/.test(d)) return 'Utilities';
  if (/school|college|course|education|book|tuition/.test(d)) return 'Education';
  if (/hospital|pharmacy|medical|health|doctor|clinic|medicine/.test(d)) return 'Healthcare';
  if (/rent|emi|loan|mortgage/.test(d)) return 'Housing';
  if (/salary|income|dividend|interest|return/.test(d)) return 'Income';
  return 'Other';
}

function parseDate(v: any): string {
  if (!v) return new Date().toISOString().split('T')[0];
  const s = String(v).trim();
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  if (s.match(/^\d{4}-\d{2}-\d{2}/)) return s.slice(0, 10);
  return new Date().toISOString().split('T')[0];
}


// ── Parsers ────────────────────────────────────────────────────────────────
function sToJ(ws: any, opts?: any): any[] {
  return XLSX.utils.sheet_to_json(ws, opts ?? { header: 1, defval: null });
}

function detectFileType(wb: any): FileType {
  const first = sToJ(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null });
  const text = (first as any[][]).slice(0, 25).map(r => r.join(' ')).join(' ').toLowerCase();
  if (text.includes('stock name') || text.includes('holdings statement for stocks')) return 'stocks';
  if (text.includes('scheme name') && text.includes('amc')) return 'mutual_funds';
  if (text.includes('transaction type') && text.includes('date & time')) return 'credit_card';
  if (text.includes('asset') || text.includes('invested') || text.includes('current value')) return 'generic_assets';
  return 'generic_tx';
}

function parseStocks(wb: any): MappedAsset[] {
  const rows = sToJ(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null }) as any[][];
  const hi = rows.findIndex(r => r.some(c => String(c || '').toLowerCase().includes('stock name')));
  if (hi < 0) return [];
  return rows.slice(hi + 1).filter(r => r[0] && String(r[0]).trim()).map(r => ({
    name: String(r[0]).trim(),
    category: 'Stocks & Equity',
    units: cleanNum(r[2]),
    invested: cleanNum(r[4]),
    currentValue: cleanNum(r[6]),
    pnl: cleanNum(r[7]),
  }));
}

function parseMutualFunds(wb: any): MappedAsset[] {
  const ws = wb.Sheets['Holdings'] || wb.Sheets[wb.SheetNames[0]];
  const rows = sToJ(ws, { header: 1, defval: null }) as any[][];
  const hi = rows.findIndex(r => r.some(c => String(c || '').toLowerCase() === 'scheme name'));
  if (hi < 0) return [];
  return rows.slice(hi + 1).filter(r => r[0] && String(r[0]).trim()).map(r => ({
    name: String(r[0]).trim(),
    category: mapAssetCategory(`Mutual Fund ${String(r[2] || '')}`),  // maps to valid ASSET_CATEGORIES label
    units: cleanNum(r[6]),
    invested: cleanNum(r[7]),
    currentValue: cleanNum(r[8]),
    pnl: cleanNum(r[9]),
  }));
}

function parseCreditCard(wb: any): MappedTransaction[] {
  const ws = wb.Sheets['Statement'] || wb.Sheets[wb.SheetNames[0]];
  const rows = sToJ(ws, { header: 1, defval: null }) as any[][];
  const hi = rows.findIndex(r => r.some(c => String(c || '').toLowerCase().includes('transaction type')));
  if (hi < 0) return [];
  return rows.slice(hi + 1)
    .filter(r => r[0] && ['domestic', 'international'].includes(String(r[0]).toLowerCase()))
    .map(r => ({
      date: parseDate(r[9]),
      description: String(r[12] || '').trim(),
      amount: cleanNum(r[20] ?? r[21] ?? 0),
      type: String(r[24] || '').toLowerCase() === 'cr' ? 'credit' : 'debit',
      category: mapTxCategory(String(r[12] || '')),  // maps to valid transaction category
    }))
    .filter(t => t.amount > 0);
}

function parseGenericAssets(wb: any): MappedAsset[] {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = sToJ(ws, { defval: '' }) as ParsedRow[];
  const get = (r: ParsedRow, patterns: string[]) => {
    const k = Object.keys(r).find(k => patterns.some(p => k.toLowerCase().includes(p)));
    return k ? r[k] : '';
  };
  return rows.map(r => ({
    name: String(get(r, ['name', 'asset', 'stock', 'scheme']) || '').trim() || 'Unnamed',
    category: mapAssetCategory(String(get(r, ['category', 'type', 'class']) || 'Other')),
    units: cleanNum(get(r, ['unit', 'qty', 'quantity'])),
    invested: cleanNum(get(r, ['invest', 'buy value', 'cost'])),
    currentValue: cleanNum(get(r, ['current', 'market', 'closing', 'value'])),
    pnl: cleanNum(get(r, ['p&l', 'pnl', 'unrealised', 'profit', 'return'])),
  })).filter(r => r.name !== 'Unnamed');
}

function parseFile(wb: any, fileType: FileType): { assets?: MappedAsset[]; transactions?: MappedTransaction[] } {
  try {
    if (fileType === 'stocks')       return { assets: parseStocks(wb) };
    if (fileType === 'mutual_funds') return { assets: parseMutualFunds(wb) };
    if (fileType === 'credit_card')  return { transactions: parseCreditCard(wb) };
    return { assets: parseGenericAssets(wb) };
  } catch {
    return {};
  }
}

// ── Constants ──────────────────────────────────────────────────────────────
const FILE_TYPE_LABELS: Record<NonNullable<FileType>, { label: string; desc: string; color: string }> = {
  stocks:         { label: 'Stock Holdings',        desc: 'Zerodha / Groww stock statement',   color: 'text-blue-500' },
  mutual_funds:   { label: 'Mutual Funds',           desc: 'Groww / Coin MF holding statement', color: 'text-purple-500' },
  credit_card:    { label: 'Credit Card Statement',  desc: 'HDFC / SBI / ICICI credit card',   color: 'text-rose-500' },
  generic_assets: { label: 'Custom Assets',          desc: 'Generic asset spreadsheet',         color: 'text-emerald-500' },
  generic_tx:     { label: 'Transactions',           desc: 'Generic transaction list',           color: 'text-amber-500' },
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function ImportWizard({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [step, setStep]               = useState<ImportStep>('upload');
  const [dragging, setDragging]       = useState(false);
  const [fileName, setFileName]       = useState('');
  const [fileType, setFileType]       = useState<FileType>(null);
  const [assets, setAssets]           = useState<MappedAsset[]>([]);
  const [transactions, setTransactions] = useState<MappedTransaction[]>([]);
  const [importing, setImporting]     = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError]             = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const detected = detectFileType(wb);
        setFileType(detected);
        const parsed = parseFile(wb, detected);
        if (parsed.assets && parsed.assets.length > 0) {
          setAssets(parsed.assets);
          setTransactions([]);
        } else if (parsed.transactions && parsed.transactions.length > 0) {
          setTransactions(parsed.transactions);
          setAssets([]);
        } else {
          setError('No data rows found. Please check the file format matches a supported type.');
          return;
        }
        setStep('preview');
      } catch (err) {
        console.error('Parse error:', err);
        setError(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}. Please check the format.`);
      }
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleImport = async () => {
    setImporting(true); setError('');
    try {
      const isAssets = assets.length > 0;
      const payload = isAssets
        ? { type: 'assets', rows: assets.map(a => ({ name: a.name, category: a.category, currentValue: a.currentValue, invested: a.invested, units: a.units ?? null })) }
        : { type: 'transactions', rows: transactions.map(t => ({ date: t.date, description: t.description, amount: t.amount, type: t.type, category: t.category })) };
      const res = await fetch('/api/finance/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setImportedCount(data.count);
      setStep('done');
      onSuccess?.();
    } catch (e) {
      setError(`Import failed: ${e instanceof Error ? e.message : 'Please try again.'}`);
    } finally {
      setImporting(false);
    }
  };

  const isAssets = assets.length > 0;
  const totalRows = isAssets ? assets.length : transactions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex-none flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Import Financial Data</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Upload .xlsx, .xls or .csv files</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Upload Step ── */}
        {step === 'upload' && (
          <div className="overflow-y-auto flex-1 p-6">
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition py-14 ${dragging ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-white/5'}`}
            >
              <Upload className="h-10 w-10 text-gray-400 mb-3" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Drop your file here or click to browse</p>
              <p className="mt-1 text-xs text-gray-400 text-center max-w-sm">Supports: HDFC/SBI credit card statements, Zerodha/Groww stock/MF holdings, custom spreadsheets</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={e => { if (e.target.files?.[0]) processFile(e.target.files[0]); e.target.value = ''; }} />
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 flex-none mt-0.5" /><span>{error}</span>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              {Object.entries(FILE_TYPE_LABELS).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 rounded-xl border border-gray-100 dark:border-gray-700 px-3 py-2">
                  <div className={`h-2 w-2 flex-none rounded-full bg-current ${v.color}`} />
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{v.label}</p>
                    <p className="text-[10px] text-gray-400">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Preview Step ── */}
        {step === 'preview' && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-none flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 px-6 py-3">
              <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{fileName}</p>
                {fileType && <p className={`text-xs ${FILE_TYPE_LABELS[fileType].color}`}>{FILE_TYPE_LABELS[fileType].label} · {totalRows} rows detected</p>}
              </div>
              <button onClick={() => { setStep('upload'); setAssets([]); setTransactions([]); setError(''); }}
                className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" /> Change
              </button>
            </div>

            <div className="overflow-auto flex-1">
              {isAssets ? (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                    <tr>{['Name', 'Category', 'Units', 'Invested (₹)', 'Current (₹)', 'P&L (₹)'].map(h => (
                      <th key={h} className="px-4 py-2 text-left font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {assets.map((a, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white max-w-[180px] truncate">{a.name}</td>
                        <td className="px-4 py-2 text-gray-500">{a.category}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{a.units?.toFixed(3) ?? '—'}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{a.invested.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{a.currentValue.toLocaleString('en-IN')}</td>
                        <td className={`px-4 py-2 font-medium ${(a.pnl ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {(a.pnl ?? 0) >= 0 ? '+' : ''}{(a.pnl ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                    <tr>{['Date', 'Description', 'Category', 'Amount (₹)', 'Type'].map(h => (
                      <th key={h} className="px-4 py-2 text-left font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {transactions.map((t, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{t.date}</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white max-w-[200px] truncate">{t.description}</td>
                        <td className="px-4 py-2"><span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-gray-600 dark:text-gray-300">{t.category}</span></td>
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{t.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                        <td className="px-4 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.type === 'credit' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                            {t.type === 'credit' ? 'Income' : 'Expense'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {error && (
              <div className="flex-none mx-6 mb-3 flex items-start gap-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 flex-none mt-0.5" /><span>{error}</span>
              </div>
            )}

            <div className="flex-none flex items-center justify-between border-t border-gray-100 dark:border-gray-700 px-6 py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ready to import <span className="font-semibold text-gray-900 dark:text-white">{totalRows}</span> {isAssets ? 'assets' : 'transactions'}.
              </p>
              <div className="flex gap-3">
                <button onClick={onClose} className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5">Cancel</button>
                <button onClick={handleImport} disabled={importing || totalRows === 0}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                  {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {importing ? 'Importing…' : `Import ${totalRows} rows`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Done Step ── */}
        {step === 'done' && (
          <div className="flex flex-col items-center py-16 px-6 text-center flex-1">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Successful!</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-emerald-600">{importedCount}</span> {isAssets ? 'assets added to your portfolio.' : 'transactions added.'}
            </p>
            <button onClick={onClose} className="mt-6 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
