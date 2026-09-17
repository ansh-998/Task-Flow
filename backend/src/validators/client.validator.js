// ============================================================================
// File: backend/src/validators/client.validator.js
// Description: Client creation and update validation schemas
// ============================================================================

import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  code: z.string().optional(),
  contactPerson: z.string().nullable().optional(),
  email: z.string().email('Invalid email address').nullable().optional().or(z.literal('')),
  contactEmail: z.string().email('Invalid email address').nullable().optional().or(z.literal('')),
  phone: z.string().nullable().optional().or(z.literal('')),
  status: z.string().optional(),
  isActive: z.boolean().optional()
}).strict();

export const updateClientSchema = z.object({
  name: z.string().min(1, 'Client name cannot be empty').optional(),
  code: z.string().optional(),
  contactPerson: z.string().nullable().optional(),
  email: z.string().email('Invalid email address').nullable().optional().or(z.literal('')),
  contactEmail: z.string().email('Invalid email address').nullable().optional().or(z.literal('')),
  phone: z.string().nullable().optional().or(z.literal('')),
  status: z.string().optional(),
  isActive: z.boolean().optional()
}).strict();

export default {
  createClientSchema,
  updateClientSchema
};
