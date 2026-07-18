const { pool } = require('../config/db');
const { ok, fail } = require('../utils/respond');
const { getMessages, formatInTimezone } = require('../services/i18nService');
const { startSso, handleCallback } = require('../services/ssoService');
const { parseVoiceTranscript, aiEnabled } = require('../services/voiceOrderingService');
const { reply: chatReply } = require('../services/supportChatbotService');
const { recommendRestaurants } = require('../services/recommendationService');
const { personalizedOffers } = require('../services/personalizedOffersService');
const {
  createCorporateAccount,
  listCorporateAccounts,
  createCorporateOrder,
  createRecurringSchedule,
  runDueRecurring,
} = require('../services/corporateOrderingService');
const { optimizeRoute } = require('../services/routeOptimizationService');
const { ingestTelemetry } = require('../services/iotKitchenService');
const { generateSuggestions } = require('../services/predictiveInventoryService');

const health = async (_req, res) =>
  ok(res, 'Foodiq API v4', {
    version: '4.0.0',
    api: 'v4',
    tax_engine: String(process.env.TAX_ENGINE_ENABLED || 'false'),
    multi_currency: String(process.env.MULTI_CURRENCY_PAYMENTS || 'false'),
    sso: String(process.env.SSO_ENABLED || 'false'),
    ai_assistants: String(process.env.AI_ASSISTANTS_ENABLED || 'false'),
  });

const i18nMessages = async (req, res) => {
  try {
    return ok(res, 'Messages', getMessages(req.locale || req.query.locale));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const ssoStart = async (req, res) => {
  const result = startSso(req.params.provider);
  if (!result.ok) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
      error: { code: result.code || 'SSO_ERROR' },
    });
  }
  return ok(res, 'SSO start', result.data);
};

const ssoCallback = async (req, res) => {
  const result = await handleCallback(req.params.provider, req.body);
  if (!result.ok) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
      error: { code: result.code || 'SSO_ERROR' },
    });
  }
  return ok(res, 'SSO callback', result.data);
};

