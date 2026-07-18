const {
  getAllLiveDeals,
  getLiveDealByRestaurantId,
  getLiveDealByCouponCode,
} = require('../models/liveDealModel');
const cache = require('../services/cacheService');

const listLiveDeals = async (req, res) => {
  try {
    const key = cache.cacheKey('live_deals:all', {});
    const { data: deals, cache: status } = await cache.wrap(
      key,
      Number(process.env.CACHE_TTL_OFFERS || 120),
      () => getAllLiveDeals()
    );
    res.setHeader('X-Cache', status);
    res.json({ success: true, message: 'Live deals retrieved', data: deals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getRestaurantLiveDeal = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { coupon } = req.query;
    const key = cache.cacheKey('live_deals:restaurant', {
      restaurantId,
      coupon: coupon || '',
    });
    const { data: deal, cache: status } = await cache.wrap(
      key,
      Number(process.env.CACHE_TTL_OFFERS || 120),
      async () => {
        if (coupon) return getLiveDealByCouponCode(coupon, restaurantId);
        return getLiveDealByRestaurantId(restaurantId);
      }
    );

    if (!deal) {
      return res.status(404).json({ success: false, message: 'No live deal for this restaurant', error: {} });
    }

    res.setHeader('X-Cache', status);
    res.json({ success: true, message: 'Live deal retrieved', data: deal });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { listLiveDeals, getRestaurantLiveDeal };
