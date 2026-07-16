const {
  getReviewsByRestaurant,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
} = require('../models/reviewModel');
const { updateRestaurantRating } = require('../models/restaurantModel');

const getForRestaurant = async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;
    const reviews = await getReviewsByRestaurant(restaurantId);
    res.json({ success: true, message: 'Reviews retrieved', data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;
    // Always derive the reviewer from the authenticated user, never from the body.
    const user_id = req.user.id;
    const rating = Number(req.body.rating);
    const comment = req.body.comment;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'A rating between 1 and 5 is required', error: {} });
    }

    const newReview = await createReview({ user_id, restaurant_id: restaurantId, rating, comment });
    
    // Update the average rating for the restaurant
    await updateRestaurantRating(restaurantId);

    res.status(201).json({ success: true, message: 'Review created', data: newReview });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await getReviewById(id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found', error: {} });
    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this review', error: {} });
    }

    const updatedReview = await updateReview(id, req.body);
    
    // Update the average rating
    await updateRestaurantRating(updatedReview.restaurant_id);

    res.json({ success: true, message: 'Review updated', data: updatedReview });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await getReviewById(id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found', error: {} });
    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review', error: {} });
    }

    const deletedReview = await deleteReview(id);
    
    // Update the average rating
    await updateRestaurantRating(deletedReview.restaurant_id);

    res.json({ success: true, message: 'Review deleted', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { getForRestaurant, create, update, remove };
