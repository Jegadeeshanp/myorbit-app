'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, ChevronDown, ChevronUp, Send } from 'lucide-react';
import {
  isFCMSupported,
  requestPermission,
  registerAndGetToken,
  saveTokenToServer,
} from '@/lib/firebase';

type Status = 'checking' | 'unsupported' | 'idle' | 'loading' | 'granted' | 'denied';

const isiOSDevice = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
};

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as typeof window.navigator & { standalone?: boolean };
  if (nav.standalone) return true;
  return window.matchMedia('(display-mode: standalone)').matches;
};

// ── "Already enabled" state with test button ──────────────────────────────
function NotificationsEnabled() {
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [err, setErr]         = useState<string | null>(null);

  const sendTest = async () => {
    setSending(true);
    setErr(null);
    setSent(false);
    try {
      const res = await fetch('/api/test-notification', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 px-4 py-2.5">
          <BellRing className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-none" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Reminders enabled
          </span>
        </div>
        <button
          type="button"
          onClick={sendTest}
          disabled={sending}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-60"
        >
          <Send className="h-3.5 w-3.5" />
          {sending ? 'Sending…' : sent ? 'Sent ✓' : 'Send test'}
        </button>
      </div>
      {err && (
        <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 rounded-lg px-3 py-2">
          {err}
        </p>
      )}
    </div>
  );
}

export default function EnableNotifications() {
  const [status, setStatus]     = useState<Status>('checking');
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supported = await isFCMSupported();
      if (!supported) { setStatus('unsupported'); return; }

      const perm = Notification.permission;
      if (perm === 'denied') { setStatus('denied'); return; }

      if (perm === 'granted') {
        // Verify this user actually has a token saved in DB — not just browser permission
        const res = await fetch('/api/save-token').catch(() => null);
        const data = res?.ok ? await res.json() : null;
        if (data?.hasToken) {
          setStatus('granted');
          // Silently refresh token in background — if SW fails, reset to idle so user can re-enable
          registerAndGetToken()
            .then(token => { if (token) saveTokenToServer(token).catch(console.error); })
            .catch(() => setStatus('idle'));
          return;
        }
      }

      // Browser permission is granted but no DB token for this user → show enable button
      setStatus('idle');
    })();
  }, []);

  const handleEnable = async () => {
    setStatus('loading');
    setError(null);
    try {
      if (isiOSDevice() && !isStandalone()) {
        throw new Error('Install the app to your Home Screen (Safari → Share → Add to Home Screen) before enabling push on iPhone.');
      }

      const perm = await requestPermission();
      if (perm === 'unsupported') { setStatus('unsupported'); return; }
      if (perm === 'denied')      { setStatus('denied');      return; }

      const token = await registerAndGetToken();
      if (!token) throw new Error('Could not get a notification token. Please try again.');

      await saveTokenToServer(token);
      setStatus('granted');
    } catch (err: any) {
      console.error('[FCM] Enable error:', err);
      setError(err?.message ?? 'Something went wrong. Please try again.');
      setStatus('idle');
    }
  };

  if (status === 'checking' || status === 'unsupported') return null;

  if (status === 'granted') return <NotificationsEnabled />;

  if (status === 'denied') {
    return (
      <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3">
        <BellOff className="h-4 w-4 text-gray-400 flex-none mt-0.5" />
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Notifications blocked</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Open your browser settings, allow notifications for this site, then refresh.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showInfo && (
        <div className="rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-4 space-y-2">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">What you&apos;ll get</p>
          <ul className="space-y-1.5">
            {['Task due-date reminders', 'Habit check-in nudges', 'Custom scheduled alerts'].map(item => (
              <li key={item} className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400 flex-none" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-blue-500 dark:text-blue-400 pt-1 border-t border-blue-100 dark:border-blue-900">
            <strong>iPhone users:</strong> install this app to your Home Screen first (Safari → Share → Add to Home Screen).
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleEnable}
          disabled={status === 'loading'}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Bell className="h-4 w-4 flex-none" />
          {status === 'loading' ? 'Enabling…' : 'Enable Reminders 🔔'}
        </button>

        <button
          type="button"
          onClick={() => setShowInfo(p => !p)}
          className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          {showInfo ? <><ChevronUp className="h-3.5 w-3.5" /> Less</> : <><ChevronDown className="h-3.5 w-3.5" /> Why?</>}
        </button>
      </div>
    </div>
  );
}
