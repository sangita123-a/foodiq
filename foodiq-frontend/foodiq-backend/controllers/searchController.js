const { globalSearch, suggestSearch } = require('../models/searchModel');
const cache = require('../services/cacheService');
const { setCatalogHttpCache } = require('../middleware/cacheMiddleware');

const search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search term "q" is required', error: {} });
    }

    const term = String(q).trim().slice(0, 120);
    const key = cache.cacheKey('search:q', { q: term.toLowerCase() });
    const ttl = Number(process.env.CACHE_TTL_SEARCH || 30);
    const { data: results, cache: status } = await cache.wrap(key, ttl, () => globalSearch(term));
    setCatalogHttpCache(res, status);
    res.json({ success: true, message: 'Search completed', data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const suggest = async (req, res) => {
  try {
    const q = req.query.q || req.query.query || '';
    if (!q || String(q).trim().length < 2) {
      return res.json({ success: true, message: 'Suggestions', data: [] });
    }
    const term = String(q).trim().slice(0, 80);
    const lim = req.query.limit;
    const key = cache.cacheKey('suggest:q', { q: term.toLowerCase(), lim });
    const ttl = Number(process.env.CACHE_TTL_SUGGEST || 45);
    const { data: rows, cache: status } = await cache.wrap(key, ttl, () =>
      suggestSearch(term, lim)
    );
    setCatalogHttpCache(res, status);
    res.json({ success: true, message: 'Suggestions', data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { search, suggest };
