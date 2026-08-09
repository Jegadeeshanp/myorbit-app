'use client';

import { useEffect } from 'react';
import { onForegroundMessage } from '@/lib/firebase';
import CommandBar from '@/components/ai/CommandBar';
import OfflineBanner from '@/components/OfflineBanner';

// Show a native notification even when the app tab is in focus.
function ForegroundNotificationListener() {
  useEffect(() => {
    let unsub: (() => void) | undefined;
    onForegroundMessage((payload) => {
      const title = payload.notification?.title ?? 'MyOrbit';
      const body  = payload.notification?.body  ?? '';
      if (Notification.permission !== 'granted') return;

      // Chrome silently drops new Notification() when a service worker is active.
      // Use registration.showNotification() instead so it works in all browsers.
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then(registration => registration.showNotification(title, {
            body,
            icon:    '/icons/icon-192.png',
            badge:   '/icons/icon-72.png',
            tag:     payload.data?.tag ?? 'myorbit',
          }))
          .catch(console.error);
      } else {
        // Fallback for browsers without service worker support
        new Notification(title, { body, icon: '/icons/icon-192.png' });
      }
    }).then(fn => { unsub = fn; });
    return () => unsub?.();
  }, []);
  return null;
}

export default function OrbitClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineBanner />
      <ForegroundNotificationListener />
      {children}
      <CommandBar />
    </>
  );
}
