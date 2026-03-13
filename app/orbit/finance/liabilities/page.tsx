'use client';

import { useMemo, useState } from 'react';
import LiabilityTable from '@/components/finance/LiabilityTable';
import AddLiabilityModal from '@/components/finance/AddLiabilityModal';
import { useFinance } from '@/lib/financeStore';

export default function LiabilitiesPage() {
  const { state, addLiability } = useFinance();
  const [isModalOpen, setModalOpen] = useState(false);

  const totalOutstanding = useMemo(() => {
    return state.liabilities.reduce((sum, liab) => sum + liab.outstanding, 0);
  }, [state.liabilities]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Liabilities</h1>
          <p className="mt-1 text-sm text-gray-600">
            Keep an eye on loans, credit, and monthly obligations.
          </p>
          <div className="mt-3 text-sm text-gray-600">
            Total outstanding: <span className="font-semibold">₹{totalOutstanding.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          Add liability
        </button>
      </header>

      <div className="rounded-2xl border border-white/40 bg-white/60 p-6 shadow-sm">
        <LiabilityTable liabilities={state.liabilities} />
      </div>

      <AddLiabilityModal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(payload) => {
          addLiability(payload);
        }}
      />
    </div>
  );
}
