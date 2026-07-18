/**
 * Public alias for /api/menu → same handlers as /api/menu-items.
 * Keeps legacy and docs callers working alongside /api/menu-items.
 */
module.exports = require('./menuItemRoutes');
