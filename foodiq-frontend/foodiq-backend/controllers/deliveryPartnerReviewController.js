const { pool } = require('../config/db');
const { ok, fail } = require('../utils/respond');
const { getOrderById } = require('../models/orderModel');
const reviewModel = require('../models/deliveryPartnerReviewModel');

const isDelivered = (status) =>
  String(status || '')
    .trim()
    .toLowerCase() === 'delivered';

const clampRating = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 5 || Math.floor(n) !== n) {
    return { error: 'rating must be an integer between 1 and 5' };
  }
  return { value: n };
};

const sanitizeReviewText = (raw, max = 2000) => {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  return s.slice(0, max);
};

/**
 * POST /api/orders/:id/review — customer rates & reviews the delivery
 * partner assigned to a delivered order. One review per order (enforced by
 * both an application check and the DB unique index on order_id).
 */
const createOrderReview = async (req, res) => {
  const client = await pool.connect();
  try {
    const orderId = req.params.id;
    const order = await getOrderById(orderId);
    if (!order) return fail(res, 404, 'Order not found');
    if (order.user_id !== req.user.id) {
      return fail(res, 403, 'Not authorized to review this order');
    }
    if (!isDelivered(order.status)) {
      return fail(res, 400, 'You can only review a delivery partner after the order has been delivered');
    }

    const existing = await reviewModel.getByOrderId(orderId);
    if (existing) {
      return fail(res, 409, 'You have already reviewed this order');
    }

    const rr = clampRating(req.body.rating);
    if (rr.error) return fail(res, 400, rr.error);

    const partnerId = await reviewModel.resolvePartnerIdForOrder(orderId, client);
    if (!partnerId) {
      return fail(res, 404, 'No delivery partner is assigned to this order');
    }

    await client.query('BEGIN');
    const review = await reviewModel.createReview(
      {
        orderId,
        partnerId,
        customerId: req.user.id,
        rating: rr.value,
        review: sanitizeReviewText(req.body.review),
      },
      client
    );
    await reviewModel.recomputeStats(partnerId, client);
    await client.query('COMMIT');

    return ok(res, 'Review submitted', review, 201);
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    if (err.code === '23505') {
      return fail(res, 409, 'You have already reviewed this order');
    }
    return fail(res, 500, 'Server Error', err);
  } finally {
    client.release();
  }
};

/** GET /api/orders/:id/review — the customer's own review for this order, if any. */
const getOrderReview = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await getOrderById(orderId);
    if (!order) return fail(res, 404, 'Order not found');
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return fail(res, 403, 'Not authorized to view this review');
    }

    const review = await reviewModel.getByOrderId(orderId);
    const partnerId = review ? review.partner_id : await reviewModel.resolvePartnerIdForOrder(orderId);
    return ok(res, 'Review retrieved', {
      reviewed: Boolean(review),
      review,
      can_review: !review && isDelivered(order.status) && Boolean(partnerId),
    });
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

/** GET /api/delivery/:partnerId/reviews — public delivery partner profile/reviews. */
const getPublicPartnerReviews = async (req, res) => {
  try {
    const stats = await reviewModel.getPartnerStatsSummary(req.params.partnerId);
    if (!stats) return fail(res, 404, 'Delivery partner not found');

    const data = await reviewModel.listForPartner(req.params.partnerId, {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
    });
    return ok(res, 'Delivery partner reviews retrieved', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

/** GET /api/delivery/me/partner-reviews — the logged-in partner's own reviews (self-service). */
const getMyPartnerReviews = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner?.id;
    if (!partnerId) return fail(res, 401, 'Unauthorized');
    const data = await reviewModel.listForPartner(partnerId, {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
    });
    return ok(res, 'Your reviews retrieved', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

/** GET /api/admin/delivery-reviews — search/filter/paginate across all reviews. */
const adminListPartnerReviews = async (req, res) => {
  try {
    const data = await reviewModel.listForAdmin({
      search: req.query.search || '',
      rating: req.query.rating,
      partnerId: req.query.partner_id || null,
      from: req.query.from || null,
      to: req.query.to || null,
      page: req.query.page,
      limit: req.query.limit,
    });
    return ok(res, 'Delivery partner reviews retrieved', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

/** DELETE /api/admin/delivery-reviews/:id — remove an abusive review and resync partner stats. */
const adminDeletePartnerReview = async (req, res) => {
  const client = await pool.connect();
  try {
    const existing = await reviewModel.getById(req.params.id);
    if (!existing) return fail(res, 404, 'Review not found');

    await client.query('BEGIN');
    await reviewModel.deleteById(existing.id, client);
    await reviewModel.recomputeStats(existing.partner_id, client);
    await client.query('COMMIT');

    return ok(res, 'Review deleted', { id: existing.id });
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

/** GET /api/admin/delivery-reviews/trends — daily rating trend for admin analytics. */
const adminReviewTrends = async (req, res) => {
  try {
    const trends = await reviewModel.getRatingTrends({ days: req.query.days });
    return ok(res, 'Rating trends retrieved', { trends });
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

module.exports = {
  createOrderReview,
  getOrderReview,
  getPublicPartnerReviews,
  getMyPartnerReviews,
  adminListPartnerReviews,
  adminDeletePartnerReview,
  adminReviewTrends,
};
