const { sendEmail } = require('./emailService');

const appUrl = () => process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://foodiq.in';

const ticketEmailShell = (title, bodyHtml) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
    <h2 style="color:#E23744;margin:0 0 16px">${title}</h2>
    ${bodyHtml}
    <p style="color:#6B7280;font-size:12px;margin-top:24px">Foodiq Support · <a href="${appUrl()}/help-and-support">Help & Support</a></p>
  </div>
`;

const notifyTicketCreated = async (ticket, user) => {
  if (!user?.email) return;
  const html = ticketEmailShell(
    'Support ticket created',
    `<p>Hi ${user.full_name || 'there'},</p>
     <p>We received your support request <strong>${ticket.ticket_number || ticket.id.slice(0, 8)}</strong>.</p>
     <p><strong>Subject:</strong> ${ticket.subject}<br/>
     <strong>Category:</strong> ${ticket.category}<br/>
     <strong>Status:</strong> ${ticket.status}<br/>
     <strong>Priority:</strong> ${ticket.priority || 'Medium'}</p>
     <p>Our team will respond shortly. You can track updates in Help & Support.</p>`
  );
  await sendEmail({
    to: user.email,
    subject: `[Foodiq] Ticket ${ticket.ticket_number || ''} created — ${ticket.subject}`,
    html,
    userId: user.id,
    template: 'ticket_created',
    meta: { ticket_id: ticket.id, ticket_number: ticket.ticket_number },
  });
};

const notifyTicketUpdated = async (ticket, user, preview = '') => {
  if (!user?.email) return;
  const html = ticketEmailShell(
    'Ticket updated',
    `<p>Hi ${user.full_name || 'there'},</p>
     <p>Your ticket <strong>${ticket.ticket_number || ''}</strong> has a new update.</p>
     <p><strong>Status:</strong> ${ticket.status}</p>
     ${preview ? `<p style="background:#F8FAFC;padding:12px;border-radius:8px">${preview.slice(0, 500)}</p>` : ''}
     <p><a href="${appUrl()}/help-and-support">View ticket</a></p>`
  );
  await sendEmail({
    to: user.email,
    subject: `[Foodiq] Update on ticket ${ticket.ticket_number || ''}`,
    html,
    userId: user.id,
    template: 'ticket_updated',
    meta: { ticket_id: ticket.id },
  });
};

const notifyTicketResolved = async (ticket, user) => {
  if (!user?.email) return;
  const html = ticketEmailShell(
    'Ticket resolved',
    `<p>Hi ${user.full_name || 'there'},</p>
     <p>Your support ticket <strong>${ticket.ticket_number || ''}</strong> has been marked as <strong>Resolved</strong>.</p>
     <p>If you need further help, reply on the ticket or open a new request.</p>
     <p><a href="${appUrl()}/help-and-support">View ticket</a></p>`
  );
  await sendEmail({
    to: user.email,
    subject: `[Foodiq] Ticket ${ticket.ticket_number || ''} resolved`,
    html,
    userId: user.id,
    template: 'ticket_resolved',
    meta: { ticket_id: ticket.id },
  });
};

module.exports = {
  notifyTicketCreated,
  notifyTicketUpdated,
  notifyTicketResolved,
};
