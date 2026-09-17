// ============================================================================
// File: backend/src/routes/client.routes.js
// Description: Client directory HTTP routes
// ============================================================================

import { Router } from 'express';
import clientController from '../controllers/client.controller.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';
import { idParamSchema, paginationQuerySchema } from '../validators/common.validator.js';

const router = Router();

router.get('/', auth, validate({ query: paginationQuerySchema }), clientController.getClients);
router.post('/', auth, requireRole('admin', 'manager'), validate(createClientSchema), clientController.createClient);
router.patch('/:id', auth, requireRole('admin', 'manager'), validate({ params: idParamSchema, body: updateClientSchema }), clientController.updateClient);

export default router;
