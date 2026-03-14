import { Account } from '@/lib/financeStore';

export default function AccountCard({ account }: { account: Account }) {
  const balanceFormatted = account.balance.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  return (
    <div className="rounded-2xl border border-white/40 bg-white/60 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{account.name}</h3>
          <p className="mt-1 text-sm text-gray-500">{account.type}</p>
        </div>
        <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          {balanceFormatted}
        </div>
      </div>
    </div>
  );
}
