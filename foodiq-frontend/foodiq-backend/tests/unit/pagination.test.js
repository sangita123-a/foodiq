/**
 * Unit tests — pagination helpers (Node built-in test runner).
 * Run: node --test tests/unit/pagination.test.js
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { clamp, parsePagination, paginatedMeta } = require('../../utils/pagination');

describe('pagination.clamp', () => {
  it('clamps below min', () => {
    assert.equal(clamp(0, 1, 10), 1);
  });
  it('clamps above max', () => {
    assert.equal(clamp(99, 1, 10), 10);
  });
  it('passes through in range', () => {
    assert.equal(clamp(5, 1, 10), 5);
  });
});

describe('pagination.parsePagination', () => {
  it('defaults page/limit', () => {
    const p = parsePagination({});
    assert.equal(p.page, 1);
    assert.equal(p.limit, 20);
    assert.equal(p.offset, 0);
  });
  it('computes offset', () => {
    const p = parsePagination({ page: '3', limit: '10' });
    assert.equal(p.page, 3);
    assert.equal(p.limit, 10);
    assert.equal(p.offset, 20);
  });
  it('respects maxLimit', () => {
    const p = parsePagination({ limit: '999' }, { page: 1, limit: 20, maxLimit: 100 });
    assert.equal(p.limit, 100);
  });
});

describe('pagination.paginatedMeta', () => {
  it('computes totalPages', () => {
    const m = paginatedMeta(45, 2, 20);
    assert.equal(m.total, 45);
    assert.equal(m.totalPages, 3);
  });
});
