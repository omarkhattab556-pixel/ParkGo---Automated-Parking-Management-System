/**
 * Restrict route access to listed user_type values.
 * Usage: router.get('/x', authenticate, requireRole('manager'), handler)
 */
export const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.user_type)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires role: ${allowedRoles.join(' or ')}`,
      });
    }
    next();
  };
