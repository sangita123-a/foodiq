const {
  getRestaurantByOwnerId,
  getDashboardStats,
  getTopDishes,
  getRecentOrders,
  getPartnerOrders,
  getPartnerOrderById,
  getMenuItemsForRestaurant,
  getAnalytics,
  updateRestaurantProfile,
  getMenuCategoriesForRestaurant,
  ensureMenuCategory,
} = require('../models/partnerModel');
const {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemById,
} = require('../models/menuItemModel');
const { updateOrderStatus } = require('../models/orderModel');
const { createNotification } = require('../models/notificationModel');
const { pool } = require('../config/db');

const PARTNER_ROLES = ['restaurant_owner', 'admin'];

const mapPaymentMethod = (method) => {
  const m = String(method || '').toLowerCase();
  if (m === 'cod' || m === 'cash') return 'Cash on Delivery';
  if (m === 'upi') return 'UPI';
  if (m === 'wallet') return 'Wallet';
  return 'Card';
};

const mapOrderStatusToUi = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'pending') return 'New';
  if (s === 'accepted') return 'Accepted';
  if (s === 'preparing') return 'Preparing';
  if (s === 'ready for pickup') return 'Ready for Pickup';
  if (s === 'picked up' || s === 'on the way') return 'Picked Up';
  if (s === 'delivered') return 'Delivered';
  if (s === 'cancelled' || s === 'rejected') return 'Rejected';
  return status || 'New';
};

const mapUiStatusToDb = (status) => {
  const s = String(status || '');
  if (s === 'New') return 'Pending';
  if (s === 'Rejected') return 'Cancelled';
  return s;
};

const formatAddress = (order) => {
  const parts = [
    order.house_no,
    order.street,
    order.city,
    order.state,
    order.zip_code,
  ].filter(Boolean);
  return parts.join(', ') || 'Address unavailable';
};

const formatPartnerOrder = (order) => ({
  id: String(order.id),
  customerName: order.customer_name || 'Customer',
  customerPhone: order.customer_phone || '',
  deliveryAddress: formatAddress(order),
  items: (order.items || []).map((item) => ({
    id: String(item.id),
    name: item.name,
    quantity: item.quantity,
    price: Number(item.price_at_time),
  })),
  specialInstructions: order.delivery_instructions || undefined,
  paymentMethod: mapPaymentMethod(order.payment_method),
  paymentStatus:
    String(order.payment_status || '').toLowerCase() === 'completed'
      ? 'Paid'
      : 'Pending',
  subtotal: Number(order.subtotal || 0),
  taxes: 0,
  discount: Number(order.discount_amount || 0),
  grandTotal: Number(order.total_amount || 0),
  orderTime: order.created_at,
  status: mapOrderStatusToUi(order.status),
});

const requirePartnerRestaurant = async (req, res) => {
  if (!PARTNER_ROLES.includes(req.user.role)) {
    res.status(403).json({
      success: false,
      message: 'Partner access only',
      error: {},
    });
    return null;
  }

  if (req.user.role === 'admin' && req.query.restaurant_id) {
    const { rows } = await pool.query(
      'SELECT * FROM restaurants WHERE id = $1',
      [req.query.restaurant_id]
    );
    if (!rows[0]) {
      res.status(404).json({
        success: false,
        message: 'Restaurant not found',
        error: {},
      });
      return null;
    }
    return rows[0];
  }

  const restaurant = await getRestaurantByOwnerId(req.user.id);
  if (!restaurant) {
    res.status(404).json({
      success: false,
      message: 'No restaurant linked to this partner account',
      error: {},
    });
    return null;
  }
  return restaurant;
};

