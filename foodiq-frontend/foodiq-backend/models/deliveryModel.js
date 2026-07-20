const { pool } = require('../config/db');
const { createNotification } = require('./notificationModel');

const ASSIGNMENT_EXPIRE_SECONDS = 120;
const BASE_DELIVERY_FEE = 40;
const INCENTIVE_BONUS = 25;

const getPartnerByUserId = async (userId) => {
  const { rows } = await pool.query(
    `SELECT dp.*, u.full_name, u.email, u.phone_number, u.role
     FROM delivery_partners dp
     JOIN users u ON u.id = dp.user_id
     WHERE dp.user_id = $1`,
    [userId]
  );
  return rows[0] || null;
};

const expireStaleAssignments = async () => {
  await pool.query(
    `UPDATE delivery_assignments
     SET status = 'expired', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'offered'
       AND (
         (expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP)
         OR (expires_at IS NULL AND offered_at < CURRENT_TIMESTAMP - make_interval(secs => $1))
       )`,
    [ASSIGNMENT_EXPIRE_SECONDS]
  );
};

const getDashboard = async (partnerId) => {
  await expireStaleAssignments();

  const partner = await pool.query(
    `SELECT * FROM delivery_partners WHERE id = $1`,
    [partnerId]
  );

  const earnings = await pool.query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE earned_at::date = CURRENT_DATE), 0)::float AS today,
       COALESCE(SUM(amount) FILTER (WHERE earned_at >= date_trunc('week', CURRENT_DATE)), 0)::float AS weekly,
       COALESCE(SUM(amount) FILTER (WHERE earned_at >= date_trunc('month', CURRENT_DATE)), 0)::float AS monthly,
       COUNT(*) FILTER (WHERE earned_at::date = CURRENT_DATE)::int AS completed_today
     FROM delivery_earnings
     WHERE delivery_partner_id = $1`,
    [partnerId]
  );

  const completed = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM delivery_assignments
     WHERE delivery_partner_id = $1 AND status = 'delivered'`,
    [partnerId]
  );

  const assigned = await listAssignedOrders(partnerId);
  const available = await listAvailableOrders(partnerId);

  return {
    partner: partner.rows[0],
    is_online: Boolean(partner.rows[0]?.is_available),
    rating: Number(partner.rows[0]?.rating || 0),
    earnings_today: earnings.rows[0].today,
    earnings_weekly: earnings.rows[0].weekly,
    earnings_monthly: earnings.rows[0].monthly,
    completed_today: earnings.rows[0].completed_today,
    completed_total: completed.rows[0].total,
    assigned_orders: assigned,
    available_orders: available,
  };
};

const orderDetailSelect = `
  SELECT
    o.id, o.status AS order_status, o.total_amount, o.delivery_fee, o.delivery_instructions,
    o.created_at, o.user_id, o.restaurant_id,
    r.name AS restaurant_name, r.address AS restaurant_address, r.phone AS restaurant_phone,
    r.image_url AS restaurant_image,
    COALESCE(r.current_lat, 12.9716)::float AS restaurant_lat,
    COALESCE(r.current_lng, 77.5946)::float AS restaurant_lng,
    u.full_name AS customer_name, u.phone_number AS customer_phone,
    a.street, a.house_no, a.city, a.state, a.zip_code, a.landmark,
    COALESCE(a.lat, 12.9784)::float AS customer_lat,
    COALESCE(a.lng, 77.6408)::float AS customer_lng,
    da.id AS assignment_id, da.status AS assignment_status, da.offered_at, da.responded_at,
    da.expires_at, da.delivery_partner_id
  FROM orders o
  JOIN restaurants r ON r.id = o.restaurant_id
  JOIN users u ON u.id = o.user_id
  LEFT JOIN addresses a ON a.id = o.delivery_address_id
  LEFT JOIN LATERAL (
    SELECT * FROM delivery_assignments dax
    WHERE dax.order_id = o.id
    ORDER BY dax.created_at DESC
    LIMIT 1
  ) da ON TRUE
`;

const formatOrder = (row) => ({
  id: row.id,
  order_status: row.order_status,
  assignment_id: row.assignment_id,
  assignment_status: row.assignment_status,
  offered_at: row.offered_at,
  expires_at: row.expires_at,
  total_amount: Number(row.total_amount),
  delivery_fee: Number(row.delivery_fee || BASE_DELIVERY_FEE),
  delivery_instructions: row.delivery_instructions,
  created_at: row.created_at,
  restaurant: {
    id: row.restaurant_id,
    name: row.restaurant_name,
    address: row.restaurant_address,
    phone: row.restaurant_phone,
    image: row.restaurant_image,
    lat: Number(row.restaurant_lat),
    lng: Number(row.restaurant_lng),
  },
  customer: {
    name: row.customer_name,
    phone: row.customer_phone,
    address: [row.house_no, row.street, row.landmark, row.city, row.state, row.zip_code]
      .filter(Boolean)
      .join(', '),
    lat: Number(row.customer_lat),
    lng: Number(row.customer_lng),
  },
});

