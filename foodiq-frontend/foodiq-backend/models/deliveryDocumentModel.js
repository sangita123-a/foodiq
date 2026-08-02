const { pool } = require('../config/db');

/** Supported KYC / vehicle verification document types. */
const DOCUMENT_TYPES = ['aadhaar', 'pan', 'driving_license', 'rc', 'insurance', 'profile_photo'];

/** All of these must be approved (and unexpired) before a partner can go online / accept orders. */
const REQUIRED_DOCUMENT_TYPES = DOCUMENT_TYPES;

/** Document types that must carry a tracked expiry date. */
const EXPIRY_TRACKED_TYPES = ['driving_license', 'insurance'];

const isExpired = (row) =>
  EXPIRY_TRACKED_TYPES.includes(row.document_type) &&
  row.expiry_date &&
  new Date(row.expiry_date) < new Date(new Date().toDateString());

/**
 * Create or replace a partner's document of a given type.
 * Re-uploading always resets it to 'pending' review.
 */
const upsertDocument = async ({ partnerId, documentType, documentNumber, fileUrl, expiryDate }) => {
  const { rows } = await pool.query(
    `INSERT INTO delivery_partner_documents (
       partner_id, document_type, document_number, file_url, expiry_date, verification_status
     ) VALUES ($1, $2, $3, $4, $5, 'pending')
     ON CONFLICT (partner_id, document_type) DO UPDATE SET
       document_number = EXCLUDED.document_number,
       file_url = EXCLUDED.file_url,
       expiry_date = EXCLUDED.expiry_date,
       verification_status = 'pending',
       rejection_reason = NULL,
       verified_by = NULL,
       verified_at = NULL,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [partnerId, documentType, documentNumber || null, fileUrl, expiryDate || null]
  );
  return rows[0];
};

const listDocumentsByPartner = async (partnerId) => {
  const { rows } = await pool.query(
    `SELECT * FROM delivery_partner_documents WHERE partner_id = $1 ORDER BY document_type ASC`,
    [partnerId]
  );
  return rows;
};

const getDocumentById = async (id) => {
  const { rows } = await pool.query(`SELECT * FROM delivery_partner_documents WHERE id = $1`, [id]);
  return rows[0] || null;
};

/**
 * Full KYC snapshot for a partner: uploaded documents plus which required
 * types are missing, pending, rejected, or expired.
 */
const getKycSummaryForPartner = async (partnerId) => {
  const documents = await listDocumentsByPartner(partnerId);
  const byType = new Map(documents.map((d) => [d.document_type, d]));

  const missing_types = [];
  const pending_types = [];
  const rejected_types = [];
  const expired_types = [];

  for (const type of REQUIRED_DOCUMENT_TYPES) {
    const doc = byType.get(type);
    if (!doc) {
      missing_types.push(type);
      continue;
    }
    if (doc.verification_status === 'pending') pending_types.push(type);
    if (doc.verification_status === 'rejected') rejected_types.push(type);
    if (doc.verification_status === 'approved' && isExpired(doc)) expired_types.push(type);
  }

  const is_verified =
    missing_types.length === 0 &&
    pending_types.length === 0 &&
    rejected_types.length === 0 &&
    expired_types.length === 0;

  return {
    documents,
    required_types: REQUIRED_DOCUMENT_TYPES,
    expiry_tracked_types: EXPIRY_TRACKED_TYPES,
    is_verified,
    missing_types,
    pending_types,
    rejected_types,
    expired_types,
  };
};

/** Lightweight boolean check used by the online/accept-order gates. */
const isPartnerKycVerified = async (partnerId) => {
  const summary = await getKycSummaryForPartner(partnerId);
  return summary.is_verified;
};

/** Throws a 403 error describing exactly what's missing/expired, used by business-rule gates. */
const assertPartnerKycVerified = async (partnerId) => {
  const summary = await getKycSummaryForPartner(partnerId);
  if (summary.is_verified) return summary;

  const reasons = [];
  if (summary.missing_types.length) reasons.push(`missing: ${summary.missing_types.join(', ')}`);
  if (summary.pending_types.length) reasons.push(`pending review: ${summary.pending_types.join(', ')}`);
  if (summary.rejected_types.length) reasons.push(`rejected: ${summary.rejected_types.join(', ')}`);
  if (summary.expired_types.length) reasons.push(`expired: ${summary.expired_types.join(', ')}`);

  const err = new Error(
    `Complete KYC verification before going online or accepting orders (${reasons.join('; ')}).`
  );
  err.status = 403;
  throw err;
};

/** Admin review queue — joined with partner identity for search/filter/display. */
const listAllForAdmin = async ({ status = '', documentType = '', search = '', page = 1, limit = 20 } = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const values = [];

  if (status) {
    values.push(status);
    conditions.push(`d.verification_status = $${values.length}`);
  }
  if (documentType) {
    values.push(documentType);
    conditions.push(`d.document_type = $${values.length}`);
  }
  if (search) {
    values.push(`%${search.toLowerCase()}%`);
    const idx = values.length;
    conditions.push(
      `(LOWER(p.full_name) LIKE $${idx} OR LOWER(p.email) LIKE $${idx} OR p.phone_number LIKE $${idx} OR LOWER(d.document_type) LIKE $${idx} OR LOWER(COALESCE(d.document_number, '')) LIKE $${idx})`
    );
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM delivery_partner_documents d
     JOIN delivery_partners p ON p.id = d.partner_id
     ${whereClause}`,
    values
  );
  const total = Number(countRes.rows[0].count);

  const dataValues = [...values, limitNum, offset];
  const { rows } = await pool.query(
    `SELECT d.*, p.full_name AS partner_name, p.email AS partner_email, p.phone_number AS partner_phone
     FROM delivery_partner_documents d
     JOIN delivery_partners p ON p.id = d.partner_id
     ${whereClause}
     ORDER BY
       CASE d.verification_status WHEN 'pending' THEN 0 ELSE 1 END,
       d.created_at DESC
     LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues
  );

  return {
    documents: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      total_pages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
};

/** Admin approve/reject a single document. */
const reviewDocument = async (id, { status, reason, verifiedBy }) => {
  if (!['approved', 'rejected'].includes(status)) {
    const err = new Error('status must be either approved or rejected');
    err.status = 400;
    throw err;
  }

  const { rows } = await pool.query(
    `UPDATE delivery_partner_documents
     SET verification_status = $1,
         rejection_reason = $2,
         verified_by = $3,
         verified_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [status, status === 'rejected' ? reason || null : null, verifiedBy, id]
  );

  const document = rows[0] || null;
  if (document) {
    try {
      const dn = require('./deliveryNotificationModel');
      const approved = status === 'approved';
      const label = String(document.document_type || '').replace(/_/g, ' ');
      await dn.createNotification({
        partnerId: document.partner_id,
        type: approved ? 'kyc_approved' : 'kyc_rejected',
        title: approved ? 'KYC Document Approved' : 'KYC Document Rejected',
        message: approved
          ? `Your ${label} document has been approved.`
          : `Your ${label} document was rejected.${reason ? ` Reason: ${reason}` : ''}`,
        actionUrl: '/delivery/documents',
      });
      if (approved) {
        try {
          const ReferralService = require('../services/referralService');
          await ReferralService.handleKycApproved(document.partner_id);
        } catch (refErr) {
          console.warn('[deliveryDocument] referral kyc check skipped:', refErr.message);
        }
      }
    } catch (err) {
      console.warn('[deliveryDocument] kyc notification skipped:', err.message);
    }
  }

  return document;
};

module.exports = {
  DOCUMENT_TYPES,
  REQUIRED_DOCUMENT_TYPES,
  EXPIRY_TRACKED_TYPES,
  upsertDocument,
  listDocumentsByPartner,
  getDocumentById,
  getKycSummaryForPartner,
  isPartnerKycVerified,
  assertPartnerKycVerified,
  listAllForAdmin,
  reviewDocument,
};
