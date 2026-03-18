'use client';

import FinanceTopBar from '@/components/money/FinanceTopBar';
import SmartInsights from '@/components/money/SmartInsights';
import FinancialHealthScore from '@/components/money/FinancialHealthScore';
import { useFinance } from '@/lib/financeStore';

export default function InsightsPage() {
  const { state } = useFinance();

  return (
    <div className="space-y-5">
      <FinanceTopBar />
      <FinancialHealthScore transactions={state.transactions} />
      <SmartInsights transactions={state.transactions} />
    </div>
  );
}
