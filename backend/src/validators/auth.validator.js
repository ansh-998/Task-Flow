// ============================================================================
// File: backend/src/validators/auth.validator.js
// Description: Auth input validation schemas
// ============================================================================

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required')
}).strict();

export const createUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
  role: z.enum(['admin', 'manager', 'team_member']).default('team_member')
}).strict();

export default {
  loginSchema,
  createUserSchema
};
