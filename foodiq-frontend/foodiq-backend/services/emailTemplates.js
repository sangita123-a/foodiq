/**
 * Branded HTML email templates + plain-text fallbacks.
 */
const brand = {
  name: 'Foodiq',
  color: '#FC8019',
  url: process.env.FRONTEND_URL || 'http://localhost:3000',
};

const layout = (title, bodyHtml) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Segoe UI,Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8FAFC;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
        <tr><td style="background:${brand.color};padding:20px 24px;">
          <div style="font-size:22px;font-weight:800;color:#fff;">${brand.name}</div>
        </td></tr>
        <tr><td style="padding:28px 24px;">${bodyHtml}</td></tr>
        <tr><td style="padding:16px 24px;background:#F8FAFC;font-size:12px;color:#9CA3AF;text-align:center;">
          © ${new Date().getFullYear()} ${brand.name} · <a href="${brand.url}" style="color:${brand.color};">${brand.url}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

const escapeHtml = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const btn = (href, label) =>
  `<a href="${escapeHtml(href)}" style="display:inline-block;margin-top:16px;background:${brand.color};color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px;">${escapeHtml(label)}</a>`;

const templates = {
  welcome({ name }) {
    const title = `Welcome to ${brand.name}`;
    const html = layout(
      title,
      `<h1 style="margin:0 0 12px;font-size:22px;">Hi ${escapeHtml(name || 'there')} 👋</h1>
       <p style="margin:0;color:#6B7280;line-height:1.6;">Thanks for joining Foodiq. Discover restaurants near you and get food delivered fast.</p>
       ${btn(`${brand.url}/restaurants`, 'Browse restaurants')}`
    );
    const text = `Hi ${name || 'there'}, welcome to Foodiq! Browse restaurants: ${brand.url}/restaurants`;
    return { subject: title, html, text };
  },

  otp({ code, purpose = 'verification' }) {
    const title = `Your Foodiq ${purpose} code`;
    const html = layout(
      title,
      `<h1 style="margin:0 0 12px;font-size:22px;">Verification code</h1>
       <p style="margin:0 0 16px;color:#6B7280;">Use this code to complete ${escapeHtml(purpose)}. It expires in 10 minutes.</p>
       <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:${brand.color};">${escapeHtml(code)}</div>
       <p style="margin:16px 0 0;color:#9CA3AF;font-size:12px;">If you did not request this, ignore this email.</p>`
    );
    const text = `Your Foodiq ${purpose} code is ${code}. Expires in 10 minutes.`;
    return { subject: title, html, text };
  },

  passwordReset({ name, code }) {
    return templates.otp({ code, purpose: 'password reset' });
  },

  orderConfirmation({ name, orderId, total, restaurant }) {
    const short = String(orderId).slice(0, 8).toUpperCase();
    const title = `Order confirmed #${short}`;
    const html = layout(
      title,
      `<h1 style="margin:0 0 12px;font-size:22px;">Order confirmed</h1>
       <p style="margin:0;color:#6B7280;line-height:1.6;">Hi ${escapeHtml(name || '')}, your order from <strong>${escapeHtml(restaurant || 'restaurant')}</strong> is confirmed.</p>
       <p style="margin:12px 0;"><strong>Total:</strong> ₹${Number(total || 0).toFixed(2)}</p>
       ${btn(`${brand.url}/track-order?id=${orderId}`, 'Track order')}`
    );
    const text = `Order #${short} confirmed. Total ₹${Number(total || 0).toFixed(2)}. Track: ${brand.url}/track-order?id=${orderId}`;
    return { subject: title, html, text };
  },

  paymentSuccess({ name, orderId, amount }) {
    const short = String(orderId || '').slice(0, 8).toUpperCase();
    const title = `Payment successful${short ? ` · #${short}` : ''}`;
    const html = layout(
      title,
      `<h1 style="margin:0 0 12px;font-size:22px;">Payment received</h1>
       <p style="color:#6B7280;">Hi ${escapeHtml(name || '')}, we received ₹${Number(amount || 0).toFixed(2)}.</p>
       ${orderId ? btn(`${brand.url}/track-order?id=${orderId}`, 'View order') : ''}`
    );
    const text = `Payment of ₹${Number(amount || 0).toFixed(2)} successful${orderId ? ` for order #${short}` : ''}.`;
    return { subject: title, html, text };
  },

  paymentFailed({ name, reason }) {
    const title = 'Payment failed';
    const html = layout(
      title,
      `<h1 style="margin:0 0 12px;font-size:22px;">Payment could not be completed</h1>
       <p style="color:#6B7280;">Hi ${escapeHtml(name || '')}, ${escapeHtml(reason || 'please try again from checkout.')}</p>
       ${btn(`${brand.url}/checkout`, 'Retry payment')}`
    );
    const text = `Payment failed. ${reason || 'Please retry from checkout.'}`;
    return { subject: title, html, text };
  },

  orderStatus({ name, orderId, status }) {
    const short = String(orderId).slice(0, 8).toUpperCase();
    const title = `Order update · #${short}`;
    const html = layout(
      title,
      `<h1 style="margin:0 0 12px;font-size:22px;">Order #${short}</h1>
       <p style="color:#6B7280;">Hi ${escapeHtml(name || '')}, your order is now <strong>${escapeHtml(status)}</strong>.</p>
       ${btn(`${brand.url}/track-order?id=${orderId}`, 'Track live')}`
    );
    const text = `Order #${short} is now ${status}. Track: ${brand.url}/track-order?id=${orderId}`;
    return { subject: title, html, text };
  },

  refund({ name, orderId, amount }) {
    const short = String(orderId).slice(0, 8).toUpperCase();
    const title = `Refund confirmed · #${short}`;
    const html = layout(
      title,
      `<h1 style="margin:0 0 12px;font-size:22px;">Refund processed</h1>
       <p style="color:#6B7280;">Hi ${escapeHtml(name || '')}, ₹${Number(amount || 0).toFixed(2)} has been refunded for order #${short}.</p>`
    );
    const text = `Refund of ₹${Number(amount || 0).toFixed(2)} for order #${short} is complete.`;
    return { subject: title, html, text };
  },

  invoice({ name, orderId }) {
    const short = String(orderId).slice(0, 8).toUpperCase();
    const title = `Your Foodiq invoice · #${short}`;
    const html = layout(
      title,
      `<h1 style="margin:0 0 12px;font-size:22px;">Invoice attached</h1>
       <p style="color:#6B7280;">Hi ${escapeHtml(name || '')}, please find your invoice for order #${short} attached (PDF).</p>
       ${btn(`${brand.url}/payment-methods`, 'Download anytime')}`
    );
    const text = `Invoice for order #${short} is attached.`;
    return { subject: title, html, text };
  },

  promotion({ title: promoTitle, body, ctaHref, ctaLabel }) {
    const title = promoTitle || 'Offer from Foodiq';
    const html = layout(
      title,
      `<h1 style="margin:0 0 12px;font-size:22px;">${escapeHtml(title)}</h1>
       <p style="color:#6B7280;line-height:1.6;">${escapeHtml(body || '')}</p>
       ${ctaHref ? btn(ctaHref, ctaLabel || 'View offer') : ''}`
    );
    const text = `${title}\n${body || ''}\n${ctaHref || ''}`;
    return { subject: title, html, text };
  },

  restaurantNewOrder({ restaurantName, orderId, total }) {
    const short = String(orderId).slice(0, 8).toUpperCase();
    const title = `New order #${short}`;
    const html = layout(
      title,
      `<h1 style="margin:0 0 12px;font-size:22px;">New order for ${escapeHtml(restaurantName || 'your restaurant')}</h1>
       <p style="color:#6B7280;">Order total: ₹${Number(total || 0).toFixed(2)}</p>
       ${btn(`${brand.url}/partner/orders`, 'Open partner dashboard')}`
    );
    const text = `New order #${short} · ₹${Number(total || 0).toFixed(2)}. Open ${brand.url}/partner/orders`;
    return { subject: title, html, text };
  },

  settlement({ name, amount, period }) {
    const title = `Payment settlement${period ? ` · ${period}` : ''}`;
    const html = layout(
      title,
      `<h1 style="margin:0 0 12px;font-size:22px;">Settlement processed</h1>
       <p style="color:#6B7280;">Hi ${escapeHtml(name || '')}, ₹${Number(amount || 0).toFixed(2)} has been settled${period ? ` for ${escapeHtml(period)}` : ''}.</p>
       ${btn(`${brand.url}/partner/earnings`, 'View earnings')}`
    );
    const text = `Settlement of ₹${Number(amount || 0).toFixed(2)}${period ? ` for ${period}` : ''} is complete.`;
    return { subject: title, html, text };
  },

  incentiveReport({ name, amount, deliveries, period }) {
    const title = `Incentive report${period ? ` · ${period}` : ''}`;
    const html = layout(
      title,
      `<h1 style="margin:0 0 12px;font-size:22px;">Your incentives</h1>
       <p style="color:#6B7280;">Hi ${escapeHtml(name || '')}, you earned ₹${Number(amount || 0).toFixed(2)} in incentives across ${Number(deliveries || 0)} deliveries${period ? ` (${escapeHtml(period)})` : ''}.</p>
       ${btn(`${brand.url}/delivery/earnings`, 'View earnings')}`
    );
    const text = `Incentives: ₹${Number(amount || 0).toFixed(2)} · ${deliveries || 0} deliveries.`;
    return { subject: title, html, text };
  },

  generic({ title, body, ctaHref, ctaLabel }) {
    const html = layout(
      title,
      `<h1 style="margin:0 0 12px;font-size:22px;">${escapeHtml(title)}</h1>
       <p style="color:#6B7280;line-height:1.6;white-space:pre-wrap;">${escapeHtml(body || '')}</p>
       ${ctaHref ? btn(ctaHref, ctaLabel || 'Open Foodiq') : ''}`
    );
    const text = `${title}\n\n${body || ''}`;
    return { subject: title, html, text };
  },
};

module.exports = { templates, layout, brand, escapeHtml };
