const { ok, fail } = require('../utils/respond');
const {
  createUserFeedback,
  listUserFeedback,
  updateUserFeedback,
} = require('../models/userFeedbackModel');
const { pool } = require('../config/db');
const { listAdminReviews, updateReview, getReviewById } = require('../models/reviewModel');
const { updateRestaurantRating } = require('../models/restaurantModel');

const sanitizeText = (s, max = 4000) =>
  String(s || '')
    .trim()
    .slice(0, max);

const submitFeedback = async (req, res) => {
  try {
    const message = sanitizeText(req.body.message, 4000);
    if (!message) return fail(res, 400, 'message is required');
    const row = await createUserFeedback({
      user_id: req.user?.id || null,
      category: sanitizeText(req.body.category || 'general', 80) || 'general',
      message,
      page_url: sanitizeText(req.body.page_url, 500) || null,
    });
    return ok(res, 'Feedback received', row, 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminListFeedback = async (req, res) => {
  try {
    const type = String(req.query.type || 'all');
    const status = req.query.status || null;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;

    const result = { product: [], support: [], contact: [] };

    if (type === 'all' || type === 'product') {
      result.product = await listUserFeedback({ status, limit, offset });
    }
    if (type === 'all' || type === 'support') {
      const values = [];
      let where = 'WHERE 1=1';
      if (status) {
        values.push(status);
        where += ` AND LOWER(status) = LOWER($${values.length})`;
      }
      values.push(limit, offset);
      const { rows } = await pool.query(
        `SELECT t.*, u.full_name, u.email
         FROM support_tickets t
         LEFT JOIN users u ON u.id = t.user_id
         ${where}
         ORDER BY t.created_at DESC
         LIMIT $${values.length - 1} OFFSET $${values.length}`,
        values
      );
      result.support = rows;
    }
    if (type === 'all' || type === 'contact') {
      const values = [];
      let where = 'WHERE 1=1';
      if (status) {
        values.push(status);
        where += ` AND COALESCE(status, 'open') = $${values.length}`;
      }
      values.push(limit, offset);
      const { rows } = await pool.query(
        `SELECT * FROM contact_messages
         ${where}
         ORDER BY created_at DESC
         LIMIT $${values.length - 1} OFFSET $${values.length}`,
        values
      );
      result.contact = rows;
    }

    return ok(res, 'Feedback inbox', result);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminPatchProductFeedback = async (req, res) => {
  try {
    const row = await updateUserFeedback(req.params.id, {
      status: req.body.status,
      admin_notes: req.body.admin_notes,
    });
    if (!row) return fail(res, 404, 'Feedback not found');
    return ok(res, 'Feedback updated', row);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminPatchSupport = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE support_tickets
       SET status = COALESCE($1, status),
           admin_notes = COALESCE($2, admin_notes),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [req.body.status || null, req.body.admin_notes ?? null, req.params.id]
    );
    if (!rows[0]) return fail(res, 404, 'Ticket not found');
    return ok(res, 'Ticket updated', rows[0]);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminPatchContact = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE contact_messages
       SET status = COALESCE($1, status)
       WHERE id = $2
       RETURNING *`,
      [req.body.status || null, req.params.id]
    );
    if (!rows[0]) return fail(res, 404, 'Message not found');
    return ok(res, 'Contact updated', rows[0]);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminListReviews = async (req, res) => {
  try {
    const rows = await listAdminReviews({
      status: req.query.status || null,
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return ok(res, 'Reviews', rows);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminPatchReview = async (req, res) => {
  try {
    const existing = await getReviewById(req.params.id);
    if (!existing) return fail(res, 404, 'Review not found');
    const updated = await updateReview(req.params.id, {
      status: req.body.status,
      admin_reply: req.body.admin_reply,
      rating: req.body.rating,
      comment: req.body.comment,
    });
    if (updated?.restaurant_id) {
      await updateRestaurantRating(updated.restaurant_id);
    }
    return ok(res, 'Review updated', updated);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

module.exports = {
  submitFeedback,
  adminListFeedback,
  adminPatchProductFeedback,
  adminPatchSupport,
  adminPatchContact,
  adminListReviews,
  adminPatchReview,
};
