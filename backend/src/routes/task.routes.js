// ============================================================================
// File: backend/src/routes/task.routes.js
// Description: Task governance, state transitions, and review HTTP routes
// ============================================================================

import { Router } from 'express';
import taskController from '../controllers/task.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { assignTaskSchema, updateTaskStatusSchema, reviewTaskSchema } from '../validators/task.validator.js';
import { idParamSchema, paginationQuerySchema } from '../validators/common.validator.js';

const router = Router();

router.get('/', auth, validate({ query: paginationQuerySchema }), taskController.getTasks);
router.get('/my', auth, validate({ query: paginationQuerySchema }), taskController.getMyTasks);
router.get('/:id', auth, validate({ params: idParamSchema }), taskController.getTaskById);
router.patch('/:id/assign', auth, validate({ params: idParamSchema, body: assignTaskSchema }), taskController.assignTask);
router.patch('/:id/status', auth, validate({ params: idParamSchema, body: updateTaskStatusSchema }), taskController.updateTaskStatus);
router.post('/:id/review', auth, validate({ params: idParamSchema, body: reviewTaskSchema }), taskController.reviewTask);
router.get('/:id/activity', auth, validate({ params: idParamSchema }), taskController.getTaskActivity);

export default router;
