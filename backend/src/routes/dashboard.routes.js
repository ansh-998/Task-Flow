// ============================================================================
// File: backend/src/routes/dashboard.routes.js
// Description: Operational dashboard KPI counts HTTP routes
// ============================================================================

import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, dashboardController.getCounts);

export default router;
