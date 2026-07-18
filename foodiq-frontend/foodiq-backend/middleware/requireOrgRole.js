const { pool } = require('../config/db');

const requireOrgRole =
  (...roles) =>
  async (req, res, next) => {
    try {
      const orgId =
        req.headers['x-organization-id'] ||
        req.query.organization_id ||
        req.body?.organization_id;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          message: 'organization_id required',
          error: { code: 'ORG_REQUIRED' },
        });
      }
      if (!req.user?.id) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      if (req.user.role === 'admin') {
        req.orgMembership = { role_code: 'org_admin', organization_id: orgId };
        return next();
      }
      const { rows } = await pool.query(
        `SELECT * FROM organization_memberships
         WHERE organization_id = $1 AND user_id = $2 AND is_active = TRUE
         LIMIT 1`,
        [orgId, req.user.id]
      );
      if (!rows[0]) {
        return res.status(403).json({
          success: false,
          message: 'Not a member of this organization',
          error: { code: 'ORG_FORBIDDEN' },
        });
      }
      if (roles.length && !roles.includes(rows[0].role_code) && rows[0].role_code !== 'org_admin') {
        return res.status(403).json({
          success: false,
          message: 'Insufficient organization role',
          error: { code: 'ORG_ROLE' },
        });
      }
      req.orgMembership = rows[0];
      next();
    } catch (err) {
      next(err);
    }
  };

module.exports = { requireOrgRole };
