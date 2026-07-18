/**
 * Audit trail — persists important actions + mirrors to audit log files.
 */
const { pool } = require('../config/db');
const { log } = require('../utils/logger');

const clientMeta = (req = {}) => {
  const ua = req.headers?.['user-agent'] || '';
  const ip =
    req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.ip ||
    req.connection?.remoteAddress ||
    null;
  let browser = 'unknown';
  let device = 'desktop';
  if (/mobile/i.test(ua)) device = 'mobile';
  else if (/tablet|ipad/i.test(ua)) device = 'tablet';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  return { ip, device, browser, user_agent: ua };
};

/**
 * @param {object} opts
 */
const writeAudit = async (opts = {}) => {
  const {
    userId = null,
    role = null,
    action,
    category = 'general',
    resourceType = null,
    resourceId = null,
    status = 'success',
    message = null,
    meta = {},
    req = null,
    organizationId = null,
    actorType = 'user',
  } = opts;

  if (!action) return null;

  const client = req ? clientMeta(req) : {};
  const orgId =
    organizationId ||
    meta.organization_id ||
    req?.headers?.['x-organization-id'] ||
    null;
  const row = {
    user_id: userId,
    role,
    action,
    category,
    resource_type: resourceType,
    resource_id: resourceId,
    status,
    message,
    ip_address: client.ip || meta.ip || null,
    device: client.device || null,
    browser: client.browser || null,
    user_agent: client.user_agent || null,
    organization_id: orgId,
    actor_type: actorType,
    meta: { ...meta, ...(req?.requestId ? { request_id: req.requestId } : {}) },
  };

  log.audit(action, row);

  try {
    const { rows } = await pool.query(
      `INSERT INTO audit_logs (
         user_id, role, action, category, resource_type, resource_id,
         status, message, ip_address, device, browser, user_agent, meta,
         organization_id, actor_type
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15)
       RETURNING id, created_at`,
      [
        row.user_id,
        row.role,
        row.action,
        row.category,
        row.resource_type,
        row.resource_id,
        row.status,
        row.message,
        row.ip_address,
        row.device,
        row.browser,
        row.user_agent,
        JSON.stringify(row.meta || {}),
        row.organization_id,
        row.actor_type,
      ]
    );
    return rows[0];
  } catch (err) {
    // Fallback without V4 columns if migrate not yet applied
    try {
      const { rows } = await pool.query(
        `INSERT INTO audit_logs (
           user_id, role, action, category, resource_type, resource_id,
           status, message, ip_address, device, browser, user_agent, meta
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)
         RETURNING id, created_at`,
        [
          row.user_id,
          row.role,
          row.action,
          row.category,
          row.resource_type,
          row.resource_id,
          row.status,
          row.message,
          row.ip_address,
          row.device,
          row.browser,
          row.user_agent,
          JSON.stringify(row.meta || {}),
        ]
      );
      return rows[0];
    } catch (e2) {
      log.warn('audit persist failed', { error: e2.message });
      return null;
    }
  }
};

const listAudits = async ({
  q = '',
  category = '',
  action = '',
  userId = '',
  role = '',
  from = '',
  to = '',
  limit = 100,
  offset = 0,
} = {}) => {
  const { rows } = await pool.query(
    `SELECT a.*, u.email AS user_email, u.full_name AS user_name
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE ($1 = '' OR a.action ILIKE '%' || $1 || '%' OR a.message ILIKE '%' || $1 || '%'
            OR u.email ILIKE '%' || $1 || '%' OR u.full_name ILIKE '%' || $1 || '%')
       AND ($2 = '' OR a.category = $2)
       AND ($3 = '' OR a.action = $3)
       AND ($4 = '' OR a.user_id::text = $4)
       AND ($5 = '' OR a.role = $5)
       AND ($6 = '' OR a.created_at::date >= $6::date)
       AND ($7 = '' OR a.created_at::date <= $7::date)
     ORDER BY a.created_at DESC
     LIMIT $8 OFFSET $9`,
    [
      q.trim(),
      category,
      action,
      userId,
      role,
      from,
      to,
      Math.min(Number(limit) || 100, 500),
      Number(offset) || 0,
    ]
  );
  return rows;
};

module.exports = {
  writeAudit,
  listAudits,
  clientMeta,
};
