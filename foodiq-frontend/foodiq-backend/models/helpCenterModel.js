const { pool } = require('../config/db');

const TICKET_CATEGORIES = [
  'Order Issue',
  'Payment Issue',
  'Refund',
  'Restaurant Complaint',
  'Delivery Complaint',
  'Technical Issue',
  'General Query',
];

const listUserTickets = async (userId) => {
  const { rows } = await pool.query(
    `SELECT id, category, subject, description, status, priority, satisfaction_score,
            assigned_agent_id, created_at, updated_at, resolved_at
     FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return rows;
};

const getTicket = async (id, userId = null) => {
  const { rows } = await pool.query(
    `SELECT t.*, u.full_name AS user_name, u.email AS user_email,
            a.full_name AS agent_name
     FROM support_tickets t
     JOIN users u ON u.id = t.user_id
     LEFT JOIN users a ON a.id = t.assigned_agent_id
     WHERE t.id = $1 ${userId ? 'AND t.user_id = $2' : ''}`,
    userId ? [id, userId] : [id]
  );
  return rows[0] || null;
};

const createTicket = async ({ userId, category, subject, description, priority, aiSessionId }) => {
  const { rows } = await pool.query(
    `INSERT INTO support_tickets (user_id, category, subject, description, priority, ai_session_id, status)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'normal'), $6, 'Open') RETURNING *`,
    [userId, category, subject, description, priority, aiSessionId || null]
  );
  return rows[0];
};

const listAllTickets = async ({ status = '', category = '', limit = 100 } = {}) => {
  const { rows } = await pool.query(
    `SELECT t.*, u.full_name AS user_name, u.email AS user_email,
            a.full_name AS agent_name
     FROM support_tickets t
     JOIN users u ON u.id = t.user_id
     LEFT JOIN users a ON a.id = t.assigned_agent_id
     WHERE ($1 = '' OR LOWER(t.status) = LOWER($1))
       AND ($2 = '' OR t.category = $2)
     ORDER BY t.created_at DESC LIMIT $3`,
    [status, category, limit]
  );
  return rows;
};

const assignTicket = async (id, agentId) => {
  const { rows } = await pool.query(
    `UPDATE support_tickets SET assigned_agent_id = $1, status = 'In Progress', updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [agentId, id]
  );
  return rows[0];
};

const resolveTicket = async (id, adminNotes) => {
  const { rows } = await pool.query(
    `UPDATE support_tickets SET status = 'Resolved', admin_notes = COALESCE($1, admin_notes),
       resolved_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *`,
    [adminNotes, id]
  );
  return rows[0];
};

const rateTicket = async (id, userId, score) => {
  const { rows } = await pool.query(
    `UPDATE support_tickets SET satisfaction_score = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3 RETURNING *`,
    [score, id, userId]
  );
  return rows[0];
};

const createLiveChat = async ({ userId, subject }) => {
  const { rows } = await pool.query(
    `INSERT INTO support_live_chats (user_id, subject, status) VALUES ($1, $2, 'waiting') RETURNING *`,
    [userId, subject || 'Live support']
  );
  return rows[0];
};

const getLiveChat = async (chatId, userId = null) => {
  const { rows } = await pool.query(
    `SELECT c.*, u.full_name AS user_name, a.full_name AS agent_name
     FROM support_live_chats c
     LEFT JOIN users u ON u.id = c.user_id
     LEFT JOIN users a ON a.id = c.agent_id
     WHERE c.id = $1 ${userId ? 'AND c.user_id = $2' : ''}`,
    userId ? [chatId, userId] : [chatId]
  );
  return rows[0] || null;
};

const assignLiveChat = async (chatId, agentId) => {
  const { rows } = await pool.query(
    `UPDATE support_live_chats SET agent_id = $1, status = 'active', updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [agentId, chatId]
  );
  return rows[0];
};

const addLiveMessage = async ({ chatId, senderId, senderRole, message, attachmentUrl, attachmentType }) => {
  const { rows } = await pool.query(
    `INSERT INTO support_live_messages (chat_id, sender_id, sender_role, message, attachment_url, attachment_type)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [chatId, senderId, senderRole, message, attachmentUrl || null, attachmentType || null]
  );
  await pool.query(`UPDATE support_live_chats SET updated_at = NOW() WHERE id = $1`, [chatId]);
  return rows[0];
};

