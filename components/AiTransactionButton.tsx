'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Sparkles, X, Check, Loader2, ChevronDown } from 'lucide-react';
import { toast } from '@/components/Toast';

type Parsed = {
  amount: number;
  type: 'expense' | 'income';
  category: string;
  description: string;
  accountId: string | null;
  accountName: string | null;
  date: string;
  confidence: 'high' | 'medium' | 'low';
  accounts: { id: string; name: string; type: string }[];
};

// Extend window for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function AiTransactionButton() {
  const [open,       setOpen]       = useState(false);
  const [text,       setText]       = useState('');
  const [listening,  setListening]  = useState(false);
  const [parsing,    setParsing]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [parsed,     setParsed]     = useState<Parsed | null>(null);
  const [editAmt,    setEditAmt]    = useState('');
  const [editDesc,   setEditDesc]   = useState('');
  const [editCat,    setEditCat]    = useState('');
  const [editAccId,  setEditAccId]  = useState<string | null>(null);
  const [editType,   setEditType]   = useState<'expense'|'income'>('expense');

  const inputRef = useRef<HTMLInputElement>(null);
  const recogRef = useRef<any>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setText(''); setParsed(null);
    }
    return () => stopListening();
  }, [open]);

  // Populate editable fields when parsed result arrives
  useEffect(() => {
    if (!parsed) return;
    setEditAmt(String(parsed.amount));
    setEditDesc(parsed.description);
    setEditCat(parsed.category);
    setEditAccId(parsed.accountId);
    setEditType(parsed.type);
  }, [parsed]);

  function startListening() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { toast('Speech recognition not supported in this browser', 'error'); return; }

    const r = new SR();
    r.lang = 'en-IN';
    r.continuous = false;
    r.interimResults = false;
    r.onresult  = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setText(prev => (prev ? prev + ' ' + transcript : transcript).trim());
    };
    r.onerror   = () => { setListening(false); };
    r.onend     = () => { setListening(false); };
    r.start();
    recogRef.current = r;
    setListening(true);
  }

  function stopListening() {
    recogRef.current?.stop();
    setListening(false);
  }

  async function handleParse() {
    if (!text.trim()) return;
    setParsing(true);
    setParsed(null);
    try {
      const res = await fetch('/api/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: Parsed = await res.json();
      setParsed(data);
    } catch (e: any) {
      toast('Could not parse — try rephrasing', 'error');
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    if (!parsed) return;
    setSaving(true);
    try {
      const body = {
        amount:      Number(editAmt) || parsed.amount,
        type:        editType,
        category:    editCat || parsed.category,
        description: editDesc || parsed.description,
        accountId:   editAccId || undefined,
        date:        parsed.date,
      };
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      toast('Transaction added!');
      setOpen(false);
      // Notify financeStore to add the transaction to in-memory state
      window.dispatchEvent(new CustomEvent('orbit:transaction-added', { detail: saved }));
    } catch {
      toast('Failed to save transaction', 'error');
    } finally {
      setSaving(false);
    }
  }

  const CATEGORIES = [
    'Food','Groceries','Restaurants','Rent','Fuel','Transport','Utilities',
    'Internet','Mobile','Shopping','Subscriptions','Medical','Insurance',
    'Travel','Education','Gifts','Miscellaneous','Investment','Loan',
    'Salary','Bonus','Freelance','Business','Dividends','Interest',
    'Rental Income','Cashback','Refund','Other Income',
  ];

  return (
    <>
      {/* ── Floating AI button ─────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-900/40 transition hover:scale-105 hover:shadow-violet-700/50 active:scale-95 sm:bottom-8 sm:right-8"
        title="Add transaction with AI"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </button>

      {/* ── Modal backdrop ─────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#1a1a2e] border border-white/10 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">AI Transaction</p>
                <p className="text-xs text-gray-400">Type or speak to add a transaction</p>
              </div>
              <button onClick={() => setOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">

              {/* Input row */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    value={text}
                    onChange={e => { setText(e.target.value); setParsed(null); }}
                    onKeyDown={e => e.key === 'Enter' && !parsing && handleParse()}
                    placeholder="e.g. 50 rupees office food sbi rupay card"
                    className="w-full rounded-2xl bg-white/8 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/60 focus:bg-white/10 transition"
                  />
                </div>
                {/* Mic button */}
                <button
                  onPointerDown={startListening}
                  onPointerUp={stopListening}
                  className={`flex h-11 w-11 flex-none items-center justify-center rounded-2xl border transition ${
                    listening
                      ? 'border-rose-500 bg-rose-500/20 text-rose-400 animate-pulse'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20'
                  }`}
                  title="Hold to speak"
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                {/* Parse button */}
                <button
                  onClick={handleParse}
                  disabled={!text.trim() || parsing}
                  className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Parse"
                >
                  {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </button>
              </div>

              {/* Hint */}
              {!parsed && !parsing && (
                <p className="text-xs text-gray-600 text-center">
                  Press <kbd className="rounded bg-white/10 px-1 py-0.5 text-[10px] text-gray-400">Enter</kbd> or tap{' '}
                  <Sparkles className="inline h-3 w-3 text-violet-400" /> to parse&nbsp;&nbsp;·&nbsp;&nbsp;
                  Hold <Mic className="inline h-3 w-3 text-gray-400" /> to speak
                </p>
              )}

              {/* Parsed result — editable confirmation card */}
              {parsed && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                  {/* Confidence */}
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Parsed result</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      parsed.confidence === 'high'   ? 'bg-emerald-900/40 text-emerald-400'
                      : parsed.confidence === 'medium' ? 'bg-amber-900/40 text-amber-400'
                      : 'bg-rose-900/40 text-rose-400'
                    }`}>
                      {parsed.confidence} confidence
                    </span>
                  </div>

                  {/* Type toggle */}
                  <div className="flex gap-2">
                    {(['expense','income'] as const).map(t => (
                      <button key={t} onClick={() => setEditType(t)}
                        className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                          editType === t
                            ? t === 'expense' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                            : 'bg-white/5 text-gray-400 hover:text-white'
                        }`}>
                        {t === 'expense' ? '− Expense' : '+ Income'}
                      </button>
                    ))}
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium">Amount (₹)</label>
                    <input
                      type="number"
                      value={editAmt}
                      onChange={e => setEditAmt(e.target.value)}
                      className="mt-1 w-full rounded-xl bg-white/8 border border-white/10 px-3 py-2 text-lg font-bold text-white focus:outline-none focus:border-violet-500/60"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium">Description</label>
                    <input
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      className="mt-1 w-full rounded-xl bg-white/8 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/60"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium">Category</label>
                    <div className="relative mt-1">
                      <select
                        value={editCat}
                        onChange={e => setEditCat(e.target.value)}
                        className="w-full appearance-none rounded-xl bg-white/8 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/60"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    </div>
                  </div>

                  {/* Account */}
                  {parsed.accounts.length > 0 && (
                    <div>
                      <label className="text-[11px] text-gray-500 font-medium">Account</label>
                      <div className="relative mt-1">
                        <select
                          value={editAccId ?? ''}
                          onChange={e => setEditAccId(e.target.value || null)}
                          className="w-full appearance-none rounded-xl bg-white/8 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/60"
                        >
                          <option value="" className="bg-gray-900">No account</option>
                          {parsed.accounts.map(a => (
                            <option key={a.id} value={a.id} className="bg-gray-900">{a.name} ({a.type})</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                  )}

                  {/* Confirm button */}
                  <button
                    onClick={handleSave}
                    disabled={saving || !editAmt || Number(editAmt) <= 0}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {saving ? 'Saving…' : 'Add Transaction'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