const listAvailableOrders = async (partnerId) => {
  await expireStaleAssignments();
  const { rows } = await pool.query(
    `${orderDetailSelect}
     WHERE LOWER(o.status) IN ('ready for pickup', 'accepted', 'preparing')
       AND (
         (da.id IS NULL)
         OR (da.delivery_partner_id = $1 AND da.status = 'offered')
       )
       AND NOT EXISTS (
         SELECT 1 FROM delivery_assignments x
         WHERE x.order_id = o.id
           AND x.status IN ('accepted', 'reached_restaurant', 'picked_up', 'on_the_way', 'delivered', 'assigned')
       )
     ORDER BY o.created_at ASC
     LIMIT 50`,
    [partnerId]
  );
  return rows.map(formatOrder);
};

const listAssignedOrders = async (partnerId) => {
  await expireStaleAssignments();
  const { rows } = await pool.query(
    `${orderDetailSelect}
     WHERE da.delivery_partner_id = $1
       AND da.status IN ('offered', 'accepted', 'reached_restaurant', 'picked_up', 'on_the_way', 'assigned')
     ORDER BY da.updated_at DESC`,
    [partnerId]
  );
  return rows.map(formatOrder);
};

const getOrderForPartner = async (orderId, partnerId) => {
  const { rows } = await pool.query(
    `${orderDetailSelect}
     WHERE o.id = $1
       AND (da.delivery_partner_id = $2 OR da.id IS NULL OR da.status IN ('rejected', 'expired'))`,
    [orderId, partnerId]
  );
  if (!rows[0]) return null;
  const items = await pool.query(
    `SELECT oi.quantity, oi.price_at_time, m.name
     FROM order_items oi JOIN menu_items m ON m.id = oi.menu_item_id
     WHERE oi.order_id = $1`,
    [orderId]
  );
  return { ...formatOrder(rows[0]), items: items.rows };
};

const createAssignmentOffer = async (orderId, partnerId) => {
  await expireStaleAssignments();
  const active = await pool.query(
    `SELECT id FROM delivery_assignments
     WHERE order_id = $1 AND status IN ('offered', 'accepted', 'reached_restaurant', 'picked_up', 'on_the_way', 'assigned')`,
    [orderId]
  );
  if (active.rows[0]) return null;

  const expires = new Date(Date.now() + ASSIGNMENT_EXPIRE_SECONDS * 1000);
  const { rows } = await pool.query(
    `INSERT INTO delivery_assignments (
       order_id, delivery_partner_id, status, offered_at, expires_at
     ) VALUES ($1, $2, 'offered', CURRENT_TIMESTAMP, $3) RETURNING *`,
    [orderId, partnerId, expires]
  );

  if (rows[0]) {
    await pool.query(
      `INSERT INTO delivery_status_history (assignment_id, order_id, delivery_partner_id, status, note)
       VALUES ($1, $2, $3, 'offered', 'Order offered to delivery partner')`,
      [rows[0].id, orderId, partnerId]
    );
    const partner = await pool.query('SELECT user_id FROM delivery_partners WHERE id = $1', [partnerId]);
    if (partner.rows[0]) {
      await createNotification(
        partner.rows[0].user_id,
        'new_delivery_request',
        'New Delivery Request',
        `You have a new delivery request for order #${String(orderId).slice(0, 8)}. Respond within 2 minutes.`,
        { order_id: orderId, link: '/delivery/orders' }
      );
    }
  }
  return rows[0] || null;
};

