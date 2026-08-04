const { pool } = require('../config/db');

const STATUS_NORM_VALUES = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITY_NORM_VALUES = ['low', 'medium', 'high', 'urgent'];
const REQUESTER_TYPES = ['customer', 'partner', 'restaurant'];

/**
 * Canonical read layer over the shared `support_tickets` table, used only by
 * the unified admin Support Center. Customer/partner/restaurant-facing flows
 * keep writing through their existing models (ticketModel, deliverySupportModel,
 * helpCenterModel) unchanged — this module never writes.
 */
const listUnifiedTickets = async ({
  requesterType = '',
  status = '',
  priority = '',
  category = '',
  assignedAgent = '',
  search = '',
  page = 1,
  limit = 20,
} = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * pageSize;

  const conditions = [];
  const params = [];

  if (requesterType && REQUESTER_TYPES.includes(requesterType)) {
    params.push(requesterType);
    conditions.push(`t.requester_type = $${params.length}`);
  }
  if (status && STATUS_NORM_VALUES.includes(status)) {
    params.push(status);
    conditions.push(`t.status_norm = $${params.length}`);
  }
  if (priority && PRIORITY_NORM_VALUES.includes(priority)) {
    params.push(priority);
    conditions.push(`t.priority_norm = $${params.length}`);
  }
  if (category) {
    params.push(category);
    conditions.push(`t.category = $${params.length}`);
  }
  if (assignedAgent) {
    params.push(assignedAgent);
    conditions.push(`COALESCE(t.assigned_agent_id, t.assigned_admin) = $${params.length}`);
  }
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const idx = params.length;
    conditions.push(`(
      t.ticket_number ILIKE $${idx} OR t.subject ILIKE $${idx} OR t.category ILIKE $${idx}
      OR u.full_name ILIKE $${idx} OR u.email ILIKE $${idx}
      OR dp.full_name ILIKE $${idx} OR dp.phone_number ILIKE $${idx}
      OR r.name ILIKE $${idx}
    )`);
  }

  const whereStr = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const joins = `
     LEFT JOIN users u ON u.id = t.user_id
     LEFT JOIN delivery_partners dp ON dp.id = t.partner_id
     LEFT JOIN restaurants r ON r.id = t.restaurant_id
     LEFT JOIN users agent ON agent.id = COALESCE(t.assigned_agent_id, t.assigned_admin)
  `;

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM support_tickets t ${joins} ${whereStr}`,
    params
  );

  const rowsRes = await pool.query(
    `SELECT t.id, t.ticket_number, t.category, t.subject, t.status, t.priority,
            t.status_norm, t.priority_norm, t.requester_type, t.source_channel,
            t.created_at, t.updated_at, t.resolved_at, t.closed_at,
            u.id AS customer_id, u.full_name AS customer_name, u.email AS customer_email,
            dp.id AS partner_id, dp.full_name AS partner_name, dp.phone_number AS partner_phone,
            r.id AS restaurant_id, r.name AS restaurant_name,
            agent.id AS agent_id, agent.full_name AS agent_name
     FROM support_tickets t
     ${joins}
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

