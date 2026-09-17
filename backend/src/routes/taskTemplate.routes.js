// ============================================================================
// File: backend/src/routes/taskTemplate.routes.js
// Description: Task blueprint template modification HTTP routes
// ============================================================================

import { Router } from 'express';
import taskTemplateController from '../controllers/taskTemplate.controller.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { updateTemplateSchema } from '../validators/taskTemplate.validator.js';
import { idParamSchema } from '../validators/common.validator.js';

const router = Router();

router.patch('/:id', auth, requireRole('admin'), validate({ params: idParamSchema, body: updateTemplateSchema }), taskTemplateController.updateTemplate);

export default router;
