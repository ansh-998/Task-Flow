// ============================================================================
// File: backend/src/routes/engagement.routes.js
// Description: Engagement lifecycle HTTP routes
// ============================================================================

import { Router } from 'express';
import engagementController from '../controllers/engagement.controller.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { createEngagementSchema } from '../validators/engagement.validator.js';
import { idParamSchema, paginationQuerySchema } from '../validators/common.validator.js';

const router = Router();

router.get('/', auth, validate({ query: paginationQuerySchema }), engagementController.getEngagements);
router.get('/:id', auth, validate({ params: idParamSchema }), engagementController.getEngagementById);
router.get('/:id/tasks', auth, validate({ params: idParamSchema }), engagementController.getEngagementTasks);
router.post('/', auth, requireRole('admin', 'manager'), validate(createEngagementSchema), engagementController.createEngagement);
router.post('/generate-recurring', auth, requireRole('admin', 'manager'), engagementController.triggerRecurringGeneration);

export default router;
