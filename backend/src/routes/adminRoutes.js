import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import * as ctrl from '../controllers/AdminController.js';

const router = Router();

router.use(authMiddleware, requireRole(['ADMIN']));

router.get('/ads/pending', ctrl.listPendingAds);
router.put('/ads/:id/validate', ctrl.validateAd);
router.put('/ads/:id/reject', ctrl.rejectAd);

router.get('/users', ctrl.listUsers);
router.put('/users/:id/status', ctrl.setUserStatus);
router.delete('/users/:id', ctrl.deleteUser);

router.get('/stats', ctrl.getStats);

export default router;
