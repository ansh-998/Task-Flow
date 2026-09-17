// ============================================================================
// File: backend/src/validators/taskTemplate.validator.js
// Description: Task Template creation and update validation schemas
// ============================================================================

import { z } from 'zod';

export const createTemplateSchema = z.object({
  serviceTypeId: z.string().uuid().optional(),
  title: z.string().min(1, 'Template title is required'),
  description: z.string().nullable().optional(),
  orderIndex: z.number().int().default(0),
  offsetDaysFromPeriodStart: z.number().int().default(0),
  defaultAssigneeRole: z.enum(['admin', 'manager', 'team_member']).nullable().optional(),
  requiresReview: z.boolean().default(true)
}).strict();

export const updateTemplateSchema = z.object({
  title: z.string().min(1, 'Template title cannot be empty').optional(),
  description: z.string().nullable().optional(),
  orderIndex: z.number().int().optional(),
  offsetDaysFromPeriodStart: z.number().int().optional(),
  defaultAssigneeRole: z.enum(['admin', 'manager', 'team_member']).nullable().optional(),
  requiresReview: z.boolean().optional(),
  isActive: z.boolean().optional()
}).strict();

export default {
  createTemplateSchema,
  updateTemplateSchema
};
