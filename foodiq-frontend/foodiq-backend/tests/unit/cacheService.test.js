/**
 * Unit tests — cache key / wrap helpers (no Redis required).
 */
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

describe('cacheService', () => {
  let cache;

  before(() => {
    process.env.REDIS_ENABLED = 'false';
    // Fresh require after env
    delete require.cache[require.resolve('../../services/cacheService')];
    cache = require('../../services/cacheService');
  });

  it('builds stable cache keys', () => {
    const a = cache.cacheKey('restaurants:list', { page: 1 });
    const b = cache.cacheKey('restaurants:list', { page: 1 });
    const c = cache.cacheKey('restaurants:list', { page: 2 });
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.match(a, /^foodiq:/);
  });

  it('wrap returns MISS then HIT', async () => {
    const key = cache.cacheKey('test:unit', { n: Date.now() });
    let calls = 0;
    const producer = async () => {
      calls += 1;
      return { ok: true };
    };
    const first = await cache.wrap(key, 30, producer);
    const second = await cache.wrap(key, 30, producer);
    assert.equal(first.cache, 'MISS');
    assert.equal(second.cache, 'HIT');
    assert.equal(calls, 1);
    assert.deepEqual(second.data, { ok: true });
  });
});
