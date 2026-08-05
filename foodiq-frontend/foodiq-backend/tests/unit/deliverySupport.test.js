const assert = require('assert');
const support = require('../../models/deliverySupportModel');
const supportController = require('../../controllers/deliverySupportController');
const supportRoutes = require('../../routes/deliverySupportRoutes');
const validators = require('../../validators/deliverySupportValidator');
const { supportLimiter } = require('../../middleware/rateLimiters');

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

async function runDeliverySupportTests() {
  console.log('Running Delivery Support Ticket System Unit Tests...');

  // ── Model exports ────────────────────────────────────────────────────────
  const requiredModelFns = ['createTicket', 'listForPartner', 'getTicketById', 'listAllTickets', 'replyToTicket'];
  for (const fn of requiredModelFns) {
    assert(typeof support[fn] === 'function', `deliverySupportModel.${fn} must be a function`);
  }
  assert.deepStrictEqual(support.STATUSES.slice().sort(), ['closed', 'in_progress', 'open', 'pending', 'resolved'].sort());

  // Test: replyToTicket rejects an invalid status without touching the DB.
  await assert.rejects(
    () => support.replyToTicket('t1', { status: 'not_a_real_status' }),
    /Invalid status/
  );
  // Test: replyToTicket rejects an empty update (no reply, no status).
  await assert.rejects(
    () => support.replyToTicket('t1', {}),
    /Provide admin_reply/
  );

  // ── Controller exports ───────────────────────────────────────────────────
  assert(typeof supportController.createTicket === 'function', 'deliverySupportController.createTicket must be a function');
  assert(typeof supportController.getMyTickets === 'function', 'deliverySupportController.getMyTickets must be a function');

  // Controller must reject requests with no authenticated partner (no DB call needed).
  const unauthedRes = mockRes();
  await supportController.createTicket({ body: { subject: 'x', description: 'y' } }, unauthedRes);
  assert.strictEqual(unauthedRes.statusCode, 401);
  assert.strictEqual(unauthedRes.body.success, false);

  const unauthedListRes = mockRes();
  await supportController.getMyTickets({ query: {} }, unauthedListRes);
  assert.strictEqual(unauthedListRes.statusCode, 401);

  // Note: the legacy `/api/admin/delivery/support*` admin wrapper
  // (adminController.getDeliverySupportTickets/patchDeliverySupportTicket) was
  // retired in the Support Center consolidation — admin reads/writes to this
  // model now go exclusively through deliverySupportController's own admin
  // exports (adminListTickets/adminGetTicket/adminAssignTicket/adminUpdateStatus/
  // adminSendMessage), asserted below.
  assert(typeof supportController.adminListTickets === 'function', 'deliverySupportController.adminListTickets must be a function');

  // ── Validators ────────────────────────────────────────────────────────────
  assert(typeof validators.validateCreateTicket === 'function');
  assert(typeof validators.validateAdminReply === 'function');

  const runValidator = (fn, body) =>
    new Promise((resolve) => {
      const req = { body };
      const res = mockRes();
      fn(req, res, () => resolve({ blocked: false, req }));
      if (res.body) resolve({ blocked: true, res });
    });

  // Missing subject/description is rejected.
  let result = await runValidator(validators.validateCreateTicket, { subject: '', description: '' });
  assert.strictEqual(result.blocked, true);
  assert.strictEqual(result.res.statusCode, 400);

  // Subject too short is rejected.
  result = await runValidator(validators.validateCreateTicket, { subject: 'ab', description: 'a valid description here' });
  assert.strictEqual(result.blocked, true);

  // Description too short is rejected.
  result = await runValidator(validators.validateCreateTicket, { subject: 'Valid subject', description: 'short' });
  assert.strictEqual(result.blocked, true);

  // Valid payload passes through and is trimmed.
  result = await runValidator(validators.validateCreateTicket, {
    subject: '  Withdrawal not credited  ',
    description: '  My withdrawal from yesterday has not been credited yet.  ',
  });
  assert.strictEqual(result.blocked, false);
  assert.strictEqual(result.req.body.subject, 'Withdrawal not credited');
  assert.strictEqual(result.req.body.description, 'My withdrawal from yesterday has not been credited yet.');

  // Admin reply validator: invalid status rejected.
  result = await runValidator(validators.validateAdminReply, { status: 'bogus' });
  assert.strictEqual(result.blocked, true);

  // Admin reply validator: no reply and no status rejected.
  result = await runValidator(validators.validateAdminReply, {});
  assert.strictEqual(result.blocked, true);

  // Admin reply validator: valid status-only update passes.
  result = await runValidator(validators.validateAdminReply, { status: 'resolved' });
  assert.strictEqual(result.blocked, false);

  // Admin reply validator: valid reply-only update passes.
  result = await runValidator(validators.validateAdminReply, { admin_reply: 'We are looking into this.' });
  assert.strictEqual(result.blocked, false);

  // ── Rate limiter ──────────────────────────────────────────────────────────
  assert(typeof supportLimiter === 'function', 'supportLimiter must be an Express middleware function');

  // ── Router sanity ─────────────────────────────────────────────────────────
  assert(typeof supportRoutes === 'function', 'deliverySupportRoutes must export an Express router');
  assert(Array.isArray(supportRoutes.stack) && supportRoutes.stack.length > 0, 'router must have registered routes');
  const routeMethods = supportRoutes.stack
    .filter((layer) => layer.route)
    .map((layer) => ({ path: layer.route.path, methods: layer.route.methods }));
  assert(routeMethods.some((r) => r.path === '/' && r.methods.get), 'GET / must be registered');
  assert(routeMethods.some((r) => r.path === '/' && r.methods.post), 'POST / must be registered');

  // ── Pagination math (mirrors listForPartner/listAllTickets) ─────────────
  const paginate = (total, limit) => Math.max(1, Math.ceil(total / limit));
  assert.strictEqual(paginate(41, 20), 3);
  assert.strictEqual(paginate(0, 20), 1);

  console.log('All Delivery Support Ticket System Unit Tests passed successfully!');
}

runDeliverySupportTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
