const {
  getAllLiveDeals,
  getLiveDealByRestaurantId,
  getLiveDealByCouponCode,
} = require('../models/liveDealModel');

const listLiveDeals = async (req, res) => {
  try {
    const deals = await getAllLiveDeals();
    res.json({ success: true, message: 'Live deals retrieved', data: deals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getRestaurantLiveDeal = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { coupon } = req.query;

    let deal;
    if (coupon) {
      deal = await getLiveDealByCouponCode(coupon, restaurantId);
    } else {
      deal = await getLiveDealByRestaurantId(restaurantId);
    }

    if (!deal) {
      return res.status(404).json({ success: false, message: 'No live deal for this restaurant', error: {} });
    }

    res.json({ success: true, message: 'Live deal retrieved', data: deal });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { listLiveDeals, getRestaurantLiveDeal };
