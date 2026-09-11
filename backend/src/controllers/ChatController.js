import { asyncHandler } from '../middlewares/errorHandler.js';
import { success, created } from '../utils/response.js';
import ChatService from '../services/ChatService.js';

export const listConversations = asyncHandler(async (req, res) => {
  const conversations = await ChatService.listConversations(req.user.id);
  success(res, conversations);
});

export const openConversation = asyncHandler(async (req, res) => {
  const conv = await ChatService.openConversation(req.user.id, req.body.targetUserId);
  created(res, conv);
});

export const getMessages = asyncHandler(async (req, res) => {
  const messages = await ChatService.getMessages(req.user.id, req.params.conversationId);
  success(res, messages);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { content, attachment } = req.body;
  const message = await ChatService.sendMessage(req.user.id, req.params.conversationId, content, attachment);
  created(res, message);
});

export const countUnreadMessages = asyncHandler(async (req, res) => {
  const result = await ChatService.countUnread(req.user.id);
  success(res, result);
});

export default { listConversations, openConversation, getMessages, sendMessage, countUnreadMessages };
