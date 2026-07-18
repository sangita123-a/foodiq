# Foodiq Real-time Order Tracking (Socket.IO)

Production-ready Socket.IO layer shared by Customer, Restaurant Partner, Delivery Partner, and Admin apps.

## Architecture

```
Express HTTP API  ←→  same Node HTTP server  ←→  Socket.IO
        │                                          │
   REST (orders, payments, delivery)         JWT handshake
        │                                          │
   DB writes  ──emit──►  rooms: user / role / order / restaurant / delivery
```

HTTP handlers keep working as before. After a successful status/location/payment write they emit targeted socket events (never a full broadcast).

## Backend files

| Path | Role |
|------|------|
| `foodiq-frontend/foodiq-backend/socket/index.js` | JWT auth, rooms, `joinOrder`, `updateLocation`, reconnect-safe presence |
| `socket/events.js` | Canonical event names |
| `socket/rooms.js` | Room helpers |
| `socket/emitters.js` | `emitOrderStatus`, `emitLocationUpdated`, `emitPaymentCompleted`, … |
| `socket/rateLimit.js` | Per-socket rate limits |
| `socket/presence.js` | Online rider presence for Admin Live |

## Rooms

- `user:{userId}` — personal notifications
- `role:customer` / `role:restaurant_owner` / `role:delivery_partner` / `role:admin`
- `order:{orderId}` — parties watching one order (after authorized `joinOrder`)
- `restaurant:{restaurantId}` — restaurant owners
- `delivery:{partnerId}` — delivery partner

## Events (server → client)

| Event | When |
|-------|------|
| `orderCreated` | Checkout / payment creates order |
| `orderAccepted` | Restaurant accepts |
| `orderPreparing` | Preparing |
| `orderReady` | Ready for pickup |
| `pickupCompleted` | Picked up |
| `outForDelivery` | On the way |
| `orderDelivered` | Delivered |
| `orderCancelled` | Cancelled |
| `orderStatus` | Always emitted with status changes |
| `locationUpdated` | Rider GPS |
| `paymentCompleted` | Verified Razorpay / prepaid success |
| `adminLive` | Compact admin ticks |
| `riderPresence` | Online riders list/count |
| `notification` | User-targeted alerts |

## Client events

| Event | Who | Payload |
|-------|-----|---------|
| `joinOrder` | Any authorized role | `{ order_id }` |
| `leaveOrder` | Any | `{ order_id }` |
| `updateLocation` | Delivery partner | `{ lat, lng, order_id?, heading? }` (rate-limited ~2/sec) |

## Frontend

| Path | Role |
|------|------|
| `lib/socket.ts` | Singleton client, auto-reconnect, JWT from cookie `token` |
| `hooks/useSocket.ts` | Connection + offline detection |
| `hooks/useOrderLiveTracking.ts` | Customer track page |
| `hooks/useLiveLocationPublisher.ts` | Delivery GPS publisher |
| `hooks/useAdminLive.ts` | Admin live ops |
| `components/tracking/LiveTrackingMap.tsx` | OpenStreetMap (Leaflet) |
| `app/track-order/page.tsx` | Live timeline + map + ETA |
| `app/admin/live/page.tsx` | Admin live dashboard |
| `components/delivery/DeliveryRealtimeBridge.tsx` | Auto GPS while online |

## Security

1. Socket handshake requires JWT (`auth.token` or `Authorization` header).
2. `joinOrder` checks customer / restaurant owner / assigned rider / admin.
3. Location updates validated (coords + assignment) and rate-limited.
4. Duplicate connections for the same user are disconnected (`forceDisconnect`).
5. Emits go only to relevant rooms.

## Env

No extra env vars required. Socket.IO shares `PORT` with the API (`NEXT_PUBLIC_API_URL` on the frontend).

Optional: ensure `FRONTEND_URL` matches the Next.js origin for CORS.

## Testing checklist

1. Start backend (`npm run dev` in `foodiq-frontend/foodiq-backend`) — log shows `Socket.IO ready`.
2. Place an order → restaurant dashboard updates without refresh.
3. Restaurant Accept → Preparing → Ready → customer `/track-order?id=` timeline advances live.
4. Delivery partner goes online → allow geolocation → customer map rider marker moves.
5. Disconnect wifi → UI shows “Reconnecting / Offline”; reconnect resumes `joinOrder`.
6. Admin → **Live Ops** — event feed + online riders update.

## Status mapping

Order Placed → Accepted → Preparing → Ready For Pickup → Picked Up → Out For Delivery → Delivered

DB may store `On The Way` (maps to Out For Delivery in the UI timeline).
