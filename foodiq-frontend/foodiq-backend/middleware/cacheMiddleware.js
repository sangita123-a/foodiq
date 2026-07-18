/**
 * Express helpers: cache GET responses, invalidate on writes.
 */
const cache = require('../services/cacheService');

const sendCached = (res, payload, cacheStatus) => {
  res.setHeader('X-Cache', cacheStatus || 'MISS');
  res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
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
  ]);
};

module.exports = {
  sendCached,
  withCacheHeaders,
  invalidateCatalog,
};
