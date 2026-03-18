import { Transaction } from '@/lib/financeData';

export default function ExpenseTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/60 shadow-sm">
      <table className="w-full min-w-[600px] text-left">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Category</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Description</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-t border-white/50 hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-600">{tx.date}</td>
              <td className="px-6 py-4 text-sm text-gray-700 font-medium">{tx.category}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{tx.description}</td>
              <td className={`px-6 py-4 text-sm font-semibold text-right ${tx.type === 'income' ? 'text-emerald-700' : 'text-red-600'}`}>
                {tx.amount.toLocaleString('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
