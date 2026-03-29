'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, ChevronDown, ChevronUp } from 'lucide-react';
import {
  isFCMSupported,
  requestPermission,
  registerAndGetToken,
  saveTokenToServer,
} from '@/lib/firebase';

type Status = 'checking' | 'unsupported' | 'idle' | 'loading' | 'granted' | 'denied';

export default function EnableNotifications() {
  const [status, setStatus]     = useState<Status>('checking');
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // ── Detect current permission state on mount ──────────────────────────
  useEffect(() => {
    (async () => {
      const supported = await isFCMSupported();
      if (!supported) { setStatus('unsupported'); return; }

      const perm = Notification.permission;
      if (perm === 'granted') {
        // Already granted — silently refresh token in background
        setStatus('granted');
        registerAndGetToken().then(token => {
          if (token) saveTokenToServer(token).catch(console.error);
        });
      } else if (perm === 'denied') {
        setStatus('denied');
      } else {
        setStatus('idle');
      }
    })();
  }, []);

  // ── Enable handler (called on user click only) ────────────────────────
  const handleEnable = async () => {
    setStatus('loading');
    setError(null);
    try {
      const perm = await requestPermission();

      if (perm === 'unsupported') { setStatus('unsupported'); return; }
      if (perm === 'denied')      { setStatus('denied');      return; }

      // Permission granted — fetch FCM token
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

  // ── Render: unsupported ───────────────────────────────────────────────
  if (status === 'checking' || status === 'unsupported') return null;

  // ── Render: already enabled ───────────────────────────────────────────
  if (status === 'granted') {
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 px-4 py-2.5">
        <BellRing className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-none" />
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          Reminders enabled
        </span>
      </div>
    );
  }

  // ── Render: blocked by user ───────────────────────────────────────────
  if (status === 'denied') {
    return (
      <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3">
        <BellOff className="h-4 w-4 text-gray-400 flex-none mt-0.5" />
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Notifications blocked</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            To enable, open your browser settings and allow notifications for this site, then refresh.
          </p>
        </div>
      </div>
    );
  }

  // ── Render: idle / loading ────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Info panel */}
      {showInfo && (
        <div className="rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-4 space-y-2">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            What you&apos;ll get
          </p>
          <ul className="space-y-1.5">
            {[
              'Task due-date reminders',
              'Habit check-in nudges',
              'Custom scheduled alerts',
            ].map(item => (
              <li key={item} className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400 flex-none" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-blue-500 dark:text-blue-400 pt-1 border-t border-blue-100 dark:border-blue-900">
            <strong>iPhone users:</strong> install this app to your Home Screen first
            (Safari → Share → Add to Home Screen) — iOS only delivers push notifications
            to installed PWAs.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Action row */}
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
          {showInfo ? (
            <><ChevronUp className="h-3.5 w-3.5" /> Less</>
          ) : (
            <><ChevronDown className="h-3.5 w-3.5" /> Why?</>
          )}
        </button>
      </div>
    </div>
  );
}