const acceptOrder = async (orderId, partnerId) => {
  await expireStaleAssignments();
  let assignment = await pool.query(
    `SELECT * FROM delivery_assignments
     WHERE order_id = $1 AND delivery_partner_id = $2 AND status = 'offered'`,
    [orderId, partnerId]
  );

  if (!assignment.rows[0]) {
    // Claim available order
    const offered = await createAssignmentOffer(orderId, partnerId);
    if (!offered) {
      throw Object.assign(new Error('Order no longer available'), { status: 409 });
    }
    assignment = { rows: [offered] };
  }

  const { rows } = await pool.query(
    `UPDATE delivery_assignments
     SET status = 'accepted', responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status = 'offered'
     RETURNING *`,
    [assignment.rows[0].id]
  );
  if (!rows[0]) throw Object.assign(new Error('Assignment expired or already handled'), { status: 409 });

  await pool.query(
    `INSERT INTO order_tracking (order_id, delivery_partner_id, current_status, estimated_delivery_time)
     VALUES ($1, $2, 'Assigned', CURRENT_TIMESTAMP + INTERVAL '30 minutes')
     ON CONFLICT (order_id) DO UPDATE SET
       delivery_partner_id = EXCLUDED.delivery_partner_id,
       current_status = 'Assigned',
       updated_at = CURRENT_TIMESTAMP`,
    [orderId, partnerId]
  );

  await recordHistory(rows[0].id, orderId, partnerId, 'accepted', 'Partner accepted delivery');
  try {
    const { recordOrderTrackingHistory } = require('../services/trackingService');
    await recordOrderTrackingHistory({
      orderId,
      status: 'Delivery Partner Assigned',
      note: 'Delivery partner accepted the order',
      actorType: 'driver',
      actorId: partnerId,
    });
  } catch {
    /* non-blocking */
  }
  await notifyStakeholders(orderId, 'Delivery partner assigned', 'A delivery partner has accepted your order.');

  return getOrderForPartner(orderId, partnerId);
};

const rejectOrder = async (orderId, partnerId) => {
  await expireStaleAssignments();
  const { rows } = await pool.query(
    `UPDATE delivery_assignments
     SET status = 'rejected', responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE order_id = $1 AND delivery_partner_id = $2 AND status = 'offered'
     RETURNING *`,
    [orderId, partnerId]
  );
  if (!rows[0]) throw Object.assign(new Error('No pending offer to reject'), { status: 404 });
  await recordHistory(rows[0].id, orderId, partnerId, 'rejected', 'Partner rejected delivery');
  return { rejected: true };
};

const STATUS_FLOW = [
  'assigned',
  'accepted',
  'reached_restaurant',
  'picked_up',
  'on_the_way',
  'delivered',
];

const mapToOrderStatus = (status) => {
  if (status === 'picked_up') return 'Picked Up';
  if (status === 'on_the_way') return 'On The Way';
  if (status === 'delivered') return 'Delivered';
  if (status === 'reached_restaurant') return 'Ready for Pickup';
  return null;
};

const mapToTrackingStatus = (status) => {
  const map = {
    assigned: 'Assigned',
    accepted: 'Accepted',
    reached_restaurant: 'Reached Restaurant',
    picked_up: 'Picked Up',
    on_the_way: 'On The Way',
    delivered: 'Delivered',
  };
  return map[status] || status;
};

