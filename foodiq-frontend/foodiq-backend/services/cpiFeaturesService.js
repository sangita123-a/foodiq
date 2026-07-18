const { pool } = require('../config/db');
const { recommendRestaurants } = require('./recommendationService');
const { personalizedOffers } = require('./personalizedOffersService');
const { listRecent } = require('../models/recentlyViewedModel');
const { listActiveCampaigns, listCollections } = require('../models/collectionModel');
const { isEnabled } = require('./featureFlagService');

/**
 * Rank coupons/offers for the current cart context.
 */
const recommendCouponsForCart = async ({ userId = null, cartTotal = 0, limit = 5 } = {}) => {
  const lim = Math.min(Number(limit) || 5, 15);
  let rows = [];
  try {
    const r = await pool.query(
      `SELECT id, code, title, description, discount_type, discount_value, is_active, created_at
       FROM offers WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 40`
    );
    rows = r.rows.map((o) => ({ ...o, min_order_amount: 0 }));
  } catch {
    try {
      const r = await pool.query(
        `SELECT id, code, discount_type, discount_amount AS discount_value,
                is_active, created_at
         FROM coupons WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 40`
      );
      rows = r.rows.map((o) => ({
        ...o,
        min_order_amount: 0,
        title: null,
        description: null,
      }));
    } catch {
      rows = [];
    }
  }

  const total = Number(cartTotal) || 0;
  const scored = rows.map((o) => {
    const min = Number(o.min_order_amount) || 0;
    let score = 50;
    if (min > 0 && total >= min) score += 30;
    if (min > 0 && total < min) score -= 20;
    if (o.discount_type === 'percentage' || o.discount_type === 'percent') {
      score += Math.min(Number(o.discount_value) || 0, 40);
    } else {
      score += Math.min((Number(o.discount_value) || 0) / 10, 30);
    }
    if (userId) score += 5;
    const estimated_savings =
      o.discount_type === 'percentage' || o.discount_type === 'percent'
        ? Math.round((total * (Number(o.discount_value) || 0)) / 100)
        : Number(o.discount_value) || 0;
    return {
      ...o,
      score,
      eligible: min <= 0 || total >= min,
      estimated_savings,
    };
  });
  scored.sort((a, b) => b.score - a.score);
  return {
    strategy: 'cart_context',
    recommendations: scored.slice(0, lim),
  };
};

/**
 * Personalized home feed — composes existing rails when flags allow.
 */
const getPersonalizedHome = async ({ userId = null, lat = null, lng = null } = {}) => {
  const [
    recsOn,
    offersOn,
    recentOn,
    campaignsOn,
    collectionsOn,
    trendingOn,
  ] = await Promise.all([
    isEnabled('ai_recommendations', { userId }),
    isEnabled('coupon_recommendations', { userId }),
    isEnabled('recently_viewed', { userId }),
    isEnabled('seasonal_campaigns', { userId }),
    isEnabled('collections', { userId }),
    isEnabled('trending_near_you', { userId }),
  ]);

  const tasks = [];
  tasks.push(
    recsOn.enabled
      ? recommendRestaurants({ userId, limit: 8 })
      : Promise.resolve(null)
  );
  tasks.push(
    offersOn.enabled
      ? personalizedOffers({ userId, limit: 6 })
      : Promise.resolve(null)
  );
  tasks.push(
    recentOn.enabled && userId
      ? listRecent({ userId, limit: 8 })
      : Promise.resolve([])
  );
  tasks.push(
    campaignsOn.enabled ? listActiveCampaigns() : Promise.resolve([])
  );
  tasks.push(
    collectionsOn.enabled ? listCollections({ limit: 6 }) : Promise.resolve([])
  );
  tasks.push(
    trendingOn.enabled
      ? getTrendingNearYou({ lat, lng, limit: 8 })
      : Promise.resolve(null)
  );

  const [recommendations, offers, recently_viewed, campaigns, collections, trending] =
    await Promise.all(tasks);

  return {
    personalized: !!userId,
    recommendations,
    offers,
    recently_viewed,
    campaigns,
    collections,
    trending,
  };
};

