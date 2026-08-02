const { pool } = require('../config/db');
const { resolvePartnerIdForOrder } = require('./deliveryReviewModel');

/**
 * Recomputes and persists the partner's rating statistics (average, total,
 * and 5/4/3/2/1 star breakdown) from delivery_partner_reviews. Must run in
 * the same transaction as any insert/update/delete of a review so the
 * stored stats never drift from the underlying rows.
 */
const recomputeStats = async (partnerId, client = pool) => {
  const { rows } = await client.query(
    `UPDATE delivery_partners dp
     SET review_average_rating = COALESCE(s.avg_rating, 0),
         review_total_count = COALESCE(s.total, 0),
         review_5_star_count = COALESCE(s.c5, 0),
         review_4_star_count = COALESCE(s.c4, 0),
         review_3_star_count = COALESCE(s.c3, 0),
         review_2_star_count = COALESCE(s.c2, 0),
         review_1_star_count = COALESCE(s.c1, 0)
     FROM (
       SELECT
         ROUND(AVG(rating)::numeric, 2) AS avg_rating,
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE rating = 5)::int AS c5,
         COUNT(*) FILTER (WHERE rating = 4)::int AS c4,
         COUNT(*) FILTER (WHERE rating = 3)::int AS c3,
         COUNT(*) FILTER (WHERE rating = 2)::int AS c2,
         COUNT(*) FILTER (WHERE rating = 1)::int AS c1
       FROM delivery_partner_reviews
       WHERE partner_id = $1
     ) s
     WHERE dp.id = $1
     RETURNING dp.review_average_rating, dp.review_total_count,
               dp.review_5_star_count, dp.review_4_star_count,
               dp.review_3_star_count, dp.review_2_star_count, dp.review_1_star_count`,
    [partnerId]
  );
  return rows[0] || null;
};

const getByOrderId = async (orderId) => {
  const { rows } = await pool.query(
    `SELECT * FROM delivery_partner_reviews WHERE order_id = $1 LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT * FROM delivery_partner_reviews WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

const createReview = async ({ orderId, partnerId, customerId, rating, review }, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO delivery_partner_reviews (order_id, partner_id, customer_id, rating, review)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [orderId, partnerId, customerId, rating, review || null]
  );
  return rows[0];
};

const deleteById = async (id, client = pool) => {
  const { rows } = await client.query(
    `DELETE FROM delivery_partner_reviews WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] || null;
};

const STAR_FIELDS = {
  5: 'review_5_star_count',
  4: 'review_4_star_count',
  3: 'review_3_star_count',
  2: 'review_2_star_count',
  1: 'review_1_star_count',
};