const voiceOrder = async (req, res) => {
  try {
    if (!aiEnabled()) {
      return ok(res, 'AI assistants disabled', {
        enabled: false,
        note: 'Set AI_ASSISTANTS_ENABLED=true',
      });
    }
    const parsed = parseVoiceTranscript(req.body.transcript || req.body.text);
    return ok(res, 'Voice intents', parsed);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const chat = async (req, res) => {
  try {
    if (!aiEnabled()) {
      return ok(res, 'AI assistants disabled', { enabled: false });
    }
    const data = await chatReply({
      userId: req.user?.id,
      message: req.body.message,
      locale: req.locale || 'en',
      sessionId: req.body.session_id,
    });
    return ok(res, 'Chat reply', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const recommendations = async (req, res) => {
  try {
    const data = await recommendRestaurants({
      userId: req.user?.id || null,
      limit: req.query.limit,
    });
    return ok(res, 'Recommendations', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const offersPersonalized = async (req, res) => {
  try {
    const data = await personalizedOffers({
      userId: req.user?.id || null,
      limit: req.query.limit,
    });
    return ok(res, 'Personalized offers', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const corporateAccountsList = async (req, res) => {
  try {
    const rows = await listCorporateAccounts({
      organizationId: req.orgMembership?.organization_id || req.query.organization_id,
    });
    return ok(res, 'Corporate accounts', rows);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const corporateAccountCreate = async (req, res) => {
  try {
    const row = await createCorporateAccount({
      organization_id: req.body.organization_id || req.orgMembership?.organization_id,
      name: req.body.name,
      billing_email: req.body.billing_email,
      credit_limit: req.body.credit_limit,
    });
    return ok(res, 'Corporate account created', row, 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const corporateOrderCreate = async (req, res) => {
  try {
    const row = await createCorporateOrder({
      ...req.body,
      placed_by: req.user?.id,
      organization_id: req.body.organization_id || req.orgMembership?.organization_id,
    });
    return ok(res, 'Corporate order created', row, 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const recurringCreate = async (req, res) => {
  try {
    const row = await createRecurringSchedule(req.body);
    return ok(res, 'Recurring schedule created', row, 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const recurringRun = async (_req, res) => {
  try {
    const data = await runDueRecurring();
    return ok(res, 'Recurring run complete', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const fleetOptimize = async (req, res) => {
  try {
    const data = optimizeRoute({
      depot: req.body.depot,
      stops: req.body.stops || [],
    });
    return ok(res, 'Optimized route', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const iotTelemetry = async (req, res) => {
  try {
    const row = await ingestTelemetry(req.body);
    return ok(res, 'Telemetry accepted', row, 201);
  } catch (err) {
    return fail(res, err.status || 500, err.message || 'Server Error', err);
  }
};

const inventoryPredict = async (_req, res) => {
  try {
    const data = await generateSuggestions();
    return ok(res, 'Reorder suggestions', data, 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const marketplaceList = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, name, description, listing_type, meta
       FROM api_marketplace_listings WHERE is_published = TRUE
       ORDER BY created_at DESC`
    );
    return ok(res, 'Marketplace', rows);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const marketplaceSubscribe = async (req, res) => {
  try {
    const { listing_id, organization_id } = req.body;
    if (!listing_id) return fail(res, 400, 'listing_id required');
    const { rows } = await pool.query(
      `INSERT INTO api_marketplace_subscriptions (listing_id, organization_id, api_key_id, status)
       VALUES ($1, $2, $3, 'active') RETURNING *`,
      [listing_id, organization_id || req.apiKey?.organization_id || null, req.apiKey?.id || null]
    );
    return ok(res, 'Subscribed', rows[0], 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const privacyExport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows: reqRow } = await pool.query(
      `INSERT INTO privacy_requests (user_id, request_type, status, payload)
       VALUES ($1, 'export', 'queued', '{}'::jsonb) RETURNING *`,
      [userId]
    );
    const { rows: user } = await pool.query(
      `SELECT id, email, full_name, phone_number, role, created_at FROM users WHERE id = $1`,
      [userId]
    );
    const { rows: orders } = await pool.query(
      `SELECT id, status, total_amount, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [userId]
    );
    const { rows: addresses } = await pool.query(
      `SELECT id, address_type, city, state, country, created_at FROM addresses WHERE user_id = $1`,
      [userId]
    ).catch(() => ({ rows: [] }));
    const { rows: payments } = await pool.query(
      `SELECT id, type, label, card_last4, card_brand, created_at FROM payment_methods WHERE user_id = $1`,
      [userId]
    ).catch(() => ({ rows: [] }));

    const payload = {
      user: user[0],
      orders,
      addresses,
      payment_methods: payments,
    };
    await pool.query(
      `UPDATE privacy_requests SET status = 'completed', completed_at = NOW(),
         payload = $2::jsonb WHERE id = $1`,
      [reqRow[0].id, JSON.stringify(payload)]
    );
    const { writeAudit } = require('../services/auditService');
    writeAudit({
      userId,
      role: req.user.role,
      action: 'privacy_export',
      category: 'privacy',
      resourceId: reqRow[0].id,
      req,
    }).catch(() => {});
    return ok(res, 'Export ready', {
      request_id: reqRow[0].id,
      exported_at: formatInTimezone(new Date(), 'UTC', 'en-GB'),
      ...payload,
    });
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const privacyDelete = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO privacy_requests (user_id, request_type, status)
       VALUES ($1, 'delete', 'queued') RETURNING *`,
      [req.user.id]
    );
    const processNow =
      String(req.body?.process_now || 'true').toLowerCase() !== 'false';
    if (processNow) {
      const { eraseUserData } = require('../services/privacyEraseService');
      await eraseUserData(req.user.id, { actorId: req.user.id, req });
      return ok(res, 'Delete request completed — data anonymized', {
        ...rows[0],
        status: 'completed',
      });
    }
    return ok(res, 'Delete request queued', rows[0], 202);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

module.exports = {
  health,
  i18nMessages,
  ssoStart,
  ssoCallback,
  voiceOrder,
  chat,
  recommendations,
  offersPersonalized,
  corporateAccountsList,
  corporateAccountCreate,
  corporateOrderCreate,
  recurringCreate,
  recurringRun,
  fleetOptimize,
  iotTelemetry,
  inventoryPredict,
  marketplaceList,
  marketplaceSubscribe,
  privacyExport,
  privacyDelete,
};
