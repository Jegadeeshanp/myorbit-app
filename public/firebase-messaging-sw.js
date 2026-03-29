importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCxEuJN6ZqJ-EaxH_F7eNjZSKFn6zgVmzA",
  authDomain: "myorbit-fdeed.firebaseapp.com",
  projectId: "myorbit-fdeed",
  messagingSenderId: "529212236858",
  appId: "1:529212236858:web:2eabc25514171548904103",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icon.png',
  });
});