/**
 * Professional PDF invoice generator (PDFKit).
 */
const PDFDocument = require('pdfkit');
const { pool } = require('../config/db');

const buildInvoicePdfBuffer = async ({ paymentId, userId = null }) => {
  const paymentQ = userId
    ? await pool.query('SELECT * FROM payments WHERE id = $1 AND user_id = $2', [
        paymentId,
        userId,
      ])
    : await pool.query('SELECT * FROM payments WHERE id = $1', [paymentId]);
  const payment = paymentQ.rows[0];
  if (!payment) {
    const err = new Error('Payment not found');
    err.status = 404;
    throw err;
  }

  const orderQ = await pool.query(
    `SELECT o.*, r.name AS restaurant_name, r.address AS restaurant_address,
            u.full_name, u.email, u.phone_number
     FROM orders o
     JOIN restaurants r ON r.id = o.restaurant_id
     JOIN users u ON u.id = o.user_id
     WHERE o.id = $1`,
    [payment.order_id]
  );
  const order = orderQ.rows[0];
  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  const itemsQ = await pool.query(
    `SELECT oi.quantity, oi.price_at_time, m.name
     FROM order_items oi JOIN menu_items m ON m.id = oi.menu_item_id
     WHERE oi.order_id = $1`,
    [payment.order_id]
  );

  const shortId = String(order.id).slice(0, 8).toUpperCase();
  const paidAt = new Date(payment.transaction_time || payment.created_at).toLocaleString(
    'en-IN'
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fillColor('#FC8019').fontSize(24).font('Helvetica-Bold').text('Foodiq', 50, 50);
    doc.fillColor('#6B7280').fontSize(10).font('Helvetica').text('Tax Invoice', 50, 78);
    doc.fillColor('#111827').fontSize(10).text(`Invoice: ${String(payment.id).slice(0, 8)}`, 350, 50, {
      width: 200,
      align: 'right',
    });
    doc.text(`Order: #${shortId}`, 350, 64, { width: 200, align: 'right' });
    doc.text(`Date: ${paidAt}`, 350, 78, { width: 200, align: 'right' });

    doc
      .moveTo(50, 100)
      .strokeColor('#FC8019')
      .lineWidth(2)
      .lineTo(545, 100)
      .stroke();

    // Parties
    let y = 120;
    doc.fillColor('#9CA3AF').fontSize(9).text('BILL TO', 50, y);
    doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text(order.full_name || '', 50, y + 14);
    doc.font('Helvetica').fontSize(10).fillColor('#6B7280');
    doc.text(order.email || '', 50, y + 30);
    doc.text(order.phone_number || '-', 50, y + 44);

    doc.fillColor('#9CA3AF').fontSize(9).text('RESTAURANT', 320, y);
    doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text(order.restaurant_name || '', 320, y + 14, {
      width: 220,
    });
    doc.font('Helvetica').fontSize(10).fillColor('#6B7280');
    doc.text(order.restaurant_address || '', 320, y + 30, { width: 220 });

    // Table header
    y = 210;
    doc.rect(50, y, 495, 24).fill('#F8FAFC');
    doc.fillColor('#6B7280').fontSize(9).font('Helvetica-Bold');
    doc.text('ITEM', 58, y + 8);
    doc.text('QTY', 320, y + 8);
    doc.text('PRICE', 380, y + 8);
    doc.text('AMOUNT', 460, y + 8);

    y += 30;
    doc.font('Helvetica').fontSize(10).fillColor('#111827');
    itemsQ.rows.forEach((item) => {
      const amount = Number(item.price_at_time) * item.quantity;
      doc.text(String(item.name).slice(0, 40), 58, y, { width: 250 });
      doc.text(String(item.quantity), 320, y);
      doc.text(`₹${Number(item.price_at_time).toFixed(2)}`, 380, y);
      doc.text(`₹${amount.toFixed(2)}`, 460, y);
      y += 20;
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });

    y += 10;
    doc.moveTo(320, y).strokeColor('#E5E7EB').lineTo(545, y).stroke();
    y += 12;
    const row = (label, value, bold = false) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10);
      doc.fillColor('#6B7280').text(label, 320, y);
      doc.fillColor('#111827').text(value, 460, y);
      y += bold ? 22 : 16;
    };
    row('Subtotal', `₹${Number(order.subtotal).toFixed(2)}`);
    row('Discount', `-₹${Number(order.discount_amount || 0).toFixed(2)}`);
    row('Delivery', `₹${Number(order.delivery_fee || 0).toFixed(2)}`);
    row('Platform Fee', `₹${Number(order.platform_fee || 0).toFixed(2)}`);
    row('GST', `₹${Number(order.tax_amount || 0).toFixed(2)}`);
    row('Total', `₹${Number(order.total_amount).toFixed(2)}`, true);

    y += 20;
    doc.fillColor('#6B7280').fontSize(9).font('Helvetica');
    doc.text(`Payment method: ${String(payment.method || '').replace(/_/g, ' ')}`, 50, y);
    doc.text(`Payment status: ${payment.status}`, 50, y + 14);
    doc.text(`Razorpay: ${payment.razorpay_payment_id || '-'}`, 50, y + 28);
    doc.text(`Currency: ${payment.currency || 'INR'}`, 50, y + 42);

    doc.fillColor('#9CA3AF').fontSize(9).text('Thank you for ordering with Foodiq!', 50, 760, {
      align: 'center',
      width: 495,
    });

    doc.end();
  });
};

const buildInvoicePdfForOrder = async (orderId, userId = null) => {
  const q = userId
    ? await pool.query('SELECT id FROM payments WHERE order_id = $1 AND user_id = $2', [
        orderId,
        userId,
      ])
    : await pool.query('SELECT id FROM payments WHERE order_id = $1', [orderId]);
  if (!q.rows[0]) {
    const err = new Error('Payment not found for order');
    err.status = 404;
    throw err;
  }
  return buildInvoicePdfBuffer({ paymentId: q.rows[0].id, userId });
};

/**
 * Persist invoice metadata after a successful payment (idempotent).
 */
const recordInvoice = async ({ paymentId, orderId, userId, amount, taxAmount = 0 }) => {
  if (!paymentId || !orderId || !userId) return null;
  const existing = await pool.query('SELECT * FROM invoices WHERE payment_id = $1 LIMIT 1', [
    paymentId,
  ]);
  if (existing.rows[0]) return existing.rows[0];

  const short = String(orderId).replace(/-/g, '').slice(0, 8).toUpperCase();
  const invoiceNumber = `INV-${short}-${Date.now().toString(36).toUpperCase()}`;
  const inserted = await pool.query(
    `INSERT INTO invoices (
      invoice_number, order_id, payment_id, user_id, amount, tax_amount, status
    ) VALUES ($1, $2, $3, $4, $5, $6, 'issued')
    ON CONFLICT (payment_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING *`,
    [invoiceNumber, orderId, paymentId, userId, Number(amount) || 0, Number(taxAmount) || 0]
  );
  return inserted.rows[0];
};

module.exports = {
  buildInvoicePdfBuffer,
  buildInvoicePdfForOrder,
  recordInvoice,
};
