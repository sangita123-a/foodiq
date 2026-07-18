/**
 * Express helpers: cache GET responses, invalidate on writes.
 */
const cache = require('../services/cacheService');

/** CDN-friendly defaults for public catalog JSON (no auth cookies required). */
const PUBLIC_CATALOG_CACHE =
  process.env.CACHE_CONTROL_PUBLIC ||
  'public, max-age=30, s-maxage=60, stale-while-revalidate=120';

const setCatalogHttpCache = (res, cacheStatus = 'MISS', { public: isPublic = true } = {}) => {
  res.setHeader('X-Cache', cacheStatus || 'MISS');
  if (isPublic) {
    res.setHeader('Cache-Control', PUBLIC_CATALOG_CACHE);
    res.setHeader('Vary', 'Accept-Encoding');
  } else {
    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
  }
};

const sendCached = (res, payload, cacheStatus, opts) => {
  setCatalogHttpCache(res, cacheStatus, opts);
  return res.json(payload);
};

/**
 * Middleware factory — only caches successful JSON GET bodies via controller cooperation.
 * Prefer using cache.wrap inside controllers for precise keys.
 */
const withCacheHeaders = (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (!res.getHeader('X-Cache')) res.setHeader('X-Cache', 'BYPASS');
    return originalJson(body);
  };
  next();
};

const invalidateCatalog = async () => {
  await Promise.all([
    cache.invalidatePattern('restaurants:'),
    cache.invalidatePattern('menu:'),
    cache.invalidatePattern('categories:'),
    cache.invalidatePattern('offers:'),
    cache.invalidatePattern('cuisines:'),
    cache.invalidatePattern('live_deals:'),
    cache.invalidatePattern('search:'),
    cache.invalidatePattern('suggest:'),
    cache.invalidatePattern('collections:'),
  ]);
};

module.exports = {
  sendCached,
  setCatalogHttpCache,
  withCacheHeaders,
  invalidateCatalog,
};
