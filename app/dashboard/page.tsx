import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import StatCard from '@/components/StatCard';
import NetWorthCard from '@/components/NetWorthCard';

export default function Dashboard() {
  return (
    <div className="flex bg-neutral-100 min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="flex-1 overflow-auto p-8">
          <NetWorthCard />

          <div className="grid grid-cols-4 gap-6 mt-8">
            <StatCard
              title="Cash Balance"
              value="₹1.34L"
              subtitle="4 accounts"
            />

            <StatCard
              title="Spent This Month"
              value="₹10.2K"
              subtitle="2 days left"
            />

            <StatCard
              title="Investments"
              value="₹52.1L"
              subtitle="+₹2.4L YTD"
            />

            <StatCard
              title="Total Debt"
              value="₹32.6L"
              subtitle="2 loans"
            />
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Recent Transactions
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="overflow-hidden">
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
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">Coffee @ Starbucks</td>
                      <td className="px-6 py-4 text-gray-600">Food & Dining</td>
                      <td className="px-6 py-4 text-gray-600">12 Mar 2026</td>
                      <td className="px-6 py-4 text-right text-red-600 font-semibold">-₹450</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">Salary Deposit</td>
                      <td className="px-6 py-4 text-gray-600">Income</td>
                      <td className="px-6 py-4 text-gray-600">01 Mar 2026</td>
                      <td className="px-6 py-4 text-right text-green-600 font-semibold">+₹75,000</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">Netflix Subscription</td>
                      <td className="px-6 py-4 text-gray-600">Subscriptions</td>
                      <td className="px-6 py-4 text-gray-600">10 Mar 2026</td>
                      <td className="px-6 py-4 text-right text-red-600 font-semibold">-₹649</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
