'use client';

import { useMemo } from 'react';
import { useFinance } from '@/lib/financeStore';
import { Transaction } from '@/lib/financeData';
import { ShieldCheck } from 'lucide-react';

function getScore(transactions: Transaction[], totalAssets: number, totalLiab: number): { score: number; factors: { label: string; score: number; max: number }[]; summary: string; hasData: boolean } {
  const hasData = transactions.length > 0 || totalAssets > 0 || totalLiab > 0;

  if (!hasData) {
    return {
      score: 0, hasData: false,
      factors: [
        { label: 'Savings Rate',    score: 0, max: 25 },
        { label: 'Debt Level',      score: 0, max: 25 },
        { label: 'Consistency',     score: 0, max: 25 },
        { label: 'Diversification', score: 0, max: 25 },
      ],
      summary: '',
    };
  }

  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const income  = thisMonth.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
  const expense = thisMonth.filter(t => t.type === 'expense').reduce((s,t) => s + Math.abs(t.amount), 0);
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  const savingsScore     = Math.min(25, Math.round(savingsRate * 0.8));
  const debtScore        = totalAssets === 0 ? 0 : totalLiab < totalAssets * 0.3 ? 25 : totalLiab < totalAssets * 0.5 ? 18 : 10;
  const consistencyScore = transactions.length > 5 ? 25 : Math.round(transactions.length * 5);
  const diversifyScore   = totalAssets > 0 ? 25 : 0;
  const total = savingsScore + debtScore + consistencyScore + diversifyScore;

  const summary = total >= 75
    ? `You're saving ${Math.round(savingsRate)}% of income. Debt levels are manageable.`
    : total >= 50
    ? `Savings rate is ${Math.round(savingsRate)}%. Consider reducing your debt utilization.`
    : `Low savings rate detected. Focus on cutting expenses and building an emergency fund.`;

  return {
    score: total, hasData: true,
    factors: [
      { label: 'Savings Rate',    score: savingsScore,     max: 25 },
      { label: 'Debt Level',      score: debtScore,        max: 25 },
      { label: 'Consistency',     score: consistencyScore, max: 25 },
      { label: 'Diversification', score: diversifyScore,   max: 25 },
    ],
    summary,
  };
}

function ScoreRing({ score }: { score: number }) {
  const r = 36, cx = 44, cy = 44;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 75 ? 'Great' : score >= 50 ? 'Good' : 'Needs work';
  return (
    <div className="relative flex h-[88px] w-[88px] flex-none items-center justify-center">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <p className="text-lg font-bold text-gray-900">{score}</p>
        <p className="text-xs font-medium" style={{ color }}>{label}</p>
      </div>
    </div>
  );
}

export default function FinancialHealthScore({ transactions }: { transactions: Transaction[] }) {
  const { state } = useFinance();
  const totalAssets = useMemo(() => state.assets.reduce((s,a) => s + a.value, 0), [state.assets]);
  const totalLiab   = useMemo(() => state.liabilities.reduce((s,l) => s + l.outstanding, 0), [state.liabilities]);
  const result = useMemo(() => getScore(transactions, totalAssets, totalLiab), [transactions, totalAssets, totalLiab]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <h2 className="text-sm font-semibold text-gray-900">Financial Health Score</h2>
      </div>
      {!result.hasData ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <ShieldCheck className="h-10 w-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">No data yet</p>
          <p className="mt-1 text-xs text-gray-400">Add accounts, transactions, and assets to get your personalised financial health score.</p>
          <div className="mt-4 w-full space-y-2">
            {result.factors.map(f => (
              <div key={f.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-400">{f.label}</span>
                  <span className="text-gray-300">—/{f.max}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-5">
            <ScoreRing score={result.score} />
            <div className="flex-1 space-y-2">
              {result.factors.map(f => (
                <div key={f.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-gray-500">{f.label}</span>
                    <span className="font-semibold text-gray-700">{f.score}/{f.max}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${(f.score/f.max)*100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-600">{result.summary}</p>
        </>
      )}
    </div>
  );
}
