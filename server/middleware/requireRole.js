/**
 * requireRole middleware factory:
 * 1. Checks that the trusted user object is attached to req.user (from requireAuth).
 * 2. Reads role strictly from the trusted MongoDB user record (never from client request).
 * 3. Compares against allowed roles.
 * 4. Rejects unauthorized access with HTTP 403 Forbidden.
 *
 * Usage:
 *   requireRole('eventManager')
 *   requireRole('student')
 *   requireRole('student', 'eventManager')
 */
const requireRole = (...allowedRoles) => {
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    // Ensure requireAuth was executed prior to requireRole
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before verifying role permissions.',
      });
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. This action requires one of the following roles: [${roles.join(', ')}]. Your role is '${userRole}'.`,
      });
    }

    next();
  };
};

export default requireRole;
