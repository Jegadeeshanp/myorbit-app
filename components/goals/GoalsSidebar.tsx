'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { LayoutDashboard, Target, CheckCircle2, PauseCircle, Settings } from 'lucide-react';

const MODULE_ICON_BG    = 'linear-gradient(135deg,rgba(167,139,250,0.22),rgba(167,139,250,0.08))';
const MODULE_ICON_BORD  = 'rgba(167,139,250,0.28)';
const MODULE_ICON_GLOW  = '0 0 14px rgba(167,139,250,0.2)';
const MODULE_ICON_COLOR = '#A78BFA';

const SB    = '#0a0f1e';
const BG    = '#0e1623';
const BORD  = '#1a2a3a';
const GREEN = '#00E5A0';
const TXT   = '#e2e8f0';
const MUTED = '#7a8ba0';
const DIM   = '#3a5060';

const menu = [
  { label: 'Overview',   href: '/orbit/goals',           Icon: LayoutDashboard },
  { label: 'All Goals',  href: '/orbit/goals/all',       Icon: Target },
  { label: 'Active',     href: '/orbit/goals/active',    Icon: CheckCircle2 },
  { label: 'Completed',  href: '/orbit/goals/completed', Icon: PauseCircle },
];

export default function GoalsSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const active = useMemo(() => {
    if (!pathname) return '/orbit/goals';
    const match = menu.find(item => item.href === pathname);
    if (match) return match.href;
    if (pathname.startsWith('/orbit/goals/')) {
      const sub = menu.find(item => pathname.startsWith(item.href) && item.href !== '/orbit/goals');
      if (sub) return sub.href;
    }
    return '/orbit/goals';
  }, [pathname]);

  const userName = session?.user?.name ?? 'User';
  const initials = userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="hidden md:flex" style={{ position: 'sticky', top: 0, height: '100vh', width: 240, flexShrink: 0, background: SB, borderRight: `1px solid ${BORD}`, flexDirection: 'column', overflowY: 'auto' }}>
      {/* Logo */}
      <div style={{ padding: '20px 18px', borderBottom: `1px solid ${BORD}`, display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: MODULE_ICON_BG, border: `1px solid ${MODULE_ICON_BORD}`, boxShadow: MODULE_ICON_GLOW, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Target size={17} color={MODULE_ICON_COLOR} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: TXT, letterSpacing: '-0.01em' }}>Goals</div>
          <div style={{ fontSize: 9, color: DIM, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 1 }}>Goal tracking workspace</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 10px 0' }}>
        <div style={{ fontSize: 9, color: DIM, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, padding: '0 10px', marginBottom: 6 }}>Main</div>
        {menu.map(({ label, href, Icon }) => {
          const isActive = active === href;
          return (
            <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, marginBottom: 2, border: `1px solid ${isActive ? 'rgba(0,229,160,0.25)' : 'transparent'}`, background: isActive ? 'rgba(0,229,160,0.1)' : 'transparent', color: isActive ? GREEN : MUTED, fontSize: 13, textDecoration: 'none', fontWeight: isActive ? 600 : 400, transition: 'all 0.15s' }}>
              <Icon size={15} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <span style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN, boxShadow: `0 0 6px ${GREEN}` }} />}
            </Link>
          );
        })}
      </nav>

      <div style={{ height: 1, background: BORD, margin: '12px 18px' }} />

      {/* Footer */}
      <div style={{ padding: '0 10px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Link href="/orbit/goals/settings" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: '1px solid transparent', color: MUTED, fontSize: 13, textDecoration: 'none' }}>
          <Settings size={15} />
          Settings
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, background: BG, border: `1px solid ${BORD}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#6366F1,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: TXT }}>{userName}</div>
            <div style={{ fontSize: 10, color: DIM, marginTop: 1 }}>Personal account</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
