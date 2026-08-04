const { pool } = require('../config/db');

/** Restaurant verification document types (GST / FSSAI / PAN). */
const DOCUMENT_TYPES = ['gst', 'fssai', 'pan'];

/**
 * Admin creates/replaces a restaurant's document of a given type.
 * Re-submitting always resets it to 'pending' review.
 */
const upsertDocument = async ({ restaurantId, documentType, documentNumber, fileUrl }) => {
  const { rows } = await pool.query(
    `INSERT INTO restaurant_documents (
       restaurant_id, document_type, document_number, file_url, verification_status
     ) VALUES ($1, $2, $3, $4, 'pending')
     ON CONFLICT (restaurant_id, document_type) DO UPDATE SET
       document_number = EXCLUDED.document_number,
       file_url = COALESCE(EXCLUDED.file_url, restaurant_documents.file_url),
       verification_status = 'pending',
       rejection_reason = NULL,
       verified_by = NULL,
       verified_at = NULL,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [restaurantId, documentType, documentNumber || null, fileUrl || null]
  );
  return rows[0];
};

const listDocumentsByRestaurant = async (restaurantId) => {
  const { rows } = await pool.query(
    `SELECT * FROM restaurant_documents WHERE restaurant_id = $1 ORDER BY document_type ASC`,
    [restaurantId]
  );
  return rows;
};

const getDocumentById = async (id) => {
  const { rows } = await pool.query(`SELECT * FROM restaurant_documents WHERE id = $1`, [id]);
  return rows[0] || null;
};

/** Admin approve/reject a single document. */
const reviewDocument = async (id, { status, reason, verifiedBy }) => {
  if (!['approved', 'rejected'].includes(status)) {
    throw Object.assign(new Error('status must be either approved or rejected'), { status: 400 });
  }

  const { rows } = await pool.query(
    `UPDATE restaurant_documents
     SET verification_status = $1,
         rejection_reason = $2,
         verified_by = $3,
         verified_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [status, status === 'rejected' ? reason || null : null, verifiedBy, id]
  );
  return rows[0] || null;
};

module.exports = {
  DOCUMENT_TYPES,
  upsertDocument,
  listDocumentsByRestaurant,
  getDocumentById,
  reviewDocument,
};
