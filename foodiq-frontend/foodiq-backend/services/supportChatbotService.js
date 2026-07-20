const { pool } = require('../config/db');
const { t } = require('./i18nService');
const helpCenter = require('../models/helpCenterModel');

const BOT_NAME = 'Foodiq AI';

const matchAutoResponse = async (text) => {
  const responses = await helpCenter.getAutoResponses();
  const lower = text.toLowerCase();
  for (const row of responses) {
    const patterns = String(row.trigger_pattern).split('|');
    if (patterns.some((p) => lower.includes(p.trim()))) {
      return row.response;
    }
  }
  return null;
};

const handleOrderQuery = async (userId, text) => {
  if (!userId) return 'Please sign in so I can look up your orders.';
  const { getOrders, getOrderById } = require('../models/orderModel');
  const orderIdMatch = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (orderIdMatch) {
    const order = await getOrderById(orderIdMatch[0]);
    if (!order || order.user_id !== userId) return 'Order not found for your account.';
    return `Order #${String(order.id).slice(0, 8)} — Status: **${order.status}**, Total: ₹${order.total_amount}. Track at /my-orders/${order.id}`;
  }
  const orders = await getOrders(userId, 'customer', { limit: 3 });
  if (!orders.length) return 'You have no recent orders. Browse restaurants at /restaurants to place one!';
  const lines = orders.map(
    (o) => `• #${String(o.id).slice(0, 8)} — ${o.status} — ₹${o.total_amount}${o.restaurant_name ? ` (${o.restaurant_name})` : ''}`
  );
  return `Your recent orders:\n${lines.join('\n')}\n\nTrack any order from My Orders.`;
};

const handleCancelQuery = async (userId) => {
  if (!userId) return 'Sign in to cancel orders from My Orders. Pending orders can usually be cancelled within 60 seconds.';
  const { getOrders } = require('../models/orderModel');
  const pending = (await getOrders(userId, 'customer', { limit: 5 })).filter(
    (o) => ['pending', 'accepted'].includes(String(o.status).toLowerCase())
  );
  if (!pending.length) return 'No cancellable orders found. Only Pending/Accepted orders can be cancelled from My Orders.';
  return `You have ${pending.length} order(s) that may be cancellable. Go to My Orders → select order → Cancel. Order: #${String(pending[0].id).slice(0, 8)}`;
};

const handleRestaurantRec = async (userId) => {
  try {
    const { recommendRestaurants } = require('./recommendationService');
    const recs = await recommendRestaurants({ userId, limit: 4 });
    if (!recs?.length) return 'Browse top restaurants at /popular-restaurants or /restaurants.';
    const lines = recs.slice(0, 4).map((r) => `• **${r.name}** — ${r.cuisine || 'Multi-cuisine'} — ⭐ ${r.rating || '4.5'}`);
    return `Here are restaurants I recommend for you:\n${lines.join('\n')}\n\nView at /restaurant/${recs[0]?.id || ''}`;
  } catch {
    return 'Check out /trending-dishes and /popular-restaurants for great picks!';
  }
};

const handleFoodRec = async () => {
  try {
    const { rows } = await pool.query(
      `SELECT m.name, r.name AS restaurant_name, m.price
       FROM menu_items m JOIN restaurants r ON r.id = m.restaurant_id
       WHERE m.is_available = TRUE ORDER BY RANDOM() LIMIT 4`
    );
    if (!rows.length) return 'Explore /trending-dishes for popular items near you.';
    return `Try these dishes:\n${rows.map((d) => `• **${d.name}** at ${d.restaurant_name} — ₹${d.price}`).join('\n')}`;
  } catch {
    return 'Visit /trending-dishes for curated food recommendations.';
  }
};

const handleCouponExplain = async () => {
  return 'Apply coupons at checkout: open your cart → Checkout → Apply Coupon. You can also visit /rewards for membership-exclusive offers. Enter code and tap Apply before payment.';
};

