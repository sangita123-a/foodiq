const {
  getReviewsByRestaurant,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getRatingDistribution,
  normalizeImageUrls,
} = require('../models/reviewModel');
const { updateRestaurantRating } = require('../models/restaurantModel');
const { getOrderById } = require('../models/orderModel');
const { ok, fail } = require('../utils/respond');

const getForRestaurant = async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;
    const [reviews, summary] = await Promise.all([
      getReviewsByRestaurant(restaurantId),
      getRatingDistribution(restaurantId),
    ]);
    return ok(res, 'Reviews retrieved', { reviews, summary });
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
};

const create = async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;
    const user_id = req.user.id;
    const rating = Number(req.body.rating);
    const comment = req.body.comment;
    const order_id = req.body.order_id || null;

    if (!rating || rating < 1 || rating > 5) {
      return fail(res, 400, 'A rating between 1 and 5 is required');
    }

    if (!order_id) {
      return fail(res, 400, 'order_id is required — only customers who completed an order can review');
    }

    const order = await getOrderById(order_id);
    if (!order) return fail(res, 404, 'Order not found');
    if (order.user_id !== user_id) return fail(res, 403, 'Not authorized for this order');
    if (String(order.restaurant_id) !== String(restaurantId)) {
      return fail(res, 400, 'Order does not belong to this restaurant');
    }
    const delivered = String(order.status || '').toLowerCase() === 'delivered';
    if (!delivered) {
      return fail(res, 400, 'Order must be delivered before reviewing');
    }

    const newReview = await createReview({
      user_id,
      restaurant_id: restaurantId,
      rating,
      comment,
      order_id,
      image_urls: normalizeImageUrls(req.body.image_urls),
    });

    await updateRestaurantRating(restaurantId);

    try {
      const loyaltyEngine = require('../services/loyaltyEngine');
      await loyaltyEngine.creditReview(user_id, newReview.id);
    } catch {
      /* review points already credited or skipped */
    }

    return ok(res, 'Review created', newReview, 201);
  } catch (error) {
    if (error.code === '23505') {
      return fail(res, 409, 'You already reviewed this order');
    }
    return fail(res, 500, 'Server Error', error);
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await getReviewById(id);
    if (!review) return fail(res, 404, 'Review not found');
    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return fail(res, 403, 'Not authorized to modify this review');
    }
    if (req.body.rating != null) {
      const n = Number(req.body.rating);
      if (!Number.isFinite(n) || n < 1 || n > 5) {
        return fail(res, 400, 'rating must be between 1 and 5');
      }
    }

    const updatedReview = await updateReview(id, {
      ...req.body,
      image_urls: req.body.image_urls !== undefined ? normalizeImageUrls(req.body.image_urls) : undefined,
    });
    await updateRestaurantRating(updatedReview.restaurant_id);
    return ok(res, 'Review updated', updatedReview);
  } catch (error) {
    if (error.status === 400) return fail(res, 400, error.message);
    return fail(res, 500, 'Server Error', error);
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await getReviewById(id);
    if (!review) return fail(res, 404, 'Review not found');
    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return fail(res, 403, 'Not authorized to delete this review');
    }

    const deletedReview = await deleteReview(id);
    await updateRestaurantRating(deletedReview.restaurant_id);
    return ok(res, 'Review deleted', {});
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
};

module.exports = { getForRestaurant, create, update, remove };