const getPartnerStatsSummary = async (partnerId) => {
  const { rows } = await pool.query(
    `SELECT review_average_rating, review_total_count,
            review_5_star_count, review_4_star_count,
            review_3_star_count, review_2_star_count, review_1_star_count
     FROM delivery_partners WHERE id = $1`,
    [partnerId]
  );
  const p = rows[0];
  if (!p) return null;

  const total = Number(p.review_total_count) || 0;
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: Number(p[STAR_FIELDS[star]]) || 0,
  }));

  const [{ rows: latestRows }] = await Promise.all([
    pool.query(
      `SELECT r.*, u.full_name AS customer_name
       FROM delivery_partner_reviews r
       LEFT JOIN users u ON u.id = r.customer_id
       WHERE r.partner_id = $1
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [partnerId]
    ),
  ]);

  return {
    average_rating: Number(p.review_average_rating) || 0,
    total_reviews: total,
    breakdown,
    five_star_percentage: total > 0 ? Math.round((breakdown[0].count / total) * 1000) / 10 : 0,
    latest_review: latestRows[0] || null,
  };
};

/**
 * Public/partner-facing paginated review listing with optional full-text
 * search across the review body and reviewer name.
 */
const listForPartner = async (partnerId, { page = 1, limit = 20, search = '' } = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const values = [partnerId];
  let searchClause = '';
  if (search) {
    values.push(`%${String(search).toLowerCase()}%`);
    searchClause = `AND (LOWER(COALESCE(r.review, '')) LIKE $${values.length} OR LOWER(COALESCE(u.full_name, '')) LIKE $${values.length})`;
  }

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM delivery_partner_reviews r
     LEFT JOIN users u ON u.id = r.customer_id
     WHERE r.partner_id = $1 ${searchClause}`,
    values
  );
  const total = countRes.rows[0]?.total || 0;

  const dataValues = [...values, limitNum, offset];
  const { rows } = await pool.query(
    `SELECT r.id, r.order_id, r.rating, r.review, r.created_at, r.updated_at,
            u.full_name AS customer_name
     FROM delivery_partner_reviews r
     LEFT JOIN users u ON u.id = r.customer_id
     WHERE r.partner_id = $1 ${searchClause}
     ORDER BY r.created_at DESC
     LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues
  );

  const stats = await getPartnerStatsSummary(partnerId);

  return {
    reviews: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      total_pages: Math.max(1, Math.ceil(total / limitNum)),
    },
    average_rating: stats?.average_rating || 0,
    total_reviews: stats?.total_reviews || 0,
    breakdown: stats?.breakdown || [],
    five_star_percentage: stats?.five_star_percentage || 0,
  };
};

/** Admin: search + filter + paginate across all delivery partner reviews. */
const listForAdmin = async ({
  search = '',
  rating = null,
  partnerId = null,
  from = null,
  to = null,
  page = 1,
  limit = 20,
} = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const values = [];

  if (search) {
    values.push(`%${String(search).toLowerCase()}%`);
    const idx = values.length;
    conditions.push(
      `(LOWER(COALESCE(r.review, '')) LIKE $${idx} OR LOWER(COALESCE(u.full_name, '')) LIKE $${idx} OR LOWER(COALESCE(dp.full_name, '')) LIKE $${idx})`
    );
  }
  if (rating != null && rating !== '') {
    values.push(Number(rating));
    conditions.push(`r.rating = $${values.length}`);
  }
  if (partnerId) {
    values.push(partnerId);
    conditions.push(`r.partner_id = $${values.length}`);
  }
  if (from) {
    values.push(from);
    conditions.push(`r.created_at::date >= $${values.length}::date`);
  }
  if (to) {
    values.push(to);
    conditions.push(`r.created_at::date <= $${values.length}::date`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const baseFrom = `
    FROM delivery_partner_reviews r
    LEFT JOIN users u ON u.id = r.customer_id
    LEFT JOIN delivery_partners dp ON dp.id = r.partner_id
    ${whereClause}
  `;

  const countRes = await pool.query(`SELECT COUNT(*)::int AS total ${baseFrom}`, values);
  const total = countRes.rows[0]?.total || 0;

  const dataValues = [...values, limitNum, offset];
  const { rows } = await pool.query(
    `SELECT r.*, u.full_name AS customer_name, u.email AS customer_email,
            dp.full_name AS partner_name, dp.email AS partner_email
     ${baseFrom}
     ORDER BY r.created_at DESC
     LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues
  );

  return {
    reviews: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      total_pages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
};

/** Admin: daily rating trend (avg rating + review count per day) for the last N days. */
const getRatingTrends = async ({ days = 30 } = {}) => {
  const dayCount = Math.min(180, Math.max(1, Number(days) || 30));
  const { rows } = await pool.query(
    `SELECT
       created_at::date AS day,
       COUNT(*)::int AS total_reviews,
       ROUND(AVG(rating)::numeric, 2)::float AS average_rating
     FROM delivery_partner_reviews
     WHERE created_at >= CURRENT_DATE - $1::int
     GROUP BY created_at::date
     ORDER BY day ASC`,
    [dayCount]
  );
  return rows;
};

module.exports = {
  resolvePartnerIdForOrder,
  createReview,
  getByOrderId,
  getById,
  deleteById,
  recomputeStats,
  getPartnerStatsSummary,
  listForPartner,
  listForAdmin,
  getRatingTrends,
};
