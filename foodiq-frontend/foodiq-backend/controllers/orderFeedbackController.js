const { pool } = require('../config/db');
const { ok, fail } = require('../utils/respond');
const { getOrderById } = require('../models/orderModel');
const {
  createReview,
  getReviewByOrder,
  updateReview,
  deleteReview,
} = require('../models/reviewModel');
const { updateRestaurantRating } = require('../models/restaurantModel');
const {
  createDeliveryReview,
  getByOrderId: getDeliveryReviewByOrder,
  updatePartnerRating,
  resolvePartnerIdForOrder,
  updateDeliveryReview,
  deleteByOrderId: deleteDeliveryReview,
} = require('../models/deliveryReviewModel');
const {
  createOrderFeedback,
  getByOrderId: getOrderFeedbackRow,
  updateOrderFeedback,
  deleteByOrderId: deleteOrderFeedbackRow,
} = require('../models/orderFeedbackModel');

const isDelivered = (status) =>
  String(status || '')
    .toLowerCase()
    .replace(/\s+/g, '_') === 'delivered' ||
  String(status || '').toLowerCase() === 'delivered';

const clampRating = (value, field, { required = false } = {}) => {
  if (value == null || value === '') {
    if (required) return { error: `${field} between 1 and 5 is required` };
    return { value: null };
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 5 || Math.floor(n) !== n) {
    return { error: `${field} must be an integer between 1 and 5` };
  }
  return { value: n };
};

const sanitizeComment = (raw, max = 2000) => {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  return s.slice(0, max);
};

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

    const rr = clampRating(req.body.restaurant_rating, 'restaurant_rating', {
      required: true,
    });
    if (rr.error) return fail(res, 400, rr.error);

    const dr = clampRating(req.body.delivery_rating, 'delivery_rating');
    if (dr.error) return fail(res, 400, dr.error);

    const or = clampRating(req.body.overall_rating, 'overall_rating');
    if (or.error) return fail(res, 400, or.error);

    await client.query('BEGIN');

    const restaurantReview = await createReview(
      {
        user_id: req.user.id,
        restaurant_id: order.restaurant_id,
        rating: rr.value,
        comment: sanitizeComment(req.body.restaurant_comment),
        order_id: orderId,
        image_urls: require('../models/reviewModel').normalizeImageUrls(req.body.image_urls),
      },
      client
    );

    let deliveryReview = null;
    const partnerId = await resolvePartnerIdForOrder(orderId, client);
    if (partnerId && dr.value != null) {
      deliveryReview = await createDeliveryReview(
        {
          user_id: req.user.id,
          delivery_partner_id: partnerId,
          order_id: orderId,
          rating: dr.value,
          comment: sanitizeComment(req.body.delivery_comment),
        },
        client
      );
      await updatePartnerRating(partnerId, client);
    }

    const orderFeedback = await createOrderFeedback(
      {
        order_id: orderId,
        user_id: req.user.id,
        overall_rating: or.value,
        comment: sanitizeComment(req.body.comment),
        tags: req.body.tags,
      },
      client
    );

    await client.query('COMMIT');
    await updateRestaurantRating(order.restaurant_id);

    try {
      const loyaltyEngine = require('../services/loyaltyEngine');
      await loyaltyEngine.creditReview(req.user.id, restaurantReview.id);
    } catch {
      /* optional */
    }

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

