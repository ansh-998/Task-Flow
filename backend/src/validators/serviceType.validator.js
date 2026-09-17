// ============================================================================
// File: backend/src/validators/serviceType.validator.js
// Description: Service Type creation and update validation schemas
// ============================================================================

import { z } from 'zod';

export const createServiceTypeSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  code: z.string().min(1, 'Service code is required'),
  description: z.string().nullable().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceInterval: z.enum(['monthly', 'quarterly', 'yearly']).nullable().optional(),
  defaultFee: z.number().nullable().optional()
}).strict();

export const updateServiceTypeSchema = z.object({
  name: z.string().min(1, 'Service name cannot be empty').optional(),
  code: z.string().min(1, 'Service code cannot be empty').optional(),
  description: z.string().nullable().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceInterval: z.enum(['monthly', 'quarterly', 'yearly']).nullable().optional(),
  defaultFee: z.number().nullable().optional(),
  isActive: z.boolean().optional()
}).strict();

export default {
  createServiceTypeSchema,
  updateServiceTypeSchema
};
