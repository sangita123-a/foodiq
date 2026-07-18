# Foodiq Push Notifications (FCM)

Production-ready push + in-app notifications. Reuses Socket.IO for online users and FCM for offline / multi-device delivery.

## Architecture

```
Event (order / payment / delivery / admin)
        │
        ▼
 notificationService.notify()
        │
        ├─► Postgres `notifications` (inbox)
        ├─► Socket.IO `notification` if user room online
        └─► `notification_queue` → FCM (retry on failure)
                    │
                    ▼
            device_tokens (web / android / ios)
```

## Database

| Table | Purpose |
|-------|---------|
| `notifications` | Inbox: user_id, role, type, category, title, message, meta, order_id, dedupe_key, is_read |
| `device_tokens` | FCM registration tokens per user/device |
| `notification_queue` | Async push jobs with retry / dead-letter |

Migrations run automatically via `ensureSchema.js`.

## Backend APIs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications` | List (filters: `q`, `from`, `to`, `category`, `type`, `unread`) |
| GET | `/api/notifications/unread-count` | Badge count |
| PUT | `/api/notifications/:id/read` | Mark read |
| PUT | `/api/notifications/read-all` | Mark all read |
| DELETE | `/api/notifications/:id` | Delete one |
| DELETE | `/api/notifications` | Clear all |
| POST | `/api/notifications/device-token` | Register FCM token |
| DELETE | `/api/notifications/device-token` | Deactivate token |
| GET | `/api/notifications/push-config` | Public Firebase web config |
| POST | `/api/notifications/admin/send` | Admin targeted send |

Role lists also: `GET /api/partner/notifications`, `GET /api/delivery/notifications`.

## Real-time sync policy

1. Always write to DB (notification center).
2. If Socket.IO room `user:{id}` has sockets → emit immediately.
3. If user has FCM tokens (or is offline) → enqueue push.
4. Respect `user_settings.push_notifications`.
5. Dedupe key prevents duplicate spam within 2 minutes.

## Firebase setup

1. Create a Firebase project → enable **Cloud Messaging**.
2. Add a **Web** app → copy config into `.env`.
3. Generate a **Web Push certificate (VAPID)** key.
4. Create a service account → download JSON → set server env.

### Frontend `.env` (Next.js root)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
```

### Backend `.env`

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# Or: FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
FCM_MOCK=true
FIREBASE_VAPID_KEY=
```

Leave `FCM_MOCK=true` (or omit credentials) for local logging without real FCM.

### Android

Use the same Firebase project. Add `google-services.json` to the native app and register tokens with:

`POST /api/notifications/device-token` `{ "token": "...", "platform": "android" }`

## Frontend pieces

| Path | Role |
|------|------|
| `lib/firebaseMessaging.ts` | Permission, token, foreground listener |
| `app/api/firebase-messaging-sw/route.ts` | Dynamic SW (rewritten to `/firebase-messaging-sw.js`) |
| `components/notifications/PushNotificationProvider.tsx` | Auto register + socket refresh |
| `components/notifications/NotificationBell.tsx` | Bell + drawer + badge |
| `app/notifications/page.tsx` | Customer center (search / date / type) |
| `app/partner/notifications/page.tsx` | Restaurant center |
| `app/delivery/notifications/page.tsx` | Rider center |
| `app/admin/notifications/page.tsx` | Admin inbox + broadcast |

## Notification types (examples)

Customer: order_placed, order_accepted, order_preparing, order_ready, order_picked_up, out_for_delivery, order_delivered, order_cancelled, payment_success, payment_failed, refund_completed, coupon_alert

Restaurant: new_order, payment_received, delivery_assigned, pickup_completed

Delivery: new_delivery_request, delivery_completed, daily_earnings

Admin: failed_payment, refund_request, high_order_volume, restaurant_registration, …

## Testing checklist

1. Restart backend → schema creates `device_tokens` / queue tables.
2. Log in as customer → click **Enable push** on `/notifications`.
3. Place order → restaurant gets in-app + socket; with FCM configured, push arrives.
4. Close the tab / go offline → next status change still delivers via FCM when online again.
5. Admin → Notifications inbox + Broadcast.
6. With `FCM_MOCK=true`, check backend logs for `[fcm:mock] push`.
