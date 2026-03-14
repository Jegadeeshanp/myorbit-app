'use client';

import { useMemo, useState } from 'react';
import AssetTable from '@/components/finance/AssetTable';
import AddAssetModal from '@/components/finance/AddAssetModal';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { useFinance } from '@/lib/financeStore';

export default function AssetsPage() {
  const { state, addAsset } = useFinance();
  const [isModalOpen, setModalOpen] = useState(false);

  const totalValue = useMemo(() => {
    return state.assets.reduce((sum, asset) => sum + asset.value, 0);
  }, [state.assets]);

  return (
    <div className="space-y-6">
      <FinanceTopBar action={
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          Add asset
        </button>
      } />

      <div className="rounded-2xl border border-white/40 bg-white/60 p-6 shadow-sm">
        <AssetTable assets={state.assets} />
      </div>

      <AddAssetModal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(payload) => {
          addAsset(payload);
        }}
      />
    </div>
  );
}
