'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronDown, ChevronRight, Shield, TrendingUp, Zap,
  CheckCircle2, AlertCircle, PiggyBank, Activity,
} from 'lucide-react';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { useFinance } from '@/lib/financeStore';
import { getExcludedExpenseCategories, getExcludedIncomeCategories } from '@/lib/customCategoryStore';

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${Math.abs(v).toLocaleString('en-IN')}`;
}

// ── Scoring (each metric /2, total /10) ───────────────────────────────────
function scoreEF(months: number)   { return months >= 6 ? 2 : months >= 3 ? 1.5 : months >= 1 ? 1 : 0.5; }
function scoreSR(rate: number)     { return rate >= 0.40 ? 2 : rate >= 0.25 ? 1.5 : rate >= 0.10 ? 1 : 0.5; }
function scoreDR(ratio: number)    { return ratio < 0.20 ? 2 : ratio < 0.30 ? 1.5 : ratio < 0.50 ? 1 : 0.5; }
function scoreTerm(term: number, net: number, monthExp: number) {
  const ideal = Math.max(0, (monthExp * 12 * 25) - net);
  if (ideal === 0) return 2;
  const r = term / ideal;
  return r >= 1 ? 2 : r >= 0.7 ? 1.5 : r >= 0.4 ? 1 : 0.5;
}
function scoreHealth(cover: number, deps: number) {
  const rec = deps >= 3 ? 2500000 : 1500000;
  const r = cover / rec;
  return r >= 1 ? 2 : r >= 0.7 ? 1.5 : r >= 0.4 ? 1 : 0.5;
}

function getStatus(score: number) {
  if (score >= 8)  return { label: 'Excellent', color: 'text-emerald-700 dark:text-[#00E5A0]', bg: 'bg-emerald-50 dark:bg-[#00e5a0]/[0.1]', ring: '#00E5A0' };
  if (score >= 6)  return { label: 'Good',      color: 'text-blue-700 dark:text-[#5BE4FF]',    bg: 'bg-blue-50 dark:bg-[#5BE4FF]/[0.1]',    ring: '#5BE4FF' };
  if (score >= 4)  return { label: 'Fair',      color: 'text-amber-700 dark:text-[#F9A44A]',   bg: 'bg-amber-50 dark:bg-[#F9A44A]/[0.1]',   ring: '#F9A44A' };
  return              { label: 'Needs Work', color: 'text-rose-700 dark:text-[#FF6B6B]',    bg: 'bg-rose-50 dark:bg-[#FF6B6B]/[0.1]',    ring: '#FF6B6B' };
}

function barColor(score2: number) {
  // score is out of 2
  if (score2 >= 1.5) return '#10b981';
  if (score2 >= 1)   return '#f59e0b';
  return '#ef4444';
}

// ── Reusable sub-components ───────────────────────────────────────────────
function VProgress({
  value, max = 100, color = '#10b981', segments,
}: { value: number; max?: number; color?: string; segments?: number[] }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
      {segments?.map(s => (
        <div key={s} className="absolute top-0 bottom-0 w-px bg-white/80 dark:bg-white/30 z-10"
          style={{ left: `${Math.round((s / max) * 100)}%` }} />
      ))}
      <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function VBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${color} ${bg}`}>{label}</span>;
}

// ── Vitals Icon (dot + 3 concentric rings) ───────────────────────────────
function VitalsIcon({ size = 20, color = '#10b981' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="2.5" fill={color} />
      <circle cx="12" cy="12" r="5.5"  stroke={color} strokeWidth="1.5" strokeOpacity="0.8" />
      <circle cx="12" cy="12" r="8.5"  stroke={color} strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="12" cy="12" r="11"   stroke={color} strokeWidth="0.8" strokeOpacity="0.25" />
    </svg>
  );
}

// ── Score Ring ─────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 52, cx = 64, cy = 64, sw = 9;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, (score / 10) * circ);
  const { label, ring } = getStatus(score);
  return (
    <div className="relative flex h-32 w-32 flex-none items-center justify-center">
      <svg width="128" height="128" className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={ring} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-bold text-gray-900 dark:text-[#e4eaf4]">{score.toFixed(1)}</p>
        <p className="text-[11px] font-medium text-gray-400 dark:text-[#3d5166] -mt-0.5">/10</p>
        <p className="text-xs font-semibold mt-0.5" style={{ color: ring }}>{label}</p>
      </div>
    </div>
  );
}

