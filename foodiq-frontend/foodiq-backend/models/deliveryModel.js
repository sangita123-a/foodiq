const { pool } = require('../config/db');
const { createNotification } = require('./notificationModel');

const ASSIGNMENT_EXPIRE_SECONDS = 120;
const BASE_DELIVERY_FEE = 40;
const INCENTIVE_BONUS = 25;

const getPartnerByUserId = async (userId) => {
  const { rows } = await pool.query(
    `SELECT dp.*,
            COALESCE(dp.full_name, u.full_name) AS full_name,
            COALESCE(dp.email, u.email) AS email,
            COALESCE(dp.phone_number, u.phone_number) AS phone_number,
            COALESCE(dp.status, dp.approval_status, 'pending') AS status,
            COALESCE(dp.approval_status, dp.status, 'approved') AS approval_status,
            COALESCE(dp.is_online, dp.is_available, FALSE) AS is_online,
            COALESCE(dp.is_available, dp.is_online, FALSE) AS is_available,
            u.role
     FROM delivery_partners dp
     LEFT JOIN users u ON u.id = dp.user_id
     WHERE dp.user_id = $1 OR dp.id = $1`,
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

  const pending = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM delivery_assignments
     WHERE delivery_partner_id = $1
       AND status IN ('offered', 'accepted', 'assigned', 'reached_restaurant', 'picked_up', 'on_the_way', 'near_customer')`,
    [partnerId]
  );

  const cancelled = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM delivery_assignments
     WHERE delivery_partner_id = $1 AND status IN ('rejected', 'expired', 'cancelled')`,
    [partnerId]
  );

  const totalEarnings = await pool.query(
    `SELECT COALESCE(SUM(amount), 0)::float AS total FROM delivery_earnings WHERE delivery_partner_id = $1`,
    [partnerId]
  );

  let walletBalance = 0;
  try {
    const { getOrCreateWallet } = require('./deliveryWalletModel');
    const wallet = await getOrCreateWallet(partnerId);
    walletBalance = Number(wallet.available_balance || 0);
  } catch {
    walletBalance = 0;
  }

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
    pending_deliveries: pending.rows[0].total,
    cancelled_total: cancelled.rows[0].total,
    total_earnings: totalEarnings.rows[0].total,
    wallet_balance: walletBalance,
    assigned_orders: assigned,
    available_orders: available,
  };
};

const orderDetailSelect = `
  SELECT
    o.id,
    o.id AS order_id,
    o.status AS order_status,
    COALESCE(o.payment_status, p.status, 'paid') AS payment_status,
    o.total_amount,
    o.delivery_fee,
    o.delivery_instructions,
    o.created_at,
    o.user_id,
    o.restaurant_id,
    o.delivery_partner_id,
    o.assigned_at,
    r.name AS restaurant_name,
    r.address AS restaurant_address,
    r.phone AS restaurant_phone,
    r.image_url AS restaurant_image,
    COALESCE(r.current_lat, 17.3850)::float AS restaurant_lat,
    COALESCE(r.current_lng, 78.4867)::float AS restaurant_lng,
    COALESCE(r.estimated_delivery_time, 30) AS est_prep_min,
    u.full_name AS customer_name,
    u.phone_number AS customer_phone,
    a.street, a.house_no, a.city, a.state, a.zip_code, a.landmark,
    COALESCE(a.lat, 17.4401)::float AS customer_lat,
    COALESCE(a.lng, 78.3489)::float AS customer_lng,
    COALESCE((SELECT SUM(quantity)::int FROM order_items oi WHERE oi.order_id = o.id), 1) AS item_count,
    da.id AS assignment_id,
    da.status AS assignment_status,
    da.offered_at,
    da.responded_at,
    da.expires_at,
    da.delivery_partner_id AS assignment_partner_id
  FROM orders o
  JOIN restaurants r ON r.id = o.restaurant_id
  JOIN users u ON u.id = o.user_id
  LEFT JOIN addresses a ON a.id = o.delivery_address_id
  LEFT JOIN payments p ON p.order_id = o.id
  LEFT JOIN LATERAL (
    SELECT * FROM delivery_assignments dax
    WHERE dax.order_id = o.id
    ORDER BY dax.created_at DESC
    LIMIT 1
  ) da ON TRUE
`;

