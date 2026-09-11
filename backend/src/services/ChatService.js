import { ConversationModel, MessageModel } from '../models/ChatModel.js';
import NotificationService from './NotificationService.js';

/**
 * Service de messagerie temps réel (chat).
 */
export const ChatService = {
  async openConversation(myId, targetUserId) {
    if (!targetUserId) {
      const err = new Error('Le destinataire est obligatoire');
      err.status = 400;
      throw err;
    }
    if (myId === targetUserId) {
      const err = new Error('Vous ne pouvez pas converser avec vous-même');
      err.status = 400;
      throw err;
    }
    return ConversationModel.findOrCreate(myId, targetUserId);
  },

  async sendMessage(myId, conversationId, content, attachment = null) {
    if ((!content || content.trim() === '') && !attachment) {
      const err = new Error('Le message est vide');
      err.status = 400;
      throw err;
    }
    if (content && content.length > 2000) {
      const err = new Error('Le message est trop long (2000 caractères max)');
      err.status = 400;
      throw err;
    }

    const conv = await ConversationModel.findById(conversationId);
    if (!conv) {
      const err = new Error('Conversation introuvable');
      err.status = 404;
      throw err;
    }
    if (conv.user_a_id !== myId && conv.user_b_id !== myId) {
      const err = new Error('Accès refusé à cette conversation');
      err.status = 403;
      throw err;
    }

    const message = await MessageModel.create({
      conversationId,
      senderId: myId,
      content: content || '',
      attachmentUrl: attachment?.url,
      attachmentType: attachment?.type,
      attachmentName: attachment?.name,
    });
    await ConversationModel.touchLastMessage(conversationId);

    // Émission WebSocket au destinataire
    const recipientId = conv.user_a_id === myId ? conv.user_b_id : conv.user_a_id;
    if (global.io) {
      global.io.to(`user:${recipientId}`).emit('message', {
        conversationId,
        senderId: myId,
        content,
        attachment,
        sentAt: message.sent_at,
      });
    }

    // Notification
    await NotificationService.create({
      recipientId,
      type: 'NOUVEAU_MESSAGE',
      content: `Nouveau message : ${(content || 'Pièce jointe').substring(0, 80)}`,
      adId: null,
    });

    return message;
  },

  async listConversations(myId) {
    return ConversationModel.findByUser(myId);
  },

  async getMessages(myId, conversationId) {
    const conv = await ConversationModel.findById(conversationId);
    if (!conv) {
      const err = new Error('Conversation introuvable');
      err.status = 404;
      throw err;
    }
    if (conv.user_a_id !== myId && conv.user_b_id !== myId) {
      const err = new Error('Accès refusé à cette conversation');
      err.status = 403;
      throw err;
    }
    // Marque comme lus les messages reçus
    await MessageModel.markAsRead(conversationId, myId);
    return MessageModel.findByConversation(conversationId);
  },

  async countUnread(myId) {
    return { count: await MessageModel.countUnread(myId) };
  },
};

export default ChatService;