// ── Input field ────────────────────────────────────────────────────────────
function VInput({
  label, value, onChange, suffix = '', placeholder = '0',
}: { label: string; value: number; onChange: (v: number) => void; suffix?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-[#8fa3b8] mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={e => onChange(Number(e.target.value))}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 dark:border-white/[0.1] bg-gray-50 dark:bg-[#0b1019] px-3 py-2 pr-10 text-sm text-gray-900 dark:text-[#e4eaf4] focus:border-emerald-400 dark:focus:border-[#00E5A0] focus:bg-white dark:focus:bg-[#0b1019] focus:outline-none transition"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-[#3d5166] select-none">{suffix}</span>}
      </div>
    </div>
  );
}

// ── Metric card ────────────────────────────────────────────────────────────
function MetricCard({
  title, score, detail, progress, suggestion,
}: {
  title: string;
  score: number;
  detail: React.ReactNode;
  progress: { value: number; max: number; segments?: number[] };
  suggestion?: string;
}) {
  const color = barColor(score);
  const scoreLabel = score >= 1.5 ? 'Good' : score >= 1 ? 'Fair' : 'Low';
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-[#e4eaf4]">{title}</h3>
        <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-gray-50 dark:bg-white/[0.06]" style={{ color }}>
          {score}/2 · {scoreLabel}
        </span>
      </div>
      <div className="text-xs text-gray-500 dark:text-[#8fa3b8] space-y-0.5">{detail}</div>
      <VProgress value={progress.value} max={progress.max} segments={progress.segments} color={color} />
      {suggestion && <p className="text-[11px] text-gray-400 dark:text-[#3d5166] leading-relaxed">{suggestion}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function VitalsPage() {
  const { state } = useFinance();

  // ── API-persisted profile ──
  const [profile, setProfile] = useState({ age: 0, termCover: 0, healthCover: 0, dependents: 0 });
  const [profileOpen, setProfileOpen] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        const p = data?.preferences ?? {};
        setProfile({
          age:         typeof p.age         === 'number' ? p.age         : 0,
          dependents:  typeof p.dependents  === 'number' ? p.dependents  : 0,
          termCover:   typeof p.termCover   === 'number' ? p.termCover   : 0,
          healthCover: typeof p.healthCover === 'number' ? p.healthCover : 0,
        });
        setProfileLoaded(true);
      })
      .catch(() => setProfileLoaded(true));
  }, []);

  const updateProfile = useCallback((key: keyof typeof profile, val: number) => {
    setProfile(prev => {
      const next = { ...prev, [key]: val };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        setSaving(true);
        fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [key]: val === 0 ? null : val }),
        }).finally(() => setSaving(false));
      }, 600);
      return next;
    });
  }, []);

  // ── Derived from store ──
  const today = useMemo(() => new Date(), []);
  const todayStr = today.toISOString().slice(0, 10);

  // ── Current-month income / expense — matches TransactionList exactly ─────
  // Uses the same two rules TransactionList uses for its summary cards:
  //   1. Exclude system categories (Opening Balance, Balance Adjustment) from both sides.
  //   2. Exclude user-exempted categories (Investment, SIP, …) from expense only.
  // No "date <= today" cap — the full calendar month is counted, same as the
  // Transactions page when filtered to the current month.
  const SYSTEM_CATS = ['Opening Balance', 'Balance Adjustment', 'Adjustment', 'Credit Card Payment', 'Transfer'];

  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    const excludedExpense = getExcludedExpenseCategories();
    const excludedIncome  = getExcludedIncomeCategories();
    const curYear  = today.getFullYear();
    const curMonth = today.getMonth();

    let income  = 0;
    let expense = 0;

    for (const t of state.transactions) {
      // Skip system / internal categories and transfers on both sides
      if (SYSTEM_CATS.includes(t.category) || t.type === 'transfer') continue;

      const d = new Date(t.date);
      if (d.getFullYear() !== curYear || d.getMonth() !== curMonth) continue;

      if (t.type === 'income' && !excludedIncome.includes(t.category)) {
        income += t.amount;
      } else if (t.type === 'expense' && !excludedExpense.includes(t.category)) {
        expense += Math.abs(t.amount);
      }
    }

    return { monthlyIncome: Math.round(income), monthlyExpense: Math.round(expense) };
  }, [state.transactions, today]);

  // Emergency fund = Cash + Bank (savings) accounts only
  const emergencyFundBalance = useMemo(
    () => state.accounts.filter(a => a.type === 'Cash' || a.type === 'Bank').reduce((s, a) => s + Math.max(0, a.balance), 0),
    [state.accounts]
  );
  const liquidAssets    = useMemo(() => state.accounts.filter(a => a.type !== 'Credit Card').reduce((s, a) => s + Math.max(0, a.balance), 0), [state.accounts]);
  const investedAssets  = useMemo(() => state.assets.reduce((s, a) => s + a.value, 0), [state.assets]);
  const totalAssets     = liquidAssets + investedAssets;
  const totalLiabilities = useMemo(() => state.liabilities.reduce((s, l) => s + l.outstanding, 0), [state.liabilities]);

  const savings      = Math.max(0, monthlyIncome - monthlyExpense);
  const netWorth     = totalAssets - totalLiabilities;
  const savingsRate  = monthlyIncome > 0 ? savings / monthlyIncome : 0;
  const runwayMonths = monthlyExpense > 0 ? emergencyFundBalance / monthlyExpense : 0;
  const debtRatio    = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
  const fiYears      = savings > 0 ? Math.round((monthlyExpense * 12 * 25) / (savings * 12)) : null;
  const idealTerm    = Math.max(0, (monthlyExpense * 12 * 25) - netWorth);
  const healthRec    = profile.dependents >= 3 ? 2500000 : 1500000;

  // ── Scores ──
  const sEF     = scoreEF(runwayMonths);
  const sSR     = scoreSR(savingsRate);
  const sDR     = scoreDR(debtRatio);
  const sTerm   = scoreTerm(profile.termCover, netWorth, monthlyExpense);
  const sHealth = scoreHealth(profile.healthCover, profile.dependents);
  const totalScore = Math.round((sEF + sSR + sDR + sTerm + sHealth) * 10) / 10;
  const status = getStatus(totalScore);

  // ── Insight text (weakest metric drives the headline) ──
  const weakest = [
    { name: 'emergency fund', score: sEF },
    { name: 'savings rate',   score: sSR },
    { name: 'debt ratio',     score: sDR },
    { name: 'term insurance', score: sTerm },
    { name: 'health cover',   score: sHealth },
  ].sort((a, b) => a.score - b.score)[0];
  const insightText = totalScore >= 8
    ? 'Your finances are in excellent shape. Keep maintaining these habits.'
    : `Focus on improving your ${weakest.name} to boost your Vital score.`;

  // ── Profile completeness ──
  const completeness = Math.round(
    ([profile.age > 0, profile.termCover > 0, profile.healthCover > 0, profile.dependents >= 0,
      monthlyIncome > 0, monthlyExpense > 0, liquidAssets > 0]
      .filter(Boolean).length / 7) * 100
  );

  // ── Top 3 actions ──
  const actions = [
    { score: sEF,   label: 'Build emergency fund',    detail: runwayMonths < 6 ? `Need ${fmt(Math.max(0, monthlyExpense * (6 - runwayMonths)))} more for a 6-month safety net` : '', cond: runwayMonths < 6 },
    { score: sSR,   label: 'Increase savings rate',   detail: `Aim for 25%+ — currently at ${Math.round(savingsRate * 100)}%`, cond: savingsRate < 0.25 },
    { score: sTerm, label: 'Increase term insurance', detail: `Ideal cover is ${fmt(idealTerm)}; enter your policy in Financial Profile`, cond: sTerm < 2 },
    { score: sHealth,label:'Improve health insurance',detail: `Recommended cover: ${fmt(healthRec)}`, cond: sHealth < 2 },
    { score: sDR,   label: 'Reduce debt',             detail: `Debt ratio is ${Math.round(debtRatio * 100)}% — target below 20%`, cond: debtRatio >= 0.2 },
  ].filter(a => a.cond).sort((a, b) => a.score - b.score).slice(0, 3);

  const metrics = [
    { label: 'Emergency Fund', score: sEF },
    { label: 'Savings Rate',   score: sSR },
    { label: 'Debt Ratio',     score: sDR },
    { label: 'Term Insurance', score: sTerm },
    { label: 'Health Cover',   score: sHealth },
  ];

  return (
    <div className="space-y-5">
      <FinanceTopBar />

      {/* ── Hero Score Card ── */}
      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <VitalsIcon size={20} color={status.ring} />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">Vital Score</h2>
          <VBadge label={status.label} color={status.color} bg={status.bg} />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ScoreRing score={totalScore} />
          <div className="flex-1 w-full space-y-2.5">
            {metrics.map(m => (
              <div key={m.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-[#8fa3b8]">{m.label}</span>
                  <span className="font-semibold text-gray-700 dark:text-[#e4eaf4]">{m.score}/2</span>
                </div>
                <VProgress value={m.score} max={2} color={barColor(m.score)} />
              </div>
            ))}
          </div>
        </div>

        <p className="mt-5 rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3 text-xs leading-relaxed text-gray-600 dark:text-[#8fa3b8]">{insightText}</p>
      </div>

      {/* ── Financial Profile ── */}
      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-5 shadow-sm">
        <button type="button" onClick={() => setProfileOpen(v => !v)}
          className="flex w-full items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-gray-400 dark:text-[#3d5166] flex-none" />
          <h2 className="flex-1 text-sm font-semibold text-gray-900 dark:text-[#e4eaf4] text-left">Financial Profile</h2>
          <span className="text-xs text-gray-400 dark:text-[#3d5166]">{completeness}% complete</span>
          {profileOpen
            ? <ChevronDown className="h-4 w-4 text-gray-400 dark:text-[#3d5166]" />
            : <ChevronRight className="h-4 w-4 text-gray-400 dark:text-[#3d5166]" />}
        </button>

        <VProgress value={completeness} max={100}
          color={completeness >= 80 ? '#00E5A0' : completeness >= 50 ? '#F9A44A' : '#FF6B6B'} />

        {profileOpen && (
          <div className="mt-4 space-y-4">
            {/* Auto-pulled tiles */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Monthly Income',  value: fmt(monthlyIncome),  color: 'text-emerald-700 dark:text-[#00E5A0]', sub: 'This month' },
                { label: 'Monthly Expense', value: fmt(monthlyExpense), color: 'text-rose-600 dark:text-[#FF6B6B]',    sub: 'This month' },
                { label: 'Liquid Assets',   value: fmt(liquidAssets),   color: 'text-blue-700 dark:text-[#5BE4FF]',    sub: 'Bank + Wallets' },
              ].map(t => (
                <div key={t.label} className="rounded-xl bg-gray-50 dark:bg-white/[0.04] p-3">
                  <p className="text-[11px] text-gray-400 dark:text-[#3d5166] mb-0.5">{t.label}</p>
                  <p className={`text-sm font-semibold ${t.color}`}>{t.value}</p>
                  <p className="text-[10px] text-gray-400 dark:text-[#3d5166] mt-0.5">{t.sub}</p>
                </div>
              ))}
            </div>

            {/* User inputs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <VInput label="Age" value={profile.age} onChange={v => updateProfile('age', v)} placeholder="30" suffix="yrs" />
              <VInput label="Dependents" value={profile.dependents} onChange={v => updateProfile('dependents', v)} placeholder="0" />
              <VInput label="Term Cover" value={profile.termCover} onChange={v => updateProfile('termCover', v)} placeholder="1,00,00,000" suffix="₹" />
              <VInput label="Health Cover" value={profile.healthCover} onChange={v => updateProfile('healthCover', v)} placeholder="15,00,000" suffix="₹" />
            </div>

            <p className="text-[11px] text-gray-400 dark:text-[#3d5166]">
              {!profileLoaded ? 'Loading...' : saving ? 'Saving...' : 'All changes auto-saved to your account.'}
            </p>
          </div>
        )}
      </div>

      {/* ── Core Vitals ── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-[#e4eaf4]">Core Vitals</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricCard
            title="Emergency Fund"
            score={sEF}
            detail={
              <>
                <p>Cash &amp; Savings: <span className="font-semibold text-gray-700 dark:text-[#e4eaf4]">{fmt(emergencyFundBalance)}</span></p>
                <p>Monthly runway: <span className={`font-semibold ${runwayMonths >= 6 ? 'text-emerald-700' : runwayMonths >= 3 ? 'text-amber-600' : 'text-rose-600'}`}>{runwayMonths.toFixed(1)} months</span></p>
              </>
            }
            progress={{ value: Math.min(runwayMonths, 12), max: 12, segments: [3, 6] }}
            suggestion={runwayMonths < 6
              ? `Build ${fmt(Math.max(0, monthlyExpense * (6 - runwayMonths)))} more to reach a 6-month safety net`
              : '6-month emergency fund is in place ✓'}
          />

          <MetricCard
            title="Savings Rate"
            score={sSR}
            detail={
              <>
                <p>Income: <span className="font-semibold text-emerald-700">{fmt(monthlyIncome)}</span> · Expense: <span className="font-semibold text-rose-600">{fmt(monthlyExpense)}</span></p>
                <p>Saving <span className={`font-semibold ${savingsRate >= 0.2 ? 'text-emerald-700' : 'text-amber-600'}`}>{Math.round(savingsRate * 100)}%</span> of income this month</p>
                {fiYears !== null && <p className="text-gray-400 mt-0.5">FI estimate at current pace: ~{fiYears} yrs</p>}
              </>
            }
            progress={{ value: Math.min(savingsRate * 100, 50), max: 50, segments: [10, 25] }}
            suggestion={savingsRate < 0.25
              ? `Save ${fmt((0.25 - savingsRate) * monthlyIncome)} more / month to reach a 25% savings rate`
              : 'Savings rate is on track ✓'}
          />
        </div>
      </div>

      {/* ── Future Impact ── */}
      {monthlyIncome > 0 && monthlyExpense > 0 && (
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-blue-500 dark:text-[#5BE4FF]" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">Future Impact</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-blue-50 dark:bg-[#5BE4FF]/[0.07] p-4">
              <p className="text-[11px] text-blue-500 dark:text-[#5BE4FF]/80 mb-1">Current savings rate · {Math.round(savingsRate * 100)}%</p>
              <p className="text-xl font-bold text-blue-800 dark:text-[#5BE4FF]">{fiYears !== null ? `${fiYears} yrs to FI` : 'Not saving'}</p>
              <p className="text-xs text-blue-400 dark:text-[#5BE4FF]/60 mt-1">Time to Financial Independence</p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-[#00e5a0]/[0.07] p-4">
              <p className="text-[11px] text-emerald-600 dark:text-[#00E5A0]/80 mb-1">If savings rate = 30%</p>
              {(() => {
                const s30 = monthlyIncome * 0.30;
                const fi30 = s30 > 0 ? Math.round((monthlyExpense * 12 * 25) / (s30 * 12)) : null;
                return (
                  <>
                    <p className="text-xl font-bold text-emerald-800 dark:text-[#00E5A0]">{fi30 !== null ? `${fi30} yrs to FI` : '—'}</p>
                    <p className="text-xs text-emerald-500 dark:text-[#00E5A0]/60 mt-1">
                      {s30 > savings ? `Save ${fmt(s30 - savings)} more / month` : 'Already at target ✓'}
                    </p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Protection ── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-[#e4eaf4]">Protection</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricCard
            title="Term Insurance"
            score={sTerm}
            detail={
              <>
                <p>Current: <span className="font-semibold text-gray-700">{profile.termCover > 0 ? fmt(profile.termCover) : '—'}</span></p>
                <p>Ideal cover: <span className="font-semibold text-gray-700">{idealTerm > 0 ? fmt(idealTerm) : '—'}</span></p>
                {profile.termCover > 0 && idealTerm > 0 && (
                  <p>Gap: <span className={`font-semibold ${profile.termCover >= idealTerm ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {profile.termCover >= idealTerm ? 'Fully covered ✓' : fmt(idealTerm - profile.termCover)}
                  </span></p>
                )}
              </>
            }
            progress={{ value: profile.termCover, max: Math.max(idealTerm, profile.termCover, 1) }}
            suggestion={profile.termCover === 0 ? 'Enter your term policy amount in Financial Profile above' : undefined}
          />

          <MetricCard
            title="Health Insurance"
            score={sHealth}
            detail={
              <>
                <p>Current: <span className="font-semibold text-gray-700">{profile.healthCover > 0 ? fmt(profile.healthCover) : '—'}</span></p>
                <p>Recommended ({profile.dependents >= 3 ? '3+ dependents' : `${profile.dependents} dep.`}): <span className="font-semibold text-gray-700">{fmt(healthRec)}</span></p>
                {profile.healthCover > 0 && (
                  <p>Gap: <span className={`font-semibold ${profile.healthCover >= healthRec ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {profile.healthCover >= healthRec ? 'Covered ✓' : fmt(healthRec - profile.healthCover)}
                  </span></p>
                )}
              </>
            }
            progress={{ value: profile.healthCover, max: Math.max(healthRec, profile.healthCover, 1) }}
            suggestion={profile.healthCover === 0 ? 'Enter your health cover amount in Financial Profile above' : undefined}
          />
        </div>
      </div>

      {/* ── Debt Ratio ── */}
      {(totalAssets > 0 || totalLiabilities > 0) && (
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-400 dark:text-[#3d5166]" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">Debt Ratio</h2>
            </div>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-gray-50 dark:bg-white/[0.06]" style={{ color: barColor(sDR) }}>
              {sDR}/2
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
            <div>
              <p className="text-4xl font-bold text-gray-900 dark:text-[#e4eaf4]">{Math.round(debtRatio * 100)}%</p>
              <p className="text-xs text-gray-400 dark:text-[#3d5166] mt-0.5">Liabilities ÷ Total Assets</p>
            </div>
            <div className="flex-1 w-full space-y-1.5 text-xs text-gray-500 dark:text-[#8fa3b8] sm:mt-1">
              <div className="flex justify-between"><span>Total Assets</span><span className="font-semibold text-emerald-700 dark:text-[#00E5A0]">{fmt(totalAssets)}</span></div>
              <div className="flex justify-between"><span>Total Liabilities</span><span className="font-semibold text-rose-600 dark:text-[#FF6B6B]">{fmt(totalLiabilities)}</span></div>
              <div className="flex justify-between border-t border-gray-100 dark:border-white/[0.07] pt-1.5">
                <span className="font-medium text-gray-700 dark:text-[#e4eaf4]">Net Worth</span>
                <span className={`font-bold ${netWorth >= 0 ? 'text-emerald-700 dark:text-[#00E5A0]' : 'text-rose-600 dark:text-[#FF6B6B]'}`}>{fmt(netWorth)}</span>
              </div>
            </div>
          </div>

          <VProgress value={Math.min(debtRatio * 100, 100)} max={100} segments={[20, 30, 50]} color={barColor(sDR)} />
          <div className="mt-1.5 flex text-[10px] text-gray-400 dark:text-[#3d5166] gap-1">
            <span className="w-[20%]">0%</span>
            <span className="w-[10%]">20%</span>
            <span className="w-[20%]">30%</span>
            <span>50%</span>
          </div>
          <div className="mt-2.5 flex gap-3 text-[11px]">
            <span className="text-emerald-600 dark:text-[#00E5A0] font-medium">● &lt;20% Excellent</span>
            <span className="text-amber-500 dark:text-[#F9A44A] font-medium">● 20–30% Good</span>
            <span className="text-rose-500 dark:text-[#FF6B6B] font-medium">● &gt;50% High risk</span>
          </div>
        </div>
      )}

      {/* ── Top Actions ── */}
      {actions.length > 0 && (
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-amber-500 dark:text-[#F9A44A]" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">Top Actions</h2>
          </div>
          <div className="space-y-2">
            {actions.map((a, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3">
                <div className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-amber-100 dark:bg-[#F9A44A]/[0.15] text-[11px] font-bold text-amber-700 dark:text-[#F9A44A]">{i + 1}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-[#e4eaf4]">{a.label}</p>
                  {a.detail && <p className="text-xs text-gray-500 dark:text-[#8fa3b8] mt-0.5">{a.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
