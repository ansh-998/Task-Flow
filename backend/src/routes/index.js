// ============================================================================
// File: backend/src/routes/index.js
// Description: Main API route aggregator
// ============================================================================

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import clientRoutes from './client.routes.js';
import serviceTypeRoutes from './serviceType.routes.js';
import taskTemplateRoutes from './taskTemplate.routes.js';
import engagementRoutes from './engagement.routes.js';
import taskRoutes from './task.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import internalRoutes from './internal.routes.js';
import healthController from '../controllers/health.controller.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/clients', clientRoutes);
apiRouter.use('/service-types', serviceTypeRoutes);
apiRouter.use('/templates', taskTemplateRoutes);
apiRouter.use('/engagements', engagementRoutes);
apiRouter.use('/tasks', taskRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/internal', internalRoutes);

// API Health check
apiRouter.get('/health', healthController.getHealth);

export default apiRouter;
