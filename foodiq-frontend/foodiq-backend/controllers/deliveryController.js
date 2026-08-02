const deliveryService = require('../services/deliveryService');
const deliveryModel = require('../models/deliveryModel');
const deliveryLocationModel = require('../models/deliveryLocationModel');
const { getNotificationsByUserId } = require('../models/notificationModel');
const { pool } = require('../config/db');
const { log } = require('../utils/logger');

const ok = (res, message, data = {}) =>
  res.status(200).json({ success: true, message, data });

const created = (res, message, data = {}) =>
  res.status(201).json({ success: true, message, data });

const fail = (res, status, message, error = {}) =>
  res.status(status).json({ success: false, message, error });

/**
 * POST /api/delivery/register
 */
const register = async (req, res) => {
  try {
    const result = await deliveryService.registerPartner(req.body);
    return created(
      res,
      'Registration successful. Please verify your email. Waiting for Admin Approval.',
      result
    );
  } catch (error) {
    log.error('[deliveryController] Register error', { error: error.message, stack: error.stack });
    return fail(res, error.status || 500, error.message || 'Failed to register delivery partner.');
  }
};

/**
 * POST /api/delivery/login
 */
const login = async (req, res) => {
  try {
    const result = await deliveryService.loginPartner({
      ...req.body,
      meta: { userAgent: req.headers['user-agent'], ip: req.ip },
    });

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    };

    const isRemember = Boolean(result.rememberMe);
    const maxAgeAccess = isRemember ? 30 * 86400 * 1000 : 7 * 86400 * 1000;
    const maxAgeRefresh = isRemember ? 60 * 86400 * 1000 : 14 * 86400 * 1000;

    res.cookie('delivery_token', result.token, { ...cookieOpts, maxAge: maxAgeAccess });
    if (result.refreshToken) {
      res.cookie('delivery_refresh_token', result.refreshToken, { ...cookieOpts, maxAge: maxAgeRefresh });
    }

    return ok(res, 'Login successful', result);
  } catch (error) {
    log.error('[deliveryController] Login error', { error: error.message });
    return fail(res, error.status || 401, error.message || 'Invalid credentials.');
  }
};

/**
 * POST /api/delivery/refresh
 */
const refreshToken = async (req, res) => {
  try {
    const tokenInput = req.body.refreshToken || req.body.refresh_token || req.cookies?.delivery_refresh_token;
    const result = await deliveryService.refreshDeliveryToken(tokenInput, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    };

    res.cookie('delivery_token', result.token, { ...cookieOpts, maxAge: 7 * 86400 * 1000 });
    res.cookie('delivery_refresh_token', result.refreshToken, { ...cookieOpts, maxAge: 30 * 86400 * 1000 });

    return ok(res, 'Token refreshed successfully', result);
  } catch (error) {
    log.error('[deliveryController] Refresh token error', { error: error.message });
    return fail(res, error.status || 401, error.message || 'Invalid refresh token.');
  }
};

/**
 * POST /api/delivery/logout
 */
const logout = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    const refreshTokenInput = req.body?.refreshToken || req.body?.refresh_token || req.cookies?.delivery_refresh_token;
    await deliveryService.logoutPartner(partnerId, refreshTokenInput);

    const cookieOpts = { path: '/' };
    res.clearCookie('delivery_token', cookieOpts);
    res.clearCookie('delivery_refresh_token', cookieOpts);

    return ok(res, 'Logged out successfully');
  } catch (error) {
    log.error('[deliveryController] Logout error', { error: error.message });
    return fail(res, 500, 'Logout failed.');
  }
};

/**
 * POST /api/delivery/send-otp
 */
const sendOtp = async (req, res) => {
  try {
    const result = await deliveryService.sendDeliveryOtp(req.body);
    return ok(res, 'OTP sent successfully', result);
  } catch (error) {
    log.error('[deliveryController] Send OTP error', { error: error.message });
    return fail(res, error.status || 500, error.message || 'Failed to send OTP.');
  }
};

/**
 * POST /api/delivery/verify-otp
 */
