'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SB   = '#0a0f1e';
const BG   = '#0e1623';
const BORD = '#1a2a3a';
const TXT  = '#e2e8f0';
const DIM  = '#3a5060';

const PAGE_META: Record<string, { title: string; sub: string }> = {
  '/orbit/finance':              { title: 'Overview',      sub: 'Your personal money command center — manage and control finances with clarity.' },
  '/orbit/finance/accounts':     { title: 'Accounts',      sub: 'Track your bank accounts, wallets, and credit cards in one place.' },
  '/orbit/finance/transactions': { title: 'Transactions',  sub: 'All income and expenses recorded in one place.' },
  '/orbit/finance/assets':       { title: 'Assets',        sub: 'Keep tabs on your investments and asset allocation.' },
  '/orbit/finance/liabilities':  { title: 'Liabilities',   sub: 'Keep an eye on loans, credit, and monthly obligations.' },
  '/orbit/finance/budget':       { title: 'Budget',        sub: 'Follow your monthly spending plan and stay on track.' },
  '/orbit/finance/vitals':       { title: 'Vitals',        sub: 'Financial health check — score your money habits across 5 dimensions.' },
  '/orbit/finance/settings':     { title: 'Settings',      sub: 'Currency, recurring transactions and data export preferences.' },
};

export default function FinanceTopBar({ action }: { action?: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const segments = pathname.split('/').filter(Boolean);
  const fallback = segments[2]
    ? segments[2].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Finance';
  const meta = PAGE_META[pathname] ?? { title: fallback, sub: '' };

  return (
    <div style={{ background: SB, borderBottom: `1px solid ${BORD}`, padding: '0 28px', display: 'flex', alignItems: 'center', height: 64, flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: TXT, fontFamily: 'Georgia,serif', letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 2 }}>{meta.title}</div>
        {meta.sub && <div className="hidden sm:block" style={{ fontSize: 12, color: DIM }}>{meta.sub}</div>}
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {action}
        <Link href="/orbit" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 11px 5px 5px', borderRadius: 10, background: BG, border: `1px solid ${BORD}`, textDecoration: 'none', transition: 'all 0.18s' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#00E5A0,#5BE4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#000' }}>M</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: TXT }}>MyOrbit</span>
        </Link>
      </div>
    </div>
  );
}
