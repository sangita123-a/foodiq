const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { findUserById } = require('../models/userModel');
const { pool } = require('../config/db');
const EVENTS = require('./events');
const { userRoom, roleRoom, orderRoom, restaurantRoom, deliveryRoom, ROLE_ROOMS } = require('./rooms');
const { allow } = require('./rateLimit');
const {
  setRiderOnline,
  touchRider,
  setRiderOffline,
  onlineRiderCount,
} = require('./presence');
const {
  setIO,
  emitLocationUpdated,
  emitRiderPresence,
  EVENTS: E,
} = require('./emitters');

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const estimateEtaMinutes = (distanceKm, avgKmh = 22) => {
  if (distanceKm == null || Number.isNaN(distanceKm)) return null;
  return Math.max(1, Math.round((distanceKm / avgKmh) * 60));
};

/**
 * Attach Socket.IO to an existing HTTP server (same port as Express).
 */
const initSocket = (httpServer, { allowedOrigins = [], isOriginAllowed, corsStrict = false } = {}) => {
  const allowOrigin =
    typeof isOriginAllowed === 'function'
      ? isOriginAllowed
      : (origin) => !origin || allowedOrigins.includes(origin) || allowedOrigins.length === 0;

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (allowOrigin(origin)) {
          return callback(null, true);
        }
        if (corsStrict) {
          return callback(new Error('Not allowed by CORS'));
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingInterval: Number(process.env.SOCKET_PING_INTERVAL_MS || 25000),
    pingTimeout: Number(process.env.SOCKET_PING_TIMEOUT_MS || 20000),
    maxHttpBufferSize: Number(process.env.SOCKET_MAX_BUFFER || 1e5),
    transports: ['websocket', 'polling'],
    perMessageDeflate: {
      threshold: 1024,
    },
    connectTimeout: 10000,
  });

  // Optional Redis adapter for multi-instance Socket.IO
  try {
    const cache = require('../services/cacheService');
    const redisClient = cache.getRedis && cache.getRedis();
    if (redisClient && String(process.env.SOCKET_REDIS_ADAPTER || 'true') !== 'false') {
      const { createAdapter } = require('@socket.io/redis-adapter');
      const pub = redisClient.duplicate();
      const sub = redisClient.duplicate();
      io.adapter(createAdapter(pub, sub));
      console.log('[socket] Redis adapter enabled');
    }
  } catch (err) {
    console.warn('[socket] Redis adapter skipped', err.message);
  }

  setIO(io);

  // JWT auth on handshake
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization || '').replace(/^Bearer\s+/i, '') ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error('UNAUTHORIZED'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await findUserById(decoded.id);
      if (!user) return next(new Error('UNAUTHORIZED'));

      socket.user = {
        id: user.id,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
      };
      next();
    } catch (err) {
      next(new Error('UNAUTHORIZED'));
    }
  });

  // Prevent duplicate sockets per user: disconnect older connection with same user+role
  const activeByUser = new Map();

  io.on('connection', async (socket) => {
    const { id: userId, role } = socket.user;
    console.log('[socket] connected', userId, role, socket.id);

    const prev = activeByUser.get(userId);
    if (prev && prev !== socket.id) {
      const old = io.sockets.sockets.get(prev);
      if (old) {
        old.emit('forceDisconnect', { reason: 'duplicate_connection' });
        old.disconnect(true);
      }
    }
    activeByUser.set(userId, socket.id);

    // Join personal + role rooms
    socket.join(userRoom(userId));
    if (ROLE_ROOMS[role]) socket.join(ROLE_ROOMS[role]);

    // Restaurant owners join their restaurant room(s)
    if (role === 'restaurant_owner' || role === 'admin') {
      try {
        const { rows } = await pool.query(
          'SELECT id FROM restaurants WHERE owner_id = $1',
          [userId]
        );
        rows.forEach((r) => socket.join(restaurantRoom(r.id)));
        socket.data.restaurantIds = rows.map((r) => r.id);
      } catch {
        socket.data.restaurantIds = [];
      }
    }

    // Delivery partners join delivery room + presence
    if (role === 'delivery_partner') {
      try {
        const { rows } = await pool.query(
          'SELECT id, current_lat, current_lng, is_available FROM delivery_partners WHERE user_id = $1',
          [userId]
        );
        if (rows[0]) {
          socket.data.deliveryPartnerId = rows[0].id;
          socket.join(deliveryRoom(rows[0].id));
          setRiderOnline(rows[0].id, {
            user_id: userId,
            name: socket.user.full_name,
            lat: rows[0].current_lat,
            lng: rows[0].current_lng,
            is_available: rows[0].is_available,
          });
          emitRiderPresence();
        }
      } catch (err) {
        console.warn('[socket] delivery presence failed', err.message);
      }
    }

    socket.emit('connected', {
      user_id: userId,
      role,
      online_riders: role === 'admin' ? onlineRiderCount() : undefined,
      server_time: new Date().toISOString(),
    });

    socket.on(EVENTS.PING, (ack) => {
      if (typeof ack === 'function') ack({ ok: true, t: Date.now() });
    });

    /**
     * Join an order room after authorization check.
     */
    socket.on(EVENTS.JOIN_ORDER, async (payload, ack) => {
      try {
        if (!allow(`${socket.id}:joinOrder`, 10, 5000)) {
          if (typeof ack === 'function') ack({ ok: false, error: 'RATE_LIMIT' });
          return;
        }
        const orderId = payload?.order_id || payload?.orderId;
        if (!orderId) {
          if (typeof ack === 'function') ack({ ok: false, error: 'ORDER_ID_REQUIRED' });
          return;
        }

        const { rows } = await pool.query(
          `SELECT o.id, o.user_id, o.restaurant_id, o.status, r.owner_id
           FROM orders o
           JOIN restaurants r ON r.id = o.restaurant_id
           WHERE o.id = $1`,
          [orderId]
        );
        const order = rows[0];
        if (!order) {
          if (typeof ack === 'function') ack({ ok: false, error: 'NOT_FOUND' });
          return;
        }

        const allowed =
          role === 'admin' ||
          order.user_id === userId ||
          order.owner_id === userId ||
          (await isAssignedDeliveryPartner(userId, orderId));

        if (!allowed) {
          if (typeof ack === 'function') ack({ ok: false, error: 'FORBIDDEN' });
          return;
        }

        socket.join(orderRoom(orderId));
        socket.data.watchingOrders = socket.data.watchingOrders || new Set();
        socket.data.watchingOrders.add(orderId);

        if (typeof ack === 'function') {
          ack({ ok: true, order_id: orderId, status: order.status });
        }
      } catch (err) {
        console.error('[socket] joinOrder', err.message);
        if (typeof ack === 'function') ack({ ok: false, error: 'SERVER_ERROR' });
      }
    });

    socket.on(EVENTS.LEAVE_ORDER, (payload) => {
      const orderId = payload?.order_id || payload?.orderId;
      if (!orderId) return;
      socket.leave(orderRoom(orderId));
      socket.data.watchingOrders?.delete(orderId);
    });

    /**
     * Delivery partner pushes GPS (also accepted via HTTP; socket is preferred for live map).
     */
    socket.on(EVENTS.UPDATE_LOCATION, async (payload, ack) => {
      try {
        if (role !== 'delivery_partner' && role !== 'admin') {
          if (typeof ack === 'function') ack({ ok: false, error: 'FORBIDDEN' });
          return;
        }
        if (!allow(`${socket.id}:updateLocation`, 2, 1000)) {
          if (typeof ack === 'function') ack({ ok: false, error: 'RATE_LIMIT' });
          return;
        }

        const lat = Number(payload?.lat ?? payload?.location_lat);
        const lng = Number(payload?.lng ?? payload?.location_lng);
        const orderId = payload?.order_id || payload?.orderId || null;
        const heading = payload?.heading != null ? Number(payload.heading) : null;

        if (Number.isNaN(lat) || Number.isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
          if (typeof ack === 'function') ack({ ok: false, error: 'INVALID_COORDS' });
          return;
        }

        let partnerId = socket.data.deliveryPartnerId;
        if (!partnerId && role === 'delivery_partner') {
          const { rows } = await pool.query(
            'SELECT id FROM delivery_partners WHERE user_id = $1',
            [userId]
          );
          partnerId = rows[0]?.id;
          socket.data.deliveryPartnerId = partnerId;
        }

        if (partnerId) {
          await pool.query(
            `UPDATE delivery_partners
             SET current_lat = $1, current_lng = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [lat, lng, partnerId]
          );
          touchRider(partnerId, { lat, lng, user_id: userId, name: socket.user.full_name });
        }

        let restaurantId = null;
        let customerUserId = null;
        let distanceKm = null;
        let etaMinutes = null;

        if (orderId) {
          const authorized = await isAssignedDeliveryPartner(userId, orderId);
          if (!authorized && role !== 'admin') {
            if (typeof ack === 'function') ack({ ok: false, error: 'FORBIDDEN' });
            return;
          }

          await pool.query(
            `INSERT INTO order_tracking (order_id, delivery_partner_id, location_lat, location_lng, current_status, estimated_delivery_time)
             VALUES ($1, $2, $3, $4, 'On The Way', CURRENT_TIMESTAMP + INTERVAL '25 minutes')
             ON CONFLICT (order_id) DO UPDATE SET
               location_lat = EXCLUDED.location_lat,
               location_lng = EXCLUDED.location_lng,
               delivery_partner_id = COALESCE(EXCLUDED.delivery_partner_id, order_tracking.delivery_partner_id),
               updated_at = CURRENT_TIMESTAMP`,
            [orderId, partnerId, lat, lng]
          );

          const meta = await pool.query(
            `SELECT o.user_id, o.restaurant_id,
                    a.lat AS cust_lat, a.lng AS cust_lng,
                    r.lat AS rest_lat, r.lng AS rest_lng
             FROM orders o
             LEFT JOIN addresses a ON a.id = o.delivery_address_id
             LEFT JOIN restaurants r ON r.id = o.restaurant_id
             WHERE o.id = $1`,
            [orderId]
          );
          const m = meta.rows[0];
          if (m) {
            customerUserId = m.user_id;
            restaurantId = m.restaurant_id;
            const destLat = Number(m.cust_lat);
            const destLng = Number(m.cust_lng);
            if (!Number.isNaN(destLat) && !Number.isNaN(destLng)) {
              distanceKm = Math.round(haversineKm(lat, lng, destLat, destLng) * 100) / 100;
              etaMinutes = estimateEtaMinutes(distanceKm);
              if (etaMinutes != null) {
                await pool.query(
                  `UPDATE order_tracking
                   SET estimated_delivery_time = CURRENT_TIMESTAMP + ($1 * INTERVAL '1 minute'),
                       updated_at = CURRENT_TIMESTAMP
                   WHERE order_id = $2`,
                  [etaMinutes, orderId]
                ).catch(() => {});
              }
            }
          }
        }

        emitLocationUpdated({
          order_id: orderId,
          user_id: customerUserId,
          restaurant_id: restaurantId,
          delivery_partner_id: partnerId,
          lat,
          lng,
          eta_minutes: etaMinutes,
          distance_km: distanceKm,
          heading,
        });

        if (typeof ack === 'function') {
          ack({
            ok: true,
            lat,
            lng,
            distance_km: distanceKm,
            eta_minutes: etaMinutes,
          });
        }
      } catch (err) {
        console.error('[socket] updateLocation', err.message);
        if (typeof ack === 'function') ack({ ok: false, error: 'SERVER_ERROR' });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[socket] disconnected', userId, reason);
      if (activeByUser.get(userId) === socket.id) {
        activeByUser.delete(userId);
      }
      if (socket.data.deliveryPartnerId) {
        setRiderOffline(socket.data.deliveryPartnerId);
        emitRiderPresence();
      }
    });
  });

  console.log('[socket] Socket.IO ready');
  return io;
};

async function isAssignedDeliveryPartner(userId, orderId) {
  const { rows } = await pool.query(
    `SELECT da.id
     FROM delivery_assignments da
     JOIN delivery_partners dp ON dp.id = da.delivery_partner_id
     WHERE da.order_id = $1
       AND dp.user_id = $2
       AND da.status NOT IN ('rejected', 'expired')
     LIMIT 1`,
    [orderId, userId]
  );
  return Boolean(rows[0]);
}

module.exports = { initSocket, haversineKm, estimateEtaMinutes };
