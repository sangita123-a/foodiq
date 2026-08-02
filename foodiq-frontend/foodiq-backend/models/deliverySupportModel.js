const { pool } = require('../config/db');

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['open', 'in_progress', 'pending', 'resolved', 'closed'];

/** Generate unique ticket number: TK-YYYYMMDD-XXXX */
const generateTicketNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const candidate = `TK-${dateStr}-${randNum}`;

  const { rows } = await pool.query('SELECT id FROM support_tickets WHERE ticket_number = $1', [candidate]);
  if (rows.length > 0) {
    return generateTicketNumber();
  }
  return candidate;
};

/** Create a new support ticket */
const createTicket = async ({ partnerId, subject, category = 'General', priority = 'medium' }) => {
  const ticketNumber = await generateTicketNumber();
  const validPriority = PRIORITIES.includes(String(priority).toLowerCase())
    ? String(priority).toLowerCase()
    : 'medium';

  const { rows } = await pool.query(
    `INSERT INTO support_tickets (ticket_number, partner_id, subject, category, priority, status)
     VALUES ($1, $2, $3, $4, $5, 'open')
     RETURNING *`,
    [ticketNumber, partnerId, subject, category, validPriority]
  );
  return rows[0];
};

/** Get single ticket by ID with partner and admin details */
const getTicketById = async (id) => {
  const { rows } = await pool.query(
    `SELECT t.*,
            dp.full_name AS partner_name,
            dp.email AS partner_email,
            dp.phone_number AS partner_phone,
            dp.rating AS partner_rating,
            dp.vehicle_type AS partner_vehicle,
            u.full_name AS assigned_admin_name,
            u.email AS assigned_admin_email,
            COALESCE((
              SELECT COUNT(*)::int
              FROM support_messages sm
              WHERE sm.ticket_id = t.id AND sm.is_read = FALSE
            ), 0) AS unread_count
     FROM support_tickets t
     LEFT JOIN delivery_partners dp ON dp.id = t.partner_id
     LEFT JOIN users u ON u.id = t.assigned_admin
     WHERE t.id = $1`,
    [id]
  );
  return rows[0] || null;
};

