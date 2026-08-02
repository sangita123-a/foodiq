const supportModel = require('../models/deliverySupportModel');
const deliveryNotificationModel = require('../models/deliveryNotificationModel');
const socketEmitters = require('../socket/emitters');

/**
 * Partner creates a support ticket.
 */
const createPartnerTicket = async (partnerId, { subject, category, priority, initialMessage }) => {
  if (!subject || !subject.trim()) {
    throw Object.assign(new Error('Ticket subject is required'), { status: 400 });
  }

  const ticket = await supportModel.createTicket({
    partnerId,
    subject: subject.trim(),
    category: category || 'General',
    priority: priority || 'medium',
  });

  // If initial message or description provided, add it
  if (initialMessage && initialMessage.trim()) {
    await supportModel.addMessage({
      ticketId: ticket.id,
      senderType: 'partner',
      senderId: partnerId,
      message: initialMessage.trim(),
      messageType: 'text',
    });
  }

  // Audit log
  await supportModel.addTicketLog({
    ticketId: ticket.id,
    action: 'Ticket Created',
    performedBy: partnerId,
    newStatus: 'open',
    notes: `Ticket raised with subject: ${subject}`,
  });

  // Notify delivery partner
  try {
    await deliveryNotificationModel.createNotification({
      partnerId,
      type: 'admin_message',
      title: 'Support Ticket Created',
      message: `Your ticket ${ticket.ticket_number} ("${ticket.subject}") has been created.`,
      actionUrl: '/delivery/support',
    });
  } catch (err) {
    console.warn('[deliverySupportService] notification skipped:', err.message);
  }

  // Socket event
  try {
    socketEmitters.emitSupportNewTicket(ticket);
  } catch (err) {
    console.warn('[deliverySupportService] socket emission failed:', err.message);
  }

  return ticket;
};

/**
 * Get ticket details with messages & authorization check.
 */
const getTicketDetails = async (ticketId, userContext) => {
  const ticket = await supportModel.getTicketById(ticketId);
  if (!ticket) {
    throw Object.assign(new Error('Support ticket not found'), { status: 404 });
  }

  // Business Rule: Partners can only access their own tickets
  if (userContext.role === 'partner' || userContext.isDeliveryPartner) {
    if (ticket.partner_id !== userContext.partnerId) {
      throw Object.assign(new Error('Access denied to this support ticket'), { status: 403 });
    }
  }

  const messages = await supportModel.getTicketMessages(ticketId);
  const logs = await supportModel.getTicketLogs(ticketId);

  return {
    ...ticket,
    messages,
    logs,
  };
};

/**
 * Post a message on a ticket (Partner or Admin).
 */
const postMessage = async (ticketId, { senderType, senderId, message, attachmentUrl, messageType = 'text' }, userContext) => {
  const ticket = await supportModel.getTicketById(ticketId);
  if (!ticket) {
    throw Object.assign(new Error('Support ticket not found'), { status: 404 });
  }

  // Business Rule: Closed tickets become read-only
  if (ticket.status === 'closed') {
    throw Object.assign(new Error('This ticket is closed and read-only. No further messages allowed.'), { status: 400 });
  }

  // Business Rule: Partners can only write to their own tickets
  if (senderType === 'partner') {
    if (ticket.partner_id !== senderId) {
      throw Object.assign(new Error('Access denied to this support ticket'), { status: 403 });
    }
  }

  if (!message && !attachmentUrl) {
    throw Object.assign(new Error('Message text or attachment is required'), { status: 400 });
  }

  const newMsg = await supportModel.addMessage({
    ticketId,
    senderType,
    senderId,
    message,
    attachmentUrl,
    messageType,
  });

  // If admin replies and ticket was open, automatically set status to in_progress
  if (senderType === 'admin' && ticket.status === 'open') {
    await supportModel.updateTicketStatus(ticketId, 'in_progress');
    await supportModel.addTicketLog({
      ticketId,
      action: 'Status Updated',
      performedBy: senderId,
      oldStatus: 'open',
      newStatus: 'in_progress',
      notes: 'Auto-updated to in_progress upon admin response',
    });
  }

  // Audit log
  await supportModel.addTicketLog({
    ticketId,
    action: senderType === 'admin' ? 'Admin Replied' : 'Partner Message',
    performedBy: senderId,
    notes: messageType !== 'text' ? `Attachment sent (${messageType})` : 'Text message sent',
  });

  // Notification to partner when Admin replies
  if (senderType === 'admin') {
    try {
      await deliveryNotificationModel.createNotification({
        partnerId: ticket.partner_id,
        type: 'support_ticket_reply',
        title: 'New Support Reply',
        message: `Admin replied on ticket ${ticket.ticket_number}: ${message || 'Attachment sent'}`,
        actionUrl: '/delivery/support',
      });
    } catch (err) {
      console.warn('[deliverySupportService] reply notification skipped:', err.message);
    }
  }

  // Socket event
  try {
    socketEmitters.emitSupportNewMessage({
      ...newMsg,
      partner_id: ticket.partner_id,
    });
  } catch (err) {
    console.warn('[deliverySupportService] socket message emission failed:', err.message);
  }

  return newMsg;
};

