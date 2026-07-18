/**
 * Redis cache with in-memory fallback (works without Redis locally).
 * Supports TTL, pattern invalidation, hit/miss stats.
 */
const crypto = require('crypto');

let redis = null;
let redisReady = false;

const memory = new Map(); // key -> { value, expiresAt }
const stats = { hits: 0, misses: 0, sets: 0, deletes: 0, mode: 'memory' };

const DEFAULT_TTL = Number(process.env.CACHE_TTL_SECONDS || 60);

const connectRedis = async () => {
  if (String(process.env.REDIS_ENABLED || '').toLowerCase() === 'false') {
    stats.mode = 'memory';
    return null;
  }
  const url = process.env.REDIS_URL || process.env.REDIS_URI;
  if (!url && !process.env.REDIS_HOST) {
    stats.mode = 'memory';
    return null;
  }
  try {
    const Redis = require('ioredis');
    redis = url
      ? new Redis(url, {
          maxRetriesPerRequest: 1,
          enableReadyCheck: true,
          lazyConnect: true,
        })
      : new Redis({
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: Number(process.env.REDIS_PORT || 6379),
          password: process.env.REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: 1,
          lazyConnect: true,
        });
    redis.on('error', (err) => {
      if (redisReady) console.warn('[cache] redis error', err.message);
      redisReady = false;
      stats.mode = 'memory';
    });
    redis.on('connect', () => {
      redisReady = true;
      stats.mode = 'redis';
      console.log('[cache] Redis connected');
    });
    await redis.connect().catch(() => {
      redis = null;
      redisReady = false;
      stats.mode = 'memory';
    });
    return redis;
  } catch (err) {
    console.warn('[cache] Redis unavailable, using memory', err.message);
    redis = null;
    redisReady = false;
    stats.mode = 'memory';
    return null;
  }
};

const memGet = (key) => {
  const row = memory.get(key);
  if (!row) return null;
  if (row.expiresAt && Date.now() > row.expiresAt) {
    memory.delete(key);
    return null;
  }
  return row.value;
};

const memSet = (key, value, ttlSec) => {
  memory.set(key, {
    value,
    expiresAt: ttlSec > 0 ? Date.now() + ttlSec * 1000 : null,
  });
  // Bound memory map
  if (memory.size > Number(process.env.CACHE_MEMORY_MAX_KEYS || 2000)) {
    const first = memory.keys().next().value;
    memory.delete(first);
  }
};

const prefix = () => process.env.CACHE_PREFIX || 'foodiq:';

const cacheKey = (ns, parts = {}) => {
  const hash = crypto
    .createHash('sha1')
    .update(JSON.stringify(parts))
    .digest('hex')
    .slice(0, 16);
  return `${prefix()}${ns}:${hash}`;
};

const get = async (key) => {
  try {
    if (redis && redisReady) {
      const raw = await redis.get(key);
      if (raw != null) {
        stats.hits += 1;
        return JSON.parse(raw);
      }
      stats.misses += 1;
      return null;
    }
  } catch {
    /* fall through */
  }
  const v = memGet(key);
  if (v != null) {
    stats.hits += 1;
    return v;
  }
  stats.misses += 1;
  return null;
};

const set = async (key, value, ttlSec = DEFAULT_TTL) => {
  stats.sets += 1;
  memSet(key, value, ttlSec);
  try {
    if (redis && redisReady) {
      const payload = JSON.stringify(value);
      if (ttlSec > 0) await redis.set(key, payload, 'EX', ttlSec);
      else await redis.set(key, payload);
    }
  } catch {
    /* memory already set */
  }
};

const del = async (key) => {
  stats.deletes += 1;
  memory.delete(key);
  try {
    if (redis && redisReady) await redis.del(key);
  } catch {
    /* ignore */
  }
};

const invalidatePattern = async (pattern) => {
  const full = `${prefix()}${pattern}*`;
  // Memory
  for (const key of [...memory.keys()]) {
    if (key.startsWith(`${prefix()}${pattern}`)) memory.delete(key);
  }
  try {
    if (redis && redisReady) {
      const stream = redis.scanStream({ match: full, count: 100 });
      const pipeline = redis.pipeline();
      let n = 0;
      await new Promise((resolve, reject) => {
        stream.on('data', (keys) => {
          keys.forEach((k) => {
            pipeline.del(k);
            n += 1;
          });
        });
        stream.on('end', resolve);
        stream.on('error', reject);
      });
      if (n) await pipeline.exec();
      stats.deletes += n;
    }
  } catch (err) {
    console.warn('[cache] invalidate failed', err.message);
  }
};

/**
 * Cache-aside helper
 */
const wrap = async (key, ttlSec, producer) => {
  const cached = await get(key);
  if (cached != null) return { data: cached, cache: 'HIT' };
  const data = await producer();
  await set(key, data, ttlSec);
  return { data, cache: 'MISS' };
};

const getStats = () => {
  const total = stats.hits + stats.misses;
  return {
    ...stats,
    hit_ratio: total ? Number(((stats.hits / total) * 100).toFixed(2)) : 0,
    memory_keys: memory.size,
    redis_ready: redisReady,
  };
};

const warm = async (entries = []) => {
  for (const { key, ttl, producer } of entries) {
    try {
      const data = await producer();
      await set(key, data, ttl ?? DEFAULT_TTL);
    } catch (err) {
      console.warn('[cache] warm failed', key, err.message);
    }
  }
};

module.exports = {
  connectRedis,
  get,
  set,
  del,
  invalidatePattern,
  wrap,
  cacheKey,
  getStats,
  warm,
  getRedis: () => (redisReady ? redis : null),
  DEFAULT_TTL,
};
