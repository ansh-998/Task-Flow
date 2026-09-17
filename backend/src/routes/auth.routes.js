
// RATE LIMITOR

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import authController from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, createUserSchema } from '../validators/auth.validator.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again after a minute' }
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/register', validate(createUserSchema), authController.register);
router.get('/me', auth, authController.getMe);

export default router;
