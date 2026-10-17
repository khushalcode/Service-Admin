// Single service worker — PWA installability + Firebase Cloud Messaging background handler.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAxpgr-x-K0t_UcoOQ0UQ9Uq8C5h38vTzs",
  authDomain: "edemand-79907.firebaseapp.com",
  projectId: "edemand-79907",
  storageBucket: "edemand-79907.appspot.com",
  messagingSenderId: "811828125363",
  appId: "1:811828125363:web:5b177d6625c3e3731f5ac6",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {};
  self.registration.showNotification(title ?? "The Cleaning Bee", {
    body,
    icon: icon ?? "/favicon.ico",
  });
});
