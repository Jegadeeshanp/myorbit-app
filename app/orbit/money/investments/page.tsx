import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function InvestmentsPage() {
  return (
    <div className="flex bg-neutral-100 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto p-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">📈</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Investments</h2>
              <p className="text-gray-600">Track your stocks, mutual funds, and investment portfolio</p>
              <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-700">Coming soon: Track your entire investment portfolio in one place.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
