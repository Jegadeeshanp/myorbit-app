'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/lib/themeStore';
import EnableNotifications from '@/components/EnableNotifications';
import { Loader2 } from 'lucide-react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-base font-semibold text-gray-900">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full transition ${value ? 'bg-emerald-600' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

const selectCls = 'rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none';

export default function PreferencesTab() {
  const [currency,    setCurrency]    = useState('INR');
  const [decimals,    setDecimals]    = useState(false);
  const [separator,   setSeparator]   = useState('comma');
  const [dashPeriod,  setDashPeriod]  = useState('month');
  const [startScreen, setStartScreen] = useState('overview');
  const [saving,      setSaving]      = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [saveMsg,     setSaveMsg]     = useState<{ ok: boolean; text: string } | null>(null);
  const { theme, setTheme } = useTheme();

  // Load persisted preferences on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.preferences) return;
        const p = d.preferences;
        if (p.currency)  setCurrency(p.currency);
        if (p.theme)     setTheme(p.theme);
        // locale encodes separator + decimals as "en-IN-nodecimal" etc.
        // For simplicity use locale as raw preference storage
      })
      .catch(() => {})
      .finally(() => setLoadingPrefs(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency, theme }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveMsg({ ok: false, text: d.error ?? 'Failed to save.' });
      } else {
        setSaveMsg({ ok: true, text: 'Preferences saved!' });
        setTimeout(() => setSaveMsg(null), 2500);
      }
    } catch {
      setSaveMsg({ ok: false, text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loadingPrefs) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Section title="Currency">
        <Row label="Default Currency">
          <select value={currency} onChange={e => setCurrency(e.target.value)} className={selectCls}>
            <option value="INR">₹ INR — Indian Rupee</option>
            <option value="USD">$ USD — US Dollar</option>
            <option value="EUR">€ EUR — Euro</option>
            <option value="GBP">£ GBP — British Pound</option>
            <option value="AED">د.إ AED — UAE Dirham</option>
          </select>
        </Row>
      </Section>

      <Section title="Number Format">
        <Row label="Use decimals in amounts" sub="Show paise in amounts">
          <Toggle value={decimals} onChange={setDecimals} />
        </Row>
        <Row label="Thousand separator">
          <select value={separator} onChange={e => setSeparator(e.target.value)} className={selectCls}>
            <option value="comma">Comma (1,00,000)</option>
            <option value="period">Period (1.00.000)</option>
            <option value="space">Space (1 00 000)</option>
          </select>
        </Row>
      </Section>

      <Section title="Default Views">
        <Row label="Dashboard default period">
          <select value={dashPeriod} onChange={e => setDashPeriod(e.target.value)} className={selectCls}>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </Row>
      </Section>

      <Section title="App Behaviour">
        <Row label="Start screen">
          <select value={startScreen} onChange={e => setStartScreen(e.target.value)} className={selectCls}>
            <option value="overview">Overview</option>
            <option value="finance">Finance</option>
            <option value="orbit">My Orbit</option>
          </select>
        </Row>
      </Section>

      <Section title="Notifications">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            Receive push notifications for task reminders and habit check-ins.
          </p>
          <EnableNotifications />
        </div>
      </Section>

      <Section title="Appearance">
        <div className="grid grid-cols-3 gap-3">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={`rounded-xl border py-3 text-sm font-medium capitalize transition ${
                theme === t
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '💻'} {t}
            </button>
          ))}
        </div>
      </Section>

      {saveMsg && (
        <p className={`text-sm font-medium ${saveMsg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{saveMsg.text}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? 'Saving…' : 'Save Preferences'}
      </button>
    </div>
  );
}
