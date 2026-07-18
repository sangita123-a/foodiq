const { ok, fail } = require('../utils/respond');
const {
  listWishlist,
  addToWishlist,
  removeFromWishlist,
} = require('../models/wishlistModel');
const { recordView, listRecent } = require('../models/recentlyViewedModel');
const {
  getOrCreateReferralCode,
  listReferralStats,
} = require('../models/referralModel');
const {
  purchaseGiftCard,
  getByCode,
  redeemGiftCard,
  listMyGiftCards,
} = require('../models/giftCardModel');
const {
  listCollections,
  getCollectionBySlug,
  listActiveCampaigns,
} = require('../models/collectionModel');
const {
  getPersonalizedHome,
  getTrendingNearYou,
  recommendCouponsForCart,
  computeImprovedEta,
} = require('../services/cpiFeaturesService');
const { getFoodRecommendations } = require('../services/aiRecommendationService');
const {
  getClientFlags,
  listFlags,
  upsertFlag,
  isEnabled,
} = require('../services/featureFlagService');

const getWishlist = async (req, res) => {
  try {
    const flag = await isEnabled('wishlist', { userId: req.user.id });
    if (!flag.enabled) return fail(res, 403, 'Wishlist feature is not enabled');
    return ok(res, 'Wishlist', await listWishlist(req.user.id));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const postWishlist = async (req, res) => {
  try {
    const menuItemId = req.body.menu_item_id || req.params.menuItemId;
    if (!menuItemId) return fail(res, 400, 'menu_item_id is required');
    const row = await addToWishlist(req.user.id, menuItemId, req.body.note || null);
    return ok(res, 'Added to wishlist', row, 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const deleteWishlist = async (req, res) => {
  try {
    const menuItemId = req.params.menuItemId || req.body.menu_item_id;
    if (!menuItemId) return fail(res, 400, 'menu_item_id is required');
    await removeFromWishlist(req.user.id, menuItemId);
    return ok(res, 'Removed from wishlist');
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const postView = async (req, res) => {
  try {
    const itemType = req.body.item_type;
    const itemId = req.body.item_id;
    if (!itemType || !itemId) return fail(res, 400, 'item_type and item_id are required');
    if (!['restaurant', 'menu_item'].includes(itemType)) {
      return fail(res, 400, 'item_type must be restaurant or menu_item');
    }
    const row = await recordView({
      userId: req.user?.id || null,
      sessionKey: req.body.session_key || req.get('x-session-key') || null,
      itemType,
      itemId,
    });
    return ok(res, 'View recorded', row, 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const getRecentViews = async (req, res) => {
  try {
    const rows = await listRecent({
      userId: req.user?.id || null,
      sessionKey: req.query.session_key || req.get('x-session-key') || null,
      limit: req.query.limit,
    });
    return ok(res, 'Recently viewed', rows);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const getReferral = async (req, res) => {
  try {
    const stats = await listReferralStats(req.user.id);
    return ok(res, 'Referral', stats);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const ensureReferralCode = async (req, res) => {
  try {
    const row = await getOrCreateReferralCode(req.user.id, req.user.full_name);
    return ok(res, 'Referral code', row);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const postGiftCardPurchase = async (req, res) => {
  try {
    const flag = await isEnabled('gift_cards', { userId: req.user.id });
    if (!flag.enabled) return fail(res, 403, 'Gift cards are not enabled for your account');
    const card = await purchaseGiftCard({
      purchaserId: req.user.id,
      amount: req.body.amount,
      recipientEmail: req.body.recipient_email || null,
      currency: req.body.currency || 'INR',
    });
    return ok(res, 'Gift card purchased', card, 201);
  } catch (err) {
    return fail(res, err.status || 500, err.message || 'Server Error', err);
  }
};

const getGiftCardBalance = async (req, res) => {
  try {
    const card = await getByCode(req.params.code || req.query.code);
    if (!card) return fail(res, 404, 'Gift card not found');
    return ok(res, 'Gift card', {
      code: card.code,
      balance: card.balance,
      currency: card.currency,
      status: card.status,
      expires_at: card.expires_at,
    });
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const postGiftCardRedeem = async (req, res) => {
  try {
    const result = await redeemGiftCard({
      code: req.body.code,
      userId: req.user.id,
      amount: req.body.amount,
      orderId: req.body.order_id || null,
    });
    return ok(res, 'Gift card applied', result);
  } catch (err) {
    return fail(res, err.status || 500, err.message || 'Server Error', err);
  }
};

const getMyGiftCards = async (req, res) => {
  try {
    return ok(res, 'Gift cards', await listMyGiftCards(req.user.id));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const getCollections = async (req, res) => {
  try {
    return ok(res, 'Collections', await listCollections({ limit: req.query.limit }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const getCollection = async (req, res) => {
  try {
    const row = await getCollectionBySlug(req.params.slug);
    if (!row) return fail(res, 404, 'Collection not found');
    return ok(res, 'Collection', row);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const getCampaigns = async (req, res) => {
  try {
    return ok(res, 'Campaigns', await listActiveCampaigns());
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const getHomeFeed = async (req, res) => {
  try {
    const feed = await getPersonalizedHome({
      userId: req.user?.id || null,
      lat: req.query.lat,
      lng: req.query.lng,
    });
    return ok(res, 'Personalized home', feed);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const getTrending = async (req, res) => {
  try {
    const data = await getTrendingNearYou({
      lat: req.query.lat,
      lng: req.query.lng,
      city: req.query.city,
      limit: req.query.limit,
    });
    return ok(res, 'Trending near you', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const getRecommendations = async (req, res) => {
  try {
    const data = await getFoodRecommendations({
      userId: req.user?.id || null,
      limit: req.query.limit,
    });
    return ok(res, 'Recommendations', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const getCouponRecs = async (req, res) => {
  try {
    const data = await recommendCouponsForCart({
      userId: req.user?.id || null,
      cartTotal: req.query.cart_total || req.body?.cart_total,
      limit: req.query.limit,
    });
    return ok(res, 'Coupon recommendations', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const postEtaEstimate = async (req, res) => {
  try {
    const result = computeImprovedEta({
      distanceKm: req.body.distance_km,
      prepMinutes: req.body.prep_minutes,
      avgKmh: req.body.avg_kmh,
    });
    return ok(res, 'ETA estimate', result);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const getFlags = async (req, res) => {
  try {
    const flags = await getClientFlags(req.user?.id || null);
    return ok(res, 'Feature flags', flags);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminListFlags = async (req, res) => {
  try {
    return ok(res, 'Feature flags', await listFlags());
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminUpsertFlag = async (req, res) => {
  try {
    if (!req.body.key) return fail(res, 400, 'key is required');
    const row = await upsertFlag(req.body);
    return ok(res, 'Flag updated', row);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

module.exports = {
  getWishlist,
  postWishlist,
  deleteWishlist,
  postView,
  getRecentViews,
  getReferral,
  ensureReferralCode,
  postGiftCardPurchase,
  getGiftCardBalance,
  postGiftCardRedeem,
  getMyGiftCards,
  getCollections,
  getCollection,
  getCampaigns,
  getHomeFeed,
  getTrending,
  getRecommendations,
  getCouponRecs,
  postEtaEstimate,
  getFlags,
  adminListFlags,
  adminUpsertFlag,
};
