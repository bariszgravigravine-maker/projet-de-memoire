import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import * as ctrl from '../controllers/ChatController.js';

const router = Router();

router.use(authMiddleware);

router.get('/conversations', ctrl.listConversations);
router.post('/conversations', ctrl.openConversation);
router.get('/conversations/:conversationId/messages', ctrl.getMessages);
router.post('/conversations/:conversationId/messages', ctrl.sendMessage);
router.get('/unread/count', ctrl.countUnreadMessages);

export default router;
