// ============================================================================
// File: backend/src/validators/task.validator.js
// Description: Task assignment, status change, and review validation schemas
// ============================================================================

import { z } from 'zod';

export const assignTaskSchema = z.object({
  assigneeId: z.string().uuid('Invalid assignee ID: must be a valid UUID').nullable().optional().or(z.literal('')),
  reviewerId: z.string().uuid('Invalid reviewer ID: must be a valid UUID').nullable().optional().or(z.literal('')),
  dueDate: z.string().nullable().optional().or(z.literal(''))
}).strict();

export const updateTaskStatusSchema = z.object({
  status: z.enum([
    'not_started',
    'in_progress',
    'waiting_for_client',
    'ready_for_review',
    'changes_requested',
    'completed',
    'cancelled'
  ], {
    errorMap: () => ({ message: 'Invalid workflow status value' })
  }),
  comment: z.string().nullable().optional()
}).strict();

export const reviewTaskSchema = z.object({
  decision: z.enum(['approve', 'request_changes'], {
    errorMap: () => ({ message: 'Decision must be approve or request_changes' })
  }),
  comment: z.string().nullable().optional()
}).strict();

export default {
  assignTaskSchema,
  updateTaskStatusSchema,
  reviewTaskSchema
};
