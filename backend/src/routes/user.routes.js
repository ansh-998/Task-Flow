// ============================================================================
// File: backend/src/routes/user.routes.js
// Description: User directory & management HTTP routes
// ============================================================================

import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { updateRoleSchema, updateActiveSchema, createUserSchema } from '../validators/user.validator.js';
import { idParamSchema, paginationQuerySchema } from '../validators/common.validator.js';

const router = Router();

router.get('/', auth, validate({ query: paginationQuerySchema }), userController.getUsers);
router.post('/', auth, requireRole('admin'), validate(createUserSchema), userController.createUser);
router.patch('/:id/role', auth, requireRole('admin'), validate({ params: idParamSchema, body: updateRoleSchema }), userController.updateUserRole);
router.patch('/:id/active', auth, requireRole('admin'), validate({ params: idParamSchema, body: updateActiveSchema }), userController.updateUserActive);

export default router;
