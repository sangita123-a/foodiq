const helpCenter = require('../models/helpCenterModel');
const { reply: chatReply } = require('../services/supportChatbotService');

const ok = (res, message, data, status = 200) =>
  res.status(status).json({ success: true, message, data });
const fail = (res, status, message, error = {}) =>
  res.status(status).json({ success: false, message, error });

const getOverview = async (req, res) => {
  try {
    const contact = await helpCenter.getContactInfo();
    const autoResponses = await helpCenter.getAutoResponses();
    ok(res, 'Help center overview', {
      contact,
      ticket_categories: helpCenter.TICKET_CATEGORIES,
      auto_responses: autoResponses,
      bot_name: 'Foodiq AI',
      agents_online: (await helpCenter.getAnalytics()).agents_online > 0,
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postChat = async (req, res) => {
  try {
    const data = await chatReply({
      userId: req.user?.id,
      message: req.body.message,
      locale: req.locale || 'en',
      sessionId: req.body.session_id,
      forceEnabled: true,
    });
    ok(res, 'Chat reply', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getChatSession = async (req, res) => {
  try {
    const { pool } = require('../config/db');
    const { rows } = await pool.query(
      `SELECT id, user_id, messages, status, created_at, updated_at FROM ai_chat_sessions WHERE id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return fail(res, 404, 'Session not found');
    if (rows[0].user_id && req.user?.id && rows[0].user_id !== req.user.id) {
      return fail(res, 403, 'Not authorized');
    }
    ok(res, 'Session retrieved', rows[0]);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const listTickets = async (req, res) => {
  try {
    if (!req.user) return fail(res, 401, 'Sign in required');
    const ticketModel = require('../models/ticketModel');
    ok(res, 'Tickets retrieved', await ticketModel.listUserTickets(req.user.id));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const createTicket = async (req, res) => {
  try {
    if (!req.user) return fail(res, 401, 'Sign in required');
    const ticketModel = require('../models/ticketModel');
    const { notifyTicketCreated } = require('../services/ticketNotificationService');
    const { category, subject, description, priority } = req.body;
    if (!category || !subject || !description) {
      return fail(res, 400, 'Category, subject, and description are required');
    }
    const ticket = await ticketModel.createTicket({
      userId: req.user.id,
      category,
      subject,
      description,
      priority,
      aiSessionId: req.body.session_id,
      attachmentUrls: req.body.attachment_urls || [],
    });
    try {
      await notifyTicketCreated(ticket, req.user);
    } catch (emailErr) {
      console.warn('[help-center] ticket email skipped:', emailErr.message);
    }
    ok(res, 'Ticket created', ticket, 201);
  } catch (error) {
    fail(res, error.status || 500, error.message);
  }
};

const rateTicket = async (req, res) => {
  try {
    const score = Number(req.body.score);
    if (!score || score < 1 || score > 5) return fail(res, 400, 'Score 1–5 required');
    const ticket = await helpCenter.rateTicket(req.params.id, req.user.id, score);
    if (!ticket) return fail(res, 404, 'Ticket not found');
    ok(res, 'Rating saved', ticket);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const startLiveChat = async (req, res) => {
  try {
    if (!req.user) return fail(res, 401, 'Sign in required');
    const chat = await helpCenter.createLiveChat({
      userId: req.user.id,
      subject: req.body.subject || 'Live support request',
    });
    ok(res, 'Live chat started', chat, 201);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getLiveChat = async (req, res) => {
  try {
    const chat = await helpCenter.getLiveChat(req.params.id, req.user?.id);
    if (!chat) return fail(res, 404, 'Chat not found');
    const messages = await helpCenter.getLiveMessages(req.params.id);
    ok(res, 'Live chat retrieved', { chat, messages });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postLiveMessage = async (req, res) => {
  try {
    const { message, attachment_url, attachment_type } = req.body;
    if (!message && !attachment_url) return fail(res, 400, 'Message or attachment required');

    const chat = await helpCenter.getLiveChat(req.params.id);
    if (!chat) return fail(res, 404, 'Chat not found');
    if (chat.status === 'closed') return fail(res, 400, 'Chat is closed');

    const isAgent = req.user?.role === 'admin';
    if (!isAgent && chat.user_id !== req.user?.id) return fail(res, 403, 'Not authorized');

    const senderRole = isAgent ? 'agent' : 'customer';
    const msg = await helpCenter.addLiveMessage({
      chatId: req.params.id,
      senderId: req.user?.id,
      senderRole,
      message: message || (attachment_url ? '[Attachment]' : ''),
      attachmentUrl: attachment_url,
      attachmentType: attachment_type,
    });

    try {
      const { getIO } = require('../socket/emitters');
      const io = getIO();
      if (io) {
        io.to(`support:${req.params.id}`).emit('supportMessage', msg);
      }
    } catch {
      /* socket optional */
    }

    ok(res, 'Message sent', msg, 201);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const closeLiveChat = async (req, res) => {
  try {
    const chat = await helpCenter.closeLiveChat(req.params.id, req.body.satisfaction_score);
    if (!chat) return fail(res, 404, 'Chat not found');
    ok(res, 'Chat closed', chat);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getAgentStatus = async (_req, res) => {
  try {
    const analytics = await helpCenter.getAnalytics();
    ok(res, 'Agent status', {
      online: analytics.agents_online > 0,
      active_chats: analytics.active_live_chats,
      message: analytics.agents_online > 0
        ? 'Support agents are online'
        : 'Agents offline — AI assistant & tickets available 24/7',
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  getOverview,
  postChat,
  getChatSession,
  listTickets,
  createTicket,
  rateTicket,
  startLiveChat,
  getLiveChat,
  postLiveMessage,
  closeLiveChat,
  getAgentStatus,
};
