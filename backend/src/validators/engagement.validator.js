// ============================================================================
// File: backend/src/validators/engagement.validator.js
// Description: Engagement creation validation schemas
// ============================================================================

import { z } from 'zod';

export const createEngagementSchema = z.object({
  clientId: z.string().uuid('Invalid client ID: must be a valid UUID'),
  serviceTypeId: z.string().uuid('Invalid service type ID: must be a valid UUID'),
  title: z.string().min(1, 'Title is required'),
  periodStart: z.string().or(z.date()),
  periodEnd: z.string().or(z.date()),
  managerId: z.string().uuid('Invalid manager ID: must be a valid UUID').nullable().optional().or(z.literal(''))
}).strict();

export default {
  createEngagementSchema
};
