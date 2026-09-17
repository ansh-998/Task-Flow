// ============================================================================
// File: backend/src/middleware/requireRole.js
// Description: Role-Based Access Control (RBAC) guard middleware
//
// LEARNING NOTES — HOW RBAC AUTHORIZATION WORKS:
// 1. EVALUATE: Reads `req.user.role` attached by the preceding `auth` middleware.
// 2. CHECK: Compares the role against the list of `allowedRoles` (e.g., 'admin', 'manager').
// 3. ALLOW OR REJECT: Calls `next()` if permitted, or returns HTTP 403 Forbidden.
// ============================================================================

import { AppError } from '../utils/errors.js';

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Insufficient role permissions', 403));
    }

    next();
  };
}
