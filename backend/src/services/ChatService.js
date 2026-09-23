import { AccessToken } from 'livekit-server-sdk';
import { ConversationModel, MessageModel } from '../models/ChatModel.js';
import UserModel from '../models/UserModel.js';
import NotificationService from './NotificationService.js';
import { config } from '../config/index.js';

const callRoom = (conversationId) => `conv-${conversationId}`;

async function assertParticipant(myId, conversationId) {
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
  return conv;
}

const otherParticipant = (conv, myId) => (conv.user_a_id === myId ? conv.user_b_id : conv.user_a_id);

async function buildCallToken(myId, conversationId) {
  const user = await UserModel.findById(myId);
  const name = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : `user-${myId}`;
  const at = new AccessToken(config.livekit.apiKey, config.livekit.apiSecret, {
    identity: String(myId),
    name: name || `user-${myId}`,
    ttl: '2h',
  });
  at.addGrant({ roomJoin: true, room: callRoom(conversationId), canPublish: true, canSubscribe: true });
  return at.toJwt();
}

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

  /**
   * Recherche d'utilisateurs pour démarrer une conversation — inclut les
   * comptes qui n'ont jamais publié d'annonce. L'utilisateur courant est
   * exclu des résultats.
   */
  async searchUsers(myId, q) {
    const users = await UserModel.searchUsers(q);
    return users.filter((u) => u.id !== myId);
  },

  /**
   * Démarre un appel : génère le token de l'appelant et notifie le destinataire
   * via Socket.IO (événement "call:incoming").
   */
  async startCall(myId, conversationId, video) {
    const conv = await assertParticipant(myId, conversationId);
    if (!config.livekit.apiKey || !config.livekit.apiSecret) {
      const err = new Error('Serveur d\'appel non configuré');
      err.status = 503;
      throw err;
    }
    const caller = await UserModel.findById(myId);
    const recipientId = otherParticipant(conv, myId);
    const token = await buildCallToken(myId, conversationId);
    const payload = {
      conversationId,
      room: callRoom(conversationId),
      video: !!video,
      callerId: myId,
      callerName: caller ? `${caller.first_name || ''} ${caller.last_name || ''}`.trim() : 'Utilisateur',
      callerPhoto: caller?.profile_photo_url || null,
    };
    if (global.io) {
      global.io.to(`user:${recipientId}`).emit('call:incoming', payload);
    }
    return { token, url: config.livekit.url, room: payload.room };
  },

  /** Le destinataire rejoint l'appel en cours. */
  async joinCall(myId, conversationId) {
    const conv = await assertParticipant(myId, conversationId);
    const token = await buildCallToken(myId, conversationId);
    const recipientId = otherParticipant(conv, myId);
    if (global.io) {
      global.io.to(`user:${recipientId}`).emit('call:accepted', { conversationId });
    }
    return { token, url: config.livekit.url, room: callRoom(conversationId) };
  },

  /** Refus / raccrochage / annulation : notifie l'autre participant. */
  async endCall(myId, conversationId, reason = 'ended') {
    const conv = await assertParticipant(myId, conversationId);
    const recipientId = otherParticipant(conv, myId);
    if (global.io) {
      global.io.to(`user:${recipientId}`).emit('call:ended', { conversationId, reason });
    }
    return { ok: true };
  },
};

export default ChatService;