/**
 * Trending dishes near a lat/lng (falls back to global trending_score).
 */
const getTrendingNearYou = async ({ lat = null, lng = null, city = null, limit = 12 } = {}) => {
  const lim = Math.min(Number(limit) || 12, 30);
  const hasGeo = lat != null && lng != null && !Number.isNaN(Number(lat));

  if (hasGeo) {
    const { rows } = await pool.query(
      `SELECT m.id, m.name, m.image_url, m.price, m.discount_price, m.rating,
              m.is_trending, m.trending_score, r.id AS restaurant_id, r.name AS restaurant_name,
              r.distance_km,
              (
                6371 * acos(
                  LEAST(1.0, GREATEST(-1.0,
                    cos(radians($1)) * cos(radians(COALESCE(r.lat, $1)))
                    * cos(radians(COALESCE(r.lng, $2)) - radians($2))
                    + sin(radians($1)) * sin(radians(COALESCE(r.lat, $1)))
                  ))
                )
              ) AS distance_computed
       FROM menu_items m
       JOIN restaurants r ON r.id = m.restaurant_id
       WHERE r.is_active = TRUE
         AND (m.is_available IS NULL OR m.is_available = TRUE)
         AND (m.is_trending = TRUE OR COALESCE(m.trending_score, 0) > 0 OR m.rating >= 4.2)
       ORDER BY
         CASE WHEN r.lat IS NOT NULL THEN 0 ELSE 1 END,
         distance_computed ASC NULLS LAST,
         COALESCE(m.trending_score, 0) DESC,
         m.rating DESC NULLS LAST
       LIMIT $3`,
      [Number(lat), Number(lng), lim]
    );
    return { strategy: 'geo', items: rows };
  }

  if (city) {
    const { rows } = await pool.query(
      `SELECT m.id, m.name, m.image_url, m.price, m.discount_price, m.rating,
              m.is_trending, m.trending_score, r.id AS restaurant_id, r.name AS restaurant_name
       FROM menu_items m
       JOIN restaurants r ON r.id = m.restaurant_id
       WHERE r.is_active = TRUE
         AND (m.is_available IS NULL OR m.is_available = TRUE)
         AND r.address ILIKE $1
       ORDER BY COALESCE(m.trending_score, 0) DESC, m.rating DESC NULLS LAST
       LIMIT $2`,
      [`%${city}%`, lim]
    );
    if (rows.length) return { strategy: 'city', items: rows };
  }

  const { rows } = await pool.query(
    `SELECT m.id, m.name, m.image_url, m.price, m.discount_price, m.rating,
            m.is_trending, m.trending_score, r.id AS restaurant_id, r.name AS restaurant_name
     FROM menu_items m
     JOIN restaurants r ON r.id = m.restaurant_id
     WHERE r.is_active = TRUE
       AND (m.is_available IS NULL OR m.is_available = TRUE)
     ORDER BY COALESCE(m.trending_score, 0) DESC, m.rating DESC NULLS LAST
     LIMIT $1`,
    [lim]
  );
  return { strategy: 'global', items: rows };
};

/**
 * Improved ETA: distance + prep buffer + peak-hour factor.
 */
const computeImprovedEta = ({
  distanceKm,
  prepMinutes = 15,
  avgKmh = 22,
  now = new Date(),
}) => {
  if (distanceKm == null || Number.isNaN(Number(distanceKm))) {
    return { eta_minutes: null, eta_source: 'unknown' };
  }
  const travel = Math.max(1, Math.round((Number(distanceKm) / avgKmh) * 60));
  const hour = now.getHours();
  const peak = (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
  const trafficFactor = peak ? 1.25 : 1.0;
  const eta = Math.round(travel * trafficFactor + Number(prepMinutes || 15));
  return {
    eta_minutes: Math.max(5, eta),
    eta_source: peak ? 'haversine_peak' : 'haversine_buffered',
    breakdown: { travel, prep: Number(prepMinutes) || 15, trafficFactor },
  };
};

module.exports = {
  recommendCouponsForCart,
  getPersonalizedHome,
  getTrendingNearYou,
  computeImprovedEta,
};
