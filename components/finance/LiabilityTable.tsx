'use client';

import { Liability } from '@/lib/financeData';
import { useFinance } from '@/lib/financeStore';
import { Trash2 } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

export default function LiabilityTable({ liabilities }: { liabilities: Liability[] }) {
  const { deleteLiability } = useFinance();
  const totalOutstanding = liabilities.reduce((s, l) => s + l.outstanding, 0);
  const totalEmi         = liabilities.reduce((s, l) => s + l.monthlyEmi, 0);

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Liability</th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Outstanding</th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Monthly EMI</th>
            <th className="px-3 py-3 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {liabilities.map(l => (
            <tr key={l.id} className="group transition hover:bg-gray-50/50">
              <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{l.name}</td>
              <td className="px-5 py-3.5 text-right text-sm font-bold text-rose-600">{fmt(l.outstanding)}</td>
              <td className="px-5 py-3.5 text-right text-sm text-gray-500">{fmt(l.monthlyEmi)}/mo</td>
              <td className="px-3 py-3.5">
                <button
                  onClick={() => deleteLiability(l.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-400"
                  title="Delete liability"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        {liabilities.length > 0 && (
          <tfoot>
            <tr className="border-t border-gray-100 bg-gray-50/60">
              <td className="px-5 py-3 text-xs font-semibold text-gray-500">{liabilities.length} liabilities</td>
              <td className="px-5 py-3 text-right text-sm font-bold text-rose-600">{fmt(totalOutstanding)}</td>
              <td className="px-5 py-3 text-right text-xs text-gray-400">{fmt(totalEmi)}/mo</td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
