'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SB   = '#0a0f1e';
const BG   = '#0e1623';
const BORD = '#1a2a3a';
const TXT  = '#e2e8f0';
const DIM  = '#3a5060';

const PAGE_META: Record<string, { title: string; sub: string }> = {
  '/orbit/health':           { title: 'Overview',   sub: 'Track your wellness metrics daily.' },
  '/orbit/health/log':       { title: 'Log Today',  sub: 'Record today\'s health data.' },
  '/orbit/health/workouts':  { title: 'Workouts',   sub: 'Log and review your exercise sessions.' },
  '/orbit/health/nutrition': { title: 'Nutrition',  sub: 'Monitor what fuels your body.' },
  '/orbit/health/sync':      { title: 'Sync',       sub: 'Connect your health devices and apps.' },
  '/orbit/health/settings':  { title: 'Settings',   sub: 'Configure your health workspace.' },
};

export default function HealthTopBar({ action }: { action?: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const meta = PAGE_META[pathname] ?? { title: 'Health', sub: '' };

  return (
    <div style={{ background: SB, borderBottom: `1px solid ${BORD}`, padding: '0 28px', display: 'flex', alignItems: 'center', height: 64, flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: TXT, fontFamily: 'Georgia,serif', letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 2 }}>{meta.title}</div>
        {meta.sub && <div style={{ fontSize: 12, color: DIM }}>{meta.sub}</div>}
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
