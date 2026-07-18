const { pool } = require('../config/db');
const { ok, fail } = require('../utils/respond');
const { getOrderById } = require('../models/orderModel');
const {
  createReview,
  getReviewByOrder,
} = require('../models/reviewModel');
const { updateRestaurantRating } = require('../models/restaurantModel');
const {
  createDeliveryReview,
  getByOrderId: getDeliveryReviewByOrder,
  updatePartnerRating,
  resolvePartnerIdForOrder,
} = require('../models/deliveryReviewModel');
const {
  createOrderFeedback,
  getByOrderId: getOrderFeedbackRow,
} = require('../models/orderFeedbackModel');

const isDelivered = (status) =>
  String(status || '')
    .toLowerCase()
    .replace(/\s+/g, '_') === 'delivered' ||
  String(status || '').toLowerCase() === 'delivered';

const getFeedback = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await getOrderById(orderId);
    if (!order) return fail(res, 404, 'Order not found');
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return fail(res, 403, 'Not authorized');
    }

    const [restaurantReview, deliveryReview, orderFeedback] = await Promise.all([
      getReviewByOrder(orderId, order.user_id),
      getDeliveryReviewByOrder(orderId),
      getOrderFeedbackRow(orderId),
    ]);

    return ok(res, 'Order feedback', {
      submitted: Boolean(restaurantReview || deliveryReview || orderFeedback),
      restaurant_review: restaurantReview,
      delivery_review: deliveryReview,
      order_feedback: orderFeedback,
    });
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const submitFeedback = async (req, res) => {
  const client = await pool.connect();
  try {
    const orderId = req.params.id;
    const order = await getOrderById(orderId);
    if (!order) return fail(res, 404, 'Order not found');
    if (order.user_id !== req.user.id) {
      return fail(res, 403, 'Not authorized');
    }
    if (!isDelivered(order.status)) {
      return fail(res, 400, 'Feedback is only allowed for delivered orders');
    }

    const existing = await getOrderFeedbackRow(orderId);
    const existingReview = await getReviewByOrder(orderId, req.user.id);
    if (existing || existingReview) {
      return fail(res, 409, 'Feedback already submitted for this order');
    }

    const restaurant_rating = Number(req.body.restaurant_rating);
    if (!restaurant_rating || restaurant_rating < 1 || restaurant_rating > 5) {
      return fail(res, 400, 'restaurant_rating between 1 and 5 is required');
    }

    const delivery_rating =
      req.body.delivery_rating != null && req.body.delivery_rating !== ''
        ? Number(req.body.delivery_rating)
        : null;
    if (delivery_rating != null && (delivery_rating < 1 || delivery_rating > 5)) {
      return fail(res, 400, 'delivery_rating must be between 1 and 5');
    }

    const overall_rating =
      req.body.overall_rating != null && req.body.overall_rating !== ''
        ? Number(req.body.overall_rating)
        : null;
    if (overall_rating != null && (overall_rating < 1 || overall_rating > 5)) {
      return fail(res, 400, 'overall_rating must be between 1 and 5');
    }

    await client.query('BEGIN');

    const restaurantReview = await createReview(
      {
        user_id: req.user.id,
        restaurant_id: order.restaurant_id,
        rating: restaurant_rating,
        comment: req.body.restaurant_comment || null,
        order_id: orderId,
      },
      client
    );

    let deliveryReview = null;
    const partnerId = await resolvePartnerIdForOrder(orderId, client);
    if (partnerId && delivery_rating != null) {
      deliveryReview = await createDeliveryReview(
        {
          user_id: req.user.id,
          delivery_partner_id: partnerId,
          order_id: orderId,
          rating: delivery_rating,
          comment: req.body.delivery_comment || null,
        },
        client
      );
      await updatePartnerRating(partnerId, client);
    }

    const orderFeedback = await createOrderFeedback(
      {
        order_id: orderId,
        user_id: req.user.id,
        overall_rating,
        comment: req.body.comment || null,
        tags: req.body.tags,
      },
      client
    );

    await client.query('COMMIT');
    await updateRestaurantRating(order.restaurant_id);

    return ok(
      res,
      'Feedback submitted',
      {
        restaurant_review: restaurantReview,
        delivery_review: deliveryReview,
        order_feedback: orderFeedback,
      },
      201
    );
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    if (err.code === '23505') {
      return fail(res, 409, 'Feedback already submitted for this order');
    }
    return fail(res, 500, 'Server Error', err);
  } finally {
    client.release();
  }
};

module.exports = { getFeedback, submitFeedback };
