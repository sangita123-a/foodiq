const { pool } = require('../config/db');

/**
 * Create a new sync log entry
 */
const createSyncLog = async ({
  partnerId,
  syncType,
  entityType,
  entityId = null,
  payload = {},
  syncStatus = 'pending',
  errorMessage = null,
}) => {
  const result = await pool.query(
    `INSERT INTO delivery_sync_logs (
      partner_id, sync_type, entity_type, entity_id, payload, sync_status, error_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [partnerId, syncType, entityType, entityId, JSON.stringify(payload), syncStatus, errorMessage]
  );
  return result.rows[0];
};

/**
 * Update an existing sync log record
 */
const updateSyncLog = async (id, { syncStatus, retryCount, errorMessage = null }) => {
  const fields = [];
  const values = [];
  let index = 1;

  if (syncStatus !== undefined) {
    fields.push(`sync_status = $${index++}`);
    values.push(syncStatus);
  }
  if (retryCount !== undefined) {
    fields.push(`retry_count = $${index++}`);
    values.push(retryCount);
  }
  if (errorMessage !== undefined) {
    fields.push(`error_message = $${index++}`);
    values.push(errorMessage);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const sql = `UPDATE delivery_sync_logs SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`;
  const result = await pool.query(sql, values);
  return result.rows[0];
};

/**
 * Fetch pending sync logs for a partner (oldest first for FIFO execution)
 */
const getPendingLogs = async (partnerId, limit = 50) => {
  const result = await pool.query(
    `SELECT * FROM delivery_sync_logs
     WHERE partner_id = $1 AND sync_status IN ('pending', 'failed') AND retry_count < 5
     ORDER BY created_at ASC
     LIMIT $2`,
    [partnerId, limit]
  );
  return result.rows;
};

/**
 * Fetch sync log by ID
 */
const getSyncLogById = async (id) => {
  const result = await pool.query(`SELECT * FROM delivery_sync_logs WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

/**
 * Fetch paginated sync history for a specific partner
 */
const getSyncLogsByPartner = async (partnerId, { status, limit = 20, offset = 0 } = {}) => {
  let query = `SELECT * FROM delivery_sync_logs WHERE partner_id = $1`;
  const params = [partnerId];

  if (status) {
    params.push(status);
    query += ` AND sync_status = $${params.length}`;
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM delivery_sync_logs WHERE partner_id = $1 ${status ? 'AND sync_status = $2' : ''}`,
    status ? [partnerId, status] : [partnerId]
  );

  return {
    logs: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};

/**
 * Fetch admin sync queue with optional filters & search
 */
const getAdminSyncLogs = async ({ status, partnerId, syncType, search, limit = 50, offset = 0 } = {}) => {
  let query = `
    SELECT l.*, p.full_name as partner_name, p.phone_number as partner_phone
    FROM delivery_sync_logs l
    LEFT JOIN delivery_partners p ON l.partner_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    params.push(status);
    query += ` AND l.sync_status = $${params.length}`;
  }
  if (partnerId) {
    params.push(partnerId);
    query += ` AND l.partner_id = $${params.length}`;
  }
  if (syncType) {
    params.push(syncType);
    query += ` AND l.sync_type = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    query += ` AND (p.full_name ILIKE $${params.length} OR p.phone_number ILIKE $${params.length} OR l.sync_type ILIKE $${params.length} OR l.entity_type ILIKE $${params.length})`;
  }

  query += ` ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  const countResult = await pool.query(`SELECT COUNT(*) FROM delivery_sync_logs`);

  return {
    logs: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};

/**
 * Fetch sync statistics for admin portal
 */
const getAdminSyncStats = async () => {
  const result = await pool.query(`
    SELECT
      COUNT(*) AS total_count,
      COUNT(*) FILTER (WHERE sync_status = 'pending') AS pending_count,
      COUNT(*) FILTER (WHERE sync_status = 'syncing') AS syncing_count,
      COUNT(*) FILTER (WHERE sync_status = 'completed') AS completed_count,
      COUNT(*) FILTER (WHERE sync_status = 'failed') AS failed_count,
      COUNT(*) FILTER (WHERE sync_status = 'completed' AND updated_at >= CURRENT_DATE) AS completed_today
    FROM delivery_sync_logs
  `);

  const partnerStats = await pool.query(`
    SELECT
      l.partner_id,
      p.full_name,
      COUNT(*) FILTER (WHERE l.sync_status = 'pending') AS pending_actions,
      COUNT(*) FILTER (WHERE l.sync_status = 'failed') AS failed_actions,
      MAX(l.updated_at) AS last_sync_at
    FROM delivery_sync_logs l
    LEFT JOIN delivery_partners p ON l.partner_id = p.id
    GROUP BY l.partner_id, p.full_name
    ORDER BY last_sync_at DESC
    LIMIT 20
  `);

  return {
    summary: result.rows[0],
    partnerStats: partnerStats.rows,
  };
};

module.exports = {
  createSyncLog,
  updateSyncLog,
  getPendingLogs,
  getSyncLogById,
  getSyncLogsByPartner,
  getAdminSyncLogs,
  getAdminSyncStats,
};
