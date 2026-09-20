import { query, queryOne } from '../config/db.js';

export const ConversationModel = {
  async findOrCreate(userAId, userBId) {
    // Ordonne les IDs pour garantir l'unicité
    const [a, b] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];
    const existing = await queryOne(
      'SELECT * FROM conversations WHERE user_a_id = $1 AND user_b_id = $2',
      [a, b]
    );
    if (existing) return existing;
    return queryOne(
      'INSERT INTO conversations (user_a_id, user_b_id) VALUES ($1, $2) RETURNING *',
      [a, b]
    );
  },

  async findByUser(userId) {
    const sql = `
      SELECT c.*,
             ua.first_name AS user_a_first_name, ua.last_name AS user_a_last_name,
             ua.profile_photo_url AS user_a_photo,
             ub.first_name AS user_b_first_name, ub.last_name AS user_b_last_name,
             ub.profile_photo_url AS user_b_photo,
             CASE WHEN c.user_a_id = $1 THEN ub.id ELSE ua.id END AS other_user_id,
             CASE WHEN c.user_a_id = $1 THEN ub.first_name ELSE ua.first_name END AS other_first_name,
             CASE WHEN c.user_a_id = $1 THEN ub.last_name ELSE ua.last_name END AS other_last_name,
             CASE WHEN c.user_a_id = $1 THEN ub.profile_photo_url ELSE ua.profile_photo_url END AS other_photo,
             lm.content AS last_message,
             (SELECT COUNT(*)::int FROM messages m
              WHERE m.conversation_id = c.id AND m.sender_id != $1 AND m.is_read = false
             ) AS unread_count
      FROM conversations c
      JOIN users ua ON c.user_a_id = ua.id
      JOIN users ub ON c.user_b_id = ub.id
      LEFT JOIN LATERAL (
        SELECT m.content FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.sent_at DESC LIMIT 1
      ) lm ON true
      WHERE c.user_a_id = $1 OR c.user_b_id = $1
      ORDER BY c.last_message_at DESC NULLS LAST
    `;
    return query(sql, [userId]);
  },

  async findById(id) {
    return queryOne('SELECT * FROM conversations WHERE id = $1', [id]);
  },

  async touchLastMessage(id) {
    return queryOne('UPDATE conversations SET last_message_at = NOW() WHERE id = $1 RETURNING *', [id]);
  },

  async getOtherUserId(conversationId, myId) {
    const c = await queryOne('SELECT * FROM conversations WHERE id = $1', [conversationId]);
    if (!c) return null;
    return c.user_a_id === myId ? c.user_b_id : c.user_a_id;
  },
};

export const MessageModel = {
  async create({ conversationId, senderId, content, attachmentUrl, attachmentType, attachmentName }) {
    return queryOne(
      `INSERT INTO messages (conversation_id, sender_id, content, attachment_url, attachment_type, attachment_name)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [conversationId, senderId, content, attachmentUrl || null, attachmentType || null, attachmentName || null]
    );
  },

  async findByConversation(conversationId) {
    return query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY sent_at ASC', [conversationId]);
  },

  async markAsRead(conversationId, readerId) {
    // Marque comme lus les messages reçus (pas ceux envoyés par le lecteur)
    return query(
      'UPDATE messages SET is_read = true WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false RETURNING id',
      [conversationId, readerId]
    );
  },

  async countUnread(userId) {
    const sql = `
      SELECT COUNT(*)::int AS count FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.sender_id != $1 AND m.is_read = false
        AND (c.user_a_id = $1 OR c.user_b_id = $1)
    `;
    const row = await queryOne(sql, [userId]);
    return row ? row.count : 0;
  },
};

export default { ConversationModel, MessageModel };
