/**
 * Firebase Cloud Messaging (Admin SDK).
 * Mock mode when credentials are missing — logs instead of sending.
 */
let messaging = null;
let initAttempted = false;

const isMockMode = () => {
  if (process.env.FCM_MOCK === 'true') return true;
  if (!process.env.FIREBASE_PROJECT_ID) return true;
  if (!process.env.FIREBASE_CLIENT_EMAIL && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return true;
  }
  return false;
};

const initFirebase = () => {
  if (initAttempted) return messaging;
  initAttempted = true;

  if (isMockMode()) {
    console.log('[fcm] Mock mode — push notifications will be logged only');
    return null;
  }

  try {
    // eslint-disable-next-line global-require
    const admin = require('firebase-admin');
    if (admin.apps.length) {
      messaging = admin.messaging();
      return messaging;
    }

    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const json = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      credential = admin.credential.cert(json);
    } else {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: String(process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      });
    }

    admin.initializeApp({
      credential,
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    messaging = admin.messaging();
    console.log('[fcm] Firebase Admin initialized');
    return messaging;
  } catch (err) {
    console.error('[fcm] init failed — falling back to mock:', err.message);
    return null;
  }
};

/**
 * Send FCM to one or more device tokens.
 * @returns {{ successCount, failureCount, invalidTokens: string[] }}
 */
const sendToTokens = async ({ tokens, title, body, data = {} }) => {
  const list = (tokens || []).filter(Boolean);
  if (list.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [], mock: true };
  }

  const msg = initFirebase();
  const stringData = {};
  Object.entries(data || {}).forEach(([k, v]) => {
    if (v != null) stringData[k] = String(v);
  });

  if (!msg || isMockMode()) {
    console.log('[fcm:mock] push', {
      tokens: list.length,
      title,
      body,
      data: stringData,
    });
    return {
      successCount: list.length,
      failureCount: 0,
      invalidTokens: [],
      mock: true,
    };
  }

  try {
    const response = await msg.sendEachForMulticast({
      tokens: list,
      notification: { title, body },
      data: stringData,
      webpush: {
        notification: {
          title,
          body,
          icon: '/icons/notification-icon.png',
          badge: '/icons/notification-badge.png',
        },
        fcmOptions: {
          link: stringData.link || process.env.FRONTEND_URL || '/',
        },
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'foodiq_orders',
          sound: 'default',
        },
      },
    });

    const invalidTokens = [];
    response.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code || '';
        if (
          code.includes('registration-token-not-registered') ||
          code.includes('invalid-registration-token') ||
          code.includes('invalid-argument')
        ) {
          invalidTokens.push(list[i]);
        }
        console.warn('[fcm] send fail', code, r.error?.message);
      }
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
      mock: false,
    };
  } catch (err) {
    console.error('[fcm] send error', err.message);
    return {
      successCount: 0,
      failureCount: list.length,
      invalidTokens: [],
      error: err.message,
    };
  }
};

module.exports = {
  isMockMode,
  initFirebase,
  sendToTokens,
};