const updateFeedback = async (req, res) => {
  const client = await pool.connect();
  try {
    const orderId = req.params.id;
    const order = await getOrderById(orderId);
    if (!order) return fail(res, 404, 'Order not found');
    if (order.user_id !== req.user.id) {
      return fail(res, 403, 'Not authorized');
    }

    const existingReview = await getReviewByOrder(orderId, req.user.id);
    const existingDelivery = await getDeliveryReviewByOrder(orderId);
    const existingOverall = await getOrderFeedbackRow(orderId);
    if (!existingReview && !existingDelivery && !existingOverall) {
      return fail(res, 404, 'No feedback found for this order');
    }

    const rr = clampRating(req.body.restaurant_rating, 'restaurant_rating');
    if (rr.error) return fail(res, 400, rr.error);
    const dr = clampRating(req.body.delivery_rating, 'delivery_rating');
    if (dr.error) return fail(res, 400, dr.error);
    const or = clampRating(req.body.overall_rating, 'overall_rating');
    if (or.error) return fail(res, 400, or.error);

    await client.query('BEGIN');

    let restaurantReview = existingReview;
    if (existingReview) {
      restaurantReview = await updateReview(
        existingReview.id,
        {
          rating: rr.value ?? existingReview.rating,
          comment:
            req.body.restaurant_comment !== undefined
              ? sanitizeComment(req.body.restaurant_comment)
              : existingReview.comment,
          image_urls:
            req.body.image_urls !== undefined
              ? require('../models/reviewModel').normalizeImageUrls(req.body.image_urls)
              : undefined,
        },
        client
      );
    }

    let deliveryReview = existingDelivery;
    if (existingDelivery) {
      deliveryReview = await updateDeliveryReview(
        orderId,
        {
          rating: dr.value ?? existingDelivery.rating,
          comment:
            req.body.delivery_comment !== undefined
              ? sanitizeComment(req.body.delivery_comment)
              : existingDelivery.comment,
        },
        client
      );
      await updatePartnerRating(existingDelivery.delivery_partner_id, client);
    } else if (dr.value != null) {
      const partnerId = await resolvePartnerIdForOrder(orderId, client);
      if (partnerId) {
        deliveryReview = await createDeliveryReview(
          {
            user_id: req.user.id,
            delivery_partner_id: partnerId,
            order_id: orderId,
            rating: dr.value,
            comment: sanitizeComment(req.body.delivery_comment),
          },
          client
        );
        await updatePartnerRating(partnerId, client);
      }
    }

    let orderFeedback = existingOverall;
    if (existingOverall) {
      orderFeedback = await updateOrderFeedback(
        orderId,
        {
          overall_rating: or.value,
          comment:
            req.body.comment !== undefined
              ? sanitizeComment(req.body.comment)
              : undefined,
          tags: req.body.tags,
        },
        client
      );
    } else if (or.value != null || req.body.comment) {
      orderFeedback = await createOrderFeedback(
        {
          order_id: orderId,
          user_id: req.user.id,
          overall_rating: or.value,
          comment: sanitizeComment(req.body.comment),
          tags: req.body.tags,
        },
        client
      );
    }

    await client.query('COMMIT');
    await updateRestaurantRating(order.restaurant_id);

    return ok(res, 'Feedback updated', {
      restaurant_review: restaurantReview,
      delivery_review: deliveryReview,
      order_feedback: orderFeedback,
    });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    return fail(res, 500, 'Server Error', err);
  } finally {
    client.release();
  }
};

const deleteFeedback = async (req, res) => {
  const client = await pool.connect();
  try {
    const orderId = req.params.id;
    const order = await getOrderById(orderId);
    if (!order) return fail(res, 404, 'Order not found');
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return fail(res, 403, 'Not authorized');
    }

    const existingReview = await getReviewByOrder(orderId, order.user_id);
    const existingDelivery = await getDeliveryReviewByOrder(orderId);
    const existingOverall = await getOrderFeedbackRow(orderId);
    if (!existingReview && !existingDelivery && !existingOverall) {
      return fail(res, 404, 'No feedback found for this order');
    }

    await client.query('BEGIN');
    if (existingReview) {
      await deleteReview(existingReview.id, client);
    }
    let partnerId = null;
    if (existingDelivery) {
      partnerId = existingDelivery.delivery_partner_id;
      await deleteDeliveryReview(orderId, client);
    }
    if (existingOverall) {
      await deleteOrderFeedbackRow(orderId, client);
    }
    await client.query('COMMIT');

    await updateRestaurantRating(order.restaurant_id);
    if (partnerId) await updatePartnerRating(partnerId);

    return ok(res, 'Feedback deleted', { order_id: orderId });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    return fail(res, 500, 'Server Error', err);
  } finally {
    client.release();
  }
};

module.exports = {
  getFeedback,
  submitFeedback,
  updateFeedback,
  deleteFeedback,
};
