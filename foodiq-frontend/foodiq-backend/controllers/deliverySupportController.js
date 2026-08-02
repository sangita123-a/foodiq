const supportModel = require('../models/deliverySupportModel');
const supportService = require('../services/deliverySupportService');

const ok = (res, message, data = {}) => res.json({ success: true, message, data });
const fail = (res, status, message, error = {}) =>
  res.status(status).json({
    success: false,
    message,
    error: typeof error === 'string' ? { detail: error } : error,
  });

const getPartnerId = (req) => req.deliveryPartner?.id || req.user?.partner_id || (req.user?.role === 'partner' ? req.user?.id : null) || null;

/* ── Delivery Partner Handlers ────────────────────────────────────────── */

/**
 * POST /api/delivery/support/ticket & POST /api/delivery/support
 */
const createTicket = async (req, res) => {
  try {
    const partnerId = getPartnerId(req);
    if (!partnerId) {
      return fail(res, 401, 'Unauthorized: Delivery partner access required');
    }
    const { subject, category, priority, description, message } = req.body || {};

    const initialMessage = message || description || '';
    const ticket = await supportService.createPartnerTicket(partnerId, {
      subject,
      category,
      priority,
      initialMessage,
    });

    return ok(res, 'Support ticket created successfully', ticket);
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'Failed to create support ticket');
  }
};

/**
 * GET /api/delivery/support/tickets & GET /api/delivery/support
 */
const getMyTickets = async (req, res) => {
  try {
    const partnerId = getPartnerId(req);
    if (!partnerId) {
      return fail(res, 401, 'Unauthorized: Delivery partner access required');
    }
    const { page, limit, status, priority, search } = req.query || {};

    const result = await supportModel.listPartnerTickets(partnerId, {
      page,
      limit,
      status,
      priority,
      search,
    });

    return ok(res, 'Partner support tickets retrieved', result);
  } catch (error) {
    return fail(res, 500, error.message || 'Failed to retrieve support tickets');
  }
};

/**
 * GET /api/delivery/support/ticket/:id & GET /api/delivery/support/:id
 */
const getTicketById = async (req, res) => {
  try {
    const partnerId = getPartnerId(req);
    if (!partnerId) {
      return fail(res, 401, 'Unauthorized: Delivery partner access required');
    }
    const ticketId = req.params.id;

    const result = await supportService.getTicketDetails(ticketId, {
      role: 'partner',
      isDeliveryPartner: true,
      partnerId,
    });

    return ok(res, 'Support ticket details retrieved', result);
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'Failed to retrieve ticket details');
  }
};

/**
 * POST /api/delivery/support/message
 */
const sendPartnerMessage = async (req, res) => {
  try {
    const partnerId = getPartnerId(req);
    if (!partnerId) {
      return fail(res, 401, 'Unauthorized: Delivery partner access required');
    }
    const { ticket_id, ticketId, message, attachment_url, attachmentUrl, message_type, messageType } = req.body || {};
    const targetTicketId = ticket_id || ticketId || req.params.id;

    if (!targetTicketId) {
      return fail(res, 400, 'ticket_id is required');
    }

    const newMsg = await supportService.postMessage(
      targetTicketId,
      {
        senderType: 'partner',
        senderId: partnerId,
        message,
        attachmentUrl: attachment_url || attachmentUrl,
        messageType: message_type || messageType || 'text',
      },
      { role: 'partner', isDeliveryPartner: true, partnerId }
    );

    return ok(res, 'Message sent successfully', newMsg);
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'Failed to send message');
  }
};

/**
 * PATCH /api/delivery/support/read
 */
const markReadPartner = async (req, res) => {
  try {
    const partnerId = getPartnerId(req);
    if (!partnerId) {
      return fail(res, 401, 'Unauthorized: Delivery partner access required');
    }
    const { ticket_id, ticketId } = req.body || {};
    const targetTicketId = ticket_id || ticketId || req.params.id;

    if (!targetTicketId) {
      return fail(res, 400, 'ticket_id is required');
    }

    const result = await supportService.markRead(targetTicketId, 'partner', partnerId);
    return ok(res, 'Messages marked as read', result);
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'Failed to mark messages as read');
  }
};

/* ── Admin Console Handlers ───────────────────────────────────────────── */

/**
 * GET /api/admin/support/tickets
 */
const adminListTickets = async (req, res) => {
  try {
    const { page, limit, status, priority, assigned_admin, search } = req.query;

    const result = await supportModel.listAdminTickets({
      page,
      limit,
      status,
      priority,
      assignedAdmin: assigned_admin,
      search,
    });

    const analytics = await supportModel.getSupportAnalytics();

    return ok(res, 'Admin support tickets retrieved', {
      ...result,
      analytics,
    });
  } catch (error) {
    return fail(res, 500, error.message || 'Failed to retrieve support tickets');
  }
};

/**
 * GET /api/admin/support/ticket/:id
 */
const adminGetTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;

    const result = await supportService.getTicketDetails(ticketId, {
      role: 'admin',
      isDeliveryPartner: false,
    });

    return ok(res, 'Ticket details retrieved', result);
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'Failed to retrieve ticket details');
  }
};

/**
 * PATCH /api/admin/support/assign
 */
const adminAssignTicket = async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { ticket_id, ticketId, assigned_admin, admin_id } = req.body;
    const targetTicketId = ticket_id || ticketId;
    const targetAdminId = assigned_admin || admin_id || adminUserId;

    if (!targetTicketId) {
      return fail(res, 400, 'ticket_id is required');
    }

    const ticket = await supportService.assignAdmin(targetTicketId, targetAdminId, adminUserId);
    return ok(res, 'Ticket assigned successfully', ticket);
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'Failed to assign ticket');
  }
};

/**
 * PATCH /api/admin/support/status
 */
const adminUpdateStatus = async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { ticket_id, ticketId, status, notes } = req.body;
    const targetTicketId = ticket_id || ticketId;

    if (!targetTicketId || !status) {
      return fail(res, 400, 'ticket_id and status are required');
    }

    const ticket = await supportService.updateStatus(targetTicketId, status, adminUserId, notes);
    return ok(res, `Ticket status updated to ${status}`, ticket);
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'Failed to update ticket status');
  }
};

/**
 * POST /api/admin/support/message
 */
const adminSendMessage = async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { ticket_id, ticketId, message, attachment_url, attachmentUrl, message_type, messageType } = req.body;
    const targetTicketId = ticket_id || ticketId;

    if (!targetTicketId) {
      return fail(res, 400, 'ticket_id is required');
    }

    const newMsg = await supportService.postMessage(
      targetTicketId,
      {
        senderType: 'admin',
        senderId: adminUserId,
        message,
        attachmentUrl: attachment_url || attachmentUrl,
        messageType: message_type || messageType || 'text',
      },
      { role: 'admin', isDeliveryPartner: false }
    );

    return ok(res, 'Admin response sent', newMsg);
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'Failed to send admin message');
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getTicketById,
  sendPartnerMessage,
  markReadPartner,
  adminListTickets,
  adminGetTicket,
  adminAssignTicket,
  adminUpdateStatus,
  adminSendMessage,
};