/** List tickets for a specific delivery partner */
const listPartnerTickets = async (partnerId, { status = '', priority = '', search = '', page = 1, limit = 20 } = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * pageSize;

  const conditions = ['t.partner_id = $1'];
  const params = [partnerId];

  if (status && STATUSES.includes(status)) {
    params.push(status);
    conditions.push(`t.status = $${params.length}`);
  }
  if (priority && PRIORITIES.includes(priority)) {
    params.push(priority);
    conditions.push(`t.priority = $${params.length}`);
  }
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const idx = params.length;
    conditions.push(`(t.ticket_number ILIKE $${idx} OR t.subject ILIKE $${idx} OR t.category ILIKE $${idx})`);
  }

  const whereStr = conditions.join(' AND ');

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM support_tickets t WHERE ${whereStr}`,
    params
  );

  const rowsRes = await pool.query(
    `SELECT t.*,
            COALESCE((
              SELECT COUNT(*)::int
              FROM support_messages sm
              WHERE sm.ticket_id = t.id AND sm.sender_type = 'admin' AND sm.is_read = FALSE
            ), 0) AS unread_count,
            (
              SELECT message FROM support_messages sm
              WHERE sm.ticket_id = t.id
              ORDER BY sm.created_at DESC LIMIT 1
            ) AS latest_message,
            (
              SELECT created_at FROM support_messages sm
              WHERE sm.ticket_id = t.id
              ORDER BY sm.created_at DESC LIMIT 1
            ) AS latest_message_at
     FROM support_tickets t
     WHERE ${whereStr}
     ORDER BY t.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, pageSize, offset]
  );

  const total = countRes.rows[0]?.total || 0;
  return {
    tickets: rowsRes.rows,
    pagination: {
      page: pageNum,
      limit: pageSize,
      total,
      total_pages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
};

/** List tickets for Admin console across all partners */
const listAdminTickets = async ({ status = '', priority = '', assignedAdmin = '', search = '', page = 1, limit = 20 } = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * pageSize;

  const conditions = [];
  const params = [];

  if (status && STATUSES.includes(status)) {
    params.push(status);
    conditions.push(`t.status = $${params.length}`);
  }
  if (priority && PRIORITIES.includes(priority)) {
    params.push(priority);
    conditions.push(`t.priority = $${params.length}`);
  }
  if (assignedAdmin) {
    params.push(assignedAdmin);
    conditions.push(`t.assigned_admin = $${params.length}`);
  }
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const idx = params.length;
    conditions.push(`(t.ticket_number ILIKE $${idx} OR t.subject ILIKE $${idx} OR t.category ILIKE $${idx} OR dp.full_name ILIKE $${idx} OR dp.phone_number ILIKE $${idx})`);
  }

  const whereStr = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM support_tickets t
     LEFT JOIN delivery_partners dp ON dp.id = t.partner_id
     ${whereStr}`,
    params
  );

  const rowsRes = await pool.query(
    `SELECT t.*,
            dp.full_name AS partner_name,
            dp.email AS partner_email,
            dp.phone_number AS partner_phone,
            dp.rating AS partner_rating,
            u.full_name AS assigned_admin_name,
            COALESCE((
              SELECT COUNT(*)::int
              FROM support_messages sm
              WHERE sm.ticket_id = t.id AND sm.sender_type = 'partner' AND sm.is_read = FALSE
            ), 0) AS unread_count,
            (
              SELECT message FROM support_messages sm
              WHERE sm.ticket_id = t.id
              ORDER BY sm.created_at DESC LIMIT 1
            ) AS latest_message,
            (
              SELECT created_at FROM support_messages sm
              WHERE sm.ticket_id = t.id
              ORDER BY sm.created_at DESC LIMIT 1
            ) AS latest_message_at
     FROM support_tickets t
     LEFT JOIN delivery_partners dp ON dp.id = t.partner_id
     LEFT JOIN users u ON u.id = t.assigned_admin
     ${whereStr}
     ORDER BY t.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, pageSize, offset]
  );

  const total = countRes.rows[0]?.total || 0;
  return {
    tickets: rowsRes.rows,
    pagination: {
      page: pageNum,
      limit: pageSize,
      total,
      total_pages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
};

/** Add a message to a ticket */
const addMessage = async ({ ticketId, senderType, senderId, message, attachmentUrl = null, messageType = 'text' }) => {
  const { rows } = await pool.query(
    `INSERT INTO support_messages (ticket_id, sender_type, sender_id, message, attachment_url, message_type, is_read)
     VALUES ($1, $2, $3, $4, $5, $6, FALSE)
     RETURNING *`,
    [ticketId, senderType, senderId, message || '', attachmentUrl, messageType]
  );

  await pool.query(
    `UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [ticketId]
  );

  return rows[0];
};

/** Get messages for a ticket */
const getTicketMessages = async (ticketId) => {
  const { rows } = await pool.query(
    `SELECT sm.*,
            CASE
              WHEN sm.sender_type = 'partner' THEN dp.full_name
              ELSE u.full_name
            END AS sender_name
     FROM support_messages sm
     LEFT JOIN delivery_partners dp ON dp.id = sm.sender_id AND sm.sender_type = 'partner'
     LEFT JOIN users u ON u.id = sm.sender_id AND sm.sender_type = 'admin'
     WHERE sm.ticket_id = $1
     ORDER BY sm.created_at ASC`,
    [ticketId]
  );
  return rows;
};

/** Mark messages in a ticket as read */
const markMessagesRead = async (ticketId, readerType) => {
  const senderTarget = readerType === 'partner' ? 'admin' : 'partner';
  const { rowCount } = await pool.query(
    `UPDATE support_messages
     SET is_read = TRUE
     WHERE ticket_id = $1 AND sender_type = $2 AND is_read = FALSE`,
    [ticketId, senderTarget]
  );
  return rowCount;
};

/** Update ticket status */
const updateTicketStatus = async (ticketId, newStatus) => {
  if (!STATUSES.includes(newStatus)) {
    throw Object.assign(new Error(`Invalid status: ${newStatus}`), { status: 400 });
  }

  const isClosing = newStatus === 'closed';
  const { rows } = await pool.query(
    `UPDATE support_tickets
     SET status = $1,
         updated_at = CURRENT_TIMESTAMP,
         closed_at = CASE WHEN $1 = 'closed' THEN CURRENT_TIMESTAMP ELSE NULL END
     WHERE id = $2
     RETURNING *`,
    [newStatus, ticketId]
  );
  return rows[0] || null;
};

/** Assign admin to ticket */
const assignTicketAdmin = async (ticketId, adminId) => {
  const { rows } = await pool.query(
    `UPDATE support_tickets
     SET assigned_admin = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [adminId, ticketId]
  );
  return rows[0] || null;
};

/** Add log entry to support_ticket_logs */
const addTicketLog = async ({ ticketId, action, performedBy, oldStatus = null, newStatus = null, notes = '' }) => {
  const { rows } = await pool.query(
    `INSERT INTO support_ticket_logs (ticket_id, action, performed_by, old_status, new_status, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [ticketId, action, performedBy, oldStatus, newStatus, notes]
  );
  return rows[0];
};

/** Get logs for a ticket */
const getTicketLogs = async (ticketId) => {
  const { rows } = await pool.query(
    `SELECT l.*,
            u.full_name AS performed_by_name
     FROM support_ticket_logs l
     LEFT JOIN users u ON u.id = l.performed_by
     WHERE l.ticket_id = $1
     ORDER BY l.created_at ASC`,
    [ticketId]
  );
  return rows;
};

/** Analytics metrics for admin dashboard */
const getSupportAnalytics = async () => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total_tickets,
       COUNT(*) FILTER (WHERE status = 'open')::int AS open_tickets,
       COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress_tickets,
       COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved_tickets,
       COUNT(*) FILTER (WHERE status = 'closed')::int AS closed_tickets,
       COUNT(*) FILTER (WHERE priority = 'urgent')::int AS urgent_tickets
     FROM support_tickets`
  );
  return rows[0] || {
    total_tickets: 0,
    open_tickets: 0,
    in_progress_tickets: 0,
    resolved_tickets: 0,
    closed_tickets: 0,
    urgent_tickets: 0,
  };
};

/** Reply to a ticket or update status */
const replyToTicket = async (ticketId, { admin_reply, status, performed_by = null }) => {
  if (status && !STATUSES.includes(status)) {
    throw new Error('Invalid status');
  }
  if (!admin_reply && !status) {
    throw new Error('Provide admin_reply or status');
  }
  if (status) {
    await updateTicketStatus(ticketId, status);
  }
  if (admin_reply) {
    await addMessage({ ticketId, senderType: 'admin', senderId: performed_by, message: admin_reply });
  }
  return getTicketById(ticketId);
};

module.exports = {
  PRIORITIES,
  STATUSES,
  generateTicketNumber,
  createTicket,
  getTicketById,
  listPartnerTickets,
  listForPartner: listPartnerTickets,
  listAdminTickets,
  listAllTickets: listAdminTickets,
  replyToTicket,
  addMessage,
  getTicketMessages,
  markMessagesRead,
  updateTicketStatus,
  assignTicketAdmin,
  addTicketLog,
  getTicketLogs,
  getSupportAnalytics,
};