const formatOrder = (row) => {
  const customerAddress = [row.house_no, row.street, row.landmark, row.city, row.state, row.zip_code]
    .filter(Boolean)
    .join(', ') || 'Address details provided upon order acceptance';

  const totalAmt = Number(row.total_amount || 0);
  const deliveryFee = Number(row.delivery_fee || BASE_DELIVERY_FEE);
  const estimatedEarnings = deliveryFee + 25;
  const itemCount = Number(row.item_count || 1);

  const restaurantObj = {
    id: row.restaurant_id,
    name: row.restaurant_name,
    address: row.restaurant_address || 'Address provided upon acceptance',
    phone: row.restaurant_phone,
    image: row.restaurant_image,
    lat: Number(row.restaurant_lat),
    lng: Number(row.restaurant_lng),
  };

  const customerObj = {
    name: row.customer_name || 'Customer',
    phone: row.customer_phone,
    address: customerAddress,
    lat: Number(row.customer_lat),
    lng: Number(row.customer_lng),
  };

  return {
    id: row.id,
    order_id: row.id,
    order_status: row.order_status,
    payment_status: row.payment_status,
    delivery_partner_id: row.delivery_partner_id,
    assigned_at: row.assigned_at,
    assignment_id: row.assignment_id,
    assignment_status: row.assignment_status,
    offered_at: row.offered_at,
    expires_at: row.expires_at,
    total_amount: totalAmt,
    delivery_fee: deliveryFee,
    estimated_earnings: estimatedEarnings,
    item_count: itemCount,
    restaurant: restaurantObj,
    restaurant_name: row.restaurant_name,
    restaurant_address: row.restaurant_address || 'Address provided upon acceptance',
    customer: customerObj,
    customer_name: row.customer_name || 'Customer',
    customer_address: customerAddress,
    distance: '3.5 km',
    estimated_delivery_time: `${row.est_prep_min || 30} mins`,
    delivery_instructions: row.delivery_instructions,
    created_at: row.created_at,
  };
};

const listAvailableOrders = async (partnerId) => {
  await expireStaleAssignments();
  const { rows } = await pool.query(
    `${orderDetailSelect}
     WHERE (
       LOWER(o.status) IN ('ready_for_pickup', 'ready for pickup', 'preparing', 'paid', 'accepted')
       OR LOWER(COALESCE(o.payment_status, p.status, 'paid')) IN ('paid', 'completed')
     )
       AND (o.delivery_partner_id IS NULL)
       AND NOT EXISTS (
         SELECT 1 FROM delivery_assignments x
         WHERE x.order_id = o.id
           AND x.status IN ('accepted', 'assigned', 'reached_restaurant', 'picked_up', 'on_the_way', 'delivered')
       )
     ORDER BY o.created_at ASC
     LIMIT 50`
  );
  return rows.map(formatOrder);
};

const listAssignedOrders = async (partnerId) => {
  await expireStaleAssignments();
  const { rows } = await pool.query(
    `${orderDetailSelect}
     WHERE (da.delivery_partner_id = $1 OR o.delivery_partner_id = $1)
       AND (
         da.status IN ('offered', 'accepted', 'assigned', 'reached_restaurant', 'picked_up', 'out_for_delivery', 'on_the_way', 'near_customer')
         OR o.status IN ('assigned', 'Accepted', 'Ready for Pickup', 'Reached Restaurant', 'Picked Up', 'Out For Delivery', 'On The Way')
       )
     ORDER BY COALESCE(da.updated_at, o.updated_at) DESC`,
    [partnerId]
  );
  const formatted = rows.map(formatOrder);
  if (formatted.length > 0) {
    const orderIds = formatted.map((o) => o.id);
    const itemsRes = await pool.query(
      `SELECT oi.order_id, oi.quantity, oi.price_at_time, m.name
       FROM order_items oi JOIN menu_items m ON m.id = oi.menu_item_id
       WHERE oi.order_id = ANY($1::uuid[])`,
      [orderIds]
    );
    const itemsByOrder = {};
    for (const item of itemsRes.rows) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push({
        quantity: item.quantity,
        price_at_time: item.price_at_time,
        name: item.name,
      });
    }
    for (const order of formatted) {
      const items = itemsByOrder[order.id] || [];
      order.items = items;
      order.order_items = items;
    }
  }
  return formatted;
};