const verifyOtp = async (req, res) => {
  try {
    const result = await deliveryService.verifyDeliveryOtp(req.body);
    return ok(res, result.message || 'Email verified successfully. Waiting for Admin Approval.', result);
  } catch (error) {
    log.error('[deliveryController] Verify OTP error', { error: error.message });
    return fail(res, error.status || 400, error.message || 'OTP verification failed.');
  }
};

/**
 * POST /api/delivery/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const result = await deliveryService.forgotPassword(req.body.email);
    return ok(res, result.message, result);
  } catch (error) {
    log.error('[deliveryController] Forgot password error', { error: error.message });
    return fail(res, error.status || 500, error.message || 'Failed to process forgot password.');
  }
};

/**
 * POST /api/delivery/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const result = await deliveryService.resetPassword(req.body);
    return ok(res, result.message, result);
  } catch (error) {
    log.error('[deliveryController] Reset password error', { error: error.message });
    return fail(res, error.status || 400, error.message || 'Failed to reset password.');
  }
};

/**
 * GET /api/delivery/profile
 */
const getProfile = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) {
      return fail(res, 401, 'Unauthorized access.');
    }
    const partner = await deliveryService.getProfile(partnerId);
    return ok(res, 'Delivery partner profile retrieved successfully', partner);
  } catch (error) {
    log.error('[deliveryController] Get profile error', { error: error.message });
    return fail(res, error.status || 500, error.message || 'Failed to retrieve profile.');
  }
};

/**
 * PATCH /api/delivery/online-status
 */
const updateOnlineStatus = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) {
      return fail(res, 401, 'Unauthorized access.');
    }
    const isOnline = req.body.is_online ?? req.body.online ?? req.body.is_available;
    const partner = await deliveryService.updateOnlineStatus(partnerId, isOnline);
    return ok(res, 'Online status updated successfully', partner);
  } catch (error) {
    log.error('[deliveryController] Update online status error', { error: error.message });
    return fail(res, error.status || 500, error.message || 'Failed to update online status.');
  }
};

/* ── Legacy & Auxiliary Endpoints ────────────────────────────────────────── */

const requirePartnerLegacy = async (req, res) => {
  if (req.deliveryPartner) return req.deliveryPartner;
  const partner = await deliveryModel.getPartnerByUserId(req.user.id);
  if (!partner) {
    fail(res, 404, 'Delivery partner profile not found.');
    return null;
  }
  return partner;
};

const getMe = async (req, res) => {
  try {
    if (req.deliveryPartner) {
      return ok(res, 'Delivery partner profile', {
        partner: req.deliveryPartner,
        verification_status: req.deliveryPartner.status || 'pending',
      });
    }
    const partner = await deliveryModel.getPartnerByUserId(req.user.id);
    if (!partner) {
      return fail(res, 404, 'Delivery partner profile not found.');
    }
    ok(res, 'Delivery partner profile', {
      user: {
        id: req.user.id,
        full_name: req.user.full_name,
        email: req.user.email,
        role: req.user.role,
      },
      partner,
      verification_status: partner.approval_status || partner.status || 'approved',
    });
  } catch (error) {
    log.error('[deliveryController] getMe error', { error: error.message });
    fail(res, 500, 'Server Error', error.message);
  }
};

const getDashboard = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    const data = await deliveryModel.getDashboard(partner.id);
    const { getPartnerStatsSummary } = require('../models/deliveryPartnerReviewModel');
    const review_stats = await getPartnerStatsSummary(partner.id);
    ok(res, 'Dashboard retrieved', { ...data, review_stats });
  } catch (error) {
    log.error('[deliveryController] getDashboard error', { error: error.message });
    fail(res, 500, 'Server Error', error.message);
  }
};

const setAvailability = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    const is_available = Boolean(req.body.is_available ?? req.body.online ?? req.body.is_online);

    try {
      await deliveryService.updateOnlineStatus(partner.id, is_available);
    } catch (innerError) {
      if (innerError.status === 403) throw innerError;
      await deliveryModel.updateAvailability(partner.id, is_available);
    }

    ok(res, is_available ? 'You are online' : 'You are offline', { is_online: is_available });
  } catch (error) {
    log.error('[deliveryController] setAvailability error', { error: error.message });
    fail(res, error.status || 500, error.message || 'Server Error', error.message);
  }
};

