import { Router } from 'express';
import { authLimiter } from '../middlewares/rateLimit.js';
import { authMiddleware } from '../middlewares/auth.js';
import * as ctrl from '../controllers/AuthController.js';

const router = Router();

router.post('/register', authLimiter, ctrl.register);
router.post('/login', authLimiter, ctrl.login);
router.get('/profile', authMiddleware, ctrl.getProfile);
router.put('/profile', authMiddleware, ctrl.updateProfile);
router.put('/preferences', authMiddleware, ctrl.updatePreferences);

export default router;