const getOrderForPartner = async (orderId, partnerId) => {
  const { rows } = await pool.query(
    `${orderDetailSelect}
     WHERE o.id = $1
       AND (da.delivery_partner_id = $2 OR o.delivery_partner_id = $2 OR da.id IS NULL OR da.status IN ('rejected', 'expired'))`,
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
    try {
      const dn = require('./deliveryNotificationModel');
      await dn.createNotification({
        partnerId,
        type: 'new_order',
        title: 'New Delivery Request',
        message: `You have a new delivery request for order #${String(orderId).slice(0, 8)}. Respond within 2 minutes.`,
        relatedOrderId: orderId,
        actionUrl: '/delivery/orders?tab=available',
      });
    } catch (err) {
      console.warn('[delivery] new_order notification skipped:', err.message);
    }
  }
  return rows[0] || null;
};

const acceptOrder = async (orderId, partnerId) => {
  const { assertPartnerKycVerified } = require('./deliveryDocumentModel');
  await assertPartnerKycVerified(partnerId);

  const client = await pool.connect();
  let updatedOrder = null;
  try {
    await client.query('BEGIN');

    // Lock the target order row to prevent concurrent claims
    const orderRes = await client.query(
      `SELECT id, status, delivery_partner_id, restaurant_id, total_amount, user_id
       FROM orders
       WHERE id = $1
       FOR UPDATE`,
      [orderId]
    );

    const orderRow = orderRes.rows[0];
    if (!orderRow) {
      await client.query('ROLLBACK');
      const err = new Error('Order not found');
      err.status = 404;
      throw err;
    }

    if (orderRow.delivery_partner_id && orderRow.delivery_partner_id !== partnerId) {
      await client.query('ROLLBACK');
      const err = new Error('Order is no longer available or already accepted by another delivery partner');
      err.status = 409;
      throw err;
    }

    // Update order with delivery_partner_id, status = 'assigned', assigned_at = CURRENT_TIMESTAMP
    await client.query(
      `UPDATE orders
       SET delivery_partner_id = $1,
           status = 'assigned',
           assigned_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [partnerId, orderId]
    );

    // Update or insert delivery assignment
    const assignRes = await client.query(
      `SELECT id FROM delivery_assignments WHERE order_id = $1 AND delivery_partner_id = $2 FOR UPDATE`,
      [orderId, partnerId]
    );

    let assignmentId;
    if (assignRes.rows[0]) {
      assignmentId = assignRes.rows[0].id;
      await client.query(
        `UPDATE delivery_assignments
         SET status = 'accepted', responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [assignmentId]
      );
    } else {
      const insRes = await client.query(
        `INSERT INTO delivery_assignments (
           order_id, delivery_partner_id, status, offered_at, responded_at
         ) VALUES ($1, $2, 'accepted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        [orderId, partnerId]
      );
      assignmentId = insRes.rows[0].id;
    }

    // Upsert order_tracking
    await client.query(
      `INSERT INTO order_tracking (order_id, delivery_partner_id, current_status, estimated_delivery_time)
       VALUES ($1, $2, 'Assigned', CURRENT_TIMESTAMP + INTERVAL '30 minutes')
       ON CONFLICT (order_id) DO UPDATE SET
         delivery_partner_id = EXCLUDED.delivery_partner_id,
         current_status = 'Assigned',
         updated_at = CURRENT_TIMESTAMP`,
      [orderId, partnerId]
    );

    // Status history
    await client.query(
      `INSERT INTO delivery_status_history (assignment_id, order_id, delivery_partner_id, status, note)
       VALUES ($1, $2, $3, 'accepted', 'Partner accepted delivery')`,
      [assignmentId, orderId, partnerId]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }

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

  await notifyStakeholders(
    orderId,
    'Delivery partner assigned',
    'A delivery partner has accepted your order.',
    'Delivery Partner Assigned'
  );

  try {
    const dn = require('./deliveryNotificationModel');
    await dn.createNotification({
      partnerId,
      type: 'order_assigned',
      title: 'Order Assigned',
      message: `Order #${String(orderId).slice(0, 8)} has been assigned to you. Head to the restaurant to pick it up.`,
      relatedOrderId: orderId,
      actionUrl: '/delivery/orders/assigned',
    });
  } catch (err) {
    console.warn('[delivery] order_assigned notification skipped:', err.message);
  }

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
  'out_for_delivery',
  'on_the_way',
  'near_customer',
  'delivered',
];

