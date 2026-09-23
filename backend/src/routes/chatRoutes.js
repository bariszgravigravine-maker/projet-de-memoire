import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import * as ctrl from '../controllers/ChatController.js';

const router = Router();

router.use(authMiddleware);

router.get('/conversations', ctrl.listConversations);
router.post('/conversations', ctrl.openConversation);
router.get('/users/search', ctrl.searchUsers);
router.get('/conversations/:conversationId/messages', ctrl.getMessages);
router.post('/conversations/:conversationId/messages', ctrl.sendMessage);
router.post('/conversations/:conversationId/call', ctrl.startCall);
router.post('/conversations/:conversationId/call/join', ctrl.joinCall);
router.post('/conversations/:conversationId/call/end', ctrl.endCall);
router.get('/unread/count', ctrl.countUnreadMessages);

export default router;
