'use client';

interface Transaction {
  id: number;
  description: string;
  category: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
}

interface TransactionListProps {
  transactions?: Transaction[];
}

export default function TransactionList({ transactions = [] }: TransactionListProps) {
  const defaultTransactions: Transaction[] = [
    {
      id: 1,
      description: 'Coffee @ Starbucks',
      category: 'Food & Dining',
      date: '12 Mar 2026',
      amount: -450,
      type: 'expense',
    },
    {
      id: 2,
      description: 'Salary Deposit',
      category: 'Income',
      date: '01 Mar 2026',
      amount: 75000,
      type: 'income',
    },
    {
      id: 3,
      description: 'Netflix Subscription',
      category: 'Subscriptions',
      date: '10 Mar 2026',
      amount: -649,
      type: 'expense',
    },
  ];

  const displayTransactions = transactions.length > 0 ? transactions : defaultTransactions;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">Description</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">Category</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">Date</th>
              <th className="px-6 py-4 text-right font-semibold text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-900 font-medium">
                  {tx.description}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {tx.category}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {tx.date}
                </td>
                <td className={`px-6 py-4 text-right font-semibold ${
                  tx.type === 'income' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {tx.type === 'income' ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
