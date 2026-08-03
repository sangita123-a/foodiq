/**
 * Route Optimization Controller — delivery partner + admin endpoints.
 */
const routeService = require('../services/routeOptimizationService');
const { log } = require('../utils/logger');

const ok = (res, message, data = {}) =>
  res.status(200).json({ success: true, message, data });

const fail = (res, status, message, error = {}) =>
  res.status(status).json({ success: false, message, error });

/**
 * GET /api/delivery/route/optimized
 * Returns an AI-optimized route for the authenticated delivery partner.
 */
const getOptimizedRoute = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) return fail(res, 401, 'Unauthorized');

    const orderIds = req.query.orders
      ? String(req.query.orders).split(',').filter(Boolean)
      : [];
    const routeType = req.query.type || 'fastest';

    const result = await routeService.computeOptimizedRoute(partnerId, orderIds, { routeType });

    // Emit socket event if route was computed
    try {
      const { emitRouteOptimized } = require('../socket/emitters');
      if (result.route) {
        emitRouteOptimized(partnerId, result.route);
      }
    } catch { /* socket not initialized */ }

    return ok(res, result.route ? 'Route optimized successfully' : 'No active orders to optimize', result);
  } catch (error) {
    log.error('[routeController] getOptimizedRoute error', { error: error.message, stack: error.stack });
    return fail(res, error.status || 500, error.message || 'Failed to optimize route');
  }
};

/**
 * POST /api/delivery/route/recalculate
 * Recalculates route for the authenticated partner.
 */
const recalculateRoute = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) return fail(res, 401, 'Unauthorized');

    const reason = req.body.reason || 'manual';
    const result = await routeService.recalculateRoute(partnerId, reason);

    // Emit socket event
    try {
      const { emitRouteRerouted } = require('../socket/emitters');
      if (result.route) {
        emitRouteRerouted(partnerId, { ...result.route, reason });
      }
    } catch { /* socket not initialized */ }

    return ok(res, result.route ? 'Route recalculated successfully' : 'No active orders', result);
  } catch (error) {
    log.error('[routeController] recalculateRoute error', { error: error.message });
    return fail(res, error.status || 500, error.message || 'Failed to recalculate route');
  }
};

/**
 * GET /api/admin/routes
 * Returns all active delivery routes for admin dashboard.
 */
const getAdminRoutes = async (req, res) => {
  try {
    const routes = await routeService.getActiveRoutes();
    return ok(res, 'Active routes retrieved', { routes, total: routes.length });
  } catch (error) {
    log.error('[routeController] getAdminRoutes error', { error: error.message });
    return fail(res, 500, 'Failed to retrieve active routes');
  }
};

/**
 * GET /api/admin/routes/analytics
 * Returns route analytics for admin dashboard.
 */
const getAdminRouteAnalytics = async (req, res) => {
  try {
    const days = Number(req.query.days || 7);
    const partnerId = req.query.partner_id || null;
    const analytics = await routeService.getRouteAnalytics({ partnerId, days });
    return ok(res, 'Route analytics retrieved', analytics);
  } catch (error) {
    log.error('[routeController] getAdminRouteAnalytics error', { error: error.message });
    return fail(res, 500, 'Failed to retrieve route analytics');
  }
};

module.exports = {
  getOptimizedRoute,
  recalculateRoute,
  getAdminRoutes,
  getAdminRouteAnalytics,
};
