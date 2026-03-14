'use client';

import { useCallback, useMemo, useState } from 'react';
import AccountCard from '@/components/finance/AccountCard';
import AddAccountModal from '@/components/finance/AddAccountModal';
import { Account, useFinance } from '@/lib/financeStore';

function formatCurrency(value: number) {
  return value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

const CATEGORY_SECTIONS: { key: string; title: string; types: Account['type'][] }[] = [
  { key: 'bank', title: 'Bank Accounts', types: ['Bank'] },
  { key: 'credit', title: 'Credit Cards', types: ['Credit Card'] },
  { key: 'debit', title: 'Debit Accounts', types: ['Debit Card'] },
  { key: 'wallet', title: 'Wallets', types: ['Cash', 'Wallet'] },
];

export default function AccountsPage() {
  const { state, addAccount } = useFinance();
  const [isModalOpen, setModalOpen] = useState(false);

  const balances = useMemo(() => {
    const summary = {
      total: 0,
      bank: 0,
      credit: 0,
      debit: 0,
      wallet: 0,
    };

    state.accounts.forEach((acct) => {
      summary.total += acct.balance;

      if (acct.type === 'Credit Card') {
        summary.credit += acct.balance;
      } else if (acct.type === 'Cash' || acct.type === 'Wallet') {
        summary.wallet += acct.balance;
      } else if (acct.type === 'Debit Card') {
        summary.debit += acct.balance;
      } else {
        // Treat all other account types as bank accounts
        summary.bank += acct.balance;
      }
    });

    // Total balance should follow the business rule:
    // (Bank + Wallet + Debit) - Credit (treat credit as a liability)
    const creditLiability = Math.abs(summary.credit);
    summary.total = summary.bank + summary.wallet + summary.debit - creditLiability;

    return summary;
  }, [state.accounts]);

  const accountsBySection = useMemo(() => {
    return CATEGORY_SECTIONS.reduce<Record<string, Account[]>>((acc, section) => {
      acc[section.key] = state.accounts.filter((acct) => section.types.includes(acct.type));
      return acc;
    }, {} as Record<string, Account[]>);
  }, [state.accounts]);

  const handleScrollTo = useCallback((sectionKey: string) => {
    const el = document.getElementById(`section-${sectionKey}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const tileGridClass = 'grid-cols-[repeat(auto-fit,minmax(180px,1fr))]';
  const tileJustifyClass = 'justify-items-stretch';

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track your bank accounts, wallets, and credit cards in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          Add account
        </button>
      </header>

      <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-emerald-50 to-white p-6 shadow-sm hover:shadow-md transition">
        <div className="grid gap-0 lg:grid-cols-[2fr_1fr]">
          <div className="min-w-0 flex flex-col justify-between px-6 py-8 lg:border-r lg:border-gray-200">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Total Balance
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Across {state.accounts.length} account{state.accounts.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="mt-6">
              <div
                className={`text-5xl font-semibold ${
                  balances.total >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(balances.total)}
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Your money position across all account types.
            </div>
          </div>

          <div className="min-w-0 grid gap-0 border-t border-gray-200 sm:border-t-0 sm:border-l sm:border-gray-200">
            <div className={`grid ${tileGridClass} ${tileJustifyClass} divide-y divide-gray-200 sm:divide-y-0 sm:divide-x sm:divide-gray-200`}>
              {accountsBySection.bank?.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleScrollTo('bank')}
                  className="flex flex-col justify-center gap-2 px-6 py-5 text-left hover:bg-white/70"
                >
                  <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bank</div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <span className="text-sm font-semibold">B</span>
                    </div>
                  </div>
                  <div className="min-w-[160px]">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(balances.bank)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {accountsBySection.bank.length} account{accountsBySection.bank.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </button>
              )}

              {accountsBySection.credit?.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleScrollTo('credit')}
                  className="flex flex-col justify-center gap-2 px-6 py-5 text-left hover:bg-white/70"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Credit</div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                      <span className="text-sm font-semibold">C</span>
                    </div>
                  </div>
                  <div className="min-w-[160px]">
                    <div
                      className={`text-lg font-semibold ${
                        balances.credit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrency(balances.credit)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {accountsBySection.credit.length} card{accountsBySection.credit.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </button>
              )}

              {accountsBySection.wallet?.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleScrollTo('wallet')}
                  className="flex flex-col justify-center gap-2 px-6 py-5 text-left hover:bg-white/70"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Wallet</div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <span className="text-sm font-semibold">W</span>
                    </div>
                  </div>
                  <div className="min-w-[160px]">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(balances.wallet)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {accountsBySection.wallet.length} wallet{accountsBySection.wallet.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </button>
              )}

              {accountsBySection.debit?.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleScrollTo('debit')}
                  className="flex flex-col justify-center gap-2 px-6 py-5 text-left hover:bg-white/70"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Debit</div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                      <span className="text-sm font-semibold">D</span>
                    </div>
                  </div>
                  <div className="min-w-[160px]">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(balances.debit)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {accountsBySection.debit.length} account{accountsBySection.debit.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {CATEGORY_SECTIONS.map((section) => {
        const accounts = accountsBySection[section.key] ?? [];
        if (accounts.length === 0) return null;

        return (
          <section key={section.key} id={`section-${section.key}`} className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {accounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          </section>
        );
      })}

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
