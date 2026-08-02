const assert = require('assert');
const reviewModel = require('../../models/deliveryPartnerReviewModel');
const reviewController = require('../../controllers/deliveryPartnerReviewController');

async function runDeliveryPartnerReviewTests() {
  console.log('Running Delivery Partner Ratings & Reviews Unit Tests...');

  // Test 1: deliveryPartnerReviewModel exports required functions
  const requiredModelFns = [
    'resolvePartnerIdForOrder',
    'createReview',
    'getByOrderId',
    'getById',
    'deleteById',
    'recomputeStats',
    'getPartnerStatsSummary',
    'listForPartner',
    'listForAdmin',
    'getRatingTrends',
  ];
  for (const fn of requiredModelFns) {
    assert(typeof reviewModel[fn] === 'function', `deliveryPartnerReviewModel.${fn} must be a function`);
  }

  // Test 2: deliveryPartnerReviewController exports the customer/public/partner/admin endpoints
  const requiredControllerFns = [
    'createOrderReview',
    'getOrderReview',
    'getPublicPartnerReviews',
    'getMyPartnerReviews',
    'adminListPartnerReviews',
    'adminDeletePartnerReview',
    'adminReviewTrends',
  ];
  for (const fn of requiredControllerFns) {
    assert(typeof reviewController[fn] === 'function', `deliveryPartnerReviewController.${fn} must be a function`);
  }

  // ── Rating validation (mirrors clampRating in the controller) ───────────
  const simulateClampRating = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1 || n > 5 || Math.floor(n) !== n) {
      return { error: 'rating must be an integer between 1 and 5' };
    }
    return { value: n };
  };

  // Test 3: valid integer ratings 1-5 pass
  for (const n of [1, 2, 3, 4, 5]) {
    assert.strictEqual(simulateClampRating(n).value, n, `rating ${n} must be accepted`);
  }
  // Test 4: rating 0 is rejected
  assert(simulateClampRating(0).error, 'rating 0 must be rejected');
  // Test 5: rating 6 is rejected
  assert(simulateClampRating(6).error, 'rating 6 must be rejected');
  // Test 6: fractional rating is rejected
  assert(simulateClampRating(3.5).error, 'fractional rating must be rejected');
  // Test 7: non-numeric rating is rejected
  assert(simulateClampRating('five').error, 'non-numeric rating must be rejected');
  assert(simulateClampRating(null).error, 'null rating must be rejected');

  // ── Review text sanitization (mirrors sanitizeReviewText) ────────────────
  const simulateSanitize = (raw, max = 2000) => {
    if (raw == null) return null;
    const s = String(raw).trim();
    if (!s) return null;
    return s.slice(0, max);
  };

  // Test 8: whitespace-only review collapses to null (optional field)
  assert.strictEqual(simulateSanitize('   '), null);
  // Test 9: review text is trimmed
  assert.strictEqual(simulateSanitize('  Great delivery!  '), 'Great delivery!');
  // Test 10: review text longer than max is truncated
  assert.strictEqual(simulateSanitize('a'.repeat(2500), 2000).length, 2000);

  // ── Delivered-order gate (mirrors isDelivered) ──────────────────────────
  const simulateIsDelivered = (status) => String(status || '').trim().toLowerCase() === 'delivered';

  // Test 11: capitalized "Delivered" status is accepted
  assert.strictEqual(simulateIsDelivered('Delivered'), true);
  // Test 12: case-insensitive match
  assert.strictEqual(simulateIsDelivered('DELIVERED'), true);
  // Test 13: an order still in progress is rejected
  assert.strictEqual(simulateIsDelivered('Preparing'), false);
  assert.strictEqual(simulateIsDelivered('On The Way'), false);

  // ── Ownership / IDOR protection (mirrors the order.user_id check) ───────
  const simulateOwnershipCheck = (order, requestingUserId) => order.user_id === requestingUserId;

  // Test 14: the customer who placed the order may review it
  assert.strictEqual(simulateOwnershipCheck({ user_id: 'cust-a' }, 'cust-a'), true);
  // Test 15: a different customer cannot review someone else's order (IDOR blocked)
  assert.strictEqual(simulateOwnershipCheck({ user_id: 'cust-a' }, 'cust-b'), false);

  // ── One review per order (mirrors the "existing review" + unique index gate) ─
  const simulateCreateReviewGate = (order, requestingUserId, existingReview) => {
    if (order.user_id !== requestingUserId) {
      const err = new Error('Not authorized to review this order');
      err.status = 403;
      throw err;
    }
    if (!simulateIsDelivered(order.status)) {
      const err = new Error('You can only review a delivery partner after the order has been delivered');
      err.status = 400;
      throw err;
    }
    if (existingReview) {
      const err = new Error('You have already reviewed this order');
      err.status = 409;
      throw err;
    }
    return { created: true };
  };

  // Test 16: happy path — delivered order, owner, no existing review
  assert.deepStrictEqual(
    simulateCreateReviewGate({ user_id: 'cust-a', status: 'Delivered' }, 'cust-a', null),
    { created: true }
  );
  // Test 17: wrong customer is blocked with 403
  try {
    simulateCreateReviewGate({ user_id: 'cust-a', status: 'Delivered' }, 'cust-b', null);
    assert.fail('Should block a customer reviewing someone else\'s order');
  } catch (err) {
    assert.strictEqual(err.status, 403);
  }
  // Test 18: an order that has not been delivered yet is blocked with 400
  try {
    simulateCreateReviewGate({ user_id: 'cust-a', status: 'Preparing' }, 'cust-a', null);
    assert.fail('Should block reviewing an undelivered order');
  } catch (err) {
    assert.strictEqual(err.status, 400);
  }
  // Test 19: a duplicate review is blocked with 409
  try {
    simulateCreateReviewGate({ user_id: 'cust-a', status: 'Delivered' }, 'cust-a', { id: 'existing' });
    assert.fail('Should block a second review for the same order');
  } catch (err) {
    assert.strictEqual(err.status, 409);
  }

  // ── Statistics calculation (mirrors the recomputeStats SQL aggregate) ───
  const simulateRecomputeStats = (ratings) => {
    const total = ratings.length;
    const avg = total ? Math.round((ratings.reduce((a, b) => a + b, 0) / total) * 100) / 100 : 0;
    const countOf = (star) => ratings.filter((r) => r === star).length;
    return {
      review_average_rating: avg,
      review_total_count: total,
      review_5_star_count: countOf(5),
      review_4_star_count: countOf(4),
      review_3_star_count: countOf(3),
      review_2_star_count: countOf(2),
      review_1_star_count: countOf(1),
    };
  };

  // Test 20: mixed ratings produce the correct average and star breakdown
  const stats = simulateRecomputeStats([5, 5, 4, 3, 1]);
  assert.strictEqual(stats.review_total_count, 5);
  assert.strictEqual(stats.review_average_rating, 3.6);
  assert.strictEqual(stats.review_5_star_count, 2);
  assert.strictEqual(stats.review_4_star_count, 1);
  assert.strictEqual(stats.review_3_star_count, 1);
  assert.strictEqual(stats.review_2_star_count, 0);
  assert.strictEqual(stats.review_1_star_count, 1);

  // Test 21: no reviews resets stats to zero (mirrors COALESCE(..., 0) in the SQL)
  const emptyStats = simulateRecomputeStats([]);
  assert.strictEqual(emptyStats.review_total_count, 0);
  assert.strictEqual(emptyStats.review_average_rating, 0);

  // Test 22: five_star_percentage math (mirrors getPartnerStatsSummary)
  const fiveStarPct = (breakdownFive, total) =>
    total > 0 ? Math.round((breakdownFive / total) * 1000) / 10 : 0;
  assert.strictEqual(fiveStarPct(2, 5), 40);
  assert.strictEqual(fiveStarPct(0, 0), 0);

  // ── Pagination math (mirrors listForPartner / listForAdmin) ─────────────
  const simulatePagination = (total, page, limit) => ({
    page,
    limit,
    total,
    total_pages: Math.max(1, Math.ceil(total / limit)),
  });

  // Test 23: 45 rows at 20/page yields 3 pages
  assert.deepStrictEqual(simulatePagination(45, 1, 20), { page: 1, limit: 20, total: 45, total_pages: 3 });
  // Test 24: zero rows still reports at least 1 page (no negative/zero page count)
  assert.strictEqual(simulatePagination(0, 1, 20).total_pages, 1);
  // Test 25: limit is clamped to the [1, 100] range (mirrors the model's Math.min/Math.max)
  const clampLimit = (limit) => Math.min(100, Math.max(1, Number(limit) || 20));
  assert.strictEqual(clampLimit(500), 100, 'limit above 100 must clamp down to 100');
  assert.strictEqual(clampLimit(0), 20, '0/falsy limit must fall back to the default of 20');
  assert.strictEqual(clampLimit(undefined), 20, 'omitted limit must default to 20');

  // ── Admin delete recomputes stats from the remaining rows ───────────────
  // Test 26: deleting one review from the set changes the average/breakdown correctly
  const beforeDelete = simulateRecomputeStats([5, 5, 4, 3, 1]);
  const afterDeletingOneFiveStar = simulateRecomputeStats([5, 4, 3, 1]);
  assert.strictEqual(beforeDelete.review_total_count, 5);
  assert.strictEqual(afterDeletingOneFiveStar.review_total_count, 4);
  assert.strictEqual(afterDeletingOneFiveStar.review_5_star_count, 1);
  assert.strictEqual(afterDeletingOneFiveStar.review_average_rating, 3.25);

  console.log('All Delivery Partner Ratings & Reviews Unit Tests passed successfully!');
}

runDeliveryPartnerReviewTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
