// lib/firebase.ts — Client-side Firebase helpers.
// Never import this file in API routes or server components.
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

/** Returns true if the current browser supports FCM. */
export async function isFCMSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  return isSupported();
}

/**
 * Request the user's notification permission.
 * Returns 'granted', 'denied', or 'unsupported'.
 * Must be called on a direct user gesture — never auto-prompt.
 */
export async function requestPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  const supported = await isFCMSupported();
  if (!supported) return 'unsupported';
  const result = await Notification.requestPermission();
  return result as 'granted' | 'denied';
}

/**
 * Register the Firebase messaging service worker and return an FCM token.
 * Returns null if unsupported, permission not granted, or any other error.
 */
export async function registerAndGetToken(): Promise<string | null> {
  try {
    const supported = await isFCMSupported();
    if (!supported) return null;
    if (Notification.permission !== 'granted') return null;

    // Register (or reuse) our config-injected service worker
    const registration = await navigator.serviceWorker.register(
      '/api/firebase-messaging-sw',
      { scope: '/' }
    );
    await navigator.serviceWorker.ready;

    const app = getFirebaseApp();
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (err) {
    console.error('[FCM] Error getting token:', err);
    return null;
  }
}

/**
 * Listen for foreground messages (app tab is open and in focus).
 * Returns an unsubscribe function.
 */
export async function onForegroundMessage(
  callback: (payload: {
    notification?: { title?: string; body?: string; icon?: string };
    data?: Record<string, string>;
  }) => void
): Promise<() => void> {
  const supported = await isFCMSupported();
  if (!supported) return () => {};

  const app = getFirebaseApp();
  const messaging = getMessaging(app);
  return onMessage(messaging, callback as any);
}

/**
 * Save (or refresh) the current device's FCM token to the backend.
 * Call this after permission is granted and after each token refresh.
 */
export async function saveTokenToServer(token: string): Promise<void> {
  const platform = detectPlatform();
  const res = await fetch('/api/save-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, platform }),
  });
  if (!res.ok) throw new Error('Failed to save FCM token');
}

function detectPlatform(): string {
  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'web';
}
