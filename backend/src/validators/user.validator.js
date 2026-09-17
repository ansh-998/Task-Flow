// ============================================================================
// File: backend/src/validators/user.validator.js
// Description: User update validation schemas
// ============================================================================

import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
  role: z.enum(['admin', 'manager', 'team_member']).default('team_member')
}).strict();

export const updateRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'team_member'], {
    errorMap: () => ({ message: 'Invalid user role' })
  })
}).strict();

export const updateActiveSchema = z.object({
  isActive: z.boolean({
    required_error: 'isActive is required'
  })
}).strict();

export default {
  createUserSchema,
  updateRoleSchema,
  updateActiveSchema
};
