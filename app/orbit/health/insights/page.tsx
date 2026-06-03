'use client';

import { useEffect } from 'react';
import { useHealth } from '@/lib/healthStore';
import HealthInsights from '@/components/health/HealthInsights';
import { Zap } from 'lucide-react';

const BG   = '#090d16';
const CARD_BG   = 'rgba(255,255,255,0.04)';
const CARD_BORD = 'rgba(255,255,255,0.08)';
const MUTED = '#7a8ba0';

export default function HealthInsightsPage() {
  const { loadState, entries, dashboard, reload } = useHealth();

  useEffect(() => {
    reload();
    const handler = () => reload();
    window.addEventListener('health:refresh', handler);
    return () => window.removeEventListener('health:refresh', handler);
  }, []);

  if (loadState === 'loading') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse" style={{ height: 80, borderRadius: 14, background: CARD_BG }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', margin: '0 0 20px' }}>Health Insights</h1>
      {dashboard ? (
        <HealthInsights dashboard={dashboard} recentEntries={entries} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px', background: CARD_BG, border: `1px solid ${CARD_BORD}`, borderRadius: 16, textAlign: 'center' }}>
          <Zap size={36} color={MUTED} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>No data to show insights yet. Start logging your health!</p>
        </div>
      )}
    </div>
  );
}
