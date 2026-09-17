// ============================================================================
// File: backend/src/validators/common.validator.js
// Description: Shared reusable validation schemas (UUID params, pagination query)
// ============================================================================

import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID: must be a valid UUID')
}).strict();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25).optional()
}).strict();

export default {
  idParamSchema,
  paginationQuerySchema
};
