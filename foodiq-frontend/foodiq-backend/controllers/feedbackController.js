const { ok, fail } = require('../utils/respond');
const {
  createUserFeedback,
  listUserFeedback,
  updateUserFeedback,
} = require('../models/userFeedbackModel');
const { pool } = require('../config/db');
const { listAdminReviews, updateReview, getReviewById, deleteReview } = require('../models/reviewModel');
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
    const isRead = req.body.is_read === true || req.body.status === 'read';
    const { rows } = await pool.query(
      `UPDATE contact_messages
       SET status = COALESCE($1, status),
           admin_reply = COALESCE($2, admin_reply),
           is_read = CASE WHEN $3 THEN TRUE WHEN $1 = 'open' THEN FALSE ELSE is_read END
       WHERE id = $4
       RETURNING *`,
      [req.body.status || null, req.body.admin_reply ?? null, isRead, req.params.id]
    );
    if (!rows[0]) return fail(res, 404, 'Message not found');
    return ok(res, 'Contact updated', rows[0]);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminDeleteContact = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM contact_messages WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) return fail(res, 404, 'Message not found');
    return ok(res, 'Contact message deleted', { id: rows[0].id });
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminReplyContact = async (req, res) => {
  try {
    const reply = sanitizeText(req.body.admin_reply, 4000);
    if (!reply) return fail(res, 400, 'admin_reply is required');
    const { rows } = await pool.query(
      `UPDATE contact_messages
       SET admin_reply = $1, status = 'replied', is_read = TRUE
       WHERE id = $2
       RETURNING *`,
      [reply, req.params.id]
    );
    if (!rows[0]) return fail(res, 404, 'Message not found');
    return ok(res, 'Reply saved', rows[0]);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminExportContactCsv = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT name, email, phone, reason, subject, message, status, is_read, admin_reply, created_at
       FROM contact_messages ORDER BY created_at DESC LIMIT 5000`
    );
    const header = 'name,email,phone,reason,subject,message,status,is_read,admin_reply,created_at';
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map((r) =>
      [r.name, r.email, r.phone, r.reason, r.subject, r.message, r.status, r.is_read, r.admin_reply, r.created_at]
        .map(escape)
        .join(',')
    );
    const csv = [header, ...lines].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="contact-messages.csv"');
    return res.send(csv);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminListReviews = async (req, res) => {
  try {
    const data = await listAdminReviews({
      status: req.query.status || null,
      restaurantId: req.query.restaurant_id || null,
      rating: req.query.rating || null,
      from: req.query.from || null,
      to: req.query.to || null,
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return ok(res, 'Reviews', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminPatchReview = async (req, res) => {
  try {
    const existing = await getReviewById(req.params.id);
    if (!existing) return fail(res, 404, 'Review not found');
    if (req.body.rating != null) {
      const n = Number(req.body.rating);
      if (!Number.isFinite(n) || n < 1 || n > 5) {
        return fail(res, 400, 'rating must be between 1 and 5');
      }
    }
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
    if (err.status === 400) return fail(res, 400, err.message);
    return fail(res, 500, 'Server Error', err);
  }
};

const adminDeleteReview = async (req, res) => {
  try {
    const existing = await getReviewById(req.params.id);
    if (!existing) return fail(res, 404, 'Review not found');
    const deleted = await deleteReview(req.params.id);
    if (deleted?.restaurant_id) {
      await updateRestaurantRating(deleted.restaurant_id);
    }
    return ok(res, 'Review deleted', { id: deleted?.id });
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminListOrderFeedback = async (req, res) => {
  try {
    const { listAdminOrderFeedback } = require('../models/orderFeedbackModel');
    const data = await listAdminOrderFeedback({
      restaurantId: req.query.restaurant_id || null,
      deliveryPartnerId: req.query.delivery_partner_id || null,
      rating: req.query.rating || null,
      from: req.query.from || null,
      to: req.query.to || null,
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return ok(res, 'Order feedback', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminFeedbackAnalytics = async (req, res) => {
  try {
    const { buildReviewAnalytics } = require('../services/maintenanceReportService');
    const data = await buildReviewAnalytics(req.query.days);
    return ok(res, 'Feedback analytics', data);
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
  adminDeleteContact,
  adminReplyContact,
  adminExportContactCsv,
  adminListReviews,
  adminPatchReview,
  adminDeleteReview,
  adminListOrderFeedback,
  adminFeedbackAnalytics,
};