const mapToOrderStatus = (status) => {
  if (status === 'picked_up') return 'Picked Up';
  if (status === 'out_for_delivery') return 'Out For Delivery';
  if (status === 'on_the_way') return 'On The Way';
  if (status === 'near_customer') return 'On The Way';
  if (status === 'delivered') return 'Delivered';
  if (status === 'reached_restaurant') return 'Reached Restaurant';
  return null;
};

const mapToTrackingStatus = (status) => {
  const map = {
    assigned: 'Assigned',
    accepted: 'Accepted',
    reached_restaurant: 'Reached Restaurant',
    picked_up: 'Picked Up',
    out_for_delivery: 'Out For Delivery',
    on_the_way: 'On The Way',
    near_customer: 'Near Customer',
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
       AND status IN ('accepted', 'assigned', 'reached_restaurant', 'picked_up', 'on_the_way', 'near_customer')`,
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

  if (status === 'out_for_delivery' || status === 'on_the_way') {
    const crypto = require('crypto');
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      `UPDATE orders
       SET delivery_otp_hash = $1,
           delivery_otp_expires_at = $2,
           delivery_otp_attempts = 0,
           delivery_otp = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [otpHash, expiresAt, otp, orderId]
    );
  }

  await recordHistory(rows[0].id, orderId, partnerId, status, `Status updated to ${trackingStatus}`);
  await notifyStakeholders(orderId, 'Order Update', `Your order is now: ${trackingStatus}.`, orderStatus || trackingStatus);

  if (status === 'picked_up') {
    try {
      const dn = require('./deliveryNotificationModel');
      await dn.createNotification({
        partnerId,
        type: 'order_updated',
        title: 'Order Picked Up',
        message: `You picked up order #${String(orderId).slice(0, 8)}. Deliver it to the customer.`,
        relatedOrderId: orderId,
        actionUrl: '/delivery/orders/assigned',
      });
    } catch (err) {
      console.warn('[delivery] order_updated notification skipped:', err.message);
    }
  }

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
    try {
      const dn = require('./deliveryNotificationModel');
      await dn.createNotification({
        partnerId,
        type: 'delivery_completed',
        title: 'Delivery Completed',
        message: `Order #${String(orderId).slice(0, 8)} delivered successfully. Earnings have been credited to your wallet.`,
        relatedOrderId: orderId,
        actionUrl: '/delivery/wallet',
      });
    } catch (err) {
      console.warn('[delivery] delivery_completed notification skipped:', err.message);
    }
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

  try {
    const { creditWallet } = require('./deliveryWalletModel');
    await creditWallet(partnerId, amount, orderId, incentive ? 'Delivery fee + incentive' : 'Delivery fee');
  } catch (walletErr) {
    console.warn('[delivery] wallet credit skipped:', walletErr.message);
  }
};