const getLiveMessages = async (chatId, { limit = 100 } = {}) => {
  const { rows } = await pool.query(
    `SELECT m.*, u.full_name AS sender_name
     FROM support_live_messages m
     LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.chat_id = $1 ORDER BY m.created_at ASC LIMIT $2`,
    [chatId, limit]
  );
  return rows;
};

const listActiveChats = async () => {
  const { rows } = await pool.query(
    `SELECT c.*, u.full_name AS user_name,
            (SELECT COUNT(*)::int FROM support_live_messages m WHERE m.chat_id = c.id) AS message_count
     FROM support_live_chats c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.status IN ('waiting', 'active')
     ORDER BY c.created_at ASC`
  );
  return rows;
};

const closeLiveChat = async (chatId, satisfactionScore = null) => {
  const { rows } = await pool.query(
    `UPDATE support_live_chats SET status = 'closed', closed_at = NOW(),
       satisfaction_score = COALESCE($1, satisfaction_score), updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [satisfactionScore, chatId]
  );
  return rows[0];
};

const getAutoResponses = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM support_auto_responses WHERE is_active = TRUE ORDER BY sort_order ASC`
  );
  return rows;
};

const getContactInfo = async () => {
  const { rows } = await pool.query(`SELECT support_email, support_phone, whatsapp_number FROM admin_settings WHERE id = 1`);
  const s = rows[0] || {};
  return {
    email: s.support_email || 'support@foodiq.com',
    phone: s.support_phone || '+91 1800 000 000',
    whatsapp: s.whatsapp_number || s.support_phone || '+91 1800 000 000',
  };
};

const getAnalytics = async () => {
  const tickets = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE LOWER(status) IN ('open', 'in progress'))::int AS pending,
       COUNT(*) FILTER (WHERE LOWER(status) = 'resolved')::int AS resolved,
       COALESCE(AVG(satisfaction_score) FILTER (WHERE satisfaction_score IS NOT NULL), 0)::float AS avg_satisfaction,
       COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at IS NOT NULL), 0)::float AS avg_resolution_hours
     FROM support_tickets`
  );
  const chats = await pool.query(
    `SELECT COUNT(*)::int AS active FROM support_live_chats WHERE status IN ('waiting', 'active')`
  );
  const aiSessions = await pool.query(
    `SELECT COUNT(*)::int AS total FROM ai_chat_sessions WHERE channel = 'support'`
  );
  const agentsOnline = await pool.query(
    `SELECT COUNT(DISTINCT agent_id)::int AS online FROM support_live_chats
     WHERE status = 'active' AND agent_id IS NOT NULL`
  );
  return {
    tickets: tickets.rows[0],
    active_live_chats: chats.rows[0]?.active || 0,
    ai_sessions: aiSessions.rows[0]?.total || 0,
    agents_online: agentsOnline.rows[0]?.online || 0,
  };
};

const listAiSessions = async ({ limit = 50 } = {}) => {
  const { rows } = await pool.query(
    `SELECT s.*, u.full_name, u.email
     FROM ai_chat_sessions s
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.channel = 'support'
     ORDER BY s.updated_at DESC LIMIT $1`,
    [limit]
  );
  return rows;
};

module.exports = {
  TICKET_CATEGORIES,
  listUserTickets,
  getTicket,
  createTicket,
  listAllTickets,
  assignTicket,
  resolveTicket,
  rateTicket,
  createLiveChat,
  getLiveChat,
  assignLiveChat,
  addLiveMessage,
  getLiveMessages,
  listActiveChats,
  closeLiveChat,
  getAutoResponses,
  getContactInfo,
  getAnalytics,
  listAiSessions,
};