const setLocation = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    const lat = Number(req.body.lat ?? req.body.current_lat);
    const lng = Number(req.body.lng ?? req.body.current_lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return fail(res, 400, 'lat and lng are required');
    }
    const data = await deliveryModel.updateLocation(partner.id, lat, lng, null);
    ok(res, 'Location updated', data);
  } catch (error) {
    log.error('[deliveryController] setLocation error', { error: error.message });
    fail(res, 500, 'Server Error', error.message);
  }
};

/**
 * POST /api/delivery/location/update
 * Body: { latitude, longitude, accuracy, heading, speed, order_id? }
 * Saves the GPS ping (delivery_locations history + delivery_partners live position)
 * and broadcasts it over Socket.IO to order/admin watchers.
 */
const updateLocationDetailed = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;

    const latitude = Number(req.body.latitude ?? req.body.lat);
    const longitude = Number(req.body.longitude ?? req.body.lng);
    const accuracy = req.body.accuracy != null ? Number(req.body.accuracy) : null;
    const speed = req.body.speed != null ? Number(req.body.speed) : null;
    const heading = req.body.heading != null ? Number(req.body.heading) : null;

    let orderId = req.body.order_id || req.body.orderId || null;
    if (!orderId) {
      orderId = await deliveryLocationModel.getActiveOrderIdForPartner(partner.id);
    }

    const [ping] = await Promise.all([
      deliveryLocationModel.recordLocation({
        partnerId: partner.id,
        orderId,
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
      }),
      deliveryModel.updateLocation(partner.id, latitude, longitude, orderId),
    ]);

    let distance_km = null;
    let eta_minutes = null;
    let customerUserId = null;
    let restaurantId = null;

    if (orderId) {
      const { haversineKm, estimateEtaMinutes } = require('../socket');
      await pool.query(
        `INSERT INTO order_tracking (order_id, delivery_partner_id, location_lat, location_lng, current_status, estimated_delivery_time)
         VALUES ($1, $2, $3, $4, 'On The Way', CURRENT_TIMESTAMP + INTERVAL '25 minutes')
         ON CONFLICT (order_id) DO UPDATE SET
           location_lat = EXCLUDED.location_lat,
           location_lng = EXCLUDED.location_lng,
           delivery_partner_id = COALESCE(EXCLUDED.delivery_partner_id, order_tracking.delivery_partner_id),
           updated_at = CURRENT_TIMESTAMP`,
        [orderId, partner.id, latitude, longitude]
      ).catch(() => {});

      const meta = await pool.query(
        `SELECT o.user_id, o.restaurant_id, a.lat AS cust_lat, a.lng AS cust_lng
         FROM orders o
         LEFT JOIN addresses a ON a.id = o.delivery_address_id
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
          distance_km = Math.round(haversineKm(latitude, longitude, destLat, destLng) * 100) / 100;
          eta_minutes = estimateEtaMinutes(distance_km);
        }
      }
    }

    const { emitLocationUpdated } = require('../socket/emitters');
    emitLocationUpdated({
      order_id: orderId,
      user_id: customerUserId,
      restaurant_id: restaurantId,
      delivery_partner_id: partner.id,
      lat: latitude,
      lng: longitude,
      eta_minutes,
      distance_km,
      heading,
    });

    return ok(res, 'Location updated', {
      ...ping,
      order_id: orderId,
      distance_km,
      eta_minutes,
    });
  } catch (error) {
    log.error('[deliveryController] updateLocationDetailed error', { error: error.message });
    return fail(res, 500, 'Failed to update location.', error.message);
  }
};

const getAvailable = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    ok(res, 'Available orders', await deliveryModel.listAvailableOrders(partner.id));
  } catch (error) {
    log.error('[deliveryController] getAvailable error', { error: error.message });
    fail(res, 500, 'Server Error', error.message);
  }
};

const getAssigned = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    ok(res, 'Assigned orders', await deliveryModel.listAssignedOrders(partner.id));
  } catch (error) {
    log.error('[deliveryController] getAssigned error', { error: error.message });
    fail(res, 500, 'Server Error', error.message);
  }
};

const getOrder = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    const data = await deliveryModel.getOrderForPartner(req.params.id, partner.id);
    if (!data) return fail(res, 404, 'Order not found');
    ok(res, 'Order details', data);
  } catch (error) {
    log.error('[deliveryController] getOrder error', { error: error.message });
    fail(res, 500, 'Server Error', error.message);
  }
};

const accept = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    const data = await deliveryModel.acceptOrder(req.params.id, partner.id);
    ok(res, 'Order accepted', data);
  } catch (error) {
    log.error('[deliveryController] accept error', { error: error.message });
    fail(res, error.status || 500, error.message, error.message);
  }
};

const reject = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    const data = await deliveryModel.rejectOrder(req.params.id, partner.id);
    ok(res, 'Order rejected', data);
  } catch (error) {
    log.error('[deliveryController] reject error', { error: error.message });
    fail(res, error.status || 500, error.message, error.message);
  }
};

const updateStatus = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    const status = String(req.body.status || '').toLowerCase().replace(/\s+/g, '_');
    const data = await deliveryModel.updateDeliveryStatusWithRules(req.params.id, partner.id, status);
    ok(res, 'Status updated', data);
  } catch (error) {
    log.error('[deliveryController] updateStatus error', { error: error.message });
    fail(res, error.status || 500, error.message, error.message);
  }
};

const reachedRestaurant = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) return fail(res, 401, 'Unauthorized access.');
    const data = await deliveryModel.updateDeliveryStatusWithRules(req.params.id, partnerId, 'reached_restaurant');
    return ok(res, 'Reached restaurant status recorded successfully', data);
  } catch (error) {
    log.error('[deliveryController] reachedRestaurant error', { error: error.message });
    return fail(res, error.status || 500, error.message || 'Failed to update order status.');
  }
};

const pickedUp = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) return fail(res, 401, 'Unauthorized access.');
    const data = await deliveryModel.updateDeliveryStatusWithRules(req.params.id, partnerId, 'picked_up');
    return ok(res, 'Picked up status recorded successfully', data);
  } catch (error) {
    log.error('[deliveryController] pickedUp error', { error: error.message });
    return fail(res, error.status || 500, error.message || 'Failed to update order status.');
  }
};

const outForDelivery = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) return fail(res, 401, 'Unauthorized access.');
    const data = await deliveryModel.updateDeliveryStatusWithRules(req.params.id, partnerId, 'out_for_delivery');
    return ok(res, 'Out for delivery status recorded successfully', data);
  } catch (error) {
    log.error('[deliveryController] outForDelivery error', { error: error.message });
    return fail(res, error.status || 500, error.message || 'Failed to update order status.');
  }
};

const delivered = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) return fail(res, 401, 'Unauthorized access.');
    const data = await deliveryModel.updateDeliveryStatusWithRules(req.params.id, partnerId, 'delivered');
    return ok(res, 'Delivered status recorded successfully', data);
  } catch (error) {
    log.error('[deliveryController] delivered error', { error: error.message });
    return fail(res, error.status || 500, error.message || 'Failed to update order status.');
  }
};

const verifyOrderOtp = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) return fail(res, 401, 'Unauthorized access.');
    const otp = req.body?.otp;
    if (!otp) return fail(res, 400, 'OTP is required.');
    const data = await deliveryModel.verifyDeliveryOtp(req.params.id, partnerId, otp);
    return ok(res, 'Delivery OTP verified successfully. Order delivered!', data);
  } catch (error) {
    log.error('[deliveryController] verifyOrderOtp error', { error: error.message });
    return fail(res, error.status || 400, error.message || 'Failed to verify delivery OTP.');
  }
};

const getEarnings = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    ok(res, 'Earnings retrieved', await deliveryModel.getEarnings(partner.id));
  } catch (error) {
    log.error('[deliveryController] getEarnings error', { error: error.message });
    fail(res, 500, 'Server Error', error.message);
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.deliveryPartner?.id || req.user?.id;
    ok(res, 'Notifications retrieved', await getNotificationsByUserId(userId));
  } catch (error) {
    log.error('[deliveryController] getNotifications error', { error: error.message });
    fail(res, 500, 'Server Error', error.message);
  }
};

const gmapsDirUrl = (origin, destination, waypoint) => {
  const params = new URLSearchParams({
    api: '1',
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    travelmode: 'driving',
  });
  if (waypoint) params.set('waypoints', `${waypoint.lat},${waypoint.lng}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

const osmEmbedUrl = (points) => {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const pad = 0.01;
  const bbox = [
    Math.min(...lngs) - pad,
    Math.min(...lats) - pad,
    Math.max(...lngs) + pad,
    Math.max(...lats) + pad,
  ].join('%2C');
  const marker = points[points.length - 1];
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker.lat}%2C${marker.lng}`;
};

const getRoute = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    const order = await deliveryModel.getOrderForPartner(req.params.id, partner.id);
    if (!order) return fail(res, 404, 'Order not found');

    const { haversineKm, estimateEtaMinutes } = require('../socket');
    const restaurant = { lat: order.restaurant.lat, lng: order.restaurant.lng, name: order.restaurant.name, address: order.restaurant.address };
    const customer = { lat: order.customer.lat, lng: order.customer.lng, name: order.customer.name, address: order.customer.address };
    const partnerLocation = {
      lat: partner.current_lat != null ? Number(partner.current_lat) : restaurant.lat,
      lng: partner.current_lng != null ? Number(partner.current_lng) : restaurant.lng,
    };

    const stage = String(order.assignment_status || order.order_status || '').toLowerCase();
    const pickedUp = ['picked_up', 'on_the_way', 'out_for_delivery', 'near_customer'].some((s) => stage.includes(s));
    const destination = pickedUp ? customer : restaurant;

    const distance_km = Math.round(haversineKm(partnerLocation.lat, partnerLocation.lng, destination.lat, destination.lng) * 100) / 100;
    const eta = estimateEtaMinutes(distance_km, 22, 0);
    const duration_min = eta != null ? eta : null;

    ok(res, 'Route retrieved', {
      restaurant,
      customer,
      partner_location: partnerLocation,
      distance_km,
      duration_min,
      osm_embed_url: osmEmbedUrl([partnerLocation, restaurant, customer]),
      osm_directions_url: `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${partnerLocation.lat}%2C${partnerLocation.lng}%3B${destination.lat}%2C${destination.lng}`,
      google_maps_url: gmapsDirUrl(partnerLocation, customer, pickedUp ? undefined : restaurant),
      google_maps_pickup_url: gmapsDirUrl(partnerLocation, restaurant),
      google_maps_dropoff_url: gmapsDirUrl(partnerLocation, customer),
    });
  } catch (error) {
    log.error('[deliveryController] getRoute error', { error: error.message });
    fail(res, 500, 'Server Error', error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) return fail(res, 401, 'Unauthorized');
    const updated = await deliveryService.getProfile(partnerId);
    ok(res, 'Delivery profile updated', updated);
  } catch (error) {
    log.error('[deliveryController] updateProfile error', { error: error.message });
    fail(res, 500, 'Server Error', error.message);
  }
};

const getMyReviews = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    const { listForPartner } = require('../models/deliveryReviewModel');
    const data = await listForPartner(partner.id, {
      limit: req.query.limit,
      offset: req.query.offset,
    });
    ok(res, 'Delivery reviews', data);
  } catch (error) {
    log.error('[deliveryController] getMyReviews error', { error: error.message });
    fail(res, 500, 'Server Error', error.message);
  }
};

const getWallet = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    const wallet = require('../models/deliveryWalletModel');
    ok(res, 'Wallet retrieved', await wallet.getWalletSummary(partner.id));
  } catch (error) {
    log.error('[deliveryController] getWallet error', { error: error.message });
    fail(res, error.status || 500, error.message, error.message);
  }
};

const requestWithdrawal = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    const wallet = require('../models/deliveryWalletModel');
    const amount = Number(req.body.amount);
    const bankAccountId = req.body.bank_account_id || req.body.bankAccountId || null;
    const data = await wallet.requestWithdrawal(partner.id, amount, bankAccountId);
    ok(res, 'Withdrawal request submitted', data);
  } catch (error) {
    log.error('[deliveryController] requestWithdrawal error', { error: error.message });
    fail(res, error.status || 500, error.message, error.message);
  }
};

const getTransactions = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    const wallet = require('../models/deliveryWalletModel');
    const data = await wallet.listTransactions(partner.id, {
      page: req.query.page,
      limit: req.query.limit,
      type: req.query.type,
      status: req.query.status,
    });
    ok(res, 'Transactions retrieved', data);
  } catch (error) {
    log.error('[deliveryController] getTransactions error', { error: error.message });
    fail(res, error.status || 500, error.message, error.message);
  }
};

/**
 * POST /api/delivery/documents/upload
 * Multipart field "file". Body: document_type, document_number?, expiry_date?
 */
const uploadDocument = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    if (!req.file) return fail(res, 400, 'file is required (multipart field: file)');

    const docs = require('../models/deliveryDocumentModel');
    const documentType = String(req.body.document_type || '').toLowerCase().trim();
    if (!docs.DOCUMENT_TYPES.includes(documentType)) {
      return fail(res, 400, `document_type must be one of: ${docs.DOCUMENT_TYPES.join(', ')}`);
    }

    const expiryDate = req.body.expiry_date || null;
    if (docs.EXPIRY_TRACKED_TYPES.includes(documentType) && !expiryDate) {
      return fail(res, 400, `expiry_date is required for ${documentType}`);
    }

    const purposeByType = {
      aadhaar: 'document',
      pan: 'document',
      driving_license: 'license',
      rc: 'vehicle_rc',
      insurance: 'insurance',
      profile_photo: 'delivery_profile',
    };
    const storage = require('../services/storage');
    const uploaded = await storage.uploadFile(req.file, purposeByType[documentType] || 'document', {
      original_name: req.file.originalname,
      document_type: documentType,
    });

    const record = await docs.upsertDocument({
      partnerId: partner.id,
      documentType,
      documentNumber: req.body.document_number || null,
      fileUrl: uploaded.url,
      expiryDate,
    });

    return ok(res, 'Document uploaded. Pending admin verification.', record);
  } catch (error) {
    log.error('[deliveryController] uploadDocument error', { error: error.message });
    return fail(res, error.status || 500, error.message || 'Failed to upload document.');
  }
};

/**
 * GET /api/delivery/documents
 */
const getDocuments = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    const docs = require('../models/deliveryDocumentModel');
    const summary = await docs.getKycSummaryForPartner(partner.id);
    return ok(res, 'Documents retrieved', summary);
  } catch (error) {
    log.error('[deliveryController] getDocuments error', { error: error.message });
    return fail(res, error.status || 500, error.message || 'Failed to retrieve documents.');
  }
};

const getHistory = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    const status = String(req.query.status || 'all').toLowerCase();
    const data = await deliveryModel.getDeliveryHistory(partner.id, {
      status,
      limit: req.query.limit,
    });
    ok(res, 'Delivery history retrieved', data);
  } catch (error) {
    log.error('[deliveryController] getHistory error', { error: error.message });
    fail(res, 500, 'Server Error', error.message);
  }
};

const notifyCustomerCalling = async (req, res) => {
  try {
    const partner = await requirePartnerLegacy(req, res);
    if (!partner) return;
    const orderId = req.params.id;
    ok(res, 'Customer calling alert recorded', { order_id: orderId });
  } catch (error) {
    log.error('[deliveryController] notifyCustomerCalling error', { error: error.message });
    fail(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  getProfile,
  updateOnlineStatus,

  getMe,
  getDashboard,
  setAvailability,
  setLocation,
  updateLocationDetailed,
  getAvailable,
  getAssigned,
  getOrder,
  accept,
  reject,
  updateStatus,
  getEarnings,
  getNotifications,
  getRoute,
  updateProfile,
  getMyReviews,
  getWallet,
  requestWithdrawal,
  getTransactions,
  uploadDocument,
  getDocuments,
  getHistory,
  notifyCustomerCalling,
  reachedRestaurant,
  pickedUp,
  outForDelivery,
  delivered,
  verifyOrderOtp,
};
