'use client';

import { useMemo, useState } from 'react';
import AccountCard from '@/components/finance/AccountCard';
import AddAccountModal from '@/components/finance/AddAccountModal';
import { useFinance } from '@/lib/financeStore';

export default function AccountsPage() {
  const { state, addAccount } = useFinance();
  const [isModalOpen, setModalOpen] = useState(false);

  const totalBalance = useMemo(() => {
    return state.accounts.reduce((sum, acct) => sum + acct.balance, 0);
  }, [state.accounts]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track your bank accounts, wallets, and credit cards in one place.
          </p>
          <div className="mt-3 text-sm text-gray-600">
            Total balance: <span className="font-semibold">₹{totalBalance.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          Add account
        </button>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {state.accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>

      <AddAccountModal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(payload) => {
          addAccount(payload);
        }}
      />
    </div>
  );
}
