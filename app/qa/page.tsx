'use client';

import { useState } from 'react';
import QAAgent    from './QAAgent';
import QAAgent120 from './QAAgent120';

export default function QAPage() {
  const [active, setActive] = useState<'original' | '120'>('original');

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", background: '#0d1117', minHeight: '100vh' }}>
      {/* Switcher bar */}
      <div style={{
        background: '#010409',
        borderBottom: '1px solid #21262d',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 10, color: '#484f58', fontWeight: 700, marginRight: 8, letterSpacing: '.06em' }}>
          SELECT AGENT:
        </span>
        <button
          onClick={() => setActive('original')}
          style={{
            padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
            background: active === 'original' ? '#1f6feb' : '#21262d',
            color: active === 'original' ? '#fff' : '#8b949e',
          }}
        >
          financeQATest
        </button>
        <button
          onClick={() => setActive('120')}
          style={{
            padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
            background: active === '120' ? '#1f6feb' : '#21262d',
            color: active === '120' ? '#fff' : '#8b949e',
          }}
        >
          finance120QATest
        </button>
        <span style={{ fontSize: 10, color: '#484f58', marginLeft: 8 }}>
          {active === 'original' ? '9 phases · auth, routes, API, CRUD, edge cases, security, performance' : '120 test cases · A–G modules · full validation coverage'}
        </span>
      </div>

      {/* Agent content */}
      {active === 'original' ? <QAAgent /> : <QAAgent120 />}
    </div>
  );
}