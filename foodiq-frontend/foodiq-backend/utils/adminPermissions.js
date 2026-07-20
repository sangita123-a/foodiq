/**
 * Platform admin RBAC — role → permission keys.
 * super_admin has wildcard access.
 */
const ADMIN_ROLES = [
  'super_admin',
  'admin',
  'support_executive',
  'finance_manager',
  'marketing_manager',
];

const ROLE_PERMISSIONS = {
  super_admin: ['*'],
  admin: [
    'dashboard',
    'orders',
    'customers',
    'restaurants',
    'delivery',
    'payments',
    'coupons',
    'menu',
    'analytics',
    'live',
    'monitoring',
    'bi',
    'ai',
    'fleet',
    'feedback',
    'bugs',
    'maintenance',
    'media',
    'settings',
    'notifications',
    'reports',
    'marketing',
    'cms',
    'security',
    'staff',
    'loyalty',
  ],
  support_executive: [
    'dashboard',
    'orders',
    'customers',
    'restaurants',
    'delivery',
    'feedback',
    'bugs',
    'live',
    'menu',
  ],
  finance_manager: [
    'dashboard',
    'orders',
    'payments',
    'coupons',
    'reports',
    'analytics',
    'bi',
  ],
  marketing_manager: [
    'dashboard',
    'coupons',
    'marketing',
    'cms',
    'notifications',
    'media',
    'analytics',
  ],
};

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  support_executive: 'Support Executive',
  finance_manager: 'Finance Manager',
  marketing_manager: 'Marketing Manager',
};

const resolveAdminRole = (user) => {
  if (!user || user.role !== 'admin') return null;
  const role = user.admin_role || 'admin';
  return ADMIN_ROLES.includes(role) ? role : 'admin';
};

const hasPermission = (user, permission) => {
  const role = resolveAdminRole(user);
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role] || [];
  if (perms.includes('*')) return true;
  if (perms.includes(permission)) return true;
  const base = permission.split('.')[0];
  return perms.includes(base);
};

const requirePermission = (...permissions) => (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized for this resource',
      error: {},
    });
  }
  const allowed = permissions.some((p) => hasPermission(req.user, p));
  if (!allowed) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient admin permissions',
      error: { required: permissions },
    });
  }
  return next();
};

module.exports = {
  ADMIN_ROLES,
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  resolveAdminRole,
  hasPermission,
  requirePermission,
};
