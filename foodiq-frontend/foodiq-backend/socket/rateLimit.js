/**
 * Lightweight per-socket rate limiter for inbound socket events.
 */
const buckets = new Map();

const prune = (key, now, windowMs) => {
  const list = buckets.get(key) || [];
  const fresh = list.filter((t) => now - t < windowMs);
  buckets.set(key, fresh);
  return fresh;
};

/**
 * @param {string} key unique key (e.g. `${socket.id}:updateLocation`)
 * @param {number} max max events in window
 * @param {number} windowMs window size
 * @returns {boolean} true if allowed
 */
const allow = (key, max = 5, windowMs = 1000) => {
  const now = Date.now();
  const fresh = prune(key, now, windowMs);
  if (fresh.length >= max) return false;
  fresh.push(now);
  buckets.set(key, fresh);
  return true;
};

setInterval(() => {
  const now = Date.now();
  for (const [key, list] of buckets.entries()) {
    const fresh = list.filter((t) => now - t < 60_000);
    if (fresh.length === 0) buckets.delete(key);
    else buckets.set(key, fresh);
  }
}, 60_000).unref?.();

module.exports = { allow };