const recordHistory = async (assignmentId, orderId, partnerId, status, note) => {
  await pool.query(
    `INSERT INTO delivery_status_history (assignment_id, order_id, delivery_partner_id, status, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [assignmentId, orderId, partnerId, status, note]
  );
};

const notifyStakeholders = async (orderId, title, message, status = null) => {
  const { rows } = await pool.query(
    `SELECT o.user_id, r.name AS restaurant_name
     FROM orders o
     LEFT JOIN restaurants r ON r.id = o.restaurant_id
     WHERE o.id = $1`,
    [orderId]
  );
  if (rows[0]) {
    if (status) {
      const { customerOrderNotification } = require('../services/orderStatusNotifications');
      const n = customerOrderNotification(status, orderId, rows[0].restaurant_name || '');
      await createNotification(rows[0].user_id, n.type, n.title, n.message, {
        order_id: orderId,
        link: `/track-order?id=${orderId}`,
      });
    } else {
      await createNotification(rows[0].user_id, 'order', title, message, {
        order_id: orderId,
        link: `/track-order?id=${orderId}`,
      });
    }
  }
};

const getDeliveryHistory = async (partnerId, { status = 'all', limit = 50 } = {}) => {
  const statusFilter =
    status === 'completed'
      ? `da.status = 'delivered'`
      : status === 'cancelled'
        ? `da.status IN ('rejected', 'expired', 'cancelled')`
        : `da.status IN ('delivered', 'rejected', 'expired', 'cancelled')`;

  const { rows } = await pool.query(
    `SELECT da.*, o.total_amount, o.delivery_fee, o.status AS order_status, o.created_at AS order_created_at,
            r.name AS restaurant_name, r.address AS restaurant_address,
            u.full_name AS customer_name, u.phone_number AS customer_phone,
            TRIM(CONCAT_WS(', ', a.house_no, a.street, a.landmark, a.city, a.state, a.zip_code)) AS customer_address,
            dr.rating AS customer_rating, dr.comment AS customer_comment
     FROM delivery_assignments da
     JOIN orders o ON o.id = da.order_id
     JOIN restaurants r ON r.id = o.restaurant_id
     JOIN users u ON u.id = o.user_id
     LEFT JOIN addresses a ON a.id = o.delivery_address_id
     LEFT JOIN delivery_reviews dr ON dr.order_id = da.order_id AND dr.delivery_partner_id = da.delivery_partner_id
     WHERE da.delivery_partner_id = $1 AND ${statusFilter}
     ORDER BY da.updated_at DESC
     LIMIT $2`,
    [partnerId, Math.min(Number(limit) || 50, 100)]
  );
  return rows;
};

const getEarnings = async (partnerId) => {
  const summary = await pool.query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE earned_at::date = CURRENT_DATE), 0)::float AS daily,
       COALESCE(SUM(amount) FILTER (WHERE earned_at >= date_trunc('week', CURRENT_DATE)), 0)::float AS weekly,
       COALESCE(SUM(amount) FILTER (WHERE earned_at >= date_trunc('month', CURRENT_DATE)), 0)::float AS monthly,
       COALESCE(SUM(incentive) FILTER (WHERE earned_at >= date_trunc('month', CURRENT_DATE)), 0)::float AS incentives_month,
       COALESCE(SUM(amount), 0)::float AS total
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
  if (isAvailable) {
    const { assertPartnerKycVerified } = require('./deliveryDocumentModel');
    await assertPartnerKycVerified(partnerId);
  }

  const { rows } = await pool.query(
    `UPDATE delivery_partners
     SET is_available = $1, is_online = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 OR user_id = $2 RETURNING *`,
    [isAvailable, partnerId]
  );
  return rows[0];
};

const updateLocation = async (partnerId, lat, lng, orderId = null) => {
  const { rows } = await pool.query(
    `UPDATE delivery_partners
     SET current_lat = $1, current_lng = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 OR user_id = $3 RETURNING *`,
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
       user_id, vehicle_details, vehicle_type, license_number, driving_license_number, is_available, is_online, approval_status, status
     ) VALUES ($1, $2, $3, $4, $4, FALSE, FALSE, 'pending', 'pending')
     ON CONFLICT (user_id) DO UPDATE SET
       vehicle_details = EXCLUDED.vehicle_details,
       vehicle_type = EXCLUDED.vehicle_type,
       license_number = EXCLUDED.license_number,
       driving_license_number = EXCLUDED.driving_license_number
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
    bank_account_name,
    bank_account_number,
    bank_ifsc,
    upi_id,
    aadhaar_last4,
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
       bank_account_name = COALESCE($9, bank_account_name),
       bank_account_number = COALESCE($10, bank_account_number),
       bank_ifsc = COALESCE($11, bank_ifsc),
       upi_id = COALESCE($12, upi_id),
       aadhaar_last4 = COALESCE($13, aadhaar_last4),
       updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $14
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
      bank_account_name || null,
      bank_account_number || null,
      bank_ifsc || null,
      upi_id || null,
      aadhaar_last4 || null,
      userId,
    ]
  );
  return rows[0] || null;
};

const VALID_NEXT_STATUS = {
  assigned: ['reached_restaurant'],
  accepted: ['reached_restaurant'],
  reached_restaurant: ['picked_up'],
  picked_up: ['out_for_delivery', 'on_the_way'],
  out_for_delivery: ['delivered'],
  on_the_way: ['delivered'],
};

const updateDeliveryStatusWithRules = async (orderId, partnerId, targetStatus) => {
  const { rows: orderRows } = await pool.query(
    `SELECT o.id, o.status AS order_status, o.delivery_partner_id, da.status AS assignment_status, da.delivery_partner_id AS assignment_partner_id
     FROM orders o
     LEFT JOIN LATERAL (
       SELECT * FROM delivery_assignments
       WHERE order_id = o.id
       ORDER BY created_at DESC
       LIMIT 1
     ) da ON TRUE
     WHERE o.id = $1`,
    [orderId]
  );

  const order = orderRows[0];
  if (!order) {
    throw Object.assign(new Error('Order not found'), { status: 404 });
  }

  const assignedPartnerId = order.delivery_partner_id || order.assignment_partner_id;
  if (!assignedPartnerId || String(assignedPartnerId) !== String(partnerId)) {
    throw Object.assign(new Error('Only the assigned delivery partner can update this order'), { status: 403 });
  }

  let currentRawStatus = (order.assignment_status || order.order_status || '').toLowerCase().replace(/\s+/g, '_');
  if (currentRawStatus === 'ready_for_pickup' || currentRawStatus === 'ready for pickup') {
    currentRawStatus = 'reached_restaurant';
  } else if (currentRawStatus === 'picked_up' || currentRawStatus === 'picked up') {
    currentRawStatus = 'picked_up';
  } else if (currentRawStatus === 'on_the_way' || currentRawStatus === 'on the way' || currentRawStatus === 'out_for_delivery') {
    currentRawStatus = 'out_for_delivery';
  }

  const allowedNext = VALID_NEXT_STATUS[currentRawStatus] || [];
  const normalizedTarget = targetStatus === 'on_the_way' ? 'out_for_delivery' : targetStatus;

  if (!allowedNext.includes(targetStatus) && !allowedNext.includes(normalizedTarget)) {
    throw Object.assign(
      new Error(`Invalid status transition: Cannot transition order from '${currentRawStatus}' to '${targetStatus}'`),
      { status: 400 }
    );
  }

  return await updateDeliveryStatus(orderId, partnerId, targetStatus);
};

const verifyDeliveryOtp = async (orderId, partnerId, inputOtp) => {
  const crypto = require('crypto');
  const { rows: orderRows } = await pool.query(
    `SELECT o.id, o.status AS order_status, o.user_id, o.delivery_partner_id,
            o.delivery_otp_hash, o.delivery_otp_expires_at, o.delivery_otp_attempts,
            o.delivery_verified_at, da.id AS assignment_id, da.status AS assignment_status,
            da.delivery_partner_id AS assignment_partner_id
     FROM orders o
     LEFT JOIN LATERAL (
       SELECT * FROM delivery_assignments
       WHERE order_id = o.id
       ORDER BY created_at DESC
       LIMIT 1
     ) da ON TRUE
     WHERE o.id = $1`,
    [orderId]
  );

  const order = orderRows[0];
  if (!order) {
    throw Object.assign(new Error('Order not found'), { status: 404 });
  }

  const assignedPartnerId = order.delivery_partner_id || order.assignment_partner_id;
  if (!assignedPartnerId || String(assignedPartnerId) !== String(partnerId)) {
    throw Object.assign(new Error('Only assigned delivery partner can verify OTP'), { status: 403 });
  }

  const currentStatus = (order.assignment_status || order.order_status || '').toLowerCase().replace(/\s+/g, '_');
  if (currentStatus !== 'out_for_delivery' && currentStatus !== 'on_the_way') {
    throw Object.assign(new Error('Order must be out for delivery to verify OTP'), { status: 400 });
  }

  if (Number(order.delivery_otp_attempts || 0) >= 5) {
    throw Object.assign(new Error('Maximum OTP verification attempts (5) exceeded. Please contact support.'), { status: 400 });
  }

  if (order.delivery_otp_expires_at && new Date() > new Date(order.delivery_otp_expires_at)) {
    throw Object.assign(new Error('OTP has expired. Please ask customer to refresh page.'), { status: 400 });
  }

  const rawInput = String(inputOtp || '').trim();
  const inputHash = crypto.createHash('sha256').update(rawInput).digest('hex');

  if (inputHash !== order.delivery_otp_hash) {
    const nextAttempts = Number(order.delivery_otp_attempts || 0) + 1;
    await pool.query(
      `UPDATE orders SET delivery_otp_attempts = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [nextAttempts, orderId]
    );
    const remaining = Math.max(0, 5 - nextAttempts);
    throw Object.assign(new Error(`Invalid OTP. ${remaining} attempt(s) remaining.`), { status: 400 });
  }

  const assignmentId = order.assignment_id;
  await pool.query(
    `UPDATE orders
     SET delivery_verified_at = CURRENT_TIMESTAMP,
         status = 'Delivered',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [orderId]
  );

  if (assignmentId) {
    await pool.query(
      `UPDATE delivery_assignments SET status = 'delivered', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [assignmentId]
    );
  }

  await pool.query(
    `INSERT INTO order_tracking (order_id, delivery_partner_id, current_status, estimated_delivery_time)
     VALUES ($1, $2, 'Delivered', CURRENT_TIMESTAMP)
     ON CONFLICT (order_id) DO UPDATE SET
       delivery_partner_id = EXCLUDED.delivery_partner_id,
       current_status = 'Delivered',
       updated_at = CURRENT_TIMESTAMP`,
    [orderId, partnerId]
  );

  await pool.query(
    `UPDATE delivery_partners SET is_available = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [partnerId]
  );

  if (assignmentId) {
    await settleEarnings(orderId, partnerId, assignmentId);
  }

  await recordHistory(assignmentId, orderId, partnerId, 'delivered', 'OTP verified and order delivered successfully');
  await notifyStakeholders(orderId, 'Order Delivered', 'Your order has been verified and delivered successfully!', 'Delivered');

  try {
    const dn = require('./deliveryNotificationModel');
    await dn.createNotification({
      partnerId,
      type: 'delivery_completed',
      title: 'Delivery Completed',
      message: `Order #${String(orderId).slice(0, 8)} delivered successfully. Earnings have been credited to your wallet.`,
      relatedOrderId: orderId,
    });
  } catch (err) {
    console.warn('[delivery] delivery_completed notification skipped:', err.message);
  }

  try {
    const ReferralService = require('../services/referralService');
    await ReferralService.handleFirstDeliveryCompleted(partnerId);
  } catch (refErr) {
    console.warn('[delivery] referral first delivery check skipped:', refErr.message);
  }

  try {
    const { emitOrderStatus } = require('../socket/emitters');
    const partnerUser = await pool.query('SELECT user_id FROM delivery_partners WHERE id = $1', [partnerId]);
    const orderRow = await pool.query('SELECT user_id, restaurant_id, total_amount FROM orders WHERE id = $1', [orderId]);
    emitOrderStatus(
      {
        id: orderId,
        status: 'Delivered',
        user_id: orderRow.rows[0]?.user_id,
        restaurant_id: orderRow.rows[0]?.restaurant_id,
        total_amount: orderRow.rows[0]?.total_amount,
      },
      {
        source: 'delivery',
        delivery_status: 'delivered',
        delivery_partner_id: partnerId,
        delivery_partner_user_id: partnerUser.rows[0]?.user_id,
      }
    );
  } catch (socketErr) {
    console.warn('[delivery] verify-otp socket emit skipped:', socketErr.message);
  }

  return await getOrderForPartner(orderId, partnerId);
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
  updateDeliveryStatusWithRules,
  verifyDeliveryOtp,
  getEarnings,
  getDeliveryHistory,
  updateAvailability,
  updateLocation,
  registerPartner,
  updatePartnerDocuments,
  expireStaleAssignments,
  ASSIGNMENT_EXPIRE_SECONDS,
};
