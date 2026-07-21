"use client";

import api from "@/services/api";

type FirebaseWebConfig = {
  apiKey?: string | null;
  authDomain?: string | null;
  projectId?: string | null;
  messagingSenderId?: string | null;
  appId?: string | null;
};

type FirebaseApp = import("firebase/app").FirebaseApp;
type Messaging = import("firebase/messaging").Messaging;

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let cachedVapid: string | null = null;
let messagingModule: typeof import("firebase/messaging") | null = null;
let appModule: typeof import("firebase/app") | null = null;

async function loadAppModule() {
  if (typeof window === "undefined") return null;
  if (!appModule) {
    try {
      appModule = await import("firebase/app");
    } catch {
      return null;
    }
  }
  return appModule;
}

async function loadMessagingModule() {
  if (typeof window === "undefined") return null;
  if (!messagingModule) {
    try {
      messagingModule = await import("firebase/messaging");
    } catch {
      return null;
    }
  }
  return messagingModule;
}

async function loadConfig() {
  const fromEnv: FirebaseWebConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (fromEnv.apiKey && fromEnv.projectId && fromEnv.appId) {
    cachedVapid = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || null;
    return { firebase: fromEnv, vapid_key: cachedVapid, mock: false };
  }

  try {
    const res = await api.get("/api/notifications/push-config");
    const data = res.data.data;
    cachedVapid = data.vapid_key || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || null;
    return data as {
      firebase: FirebaseWebConfig;
      vapid_key: string | null;
      mock: boolean;
      enabled: boolean;
    };
  } catch {
    return { firebase: fromEnv, vapid_key: null, mock: true, enabled: false };
  }
}

async function initApp(cfg: FirebaseWebConfig) {
  const firebaseApp = await loadAppModule();
  if (!firebaseApp || !cfg.apiKey || !cfg.projectId || !cfg.appId) return null;

  if (firebaseApp.getApps().length) {
    app = firebaseApp.getApps()[0]!;
  } else {
    app = firebaseApp.initializeApp({
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain || undefined,
      projectId: cfg.projectId,
      messagingSenderId: cfg.messagingSenderId || undefined,
      appId: cfg.appId,
    });
  }
  return app;
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;

  const fcm = await loadMessagingModule();
  if (!fcm) return null;

  const supported = await fcm.isSupported().catch(() => false);
  if (!supported) return null;

  const cfg = await loadConfig();
  if (cfg.mock && !cfg.firebase?.apiKey) return null;

  const firebaseApp = await initApp(cfg.firebase || {});
  if (!firebaseApp) return null;

  if (!messaging) {
    messaging = fcm.getMessaging(firebaseApp);
  }
  return messaging;
}

/**
 * Request permission, register SW, get FCM token, POST to backend.
 */
export async function registerPushDevice(): Promise<{
  ok: boolean;
  token?: string;
  reason?: string;
}> {
  if (typeof window === "undefined") return { ok: false, reason: "ssr" };
  if (!("Notification" in window)) return { ok: false, reason: "unsupported" };

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();

  if (permission !== "granted") {
    return { ok: false, reason: "denied" };
  }

  const msg = await getFirebaseMessaging();
  if (!msg) {
    if (process.env.NEXT_PUBLIC_FCM_MOCK_TOKEN === "true") {
      const mockToken = `mock_web_${Date.now()}`;
      await api.post("/api/notifications/device-token", {
        token: mockToken,
        platform: "web",
        device_info: { mock: true },
      });
      return { ok: true, token: mockToken, reason: "mock" };
    }
    return { ok: false, reason: "firebase_not_configured" };
  }

  const fcm = await loadMessagingModule();
  if (!fcm) return { ok: false, reason: "firebase_not_configured" };

  try {
    let registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration) {
      registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
    }
    await navigator.serviceWorker.ready;

    const vapidKey =
      cachedVapid || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || undefined;

    const token = await fcm.getToken(msg, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) return { ok: false, reason: "no_token" };

    await api.post("/api/notifications/device-token", {
      token,
      platform: "web",
      device_info: {
        userAgent: navigator.userAgent,
      },
    });

    localStorage.setItem("foodiq_fcm_token", token);
    return { ok: true, token };
  } catch (err) {
    console.warn("[fcm] register failed", err);
    return { ok: false, reason: "register_failed" };
  }
}

export async function unregisterPushDevice() {
  const token = localStorage.getItem("foodiq_fcm_token");
  if (!token) return;
  try {
    await api.delete("/api/notifications/device-token", { data: { token } });
  } catch {
    /* ignore */
  }
  localStorage.removeItem("foodiq_fcm_token");
}

/** Foreground FCM messages */
export async function listenForegroundMessages(
  onPayload: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void
) {
  const msg = await getFirebaseMessaging();
  if (!msg) return () => {};

  const fcm = await loadMessagingModule();
  if (!fcm) return () => {};

  return fcm.onMessage(msg, (payload) => {
    onPayload({
      title: payload.notification?.title,
      body: payload.notification?.body,
      data: payload.data as Record<string, string> | undefined,
    });
  });
}
