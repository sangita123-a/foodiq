/**
 * Resolve optional tenant context from query/header for scoped admin/API queries.
 * Headers: X-Organization-Id, X-Market-Id
 * Query: organization_id, market_id
 */
const resolveTenantContext = (req, _res, next) => {
  const org =
    req.headers['x-organization-id'] ||
    req.query.organization_id ||
    req.body?.organization_id ||
    null;
  const market =
    req.headers['x-market-id'] ||
    req.query.market_id ||
    req.body?.market_id ||
    null;
  req.tenant = {
    organization_id: org || null,
    market_id: market || null,
  };
  next();
};

module.exports = { resolveTenantContext };
