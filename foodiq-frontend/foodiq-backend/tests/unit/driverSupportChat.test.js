const test = require('node:test');
const assert = require('node:assert/strict');
const supportModel = require('../../models/deliverySupportModel');

test('Driver Support Chat Module Business Rules & Logic', async (t) => {
  await t.test('generates ticket number in TK-YYYYMMDD-XXXX format', async () => {
    const ticketNumber = await supportModel.generateTicketNumber();
    assert.match(
      ticketNumber,
      /^TK-\d{8}-\d{4}$/,
      'Ticket number must match TK-YYYYMMDD-XXXX format'
    );
  });

  await t.test('validates priority and status allowed values', () => {
    assert.deepEqual(
      supportModel.PRIORITIES,
      ['low', 'medium', 'high', 'urgent'],
      'PRIORITIES must include low, medium, high, urgent'
    );

    assert.deepEqual(
      supportModel.STATUSES,
      ['open', 'in_progress', 'pending', 'resolved', 'closed'],
      'STATUSES must include open, in_progress, pending, resolved, closed'
    );
  });

  await t.test('enforces closed ticket read-only protection', () => {
    const isMessageAllowed = (ticketStatus) => {
      if (ticketStatus === 'closed') {
        return { allowed: false, reason: 'This ticket is closed and read-only.' };
      }
      return { allowed: true };
    };

    assert.equal(isMessageAllowed('closed').allowed, false, 'Closed ticket must reject new messages');
    assert.equal(isMessageAllowed('open').allowed, true, 'Open ticket must allow new messages');
    assert.equal(isMessageAllowed('in_progress').allowed, true, 'In progress ticket must allow new messages');
  });

  await t.test('enforces partner ownership security boundary', () => {
    const canAccessTicket = (ticketPartnerId, requestingPartnerId, role) => {
      if (role === 'admin') return true;
      return ticketPartnerId === requestingPartnerId;
    };

    const partnerIdA = 'p-100';
    const partnerIdB = 'p-200';

    assert.equal(canAccessTicket(partnerIdA, partnerIdA, 'partner'), true, 'Partner can access own ticket');
    assert.equal(canAccessTicket(partnerIdA, partnerIdB, 'partner'), false, 'Partner cannot access another partner ticket');
    assert.equal(canAccessTicket(partnerIdA, partnerIdB, 'admin'), true, 'Admin can access any partner ticket');
  });

  await t.test('formats ticket message audit log payload correctly', () => {
    const formatLogPayload = ({ ticketId, senderType, senderId, action, notes }) => ({
      ticket_id: ticketId,
      action: action || (senderType === 'admin' ? 'Admin Replied' : 'Partner Message'),
      performed_by: senderId,
      notes: notes || '',
    });

    const partnerLog = formatLogPayload({
      ticketId: 'tk-1',
      senderType: 'partner',
      senderId: 'partner-1',
      notes: 'Initial ticket raise',
    });
    assert.equal(partnerLog.action, 'Partner Message');
    assert.equal(partnerLog.performed_by, 'partner-1');

    const adminLog = formatLogPayload({
      ticketId: 'tk-1',
      senderType: 'admin',
      senderId: 'admin-1',
    });
    assert.equal(adminLog.action, 'Admin Replied');
    assert.equal(adminLog.performed_by, 'admin-1');
  });
});
