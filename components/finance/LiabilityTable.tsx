import { Liability } from '@/lib/financeData';

export default function LiabilityTable({ liabilities }: { liabilities: Liability[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/60 shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Liability</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Outstanding</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Monthly EMI</th>
          </tr>
        </thead>
        <tbody>
          {liabilities.map((liability) => (
            <tr key={liability.id} className="border-t border-white/50 hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{liability.name}</td>
              <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                {liability.outstanding.toLocaleString('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                })}
              </td>
              <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                {liability.monthlyEmi.toLocaleString('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
