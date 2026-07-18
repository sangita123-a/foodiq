import { NextResponse } from "next/server";

/**
 * Serves Firebase messaging SW with env-injected config.
 * Rewritten from /firebase-messaging-sw.js in next.config.ts
 */
export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  };

  const siteOrigin = (() => {
    try {
      const raw = process.env.NEXT_PUBLIC_SITE_URL || "";
      if (!raw) return "";
      return new URL(raw).origin;
    } catch {
      return "";
    }
  })();

  const body = `
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const firebaseConfig = ${JSON.stringify(config)};
const SITE_ORIGIN = ${JSON.stringify(siteOrigin)};

function safeNotificationLink(raw) {
  try {
    if (!raw || typeof raw !== 'string') return '/notifications';
    if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
    var u = new URL(raw, self.location.origin);
    if (u.origin === self.location.origin) return u.pathname + u.search + u.hash;
    if (SITE_ORIGIN && u.origin === SITE_ORIGIN) return u.href;
    return '/notifications';
  } catch (e) {
    return '/notifications';
  }
}

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage(function (payload) {
      const title = (payload.notification && payload.notification.title) || (payload.data && payload.data.title) || 'Foodiq';
      const options = {
        body: (payload.notification && payload.notification.body) || (payload.data && payload.data.body) || '',
        icon: '/icons/notification-icon.png',
        badge: '/icons/notification-badge.png',
        data: payload.data || {}
      };
      self.registration.showNotification(title, options);
    });
  }
} catch (e) {
  console.warn('[fcm-sw]', e);
}

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var link = safeNotificationLink(
    (event.notification.data && event.notification.data.link) || '/notifications'
  );
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ('focus' in list[i]) return list[i].focus();
      }
      if (clients.openWindow) return clients.openWindow(link);
    })
  );
});
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Service-Worker-Allowed": "/",
      "Cache-Control": "no-cache",
    },
  });
}