/**
 * Mark messages as read.
 */
const markRead = async (ticketId, readerType, readerId) => {
  const ticket = await supportModel.getTicketById(ticketId);
  if (!ticket) {
    throw Object.assign(new Error('Support ticket not found'), { status: 404 });
  }

  if (readerType === 'partner' && ticket.partner_id !== readerId) {
    throw Object.assign(new Error('Access denied to this support ticket'), { status: 403 });
  }

  const updatedCount = await supportModel.markMessagesRead(ticketId, readerType);

  if (updatedCount > 0) {
    try {
      socketEmitters.emitSupportRead({
        ticket_id: ticketId,
        partner_id: ticket.partner_id,
        read_by: readerType,
      });
    } catch (err) {
      console.warn('[deliverySupportService] socket read emission failed:', err.message);
    }
  }

  return { ticket_id: ticketId, marked_read_count: updatedCount };
};

/**
 * Admin assigns ticket to admin user.
 */
const assignAdmin = async (ticketId, assignedAdminId, adminUserId) => {
  const ticket = await supportModel.getTicketById(ticketId);
  if (!ticket) {
    throw Object.assign(new Error('Support ticket not found'), { status: 404 });
  }

  const updatedTicket = await supportModel.assignTicketAdmin(ticketId, assignedAdminId);

  await supportModel.addTicketLog({
    ticketId,
    action: 'Ticket Assigned',
    performedBy: adminUserId,
    notes: `Assigned admin set to ${assignedAdminId}`,
  });

  try {
    socketEmitters.emitSupportStatusChange({
      ticket_id: ticketId,
      partner_id: ticket.partner_id,
      assigned_admin: assignedAdminId,
      status: updatedTicket.status,
    });
  } catch (err) {
    console.warn('[deliverySupportService] socket assign emission failed:', err.message);
  }

  return updatedTicket;
};

/**
 * Admin updates ticket status.
 */
const updateStatus = async (ticketId, newStatus, adminUserId, notes = '') => {
  const ticket = await supportModel.getTicketById(ticketId);
  if (!ticket) {
    throw Object.assign(new Error('Support ticket not found'), { status: 404 });
  }

  const oldStatus = ticket.status;
  const updatedTicket = await supportModel.updateTicketStatus(ticketId, newStatus);

  await supportModel.addTicketLog({
    ticketId,
    action: 'Status Changed',
    performedBy: adminUserId,
    oldStatus,
    newStatus,
    notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
  });

  // Notifications on status change
  try {
    let notifTitle = `Support Ticket ${newStatus.replace('_', ' ').toUpperCase()}`;
    let notifType = 'support_ticket_reply';

    if (newStatus === 'resolved') {
      notifType = 'support_ticket_resolved';
      notifTitle = 'Support Ticket Resolved';
    } else if (newStatus === 'closed') {
      notifTitle = 'Support Ticket Closed';
    }

    await deliveryNotificationModel.createNotification({
      partnerId: ticket.partner_id,
      type: notifType,
      title: notifTitle,
      message: `Your ticket ${ticket.ticket_number} status was updated to ${newStatus.replace('_', ' ')}.`,
      actionUrl: '/delivery/support',
    });
  } catch (err) {
    console.warn('[deliverySupportService] status notification skipped:', err.message);
  }

  // Socket event
  try {
    socketEmitters.emitSupportStatusChange({
      ticket_id: ticketId,
      partner_id: ticket.partner_id,
      status: newStatus,
      old_status: oldStatus,
    });
  } catch (err) {
    console.warn('[deliverySupportService] socket status emission failed:', err.message);
  }

  return updatedTicket;
};

module.exports = {
  createPartnerTicket,
  getTicketDetails,
  postMessage,
  markRead,
  assignAdmin,
  updateStatus,
};