const updateDeliveryStatus = async (orderId, partnerId, status) => {
  if (!STATUS_FLOW.includes(status)) {
    throw Object.assign(new Error('Invalid delivery status'), { status: 400 });
  }

  const { rows: assignments } = await pool.query(
    `SELECT * FROM delivery_assignments
     WHERE order_id = $1 AND delivery_partner_id = $2
       AND status IN ('accepted', 'assigned', 'reached_restaurant', 'picked_up', 'on_the_way')`,
    [orderId, partnerId]
  );
  if (!assignments[0] && status === 'accepted') {
    const accepted = await acceptOrder(orderId, partnerId);
    try {
      const { emitOrderStatus } = require('../socket/emitters');
      const partnerUser = await pool.query(
        'SELECT user_id FROM delivery_partners WHERE id = $1',
        [partnerId]
      );
      const orderRow = await pool.query(
        'SELECT user_id, restaurant_id, total_amount, status FROM orders WHERE id = $1',
        [orderId]
      );
      emitOrderStatus(
        {
          id: orderId,
          status: orderRow.rows[0]?.status || 'Ready for Pickup',
          user_id: orderRow.rows[0]?.user_id,
          restaurant_id: orderRow.rows[0]?.restaurant_id,
          total_amount: orderRow.rows[0]?.total_amount,
        },
        {
          source: 'delivery',
          delivery_status: 'accepted',
          delivery_partner_id: partnerId,
          delivery_partner_user_id: partnerUser.rows[0]?.user_id,
        }
      );
    } catch (socketErr) {
      console.warn('[delivery] accept socket emit skipped:', socketErr.message);
    }
    return accepted;
  }
  if (!assignments[0]) {
    throw Object.assign(new Error('No active assignment for this order'), { status: 404 });
  }

  const { rows } = await pool.query(
    `UPDATE delivery_assignments
     SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [status, assignments[0].id]
  );

  const trackingStatus = mapToTrackingStatus(status);
  await pool.query(
    `INSERT INTO order_tracking (order_id, delivery_partner_id, current_status, estimated_delivery_time)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '25 minutes')
     ON CONFLICT (order_id) DO UPDATE SET
       delivery_partner_id = EXCLUDED.delivery_partner_id,
       current_status = EXCLUDED.current_status,
       updated_at = CURRENT_TIMESTAMP`,
    [orderId, partnerId, trackingStatus]
  );

  const orderStatus = mapToOrderStatus(status);
  if (orderStatus) {
    await pool.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [orderStatus, orderId]
    );
  }

  await recordHistory(rows[0].id, orderId, partnerId, status, `Status updated to ${trackingStatus}`);
  await notifyStakeholders(
    orderId,
    'Order Update',
    `Your order is now: ${trackingStatus}.`
  );

  // Notify restaurant owner
  const rest = await pool.query(
    `SELECT r.owner_id FROM orders o JOIN restaurants r ON r.id = o.restaurant_id WHERE o.id = $1`,
    [orderId]
  );
  if (rest.rows[0]?.owner_id) {
    await createNotification(
      rest.rows[0].owner_id,
      'order',
      'Delivery Update',
      `Order #${String(orderId).slice(0, 8)} is now ${trackingStatus}.`,
      { order_id: orderId, status }
    );
  }

  if (status === 'delivered') {
    await settleEarnings(orderId, partnerId, rows[0].id);
    await pool.query(
      `UPDATE delivery_partners SET is_available = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [partnerId]
    );
  }

  const result = await getOrderForPartner(orderId, partnerId);

  try {
    const { emitOrderStatus } = require('../socket/emitters');
    const orderStatus = mapToOrderStatus(status) || mapToTrackingStatus(status);
    const partnerUser = await pool.query(
      'SELECT user_id FROM delivery_partners WHERE id = $1',
      [partnerId]
    );
    const orderRow = await pool.query(
      'SELECT user_id, restaurant_id, total_amount FROM orders WHERE id = $1',
      [orderId]
    );
    emitOrderStatus(
      {
        id: orderId,
        status: orderStatus,
        user_id: orderRow.rows[0]?.user_id,
        restaurant_id: orderRow.rows[0]?.restaurant_id,
        total_amount: orderRow.rows[0]?.total_amount,
      },
      {
        source: 'delivery',
        delivery_status: status,
        delivery_partner_id: partnerId,
        delivery_partner_user_id: partnerUser.rows[0]?.user_id,
      }
    );
  } catch (socketErr) {
    console.warn('[delivery] socket emit skipped:', socketErr.message);
  }

  return result;
};

const settleEarnings = async (orderId, partnerId, assignmentId) => {
  const order = await pool.query('SELECT delivery_fee, total_amount FROM orders WHERE id = $1', [orderId]);
  const fee = Number(order.rows[0]?.delivery_fee || BASE_DELIVERY_FEE);
  const todayCount = await pool.query(
    `SELECT COUNT(*)::int AS c FROM delivery_earnings
     WHERE delivery_partner_id = $1 AND earned_at::date = CURRENT_DATE`,
    [partnerId]
  );
  const incentive = todayCount.rows[0].c >= 4 ? INCENTIVE_BONUS : 0;
  const amount = fee + incentive;

  await pool.query(
    `INSERT INTO delivery_earnings (
       delivery_partner_id, order_id, assignment_id, amount, base_fee, incentive, note
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (order_id, delivery_partner_id) DO NOTHING`,
    [
      partnerId,
      orderId,
      assignmentId,
      amount,
      fee,
      incentive,
      incentive ? 'Delivery fee + daily incentive bonus' : 'Delivery fee',
    ]
  );

  const partner = await pool.query('SELECT user_id FROM delivery_partners WHERE id = $1', [partnerId]);
  if (partner.rows[0]) {
    await createNotification(
      partner.rows[0].user_id,
      'payment',
      'Payment Received',
      `You earned ₹${amount} for completing a delivery${incentive ? ' (includes incentive)' : ''}.`,
      { order_id: orderId, amount }
    );
  }
};

const recordHistory = async (assignmentId, orderId, partnerId, status, note) => {
  await pool.query(
    `INSERT INTO delivery_status_history (assignment_id, order_id, delivery_partner_id, status, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [assignmentId, orderId, partnerId, status, note]
  );
};

const notifyStakeholders = async (orderId, title, message) => {
  const { rows } = await pool.query('SELECT user_id FROM orders WHERE id = $1', [orderId]);
  if (rows[0]) {
    await createNotification(rows[0].user_id, 'order', title, message, { order_id: orderId });
  }
};

const getEarnings = async (partnerId) => {
  const summary = await pool.query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE earned_at::date = CURRENT_DATE), 0)::float AS daily,
       COALESCE(SUM(amount) FILTER (WHERE earned_at >= date_trunc('week', CURRENT_DATE)), 0)::float AS weekly,
       COALESCE(SUM(amount) FILTER (WHERE earned_at >= date_trunc('month', CURRENT_DATE)), 0)::float AS monthly,
       COALESCE(SUM(incentive) FILTER (WHERE earned_at >= date_trunc('month', CURRENT_DATE)), 0)::float AS incentives_month
     FROM delivery_earnings WHERE delivery_partner_id = $1`,
    [partnerId]
  );

  const history = await pool.query(
    `SELECT e.*, o.total_amount, r.name AS restaurant_name
     FROM delivery_earnings e
     JOIN orders o ON o.id = e.order_id
     JOIN restaurants r ON r.id = o.restaurant_id
     WHERE e.delivery_partner_id = $1
     ORDER BY e.earned_at DESC
     LIMIT 50`,
    [partnerId]
  );

  return { summary: summary.rows[0], history: history.rows };
};

const updateAvailability = async (partnerId, isAvailable) => {
  const { rows } = await pool.query(
    `UPDATE delivery_partners
     SET is_available = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 RETURNING *`,
    [isAvailable, partnerId]
  );
  return rows[0];
};

const updateLocation = async (partnerId, lat, lng, orderId = null) => {
  const { rows } = await pool.query(
    `UPDATE delivery_partners
     SET current_lat = $1, current_lng = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 RETURNING *`,
    [lat, lng, partnerId]
  );
  try {
    const { recordDriverLocation } = require('../services/trackingService');
    await recordDriverLocation({ driverId: partnerId, lat, lng, orderId });
  } catch {
    /* non-blocking */
  }
  return rows[0];
};

const registerPartner = async ({ userId, vehicle_details, vehicle_type, license_number }) => {
  await pool.query(`UPDATE users SET role = 'delivery_partner' WHERE id = $1`, [userId]);
  const { rows } = await pool.query(
    `INSERT INTO delivery_partners (
       user_id, vehicle_details, vehicle_type, license_number, is_available, approval_status
     ) VALUES ($1, $2, $3, $4, FALSE, 'approved')
     ON CONFLICT (user_id) DO UPDATE SET
       vehicle_details = EXCLUDED.vehicle_details,
       vehicle_type = EXCLUDED.vehicle_type,
       license_number = EXCLUDED.license_number
     RETURNING *`,
    [userId, vehicle_details || '', vehicle_type || 'Bike', license_number || '']
  );
  return rows[0];
};

const updatePartnerDocuments = async (userId, data = {}) => {
  const {
    profile_photo_url,
    vehicle_photo_url,
    license_photo_url,
    vehicle_rc_url,
    insurance_doc_url,
    vehicle_details,
    vehicle_type,
    license_number,
  } = data;
  const { rows } = await pool.query(
    `UPDATE delivery_partners SET
       profile_photo_url = COALESCE($1, profile_photo_url),
       vehicle_photo_url = COALESCE($2, vehicle_photo_url),
       license_photo_url = COALESCE($3, license_photo_url),
       vehicle_rc_url = COALESCE($4, vehicle_rc_url),
       insurance_doc_url = COALESCE($5, insurance_doc_url),
       vehicle_details = COALESCE($6, vehicle_details),
       vehicle_type = COALESCE($7, vehicle_type),
       license_number = COALESCE($8, license_number),
       updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $9
     RETURNING *`,
    [
      profile_photo_url || null,
      vehicle_photo_url || null,
      license_photo_url || null,
      vehicle_rc_url || null,
      insurance_doc_url || null,
      vehicle_details || null,
      vehicle_type || null,
      license_number || null,
      userId,
    ]
  );
  return rows[0] || null;
};

module.exports = {
  getPartnerByUserId,
  getDashboard,
  listAvailableOrders,
  listAssignedOrders,
  getOrderForPartner,
  createAssignmentOffer,
  acceptOrder,
  rejectOrder,
  updateDeliveryStatus,
  getEarnings,
  updateAvailability,
  updateLocation,
  registerPartner,
  updatePartnerDocuments,
  expireStaleAssignments,
  ASSIGNMENT_EXPIRE_SECONDS,
};