const getUnifiedTicket = async (id) => {
  const { rows } = await pool.query(
    `SELECT t.*,
            u.full_name AS customer_name, u.email AS customer_email,
            dp.full_name AS partner_name, dp.phone_number AS partner_phone, dp.email AS partner_email,
            r.name AS restaurant_name,
            agent.full_name AS agent_name
     FROM support_tickets t
     LEFT JOIN users u ON u.id = t.user_id
     LEFT JOIN delivery_partners dp ON dp.id = t.partner_id
     LEFT JOIN restaurants r ON r.id = t.restaurant_id
     LEFT JOIN users agent ON agent.id = COALESCE(t.assigned_agent_id, t.assigned_admin)
     WHERE t.id = $1`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Message threads live in two separate tables depending on who filed the ticket
 * (see plan §2.5): `support_ticket_messages` for customer/restaurant tickets
 * (ticketModel), `support_messages` for partner tickets (deliverySupportModel).
 * This dispatches to the right one and normalizes both into one shape.
 */
const getUnifiedTicketMessages = async (ticketId, requesterType) => {
  if (requesterType === 'partner') {
    const { rows } = await pool.query(
      `SELECT sm.id, sm.ticket_id, sm.sender_id,
              CASE WHEN sm.sender_type = 'partner' THEN 'partner' ELSE 'admin' END AS sender_role,
              sm.message, sm.message_type, sm.is_read, sm.created_at,
              CASE WHEN sm.sender_type = 'partner' THEN dp.full_name ELSE u.full_name END AS sender_name,
              CASE WHEN sm.attachment_url IS NULL THEN '[]'::jsonb
                   ELSE jsonb_build_array(sm.attachment_url) END AS attachment_urls
       FROM support_messages sm
       LEFT JOIN delivery_partners dp ON dp.id = sm.sender_id AND sm.sender_type = 'partner'
       LEFT JOIN users u ON u.id = sm.sender_id AND sm.sender_type = 'admin'
       WHERE sm.ticket_id = $1
       ORDER BY sm.created_at ASC`,
      [ticketId]
    );
    return rows;
  }

  const { rows } = await pool.query(
    `SELECT m.id, m.ticket_id, m.sender_id, m.sender_role, m.message, m.created_at,
            u.full_name AS sender_name,
            COALESCE(m.attachment_urls, '[]'::jsonb) AS attachment_urls
     FROM support_ticket_messages m
     LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.ticket_id = $1
     ORDER BY m.created_at ASC`,
    [ticketId]
  );
  return rows;
};

const getSupportAnalyticsUnified = async () => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total_tickets,
       COUNT(*) FILTER (WHERE status_norm = 'open')::int AS open_tickets,
       COUNT(*) FILTER (WHERE status_norm = 'in_progress')::int AS in_progress_tickets,
       COUNT(*) FILTER (WHERE status_norm = 'resolved')::int AS resolved_tickets,
       COUNT(*) FILTER (WHERE status_norm = 'closed')::int AS closed_tickets,
       COUNT(*) FILTER (WHERE priority_norm = 'urgent' OR priority_norm = 'high')::int AS critical_tickets,
       COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today_tickets,
       COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)
         FILTER (WHERE resolved_at IS NOT NULL), 0)::float AS avg_resolution_hours
     FROM support_tickets`
  );

  const [chats, refunds] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS active FROM support_live_chats WHERE status IN ('waiting', 'active')`),
    pool.query(`SELECT COUNT(*)::int AS pending FROM refund_requests WHERE status = 'pending'`).catch(() => ({ rows: [{ pending: 0 }] })),
  ]);

  const agentsOnline = await pool.query(
    `SELECT COUNT(DISTINCT agent_id)::int AS online FROM support_live_chats
     WHERE status = 'active' AND agent_id IS NOT NULL`
  );

  const sos = await pool
    .query(`SELECT COUNT(*)::int AS active FROM delivery_emergencies WHERE status = 'active'`)
    .catch(() => ({ rows: [{ active: 0 }] }));

  return {
    ...rows[0],
    live_chats: chats.rows[0]?.active || 0,
    agents_online: agentsOnline.rows[0]?.online || 0,
    sos_active: sos.rows[0]?.active || 0,
    refunds_pending: refunds.rows[0]?.pending || 0,
  };
};

/** Agent performance: ticket volume + avg resolution time per assigned agent. */
const getAgentPerformance = async () => {
  const { rows } = await pool.query(
    `SELECT
       COALESCE(t.assigned_agent_id, t.assigned_admin) AS agent_id,
       u.full_name AS agent_name,
       COUNT(*)::int AS total_tickets,
       COUNT(*) FILTER (WHERE t.status_norm = 'resolved' OR t.status_norm = 'closed')::int AS resolved_tickets,
       COALESCE(AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600)
         FILTER (WHERE t.resolved_at IS NOT NULL), 0)::float AS avg_resolution_hours
     FROM support_tickets t
     LEFT JOIN users u ON u.id = COALESCE(t.assigned_agent_id, t.assigned_admin)
     WHERE COALESCE(t.assigned_agent_id, t.assigned_admin) IS NOT NULL
     GROUP BY COALESCE(t.assigned_agent_id, t.assigned_admin), u.full_name
     ORDER BY total_tickets DESC`
  );
  return rows;
};

module.exports = {
  STATUS_NORM_VALUES,
  PRIORITY_NORM_VALUES,
  REQUESTER_TYPES,
  listUnifiedTickets,
  getUnifiedTicket,
  getUnifiedTicketMessages,
  getSupportAnalyticsUnified,
  getAgentPerformance,
};
