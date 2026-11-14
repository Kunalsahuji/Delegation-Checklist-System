/**
 * Role-Based Access Control middleware
 * Checks if user is Administrator or has the required permission/role
 */
const rbac = (requiredPermission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated' });
  }

  // Administrators bypass specific permission checks
  if (req.user.role === 'Administrator') {
    return next();
  }

  if (!requiredPermission) {
    return next();
  }

  const permissions = req.user.permissions || [];
  if (permissions.includes(requiredPermission)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: `Access denied. Requires permission: ${requiredPermission}`,
  });
};

module.exports = rbac;
