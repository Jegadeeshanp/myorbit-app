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

// ── Notification actions (shown on long-press on iOS, expand on Android) ──
var TASK_ACTIONS = [
  { action: 'snooze-15', title: 'Snooze 15 min' },
  { action: 'snooze-30', title: 'Snooze 30 min' },
  { action: 'snooze-60', title: 'Snooze 1 Hour' },
  { action: 'done',      title: 'Done ✓' },
];

// ── Background push handler ───────────────────────────────────────────────
messaging.onBackgroundMessage(function (payload) {
  console.log('[MyOrbit SW] Background message received:', payload);

  var notification = payload.notification || {};
  var data         = payload.data         || {};

  var title  = notification.title || data.title || 'MyOrbit';
  var body   = notification.body  || data.body  || '';
  // Use the dynamic /icon route — same origin, so it's always accessible
  var icon   = '/icon';
  var url    = data.url    || '/orbit/tasks';
  var taskId = data.taskId || '';
  var isTask = !!taskId;

  self.registration.showNotification(title, {
    body,
    icon,
    badge:              '/icon',
    data:               { url, taskId },
    tag:                data.tag || 'myorbit',
    requireInteraction: false,
    actions:            isTask ? TASK_ACTIONS : [],
  });
});

// ── Notification click / action handler ───────────────────────────────────
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  var action = event.action;
  var data   = event.notification.data || {};
  var url    = data.url    || '/orbit/tasks';
  var taskId = data.taskId || '';
  var title  = event.notification.title || '';
  var body   = event.notification.body  || '';

  // ── "Done" action: mark task complete via API ────────────────────────────
  if (action === 'done' && taskId) {
    event.waitUntil(
      fetch('/api/tasks/' + taskId + '/complete', {
        method:      'PATCH',
        credentials: 'include',
      }).catch(function (e) {
        console.error('[MyOrbit SW] Failed to complete task:', e);
      })
    );
    return;
  }

  // ── Snooze actions: store snooze time server-side so cron re-notifies ────
  // (setTimeout in SW is unreliable — OS kills background processes on mobile)
  if ((action === 'snooze-15' || action === 'snooze-30' || action === 'snooze-60') && taskId) {
    var minutes = action === 'snooze-15' ? 15 : action === 'snooze-30' ? 30 : 60;
    event.waitUntil(
      fetch('/api/tasks/' + taskId + '/snooze?minutes=' + minutes, {
        method:      'POST',
        credentials: 'include',
      }).catch(function (e) {
        console.error('[MyOrbit SW] Snooze API failed:', e);
      })
    );
    return;
  }

  // ── Default: open/focus the app at the task URL ──────────────────────────
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (windowClients) {
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
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
var CACHE_NAME = 'myorbit-v4';
var STATIC_ASSETS = ['/', '/orbit'];

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
