// ── MyOrbit Service Worker ────────────────────────────────────────────────
// Handles both PWA caching AND Firebase Cloud Messaging push notifications.

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// ── Firebase init ─────────────────────────────────────────────────────────
firebase.initializeApp({
  apiKey:            'AIzaSyCxEuJN6ZqJ-EaxH_F7eNjZSKFn6zgVmzA',
  authDomain:        'myorbit-fdeed.firebaseapp.com',
  projectId:         'myorbit-fdeed',
  storageBucket:     'myorbit-fdeed.firebasestorage.app',
  messagingSenderId: '529212236858',
  appId:             '1:529212236858:web:2eabc25514171548904103',
});

const messaging = firebase.messaging();

// ── Background push handler ───────────────────────────────────────────────
// Fires when a push arrives and the app tab is closed or in the background.
messaging.onBackgroundMessage(function (payload) {
  console.log('[MyOrbit SW] Background message received:', payload);

  const notification = payload.notification || {};
  const data         = payload.data         || {};

  const title = notification.title || data.title || 'MyOrbit';
  const body  = notification.body  || data.body  || '';
  const icon  = notification.icon  || '/icons/icon-192.png';
  const url   = data.url || '/orbit/tasks';

  self.registration.showNotification(title, {
    body,
    icon,
    badge:              '/icons/icon-72.png',
    data:               { url },
    tag:                data.tag || 'myorbit',
    renotify:           true,
    requireInteraction: false,
  });
});

// ── Notification click ────────────────────────────────────────────────────
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const url = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/orbit/tasks';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (windowClients) {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});

// ── PWA Caching ───────────────────────────────────────────────────────────
const CACHE_NAME = 'myorbit-v3';
const STATIC_ASSETS = ['/', '/orbit'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) {
          return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function () {
        return caches.match(event.request);
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request);
    })
  );
});
