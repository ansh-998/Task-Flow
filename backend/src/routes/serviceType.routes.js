// ============================================================================
// File: backend/src/routes/serviceType.routes.js
// Description: Service types catalog & related templates HTTP routes
// ============================================================================

import { Router } from 'express';
import serviceTypeController from '../controllers/serviceType.controller.js';
import taskTemplateController from '../controllers/taskTemplate.controller.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { createServiceTypeSchema, updateServiceTypeSchema } from '../validators/serviceType.validator.js';
import { createTemplateSchema } from '../validators/taskTemplate.validator.js';
import { idParamSchema } from '../validators/common.validator.js';

const router = Router();

router.get('/', auth, serviceTypeController.getServiceTypes);
router.post('/', auth, requireRole('admin'), validate(createServiceTypeSchema), serviceTypeController.createServiceType);
router.patch('/:id', auth, requireRole('admin'), validate({ params: idParamSchema, body: updateServiceTypeSchema }), serviceTypeController.updateServiceType);

// Service template endpoints
router.get('/:id/templates', auth, validate({ params: idParamSchema }), taskTemplateController.getTemplatesByService);
router.post('/:id/templates', auth, requireRole('admin'), validate({ params: idParamSchema, body: createTemplateSchema }), taskTemplateController.createTemplate);

export default router;
