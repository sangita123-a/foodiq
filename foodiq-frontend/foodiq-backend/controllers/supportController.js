const { pool } = require('../config/db');
const { ok, fail } = require('../utils/respond');
const { sendEmail } = require('../services/emailService');

const PROBLEM_TYPES = new Set([
  'Missing Item',
  'Wrong Order',
  'Food Quality',
  'Cold Food',
  'Packaging Issue',
  'Late Delivery',
]);

const nextTicketNumber = async (client = pool) => {
  const { rows } = await client.query(
    `SELECT nextval('support_ticket_number_seq') AS n`
  );
  return `TKT-${rows[0].n}`;
};

const initSupportExtras = async () => {
  try {
    await pool.query(`CREATE SEQUENCE IF NOT EXISTS support_ticket_number_seq START 1000`);
    await pool.query(`
      ALTER TABLE support_tickets
        ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal',
        ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(20),
        ADD COLUMN IF NOT EXISTS order_id UUID,
        ADD COLUMN IF NOT EXISTS restaurant_id UUID,
        ADD COLUMN IF NOT EXISTS problem_type VARCHAR(80),
        ADD COLUMN IF NOT EXISTS image_url TEXT,
        ADD COLUMN IF NOT EXISTS expected_resolution_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS attachment_urls JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_support (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ticket_number VARCHAR(20),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        attachment_url TEXT,
        status VARCHAR(40) NOT NULL DEFAULT 'Open',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_email_support_ticket_number
        ON email_support(ticket_number) WHERE ticket_number IS NOT NULL
    `);
  } catch (e) {
    console.error('[support] schema init error', e.message);
  }
};
initSupportExtras();

