'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ChevronDown, ChevronRight, Shield, TrendingUp, Zap,
  CheckCircle2, AlertCircle, PiggyBank, Activity,
} from 'lucide-react';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { useFinance } from '@/lib/financeStore';

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
  if (score >= 8)  return { label: 'Excellent', color: 'text-emerald-700', bg: 'bg-emerald-50', ring: '#10b981' };
  if (score >= 6)  return { label: 'Good',      color: 'text-blue-700',    bg: 'bg-blue-50',    ring: '#3b82f6' };
  if (score >= 4)  return { label: 'Fair',      color: 'text-amber-700',   bg: 'bg-amber-50',   ring: '#f59e0b' };
  return              { label: 'Needs Work', color: 'text-rose-700',    bg: 'bg-rose-50',    ring: '#ef4444' };
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
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
      {segments?.map(s => (
        <div key={s} className="absolute top-0 bottom-0 w-px bg-white/80 z-10"
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
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={ring} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-bold text-gray-900">{score.toFixed(1)}</p>
        <p className="text-[11px] font-medium text-gray-400 -mt-0.5">/10</p>
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
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={e => onChange(Number(e.target.value))}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 pr-10 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none transition"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none">{suffix}</span>}
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
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-gray-50" style={{ color }}>
          {score}/2 · {scoreLabel}
        </span>
      </div>
      <div className="text-xs text-gray-500 space-y-0.5">{detail}</div>
      <VProgress value={progress.value} max={progress.max} segments={progress.segments} color={color} />
      {suggestion && <p className="text-[11px] text-gray-400 leading-relaxed">{suggestion}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
const PROFILE_KEY = 'orbit_vitals_profile';

export default function VitalsPage() {
  const { state } = useFinance();

  // ── localStorage-persisted profile ──
  const [profile, setProfile] = useState({ age: 0, termCover: 0, healthCover: 0, dependents: 0 });
  const [profileOpen, setProfileOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) setProfile(JSON.parse(saved));
    } catch {}
  }, []);

  const updateProfile = useCallback((key: keyof typeof profile, val: number) => {
    setProfile(prev => {
      const next = { ...prev, [key]: val };
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // ── Derived from store ──
  const today = useMemo(() => new Date(), []);
  const todayStr = today.toISOString().slice(0, 10);

  const monthlyIncome = useMemo(
    () => state.transactions
      .filter(t => { const d = new Date(t.date); return t.type === 'income' && t.date <= todayStr && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(); })
      .reduce((s, t) => s + t.amount, 0),
    [state.transactions, todayStr, today]
  );

  const monthlyExpense = useMemo(
    () => state.transactions
      .filter(t => { const d = new Date(t.date); return t.type === 'expense' && t.date <= todayStr && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(); })
      .reduce((s, t) => s + Math.abs(t.amount), 0),
    [state.transactions, todayStr, today]
  );

  const liquidAssets    = useMemo(() => state.accounts.filter(a => a.type !== 'Credit Card').reduce((s, a) => s + Math.max(0, a.balance), 0), [state.accounts]);
  const investedAssets  = useMemo(() => state.assets.reduce((s, a) => s + a.value, 0), [state.assets]);
  const totalAssets     = liquidAssets + investedAssets;
  const totalLiabilities = useMemo(() => state.liabilities.reduce((s, l) => s + l.outstanding, 0), [state.liabilities]);

  const savings      = Math.max(0, monthlyIncome - monthlyExpense);
  const netWorth     = totalAssets - totalLiabilities;
  const savingsRate  = monthlyIncome > 0 ? savings / monthlyIncome : 0;
  const runwayMonths = monthlyExpense > 0 ? liquidAssets / monthlyExpense : 0;
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
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <VitalsIcon size={20} color={status.ring} />
          <h2 className="text-sm font-semibold text-gray-900">Vital Score</h2>
          <VBadge label={status.label} color={status.color} bg={status.bg} />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ScoreRing score={totalScore} />
          <div className="flex-1 w-full space-y-2.5">
            {metrics.map(m => (
              <div key={m.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-500">{m.label}</span>
                  <span className="font-semibold text-gray-700">{m.score}/2</span>
                </div>
                <VProgress value={m.score} max={2} color={barColor(m.score)} />
              </div>
            ))}
          </div>
        </div>

        <p className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-600">{insightText}</p>
      </div>

      {/* ── Financial Profile ── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <button type="button" onClick={() => setProfileOpen(v => !v)}
          className="flex w-full items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-gray-400 flex-none" />
          <h2 className="flex-1 text-sm font-semibold text-gray-900 text-left">Financial Profile</h2>
          <span className="text-xs text-gray-400">{completeness}% complete</span>
          {profileOpen
            ? <ChevronDown className="h-4 w-4 text-gray-400" />
            : <ChevronRight className="h-4 w-4 text-gray-400" />}
        </button>

        <VProgress value={completeness} max={100}
          color={completeness >= 80 ? '#10b981' : completeness >= 50 ? '#f59e0b' : '#ef4444'} />

        {profileOpen && (
          <div className="mt-4 space-y-4">
            {/* Auto-pulled tiles */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Monthly Income',  value: fmt(monthlyIncome),  color: 'text-emerald-700', sub: 'From transactions' },
                { label: 'Monthly Expense', value: fmt(monthlyExpense), color: 'text-rose-600',    sub: 'From transactions' },
                { label: 'Liquid Assets',   value: fmt(liquidAssets),   color: 'text-blue-700',    sub: 'Bank + Wallets' },
              ].map(t => (
                <div key={t.label} className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-400 mb-0.5">{t.label}</p>
                  <p className={`text-sm font-semibold ${t.color}`}>{t.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t.sub}</p>
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

            <p className="text-[11px] text-gray-400">All changes auto-saved to your device.</p>
          </div>
        )}
      </div>

      {/* ── Core Vitals ── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Core Vitals</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricCard
            title="Emergency Fund"
            score={sEF}
            detail={
              <>
                <p>Liquid assets: <span className="font-semibold text-gray-700">{fmt(liquidAssets)}</span></p>
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
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-900">Future Impact</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-[11px] text-blue-500 mb-1">Current savings rate · {Math.round(savingsRate * 100)}%</p>
              <p className="text-xl font-bold text-blue-800">{fiYears !== null ? `${fiYears} yrs to FI` : 'Not saving'}</p>
              <p className="text-xs text-blue-400 mt-1">Time to Financial Independence</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-[11px] text-emerald-600 mb-1">If savings rate = 30%</p>
              {(() => {
                const s30 = monthlyIncome * 0.30;
                const fi30 = s30 > 0 ? Math.round((monthlyExpense * 12 * 25) / (s30 * 12)) : null;
                return (
                  <>
                    <p className="text-xl font-bold text-emerald-800">{fi30 !== null ? `${fi30} yrs to FI` : '—'}</p>
                    <p className="text-xs text-emerald-500 mt-1">
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
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Protection</h2>
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
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Debt Ratio</h2>
            </div>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-gray-50" style={{ color: barColor(sDR) }}>
              {sDR}/2
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
            <div>
              <p className="text-4xl font-bold text-gray-900">{Math.round(debtRatio * 100)}%</p>
              <p className="text-xs text-gray-400 mt-0.5">Liabilities ÷ Total Assets</p>
            </div>
            <div className="flex-1 w-full space-y-1.5 text-xs text-gray-500 sm:mt-1">
              <div className="flex justify-between"><span>Total Assets</span><span className="font-semibold text-emerald-700">{fmt(totalAssets)}</span></div>
              <div className="flex justify-between"><span>Total Liabilities</span><span className="font-semibold text-rose-600">{fmt(totalLiabilities)}</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-1.5">
                <span className="font-medium text-gray-700">Net Worth</span>
                <span className={`font-bold ${netWorth >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{fmt(netWorth)}</span>
              </div>
            </div>
          </div>

          <VProgress value={Math.min(debtRatio * 100, 100)} max={100} segments={[20, 30, 50]} color={barColor(sDR)} />
          <div className="mt-1.5 flex text-[10px] text-gray-400 gap-1">
            <span className="w-[20%]">0%</span>
            <span className="w-[10%]">20%</span>
            <span className="w-[20%]">30%</span>
            <span>50%</span>
          </div>
          <div className="mt-2.5 flex gap-3 text-[11px]">
            <span className="text-emerald-600 font-medium">● &lt;20% Excellent</span>
            <span className="text-amber-500 font-medium">● 20–30% Good</span>
            <span className="text-rose-500 font-medium">● &gt;50% High risk</span>
          </div>
        </div>
      )}

      {/* ── Top Actions ── */}
      {actions.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-900">Top Actions</h2>
          </div>
          <div className="space-y-2">
            {actions.map((a, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-3">
                <div className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700">{i + 1}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{a.label}</p>
                  {a.detail && <p className="text-xs text-gray-500 mt-0.5">{a.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