const getMe = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    res.json({
      success: true,
      message: 'Partner restaurant retrieved',
      data: {
        user: {
          id: req.user.id,
          full_name: req.user.full_name,
          email: req.user.email,
          role: req.user.role,
        },
        restaurant,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const getDashboard = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;

    const [stats, topDishes, recentOrders] = await Promise.all([
      getDashboardStats(restaurant.id),
      getTopDishes(restaurant.id, 5),
      getRecentOrders(restaurant.id, 8),
    ]);

    res.json({
      success: true,
      message: 'Partner dashboard retrieved',
      data: {
        restaurant,
        stats: {
          totalOrders: stats.total_orders,
          todaysOrders: stats.todays_orders,
          todaysRevenue: stats.todays_revenue,
          totalRevenue: stats.total_revenue,
          pendingOrders: stats.pending_orders,
          completedOrders: stats.completed_orders,
          activeMenuItems: stats.active_menu_items,
          averageRating: stats.average_rating,
        },
        topDishes,
        recentOrders: recentOrders.map(formatPartnerOrder),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    const orders = await getPartnerOrders(restaurant.id);
    res.json({
      success: true,
      message: 'Partner orders retrieved',
      data: orders.map(formatPartnerOrder),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const updatePartnerOrderStatus = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;

    const order = await getPartnerOrderById(req.params.id, restaurant.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        error: {},
      });
    }

    const uiStatus = req.body.status;
    const dbStatus = mapUiStatusToDb(uiStatus);
    const validStatuses = [
      'Pending',
      'Accepted',
      'Preparing',
      'Ready for Pickup',
      'Picked Up',
      'On The Way',
      'Delivered',
      'Cancelled',
    ];
    if (!validStatuses.includes(dbStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
        error: {},
      });
    }

    const updated = await updateOrderStatus(req.params.id, dbStatus);

    try {
      const { trackKitchenStatus } = require('../services/inventoryService');
      await trackKitchenStatus(req.params.id, restaurant.id, dbStatus);
    } catch {
      /* non-blocking */
    }

    await pool.query(
      `INSERT INTO order_tracking (order_id, current_status, estimated_delivery_time)
       VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '30 minutes')
       ON CONFLICT (order_id) DO UPDATE SET
         current_status = EXCLUDED.current_status,
         updated_at = CURRENT_TIMESTAMP`,
      [req.params.id, dbStatus]
    ).catch(() => {});

    try {
      const { recordOrderTrackingHistory } = require('../services/trackingService');
      await recordOrderTrackingHistory({
        orderId: req.params.id,
        status: dbStatus,
        note: `Restaurant updated status to ${dbStatus}`,
        actorType: 'restaurant',
        actorId: restaurant.id,
      });
    } catch {
      /* non-blocking */
    }

    const { customerOrderNotification } = require('../services/orderStatusNotifications');
    const orderNotif = customerOrderNotification(dbStatus, order.id, restaurant?.name || '');
    await createNotification(
      order.user_id,
      orderNotif.type,
      orderNotif.title,
      orderNotif.message,
      { order_id: order.id, status: dbStatus, link: `/track-order?id=${order.id}` }
    ).catch(() => {});

    if (dbStatus === 'Ready for Pickup') {
      try {
        const rest = await pool.query(
          'SELECT owner_id, name FROM restaurants WHERE id = $1',
          [order.restaurant_id]
        );
        if (rest.rows[0]?.owner_id) {
          await createNotification(
            rest.rows[0].owner_id,
            'pickup_reminder',
            'Pickup Reminder',
            `Order #${String(order.id).slice(0, 8)} is ready for pickup.`,
            { order_id: order.id, status: dbStatus, restaurant_name: rest.rows[0].name }
          ).catch(() => {});
        }
      } catch {
        /* non-blocking */
      }
      try {
        const delivery = require('../models/deliveryModel');
        const nearby = await pool.query(
          `SELECT id FROM delivery_partners
           WHERE is_available = TRUE
             AND COALESCE(approval_status, 'approved') = 'approved'
           ORDER BY updated_at DESC
           LIMIT 1`
        );
        if (nearby.rows[0]) {
          await delivery.createAssignmentOffer(req.params.id, nearby.rows[0].id);
        }
      } catch {
        /* non-blocking */
      }
    }

    if (dbStatus === 'Cancelled') {
      try {
        const assigned = await pool.query(
          `SELECT dp.user_id FROM delivery_assignments da
           JOIN delivery_partners dp ON dp.id = da.delivery_partner_id
           WHERE da.order_id = $1
             AND da.status NOT IN ('rejected', 'expired', 'delivered')
           ORDER BY da.created_at DESC
           LIMIT 1`,
          [req.params.id]
        );
        if (assigned.rows[0]) {
          await createNotification(
            assigned.rows[0].user_id,
            'order_cancelled',
            'Order Cancelled',
            `Order #${String(req.params.id).slice(0, 8)} was cancelled.`,
            { order_id: req.params.id, link: '/delivery/orders' }
          );
          await pool.query(
            `UPDATE delivery_assignments
             SET status = 'expired', updated_at = CURRENT_TIMESTAMP
             WHERE order_id = $1
               AND status IN ('offered', 'accepted', 'assigned', 'reached_restaurant', 'picked_up', 'on_the_way')`,
            [req.params.id]
          );
        }
      } catch {
        /* non-blocking */
      }

      // Restaurant cancellation → auto refund prepaid orders
      try {
        const pay = await pool.query(
          `SELECT status, method FROM payments WHERE order_id = $1`,
          [req.params.id]
        );
        if (pay.rows[0] && pay.rows[0].status === 'completed' && pay.rows[0].method !== 'cod') {
          const { processRefund } = require('./paymentController');
          await processRefund({
            orderId: req.params.id,
            reason: 'Restaurant cancelled order',
            initiatedBy: req.user.id,
            type: 'full',
            cancelOrder: false,
          });
        }
      } catch (refundErr) {
        console.warn('[partner] auto-refund skipped:', refundErr.message);
      }
    }

    if (dbStatus === 'Delivered') {
      // Mark COD as collected on delivery
      await pool.query(
        `UPDATE payments
         SET status = 'completed',
             transaction_time = COALESCE(transaction_time, CURRENT_TIMESTAMP),
             updated_at = CURRENT_TIMESTAMP
         WHERE order_id = $1 AND method = 'cod' AND status = 'pending'`,
        [req.params.id]
      ).catch(() => {});

      try {
        const loyaltyEngine = require('../services/loyaltyEngine');
        await loyaltyEngine.creditForOrderDelivered(updated);
      } catch (loyaltyErr) {
        console.warn('[partner] loyalty credit skipped:', loyaltyErr.message);
      }
    }

    const refreshed = await getPartnerOrderById(req.params.id, restaurant.id);

    try {
      const { emitOrderStatus } = require('../socket/emitters');
      emitOrderStatus(
        {
          id: req.params.id,
          status: dbStatus,
          user_id: order.user_id,
          restaurant_id: restaurant.id,
          total_amount: refreshed?.total_amount || order.total_amount,
        },
        { source: 'partner' }
      );
    } catch (socketErr) {
      console.warn('[partner] socket emit skipped:', socketErr.message);
    }

    res.json({
      success: true,
      message: 'Order status updated',
      data: formatPartnerOrder(refreshed),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const getMenu = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    const [items, categories] = await Promise.all([
      getMenuItemsForRestaurant(restaurant.id),
      getMenuCategoriesForRestaurant(restaurant.id),
    ]);
    res.json({
      success: true,
      message: 'Partner menu retrieved',
      data: { items, categories },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const createDish = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;

    const {
      name,
      description,
      price,
      image_url,
      category_id,
      category_name,
      is_veg,
      is_available,
      is_trending,
      is_bestseller,
      discount_price,
    } = req.body;

    if (!name || price == null) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required',
        error: {},
      });
    }

    let resolvedCategoryId = category_id || null;
    if (!resolvedCategoryId && category_name) {
      const cat = await ensureMenuCategory(restaurant.id, category_name);
      resolvedCategoryId = cat.id;
    }

    const item = await createMenuItem({
      restaurant_id: restaurant.id,
      category_id: resolvedCategoryId,
      name,
      description: description || '',
      price: Number(price),
      image_url: image_url || null,
      is_veg: Boolean(is_veg),
      is_available: is_available !== false,
      is_trending: Boolean(is_trending),
      is_bestseller: Boolean(is_bestseller),
      discount_price:
        discount_price != null && discount_price !== ''
          ? Number(discount_price)
          : null,
    });

    try {
      await require('../middleware/cacheMiddleware').invalidateCatalog();
    } catch {
      /* ignore */
    }

    res.status(201).json({
      success: true,
      message: 'Dish created',
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const updateDish = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;

    const existing = await getMenuItemById(req.params.id);
    if (!existing || existing.restaurant_id !== restaurant.id) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found',
        error: {},
      });
    }

    let categoryId = req.body.category_id;
    if (!categoryId && req.body.category_name) {
      const cat = await ensureMenuCategory(restaurant.id, req.body.category_name);
      categoryId = cat.id;
    }

    const item = await updateMenuItem(req.params.id, {
      ...existing,
      ...req.body,
      category_id: categoryId ?? existing.category_id,
      restaurant_id: restaurant.id,
    });

    try {
      await require('../middleware/cacheMiddleware').invalidateCatalog();
    } catch {
      /* ignore */
    }

    res.json({
      success: true,
      message: 'Dish updated',
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const removeDish = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;

    const existing = await getMenuItemById(req.params.id);
    if (!existing || existing.restaurant_id !== restaurant.id) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found',
        error: {},
      });
    }

    await deleteMenuItem(req.params.id);
    try {
      await require('../middleware/cacheMiddleware').invalidateCatalog();
    } catch {
      /* ignore */
    }
    res.json({
      success: true,
      message: 'Dish deleted',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    res.json({
      success: true,
      message: 'Restaurant profile retrieved',
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;

    const updated = await updateRestaurantProfile(
      restaurant.id,
      restaurant.owner_id || req.user.id,
      req.body
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
        error: {},
      });
    }

    res.json({
      success: true,
      message: 'Restaurant profile updated',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const getPartnerAnalytics = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    const analytics = await getAnalytics(restaurant.id);
    res.json({
      success: true,
      message: 'Partner analytics retrieved',
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const getNotifications = async (req, res) => {
  try {
    const { getNotificationsByUserId } = require('../models/notificationModel');
    const restaurant = await getRestaurantByOwnerId(req.user.id);
    const notifications = await getNotificationsByUserId(req.user.id);

    let lowStock = [];
    if (restaurant) {
      const { rows } = await pool.query(
        `SELECT id, name FROM menu_items
         WHERE restaurant_id = $1 AND is_available = FALSE
         ORDER BY updated_at DESC
         LIMIT 10`,
        [restaurant.id]
      );
      lowStock = rows.map((item) => ({
        id: `low-stock-${item.id}`,
        title: 'Low Stock Alert',
        message: `[stock] ${item.name} is marked unavailable / out of stock.`,
        is_read: false,
        created_at: new Date().toISOString(),
      }));
    }

    res.json({
      success: true,
      message: 'Notifications retrieved',
      data: [...lowStock, ...notifications],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const getSettlements = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    const { getPartnerSettlements } = require('../models/paymentModel');
    const data = await getPartnerSettlements(restaurant.id);
    res.json({ success: true, message: 'Settlements retrieved', data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const getPartnerReviews = async (req, res) => {
  try {
    const restaurant = await getRestaurantByOwnerId(req.user.id);
    if (!restaurant && req.user.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Restaurant not found', error: {} });
    }
    const restaurantId = restaurant?.id || req.query.restaurant_id;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'restaurant_id required', error: {} });
    }
    const { listPartnerReviews, getRatingDistribution } = require('../models/reviewModel');
    const rows = await listPartnerReviews(restaurantId, {
      limit: req.query.limit,
      offset: req.query.offset,
    });
    const summary = await getRatingDistribution(restaurantId);
    const avg = summary.average_rating || Number(restaurant?.rating || 0);
    const positive = rows.filter((r) => r.rating >= 4).length;
    const neutral = rows.filter((r) => r.rating === 3).length;
    const negative = rows.filter((r) => r.rating <= 2).length;
    res.json({
      success: true,
      message: 'Partner reviews',
      data: {
        reviews: rows,
        analytics: {
          averageRating: avg,
          totalReviews: summary.total_reviews || rows.length,
          positiveReviews: positive,
          neutralReviews: neutral,
          negativeReviews: negative,
          distribution: summary.distribution,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const replyPartnerReview = async (req, res) => {
  try {
    const restaurant = await getRestaurantByOwnerId(req.user.id);
    const { getReviewById, updateReview } = require('../models/reviewModel');
    const review = await getReviewById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found', error: {} });
    }
    if (restaurant && String(review.restaurant_id) !== String(restaurant.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized', error: {} });
    }
    const updated = await updateReview(req.params.id, {
      admin_reply: req.body.reply ?? req.body.admin_reply ?? null,
      status: req.body.status,
    });
    res.json({ success: true, message: 'Review updated', data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

module.exports = {
  getMe,
  getDashboard,
  getOrders,
  updatePartnerOrderStatus,
  getMenu,
  createDish,
  updateDish,
  removeDish,
  getProfile,
  updateProfile,
  getPartnerAnalytics,
  getNotifications,
  getSettlements,
  getPartnerReviews,
  replyPartnerReview,
};