const handleMembershipExplain = async (userId) => {
  if (userId) {
    try {
      const loyaltyModel = require('../models/loyaltyModel');
      const wallet = await loyaltyModel.getWallet(userId);
      const tier = wallet.tier?.current?.name || 'Foodiq Silver';
      return `You're a **${tier}** member with **${wallet.points_balance}** points (lifetime: ${wallet.lifetime_points}). Earn on orders, referrals, reviews & daily login. Benefits include free delivery, discounts & exclusive coupons. Details at /rewards.`;
    } catch {
      /* fallback */
    }
  }
  return 'Foodiq Rewards has Silver, Gold & Platinum tiers. Earn points on every order, referrals, reviews & logins. Visit /rewards for your wallet, tier benefits & exclusive coupons.';
};

const generateReply = async ({ userId, message, locale = 'en' }) => {
  const text = String(message || '').trim();
  const lower = text.toLowerCase();

  let answer = await matchAutoResponse(text);

  if (!answer) {
    if (/track|where is my order|order status|my order/i.test(text)) {
      answer = await handleOrderQuery(userId, text);
    } else if (/cancel/i.test(text)) {
      answer = await handleCancelQuery(userId);
    } else if (/refund/i.test(text)) {
      answer = 'Refunds for cancelled orders are automatic. UPI/wallets: 2–4 hrs. Cards: 5–7 business days. For issues, create a Refund ticket in Help Center.';
    } else if (/restaurant|recommend.*place|where to eat/i.test(text)) {
      answer = await handleRestaurantRec(userId);
    } else if (/food|dish|recommend.*eat|what should i order/i.test(text)) {
      answer = await handleFoodRec();
    } else if (/coupon|promo|discount/i.test(text)) {
      answer = await handleCouponExplain();
    } else if (/membership|loyalty|points|silver|gold|platinum|reward/i.test(text)) {
      answer = await handleMembershipExplain(userId);
    } else if (/payment|upi|card|pay/i.test(text)) {
      answer = 'We accept UPI, cards, net banking, wallets & COD. Payment failed? Check bank SMS, retry, or create a Payment Issue ticket with your order ID.';
    } else if (/delivery|late|driver|rider/i.test(text)) {
      answer = 'Track live delivery from My Orders. For delays or issues, use Live Chat or submit a Delivery Complaint ticket.';
    } else if (/ticket|agent|human|speak to/i.test(text)) {
      answer = 'I can connect you with a human agent. Use **Live Chat** on this page or create a support ticket — our team typically responds within a few hours.';
    } else if (/hello|hi|hey|help/i.test(text)) {
      answer = `Hi! I'm **${BOT_NAME}**, your Foodiq assistant. I can help with orders, tracking, refunds, coupons, membership, restaurants & more. What do you need?`;
    } else {
      answer = t(locale, 'support.hello', `I'm ${BOT_NAME}. Ask me about orders, delivery, payments, refunds, coupons, or membership — or use Live Chat for an agent.`);
    }
  }

  return answer;
};

const reply = async ({ userId, message, locale = 'en', sessionId = null, forceEnabled = false }) => {
  const enabled = forceEnabled || String(process.env.AI_ASSISTANTS_ENABLED || 'true').toLowerCase() !== 'false';
  const text = String(message || '').trim();
  if (!text) {
    return { enabled, session_id: sessionId, reply: `Hello! I'm ${BOT_NAME}. How can I help?`, messages: [] };
  }

  const answer = await generateReply({ userId, message: text, locale });

  const newMessages = [
    { role: 'user', content: text, at: new Date().toISOString() },
    { role: 'assistant', content: answer, bot: BOT_NAME, at: new Date().toISOString() },
  ];

  let id = sessionId;
  if (id) {
    await pool.query(
      `UPDATE ai_chat_sessions SET messages = messages || $1::jsonb, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(newMessages), id]
    );
  } else {
    const { rows } = await pool.query(
      `INSERT INTO ai_chat_sessions (user_id, channel, messages) VALUES ($1, 'support', $2::jsonb) RETURNING id`,
      [userId || null, JSON.stringify(newMessages)]
    );
    id = rows[0].id;
  }

  const { rows: sessionRows } = await pool.query(
    `SELECT messages FROM ai_chat_sessions WHERE id = $1`, [id]
  );

  return {
    enabled,
    bot_name: BOT_NAME,
    session_id: id,
    reply: answer,
    messages: sessionRows[0]?.messages || newMessages,
  };
};

module.exports = { reply, generateReply, BOT_NAME };
