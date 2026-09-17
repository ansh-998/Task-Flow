// ============================================================================
// File: backend/src/routes/internal.routes.js
// Description: Internal cron trigger and automation execution routes
// ============================================================================

import { Router } from 'express';
import internalController from '../controllers/internal.controller.js';

const router = Router();

router.post('/run-recurring', internalController.runRecurring);

export default router;
