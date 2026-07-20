const { pool } = require('../config/db');

const TICKET_CATEGORIES = [
  'Order Issue',
  'Payment Issue',
  'Refund Issue',
  'Delivery Issue',
  'Restaurant Complaint',
  'Technical Issue',
];

const TICKET_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const TICKET_PRIORITIES = ['Low', 'Medium', 'High'];

const normalizePriority = (p) => {
  const map = { low: 'Low', medium: 'Medium', high: 'High', normal: 'Medium' };
  const key = String(p || 'Medium').toLowerCase();
  return map[key] || 'Medium';
};

const normalizeCategory = (category) => {
  const aliases = {
    Refund: 'Refund Issue',
    'Delivery Complaint': 'Delivery Issue',
    'General Query': 'Technical Issue',
  };
  return aliases[category] || category;
};

const nextTicketNumber = async (client = pool) => {
  const { rows } = await client.query(`SELECT nextval('support_ticket_number_seq')::int AS n`);
  return `TKT-${rows[0].n}`;
};

const listUserTickets = async (userId) => {
  const { rows } = await pool.query(
    `SELECT t.id, t.ticket_number, t.category, t.subject, t.description, t.status, t.priority,
            t.order_id, t.restaurant_id, t.assigned_agent_id, t.created_at, t.updated_at,
            t.resolved_at, t.closed_at,
            (SELECT COUNT(*)::int FROM support_ticket_messages m WHERE m.ticket_id = t.id) AS message_count
     FROM support_tickets t
     WHERE t.user_id = $1
     ORDER BY t.created_at DESC
     LIMIT 100`,
    [userId]
  );
  return rows;
};

const listAllTickets = async ({ status = '', category = '', limit = 100 } = {}) => {
  const { rows } = await pool.query(
    `SELECT t.*, u.full_name AS user_name, u.email AS user_email,
            a.full_name AS agent_name, r.name AS restaurant_name
     FROM support_tickets t
     JOIN users u ON u.id = t.user_id
     LEFT JOIN users a ON a.id = t.assigned_agent_id
     LEFT JOIN restaurants r ON r.id = t.restaurant_id
     WHERE ($1 = '' OR LOWER(t.status) = LOWER($1))
       AND ($2 = '' OR t.category = $2)
     ORDER BY t.created_at DESC
     LIMIT $3`,
    [status, category, Math.min(Number(limit) || 100, 500)]
  );
  return rows;
};

const listRestaurantTickets = async (restaurantId, { status = '' } = {}) => {
  const { rows } = await pool.query(
    `SELECT t.*, u.full_name AS user_name, u.email AS user_email
     FROM support_tickets t
     JOIN users u ON u.id = t.user_id
     WHERE t.restaurant_id = $1
       AND t.category = 'Restaurant Complaint'
       AND ($2 = '' OR LOWER(t.status) = LOWER($2))
     ORDER BY t.created_at DESC
     LIMIT 100`,
    [restaurantId, status || '']
  );
  return rows;
};

const getTicketMessages = async (ticketId) => {
  const { rows } = await pool.query(
    `SELECT m.*, u.full_name AS sender_name
     FROM support_ticket_messages m
     LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.ticket_id = $1
     ORDER BY m.created_at ASC`,
    [ticketId]
  );
  return rows.map((m) => ({
    ...m,
    attachment_urls: Array.isArray(m.attachment_urls) ? m.attachment_urls : [],
  }));
};

const getTicket = async (id, { userId = null, restaurantId = null, admin = false } = {}) => {
  const { rows } = await pool.query(
    `SELECT t.*, u.full_name AS user_name, u.email AS user_email,
            a.full_name AS agent_name, r.name AS restaurant_name
     FROM support_tickets t
     JOIN users u ON u.id = t.user_id
     LEFT JOIN users a ON a.id = t.assigned_agent_id
     LEFT JOIN restaurants r ON r.id = t.restaurant_id
     WHERE t.id = $1`,
    [id]
  );
  const ticket = rows[0];
  if (!ticket) return null;
  if (admin) return ticket;
  if (userId && ticket.user_id === userId) return ticket;
  if (restaurantId && ticket.restaurant_id === restaurantId && ticket.category === 'Restaurant Complaint') {
    return ticket;
  }
  return null;
};

const getTicketDetail = async (id, opts = {}) => {
  const ticket = await getTicket(id, opts);
  if (!ticket) return null;
  const messages = await getTicketMessages(id);
  return { ticket, messages };
};

