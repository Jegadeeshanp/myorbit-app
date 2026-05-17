'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, ArrowUp, Loader2 } from 'lucide-react';
import { toast } from '@/components/Toast';

const EXAMPLES = [
  'Add task call dentist every Monday at 9:00',
  'Add ₹5000 rent expense monthly on HDFC',
  'Transfer ₹2000 from SBI to HDFC',
  'Add task gym every weekday at 6:00 high priority',
  'Add ₹200 food expense on Regalia',
  'Log meditation done',
  'Mark task done: buy groceries',
  'Add goal learn Spanish by December',
];

export default function CommandBar() {
  const [open,    setOpen]    = useState(false);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [hint,    setHint]    = useState(EXAMPLES[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cycle hint examples
  useEffect(() => {
    if (!open) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % EXAMPLES.length;
      setHint(EXAMPLES[i]);
    }, 3000);
    return () => clearInterval(id);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(v => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = useCallback(async () => {
    const command = input.trim();
    if (!command || loading) return;
    setLoading(true);
    try {
      const res  = await fetch('/api/ai-command', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ command }),
      });
      const data = await res.json();
      if (data.success) {
        toast(data.message, 'success');
        setInput('');
        setOpen(false);
      } else {
        toast(data.message || 'Could not process command', 'error');
      }
    } catch {
      toast('Command failed — check your connection', 'error');
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[58] bg-black/20 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Command panel — slides up from bottom */}
      <div
        className={`fixed bottom-20 left-1/2 z-[59] w-full max-w-xl -translate-x-1/2 px-4 transition-all duration-200 ${
          open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500 flex-none" />
            <span className="text-xs font-semibold text-gray-500 tracking-wide">AI Command</span>
            <span className="ml-auto text-[10px] text-gray-400 font-mono">⌘K</span>
          </div>

          {/* Input row */}
          <div className="flex items-center gap-2 px-4 py-3">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void submit(); }}
              placeholder={hint}
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-60"
            />
            {input && !loading && (
              <button
                onClick={() => setInput('')}
                className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => void submit()}
              disabled={!input.trim() || loading}
              className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ArrowUp className="h-4 w-4" />
              }
            </button>
          </div>

          {/* Quick examples */}
          <div className="px-4 pb-3 flex flex-wrap gap-1.5">
            {EXAMPLES.slice(0, 3).map(ex => (
              <button
                key={ex}
                onClick={() => { setInput(ex); inputRef.current?.focus(); }}
                className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-500 hover:border-emerald-300 hover:text-emerald-700 transition"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        title="AI Command (⌘K)"
        className={`fixed bottom-6 left-6 z-[57] flex h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-emerald-200/60 transition-all duration-200 ${
          open
            ? 'bg-gray-800 text-white scale-95'
            : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105'
        }`}
      >
        {open
          ? <X className="h-5 w-5" />
          : <Sparkles className="h-5 w-5" />
        }
      </button>
    </>
  );
}
