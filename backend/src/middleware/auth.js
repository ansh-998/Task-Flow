// ============================================================================
// File: backend/src/middleware/auth.js
// Description: Stateless JWT authentication middleware
//
// LEARNING NOTES — HOW AUTHENTICATION WORKS:
// 1. EXTRACT: Checks the 'Authorization' header for a 'Bearer <token>' pattern.
// 2. VERIFY: Validates the token's cryptographic signature using the JWT_SECRET.
// 3. ATTACH: Attaches the decoded user identity ({ id, role }) to `req.user`.
// 4. GUARD: If the token is absent, malformed, or expired, halts the request
//    pipeline with an HTTP 401 Unauthorized error.
// ============================================================================

import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors.js';
import env from '../config/env.js';

export function auth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Missing or invalid authorization token', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired authorization token', 401));
  }
}
