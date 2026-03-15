'use client';

import { FinanceProvider } from '@/lib/financeStore';

export default function OrbitClientWrapper({ children }: { children: React.ReactNode }) {
  return <FinanceProvider>{children}</FinanceProvider>;
}