const createTicket = async ({
  userId,
  category,
  subject,
  description,
  priority = 'Medium',
  orderId = null,
  restaurantId = null,
  attachmentUrls = [],
  aiSessionId = null,
}) => {
  const cat = normalizeCategory(category);
  if (!TICKET_CATEGORIES.includes(cat)) {
    throw Object.assign(new Error('Invalid ticket category'), { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ticketNumber = await nextTicketNumber(client);
    const pri = normalizePriority(priority);

    const { rows } = await client.query(
      `INSERT INTO support_tickets (
         user_id, ticket_number, category, subject, description, priority,
         order_id, restaurant_id, ai_session_id, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Open')
       RETURNING *`,
      [userId, ticketNumber, cat, subject, description, pri, orderId, restaurantId, aiSessionId]
    );
    const ticket = rows[0];

    await client.query(
      `INSERT INTO support_ticket_messages (ticket_id, sender_id, sender_role, message, attachment_urls)
       VALUES ($1, $2, 'customer', $3, $4::jsonb)`,
      [ticket.id, userId, description, JSON.stringify(attachmentUrls || [])]
    );

    await client.query('COMMIT');
    return ticket;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const addMessage = async ({
  ticketId,
  senderId,
  senderRole,
  message,
  attachmentUrls = [],
}) => {
  const ticket = await getTicket(ticketId, { admin: true });
  if (!ticket) throw Object.assign(new Error('Ticket not found'), { status: 404 });
  if (['Closed', 'Resolved'].includes(ticket.status) && senderRole === 'customer') {
    throw Object.assign(new Error('Ticket is closed'), { status: 400 });
  }

  const { rows } = await pool.query(
    `INSERT INTO support_ticket_messages (ticket_id, sender_id, sender_role, message, attachment_urls)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING *`,
    [ticketId, senderId, senderRole, message, JSON.stringify(attachmentUrls || [])]
  );

  let newStatus = ticket.status;
  if (ticket.status === 'Open' && ['admin', 'agent', 'restaurant'].includes(senderRole)) {
    newStatus = 'In Progress';
  }
  if (senderRole === 'customer' && ticket.status === 'Resolved') {
    newStatus = 'Open';
  }

  await pool.query(
    `UPDATE support_tickets SET status = $1, updated_at = NOW() WHERE id = $2`,
    [newStatus, ticketId]
  );

  const updated = await getTicket(ticketId, { admin: true });
  return { message: { ...rows[0], attachment_urls: attachmentUrls }, ticket: updated };
};

const updateStatus = async (id, status, { adminNotes = null } = {}) => {
  if (!TICKET_STATUSES.includes(status)) {
    throw Object.assign(new Error('Invalid status'), { status: 400 });
  }
  const resolvedAt = status === 'Resolved' ? 'NOW()' : 'resolved_at';
  const closedAt = status === 'Closed' ? 'NOW()' : 'closed_at';

  const { rows } = await pool.query(
    `UPDATE support_tickets SET
       status = $1,
       admin_notes = COALESCE($2, admin_notes),
       resolved_at = CASE WHEN $1 = 'Resolved' THEN NOW() ELSE resolved_at END,
       closed_at = CASE WHEN $1 = 'Closed' THEN NOW() ELSE closed_at END,
       updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, adminNotes, id]
  );
  return rows[0] || null;
};

const assignAgent = async (id, agentId) => {
  const { rows } = await pool.query(
    `UPDATE support_tickets SET
       assigned_agent_id = $1,
       status = CASE WHEN status = 'Open' THEN 'In Progress' ELSE status END,
       updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [agentId, id]
  );
  return rows[0] || null;
};

const closeTicket = async (id, { userId = null, role = 'customer' } = {}) => {
  const ticket =
    role === 'admin'
      ? await getTicket(id, { admin: true })
      : await getTicket(id, { userId });
  if (!ticket) throw Object.assign(new Error('Ticket not found'), { status: 404 });
  if (role === 'customer' && ticket.user_id !== userId) {
    throw Object.assign(new Error('Not authorized'), { status: 403 });
  }
  return updateStatus(id, 'Closed');
};

const resolveTicket = async (id, adminNotes) => updateStatus(id, 'Resolved', { adminNotes });

const inferRestaurantFromOrder = async (orderId) => {
  if (!orderId) return null;
  const { rows } = await pool.query(`SELECT restaurant_id FROM orders WHERE id = $1`, [orderId]);
  return rows[0]?.restaurant_id || null;
};

module.exports = {
  TICKET_CATEGORIES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  normalizePriority,
  normalizeCategory,
  listUserTickets,
  listAllTickets,
  listRestaurantTickets,
  getTicket,
  getTicketDetail,
  getTicketMessages,
  createTicket,
  addMessage,
  updateStatus,
  assignAgent,
  closeTicket,
  resolveTicket,
  inferRestaurantFromOrder,
};
