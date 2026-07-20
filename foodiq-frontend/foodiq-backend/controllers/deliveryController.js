const bcrypt = require('bcrypt');
const {
  createUser,
  findUserByEmail,
} = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const { normalizeEmail } = require('../utils/normalizeEmail');
const {
  isValidEmail,
  isValidPassword,
  isValidPhone,
} = require('../utils/validation');
const delivery = require('../models/deliveryModel');
const { getNotificationsByUserId } = require('../models/notificationModel');
const { pool } = require('../config/db');

const ok = (res, message, data) => res.json({ success: true, message, data });
const fail = (res, status, message, error = {}) =>
  res.status(status).json({ success: false, message, error });

const requirePartner = async (req, res) => {
  const partner = await delivery.getPartnerByUserId(req.user.id);
  if (!partner) {
    fail(res, 404, 'Delivery partner profile not found. Please register first.');
    return null;
  }
  if (partner.approval_status === 'rejected') {
    fail(res, 403, 'Your delivery partner account was rejected.');
    return null;
  }
  if (partner.approval_status === 'suspended') {
    fail(res, 403, 'Your delivery partner account has been suspended.');
    return null;
  }
  if (partner.approval_status === 'pending') {
    fail(res, 403, 'Your account is pending approval.');
    return null;
  }
  return partner;
};