const submitSupport = async (req, res) => {
  try {
    const { category, subject, description } = req.body;
    if (!category || !subject || !description) {
      return fail(res, 400, 'All fields are required');
    }
    const ticketNumber = await nextTicketNumber();
    const { rows } = await pool.query(
      `INSERT INTO support_tickets
         (user_id, category, subject, description, ticket_number, status, expected_resolution_at)
       VALUES ($1, $2, $3, $4, $5, 'Open', NOW() + INTERVAL '24 hours')
       RETURNING *`,
      [req.user.id, category, subject, description, ticketNumber]
    );
    return ok(
      res,
      'Support ticket submitted successfully',
      {
        ...rows[0],
        ticket_number: ticketNumber,
        expected_resolution_time: rows[0].expected_resolution_at,
      },
      201
    );
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
};

/**
 * Order problem complaint — stores ticket in PostgreSQL with optional image.
 * POST /api/support/order-problem
 */
const submitOrderProblem = async (req, res) => {
  try {
    const orderId = String(req.body.order_id || req.body.orderId || '').trim();
    const problemType = String(req.body.problem_type || req.body.problemType || '').trim();
    const description = String(req.body.description || '').trim();

    if (!orderId || !problemType || !description) {
      return fail(res, 400, 'Order, problem type, and description are required');
    }
    if (!PROBLEM_TYPES.has(problemType)) {
      return fail(res, 400, 'Invalid problem type');
    }

    const orderRes = await pool.query(
      `SELECT id, restaurant_id FROM orders WHERE id = $1 AND user_id = $2`,
      [orderId, req.user.id]
    );
    if (!orderRes.rows[0]) {
      return fail(res, 404, 'Order not found');
    }

    let imageUrl = null;
    if (req.file) {
      try {
        const storage = require('../services/storage');
        const uploaded = await storage.uploadFile(req.file, 'other', {
          userId: req.user.id,
        });
        imageUrl = uploaded.url;
      } catch (uploadErr) {
        console.warn('[support] image upload failed', uploadErr.message);
        return fail(res, 400, uploadErr.message || 'Image upload failed');
      }
    } else if (req.body.image_url) {
      imageUrl = String(req.body.image_url).slice(0, 2000);
    }

    const ticketNumber = await nextTicketNumber();
    const expectedHours = problemType === 'Late Delivery' ? 4 : 24;

    const { rows } = await pool.query(
      `INSERT INTO support_tickets (
         user_id, category, subject, description, status, ticket_number,
         order_id, restaurant_id, problem_type, image_url, expected_resolution_at,
         attachment_urls
       ) VALUES (
         $1, 'Order Problem', $2, $3, 'Open', $4,
         $5, $6, $7, $8, NOW() + ($9::int * INTERVAL '1 hour'),
         $10::jsonb
       ) RETURNING *`,
      [
        req.user.id,
        `${problemType} — Order ${orderId.slice(0, 8).toUpperCase()}`,
        description.slice(0, 8000),
        ticketNumber,
        orderId,
        orderRes.rows[0].restaurant_id,
        problemType,
        imageUrl,
        expectedHours,
        JSON.stringify(imageUrl ? [imageUrl] : []),
      ]
    );

    return ok(
      res,
      'Complaint submitted successfully',
      {
        ticket: rows[0],
        ticket_number: ticketNumber,
        status: rows[0].status || 'Open',
        expected_resolution_time: rows[0].expected_resolution_at,
        expected_resolution_hours: expectedHours,
      },
      201
    );
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
};

/**
 * Email support form — persists ticket + sends via Nodemailer/Resend.
 * POST /api/support/email
 */
const submitEmailSupport = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || req.user?.email || '').trim();
    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();

    if (!name || !email || !subject || !message) {
      return fail(res, 400, 'Name, email, subject, and message are required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(res, 400, 'Invalid email address');
    }

    let attachmentUrl = null;
    const attachments = [];
    if (req.file) {
      try {
        const storage = require('../services/storage');
        const uploaded = await storage.uploadFile(req.file, 'other', {
          userId: req.user?.id,
        });
        attachmentUrl = uploaded.url;
        attachments.push({
          filename: req.file.originalname || 'attachment',
          content: req.file.buffer,
          contentType: req.file.mimetype,
        });
      } catch (uploadErr) {
        return fail(res, 400, uploadErr.message || 'Attachment upload failed');
      }
    }

    const ticketNumber = await nextTicketNumber();
    const { rows } = await pool.query(
      `INSERT INTO email_support
         (user_id, ticket_number, name, email, subject, message, attachment_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Open')
       RETURNING *`,
      [
        req.user?.id || null,
        ticketNumber,
        name.slice(0, 255),
        email.slice(0, 255),
        subject.slice(0, 255),
        message.slice(0, 8000),
        attachmentUrl,
      ]
    );

    const supportInbox =
      process.env.SUPPORT_INBOX || process.env.EMAIL_FROM_ADDRESS || 'support@foodiq.com';

    try {
      await sendEmail({
        to: supportInbox,
        subject: `[${ticketNumber}] ${subject}`,
        html: `
          <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <p><strong>Ticket:</strong> ${ticketNumber}</p>
          <p>${message.replace(/\n/g, '<br/>')}</p>
          ${attachmentUrl ? `<p><a href="${attachmentUrl}">Attachment</a></p>` : ''}
        `,
        text: message,
        attachments,
        userId: req.user?.id || null,
        template: 'support_email',
        meta: { ticket_number: ticketNumber },
      });
      // Confirmation to customer
      await sendEmail({
        to: email,
        subject: `We received your message (${ticketNumber})`,
        html: `<p>Hi ${name},</p><p>Thanks for contacting Foodiq Support. Your ticket <strong>${ticketNumber}</strong> is open. We typically respond within 24 hours.</p>`,
        text: `Thanks for contacting Foodiq. Ticket ${ticketNumber} is open.`,
        userId: req.user?.id || null,
        template: 'support_email_ack',
      });
    } catch (mailErr) {
      console.warn('[support] email send warning', mailErr.message);
    }

    return ok(
      res,
      'Email sent successfully',
      {
        ticket: rows[0],
        ticket_number: ticketNumber,
        status: 'Open',
      },
      201
    );
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
};

/**
 * Unified ticket history for logged-in users.
 * GET /api/support/history
 */
const getSupportHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const [complaints, refunds, emails, chats] = await Promise.all([
      pool.query(
        `SELECT id, ticket_number, category, subject, description, status, problem_type,
                order_id, created_at, expected_resolution_at
         FROM support_tickets
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId]
      ),
      pool.query(
        `SELECT rr.id, rr.amount, rr.status, rr.refund_type, rr.refund_method, rr.reason,
                rr.created_at, rr.order_id, rr.payment_id
         FROM refund_requests rr
         WHERE rr.user_id = $1
         ORDER BY rr.created_at DESC
         LIMIT 50`,
        [userId]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT id, ticket_number, subject, status, created_at, email
         FROM email_support
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId]
      ),
      pool.query(
        `SELECT c.id, c.subject, c.status, c.created_at,
                (
                  SELECT COUNT(*)::int FROM support_live_messages m
                  WHERE m.chat_id = c.id AND m.sender_role <> 'customer' AND COALESCE(m.is_read, FALSE) = FALSE
                ) AS unread_count
         FROM support_live_chats c
         WHERE c.user_id = $1
         ORDER BY c.created_at DESC
         LIMIT 50`,
        [userId]
      ),
    ]);

    const normalizeStatus = (s) => {
      const v = String(s || 'Open');
      if (/progress|pending|assigned/i.test(v)) return 'In Progress';
      if (/resolv|clos|done|complete/i.test(v)) return 'Resolved';
      return 'Open';
    };

    const tickets = [
      ...complaints.rows.map((t) => ({
        id: t.ticket_number || t.id,
        db_id: t.id,
        type: 'complaint',
        subject: t.subject,
        status: normalizeStatus(t.status),
        date: t.created_at,
        meta: t,
      })),
      ...refunds.rows.map((r) => ({
        id: `REF-${String(r.id).slice(0, 8).toUpperCase()}`,
        db_id: r.id,
        type: 'refund',
        subject: r.reason || `Refund ₹${Number(r.amount).toFixed(0)}`,
        status: normalizeStatus(r.status),
        date: r.created_at,
        meta: r,
      })),
      ...emails.rows.map((e) => ({
        id: e.ticket_number || e.id,
        db_id: e.id,
        type: 'email',
        subject: e.subject,
        status: normalizeStatus(e.status),
        date: e.created_at,
        meta: e,
      })),
      ...chats.rows.map((c) => ({
        id: `CHAT-${String(c.id).slice(0, 8).toUpperCase()}`,
        db_id: c.id,
        type: 'chat',
        subject: c.subject || 'Live chat',
        status: normalizeStatus(c.status),
        date: c.created_at,
        unread: Number(c.unread_count || 0),
        meta: c,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return ok(res, 'Support history retrieved', {
      tickets,
      complaints: complaints.rows,
      refunds: refunds.rows,
      emails: emails.rows,
      chats: chats.rows,
    });
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
};

module.exports = {
  submitSupport,
  submitOrderProblem,
  submitEmailSupport,
  getSupportHistory,
  PROBLEM_TYPES,
};
