const ticketModel = require('../models/ticketModel');
const {
  notifyTicketCreated,
  notifyTicketUpdated,
  notifyTicketResolved,
} = require('../services/ticketNotificationService');

const ok = (res, message, data, status = 200) =>
  res.status(status).json({ success: true, message, data });
const fail = (res, status, message, error = {}) =>
  res.status(status).json({ success: false, message, error });

const loadUser = async (userId) => {
  const { pool } = require('../config/db');
  const { rows } = await pool.query(
    `SELECT id, email, full_name FROM users WHERE id = $1`,
    [userId]
  );
  return rows[0];
};

const listMyTickets = async (req, res) => {
  try {
    ok(res, 'Tickets retrieved', {
      tickets: await ticketModel.listUserTickets(req.user.id),
      categories: ticketModel.TICKET_CATEGORIES,
      priorities: ticketModel.TICKET_PRIORITIES,
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const createTicket = async (req, res) => {
  try {
    const { category, subject, description, priority, order_id, restaurant_id, attachment_urls } =
      req.body;
    if (!category || !subject || !description) {
      return fail(res, 400, 'Category, subject, and description are required');
    }

    let restaurantId = restaurant_id || null;
    if (order_id && !restaurantId) {
      restaurantId = await ticketModel.inferRestaurantFromOrder(order_id);
    }
    if (category === 'Restaurant Complaint' && order_id && !restaurantId) {
      restaurantId = await ticketModel.inferRestaurantFromOrder(order_id);
    }

    const ticket = await ticketModel.createTicket({
      userId: req.user.id,
      category,
      subject,
      description,
      priority,
      orderId: order_id || null,
      restaurantId,
      attachmentUrls: attachment_urls || [],
    });

    try {
      const user = await loadUser(req.user.id);
      await notifyTicketCreated(ticket, user);
    } catch (emailErr) {
      console.warn('[ticket] create email skipped:', emailErr.message);
    }

    ok(res, 'Ticket created', ticket, 201);
  } catch (error) {
    fail(res, error.status || 500, error.message);
  }
};

const getTicketDetail = async (req, res) => {
  try {
    const detail = await ticketModel.getTicketDetail(req.params.id, { userId: req.user.id });
    if (!detail) return fail(res, 404, 'Ticket not found');
    ok(res, 'Ticket retrieved', detail);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const replyToTicket = async (req, res) => {
  try {
    const { message, attachment_urls } = req.body;
    if (!message?.trim() && !(attachment_urls || []).length) {
      return fail(res, 400, 'Message or attachment required');
    }

    const ticket = await ticketModel.getTicket(req.params.id, { userId: req.user.id });
    if (!ticket) return fail(res, 404, 'Ticket not found');
    if (ticket.status === 'Closed') return fail(res, 400, 'Ticket is closed');

    const result = await ticketModel.addMessage({
      ticketId: req.params.id,
      senderId: req.user.id,
      senderRole: 'customer',
      message: message?.trim() || '[Attachment]',
      attachmentUrls: attachment_urls || [],
    });

    try {
      const user = await loadUser(ticket.user_id);
      await notifyTicketUpdated(result.ticket, user, message);
    } catch (emailErr) {
      console.warn('[ticket] update email skipped:', emailErr.message);
    }

    ok(res, 'Reply sent', result, 201);
  } catch (error) {
    fail(res, error.status || 500, error.message);
  }
};

const closeMyTicket = async (req, res) => {
  try {
    const ticket = await ticketModel.closeTicket(req.params.id, {
      userId: req.user.id,
      role: 'customer',
    });
    ok(res, 'Ticket closed', ticket);
  } catch (error) {
    fail(res, error.status || 500, error.message);
  }
};

const adminListTickets = async (req, res) => {
  try {
    ok(res, 'Tickets retrieved', {
      tickets: await ticketModel.listAllTickets({
        status: req.query.status || '',
        category: req.query.category || '',
        limit: req.query.limit,
      }),
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const adminGetTicket = async (req, res) => {
  try {
    const detail = await ticketModel.getTicketDetail(req.params.id, { admin: true });
    if (!detail) return fail(res, 404, 'Ticket not found');
    ok(res, 'Ticket retrieved', detail);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const adminAssignTicket = async (req, res) => {
  try {
    const ticket = await ticketModel.assignAgent(
      req.params.id,
      req.body.agent_id || req.user.id
    );
    if (!ticket) return fail(res, 404, 'Ticket not found');

    try {
      const user = await loadUser(ticket.user_id);
      await notifyTicketUpdated(ticket, user, 'A support agent has been assigned to your ticket.');
    } catch (emailErr) {
      console.warn('[ticket] assign email skipped:', emailErr.message);
    }

    ok(res, 'Ticket assigned', ticket);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const adminUpdateStatus = async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    if (!status) return fail(res, 400, 'status is required');
    const ticket = await ticketModel.updateStatus(req.params.id, status, { adminNotes: admin_notes });
    if (!ticket) return fail(res, 404, 'Ticket not found');

    try {
      const user = await loadUser(ticket.user_id);
      if (status === 'Resolved') await notifyTicketResolved(ticket, user);
      else await notifyTicketUpdated(ticket, user, `Status changed to ${status}.`);
    } catch (emailErr) {
      console.warn('[ticket] status email skipped:', emailErr.message);
    }

    ok(res, 'Status updated', ticket);
  } catch (error) {
    fail(res, error.status || 500, error.message);
  }
};

const adminReplyTicket = async (req, res) => {
  try {
    const { message, attachment_urls } = req.body;
    if (!message?.trim() && !(attachment_urls || []).length) {
      return fail(res, 400, 'Message or attachment required');
    }

    const result = await ticketModel.addMessage({
      ticketId: req.params.id,
      senderId: req.user.id,
      senderRole: 'admin',
      message: message?.trim() || '[Attachment]',
      attachmentUrls: attachment_urls || [],
    });

    try {
      const user = await loadUser(result.ticket.user_id);
      await notifyTicketUpdated(result.ticket, user, message);
    } catch (emailErr) {
      console.warn('[ticket] admin reply email skipped:', emailErr.message);
    }

    ok(res, 'Reply sent', result, 201);
  } catch (error) {
    fail(res, error.status || 500, error.message);
  }
};

const adminCloseTicket = async (req, res) => {
  try {
    const ticket = await ticketModel.closeTicket(req.params.id, { role: 'admin' });
    ok(res, 'Ticket closed', ticket);
  } catch (error) {
    fail(res, error.status || 500, error.message);
  }
};

const partnerListTickets = async (req, res) => {
  try {
    const { getRestaurantByOwnerId } = require('../models/partnerModel');
    const restaurant = await getRestaurantByOwnerId(req.user.id);
    if (!restaurant) return fail(res, 404, 'Restaurant not found');
    ok(res, 'Tickets retrieved', {
      tickets: await ticketModel.listRestaurantTickets(restaurant.id, {
        status: req.query.status || '',
      }),
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const partnerGetTicket = async (req, res) => {
  try {
    const { getRestaurantByOwnerId } = require('../models/partnerModel');
    const restaurant = await getRestaurantByOwnerId(req.user.id);
    if (!restaurant) return fail(res, 404, 'Restaurant not found');
    const detail = await ticketModel.getTicketDetail(req.params.id, {
      restaurantId: restaurant.id,
    });
    if (!detail) return fail(res, 404, 'Ticket not found');
    ok(res, 'Ticket retrieved', detail);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const partnerReplyTicket = async (req, res) => {
  try {
    const { getRestaurantByOwnerId } = require('../models/partnerModel');
    const restaurant = await getRestaurantByOwnerId(req.user.id);
    if (!restaurant) return fail(res, 404, 'Restaurant not found');

    const ticket = await ticketModel.getTicket(req.params.id, { restaurantId: restaurant.id });
    if (!ticket) return fail(res, 404, 'Ticket not found');
    if (ticket.category !== 'Restaurant Complaint') {
      return fail(res, 403, 'Only restaurant complaint tickets can be replied to');
    }

    const { message, attachment_urls } = req.body;
    if (!message?.trim() && !(attachment_urls || []).length) {
      return fail(res, 400, 'Message or attachment required');
    }

    const result = await ticketModel.addMessage({
      ticketId: req.params.id,
      senderId: req.user.id,
      senderRole: 'restaurant',
      message: message?.trim() || '[Attachment]',
      attachmentUrls: attachment_urls || [],
    });

    try {
      const user = await loadUser(ticket.user_id);
      await notifyTicketUpdated(result.ticket, user, message);
    } catch (emailErr) {
      console.warn('[ticket] partner reply email skipped:', emailErr.message);
    }

    ok(res, 'Reply sent', result, 201);
  } catch (error) {
    fail(res, error.status || 500, error.message);
  }
};

module.exports = {
  listMyTickets,
  createTicket,
  getTicketDetail,
  replyToTicket,
  closeMyTicket,
  adminListTickets,
  adminGetTicket,
  adminAssignTicket,
  adminUpdateStatus,
  adminReplyTicket,
  adminCloseTicket,
  partnerListTickets,
  partnerGetTicket,
  partnerReplyTicket,
};