const register = async (req, res) => {
  try {
    const full_name = String(req.body.full_name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const phone = String(req.body.phone || req.body.phone_number || '').trim();
    const { vehicle_details, vehicle_type, license_number } = req.body;

    if (!full_name || !email || !password || !phone) {
      return fail(res, 400, 'Please include full_name, email, password, and phone');
    }
    if (!isValidEmail(email)) return fail(res, 400, 'Invalid email format');
    if (!isValidPassword(password)) return fail(res, 400, 'Password must be at least 8 characters');
    if (!isValidPhone(phone)) return fail(res, 400, 'Invalid phone number');

    if (await findUserByEmail(email)) {
      return fail(res, 400, 'User already exists with this email');
    }

    const password_hash = await bcrypt.hash(
      password,
      Number(process.env.BCRYPT_ROUNDS || 12)
    );
    const user = await createUser({
      full_name,
      email,
      password_hash,
      phone_number: phone,
    });

    await pool.query(
      `UPDATE users SET role = 'delivery_partner' WHERE id = $1`,
      [user.id]
    );
    await pool.query(
      'INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
      [user.id]
    );

    const partner = await delivery.registerPartner({
      userId: user.id,
      vehicle_details,
      vehicle_type,
      license_number,
    });

    const token = generateToken(user.id);
    ok(res, 'Delivery partner registered', {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone_number: phone,
      role: 'delivery_partner',
      token,
      partner,
      verification_status: partner.approval_status || 'pending',
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getMe = async (req, res) => {
  try {
    const partner = await delivery.getPartnerByUserId(req.user.id);
    if (!partner) {
      return fail(res, 404, 'Delivery partner profile not found. Please register first.');
    }
    ok(res, 'Delivery partner profile', {
      user: {
        id: req.user.id,
        full_name: req.user.full_name,
        email: req.user.email,
        role: req.user.role,
      },
      partner,
      verification_status: partner.approval_status || 'approved',
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getDashboard = async (req, res) => {
  try {
    const partner = await requirePartner(req, res);
    if (!partner) return;
    const data = await delivery.getDashboard(partner.id);
    ok(res, 'Dashboard retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const setAvailability = async (req, res) => {
  try {
    const partner = await requirePartner(req, res);
    if (!partner) return;
    const is_available = Boolean(req.body.is_available ?? req.body.online);
    const data = await delivery.updateAvailability(partner.id, is_available);
    ok(res, is_available ? 'You are online' : 'You are offline', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const setLocation = async (req, res) => {
  try {
    const partner = await requirePartner(req, res);
    if (!partner) return;
    const lat = Number(req.body.lat ?? req.body.current_lat);
    const lng = Number(req.body.lng ?? req.body.current_lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return fail(res, 400, 'lat and lng are required');
    }

    // Sync active delivery order_tracking + broadcast live location
    let distance_km = null;
    let eta_minutes = null;
    let activeOrderId = null;
    try {
      const { pool } = require('../config/db');
      const { emitLocationUpdated } = require('../socket/emitters');
      const { haversineKm, estimateEtaMinutes } = require('../socket');

      const active = await pool.query(
        `SELECT da.order_id, o.user_id, o.restaurant_id, a.lat AS cust_lat, a.lng AS cust_lng
         FROM delivery_assignments da
         JOIN orders o ON o.id = da.order_id
         LEFT JOIN addresses a ON a.id = o.delivery_address_id
         WHERE da.delivery_partner_id = $1
           AND da.status IN ('accepted', 'assigned', 'reached_restaurant', 'picked_up', 'on_the_way', 'near_customer')
         ORDER BY da.updated_at DESC
         LIMIT 1`,
        [partner.id]
      );

      const job = active.rows[0];
      if (job) {
        activeOrderId = job.order_id;
        await pool.query(
          `UPDATE order_tracking
           SET location_lat = $1, location_lng = $2,
               delivery_partner_id = $3, updated_at = CURRENT_TIMESTAMP
           WHERE order_id = $4`,
          [lat, lng, partner.id, job.order_id]
        );
        if (job.cust_lat != null) {
          distance_km =
            Math.round(haversineKm(lat, lng, Number(job.cust_lat), Number(job.cust_lng)) * 100) / 100;
          eta_minutes = estimateEtaMinutes(distance_km);
        }
        emitLocationUpdated({
          order_id: job.order_id,
          user_id: job.user_id,
          restaurant_id: job.restaurant_id,
          delivery_partner_id: partner.id,
          lat,
          lng,
          eta_minutes,
          distance_km,
        });

        if (job.user_id && distance_km != null) {
          try {
            const { createNotification } = require('../models/notificationModel');
            const types = require('../services/notificationTypes');
            if (distance_km <= 0.5) {
              await createNotification(
                job.user_id,
                types.ARRIVING_SOON,
                'Arriving Soon',
                'Your delivery partner is almost at your doorstep.',
                {
                  order_id: job.order_id,
                  link: `/track-order/${job.order_id}`,
                  dedupe_key: `arriving:${job.order_id}`,
                }
              );
            } else if (distance_km <= 2) {
              await createNotification(
                job.user_id,
                types.NEAR_YOU,
                'Driver Near You',
                'Your order is nearby and will arrive shortly.',
                {
                  order_id: job.order_id,
                  link: `/track-order/${job.order_id}`,
                  dedupe_key: `near:${job.order_id}`,
                }
              );
            }
          } catch {
            /* non-blocking */
          }
        }
      } else {
        emitLocationUpdated({
          delivery_partner_id: partner.id,
          lat,
          lng,
        });
      }
    } catch (socketErr) {
      console.warn('[delivery] location emit skipped:', socketErr.message);
    }

    const data = await delivery.updateLocation(partner.id, lat, lng, activeOrderId);
    ok(res, 'Location updated', { ...data, distance_km, eta_minutes });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getAvailable = async (req, res) => {
  try {
    const partner = await requirePartner(req, res);
    if (!partner) return;
    ok(res, 'Available orders', await delivery.listAvailableOrders(partner.id));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getAssigned = async (req, res) => {
  try {
    const partner = await requirePartner(req, res);
    if (!partner) return;
    ok(res, 'Assigned orders', await delivery.listAssignedOrders(partner.id));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getOrder = async (req, res) => {
  try {
    const partner = await requirePartner(req, res);
    if (!partner) return;
    const data = await delivery.getOrderForPartner(req.params.id, partner.id);
    if (!data) return fail(res, 404, 'Order not found');
    ok(res, 'Order details', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const accept = async (req, res) => {
  try {
    const partner = await requirePartner(req, res);
    if (!partner) return;
    if (!partner.is_available) {
      return fail(res, 400, 'Go online before accepting orders');
    }
    const data = await delivery.acceptOrder(req.params.id, partner.id);

    try {
      const { pool } = require('../config/db');
      const { emitOrderStatus } = require('../socket/emitters');
      const orderRow = await pool.query(
        'SELECT user_id, restaurant_id, total_amount, status FROM orders WHERE id = $1',
        [req.params.id]
      );
      emitOrderStatus(
        {
          id: req.params.id,
          status: orderRow.rows[0]?.status || 'Ready for Pickup',
          user_id: orderRow.rows[0]?.user_id,
          restaurant_id: orderRow.rows[0]?.restaurant_id,
          total_amount: orderRow.rows[0]?.total_amount,
        },
        {
          source: 'delivery',
          delivery_status: 'accepted',
          delivery_partner_id: partner.id,
          delivery_partner_user_id: req.user.id,
        }
      );
    } catch (socketErr) {
      console.warn('[delivery] accept emit skipped:', socketErr.message);
    }

    ok(res, 'Order accepted', data);
  } catch (error) {
    fail(res, error.status || 500, error.message, error.message);
  }
};

const reject = async (req, res) => {
  try {
    const partner = await requirePartner(req, res);
    if (!partner) return;
    const data = await delivery.rejectOrder(req.params.id, partner.id);
    ok(res, 'Order rejected', data);
  } catch (error) {
    fail(res, error.status || 500, error.message, error.message);
  }
};

const updateStatus = async (req, res) => {
  try {
    const partner = await requirePartner(req, res);
    if (!partner) return;
    const status = String(req.body.status || '').toLowerCase().replace(/\s+/g, '_');
    const data = await delivery.updateDeliveryStatus(req.params.id, partner.id, status);
    ok(res, 'Status updated', data);
  } catch (error) {
    fail(res, error.status || 500, error.message, error.message);
  }
};

const getEarnings = async (req, res) => {
  try {
    const partner = await requirePartner(req, res);
    if (!partner) return;
    ok(res, 'Earnings retrieved', await delivery.getEarnings(partner.id));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getNotifications = async (req, res) => {
  try {
    ok(res, 'Notifications retrieved', await getNotificationsByUserId(req.user.id));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getRoute = async (req, res) => {
  try {
    const partner = await requirePartner(req, res);
    if (!partner) return;
    const order = await delivery.getOrderForPartner(req.params.id, partner.id);
    if (!order) return fail(res, 404, 'Order not found');

    const fromLat = order.restaurant.lat;
    const fromLng = order.restaurant.lng;
    const toLat = order.customer.lat;
    const toLng = order.customer.lng;

    let distance_km = null;
    let duration_min = null;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
      const resp = await fetch(url);
      const json = await resp.json();
      if (json.routes?.[0]) {
        distance_km = Math.round((json.routes[0].distance / 1000) * 10) / 10;
        duration_min = Math.round(json.routes[0].duration / 60);
      }
    } catch {
      // Haversine fallback
      const R = 6371;
      const dLat = ((toLat - fromLat) * Math.PI) / 180;
      const dLon = ((toLng - fromLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((fromLat * Math.PI) / 180) *
          Math.cos((toLat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      distance_km = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
      duration_min = Math.round((distance_km / 25) * 60);
    }

    ok(res, 'Route retrieved', {
      restaurant: order.restaurant,
      customer: order.customer,
      partner_location: {
        lat: Number(partner.current_lat) || fromLat,
        lng: Number(partner.current_lng) || fromLng,
      },
      distance_km,
      duration_min,
      osm_embed_url: `https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(fromLng, toLng) - 0.02}%2C${Math.min(fromLat, toLat) - 0.02}%2C${Math.max(fromLng, toLng) + 0.02}%2C${Math.max(fromLat, toLat) + 0.02}&layer=mapnik&marker=${fromLat}%2C${fromLng}`,
      osm_directions_url: `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${fromLat}%2C${fromLng}%3B${toLat}%2C${toLng}`,
      google_maps_url: `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=driving`,
      google_maps_pickup_url: `https://www.google.com/maps/dir/?api=1&destination=${fromLat},${fromLng}&travelmode=driving`,
      google_maps_dropoff_url: `https://www.google.com/maps/dir/?api=1&destination=${toLat},${toLng}&travelmode=driving`,
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    const partner = await requirePartner(req, res);
    if (!partner) return;
    const updated = await delivery.updatePartnerDocuments(req.user.id, req.body);
    if (req.body.full_name || req.body.phone_number || req.body.profile_image_url) {
      await pool.query(
        `UPDATE users SET
           full_name = COALESCE($1, full_name),
           phone_number = COALESCE($2, phone_number),
           profile_image_url = COALESCE($3, profile_image_url),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [
          req.body.full_name || null,
          req.body.phone_number || null,
          req.body.profile_image_url || req.body.profile_photo_url || null,
          req.user.id,
        ]
      );
    }
    ok(res, 'Delivery profile updated', updated);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getMyReviews = async (req, res) => {
  try {
    const partner = await requirePartner(req, res);
    if (!partner) return;
    const { listForPartner } = require('../models/deliveryReviewModel');
    const data = await listForPartner(partner.id, {
      limit: req.query.limit,
      offset: req.query.offset,
    });
    ok(res, 'Delivery reviews', {
      rating: partner.rating ?? data.avg_rating,
      avg_rating: data.avg_rating,
      reviews: data.rows,
      total: data.total,
      limit: data.limit,
      offset: data.offset,
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getWallet = async (req, res) => {
  try {
    const partner = await requirePartner(req, res);
    if (!partner) return;
    const wallet = require('../models/deliveryWalletModel');
    ok(res, 'Wallet retrieved', await wallet.getWalletSummary(partner.id));
  } catch (error) {
    fail(res, error.status || 500, error.message, error.message);
  }
};

const requestWithdrawal = async (req, res) => {
  try {
    const partner = await requirePartner(req, res);
    if (!partner) return;
    const wallet = require('../models/deliveryWalletModel');
    const amount = Number(req.body.amount);
    const note = String(req.body.note || '').trim();
    const data = await wallet.requestWithdrawal(partner.id, amount, note);
    ok(res, 'Withdrawal request submitted', data);
  } catch (error) {
    fail(res, error.status || 500, error.message, error.message);
  }
};

const getHistory = async (req, res) => {
  try {
    const partner = await requirePartner(req, res);
    if (!partner) return;
    const status = String(req.query.status || 'all').toLowerCase();
    const data = await delivery.getDeliveryHistory(partner.id, {
      status,
      limit: req.query.limit,
    });
    ok(res, 'Delivery history retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  register,
  getMe,
  getDashboard,
  setAvailability,
  setLocation,
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
  getHistory,
};
  updateProfile,
  getRoute,
  getMyReviews,
};
