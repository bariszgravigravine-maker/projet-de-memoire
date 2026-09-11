import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import * as ctrl from '../controllers/NotificationController.js';

const router = Router();

router.use(authMiddleware);

router.get('/', ctrl.listNotifications);
router.get('/unread/count', ctrl.countUnread);
router.put('/:id/read', ctrl.markAsRead);
router.put('/read/all', ctrl.markAllAsRead);

export default router;
