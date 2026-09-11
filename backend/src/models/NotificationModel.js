import { query, queryOne } from '../config/db.js';

export const NotificationModel = {
  async create({ recipientId, type, content, adId = null }) {
    return queryOne(
      `INSERT INTO notifications (recipient_id, type, content, ad_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [recipientId, type, content, adId]
    );
  },

  async listByUser(userId) {
    return query('SELECT * FROM notifications WHERE recipient_id = $1 ORDER BY created_at DESC LIMIT 100', [userId]);
  },

  async countUnread(userId) {
    const row = await queryOne('SELECT COUNT(*)::int AS count FROM notifications WHERE recipient_id = $1 AND is_read = false', [userId]);
    return row ? row.count : 0;
  },

  async markAsRead(userId, notificationId) {
    return queryOne(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND recipient_id = $2 RETURNING *',
      [notificationId, userId]
    );
  },

  async markAllAsRead(userId) {
    return query('UPDATE notifications SET is_read = true WHERE recipient_id = $1 AND is_read = false RETURNING id', [userId]);
  },
};

export default NotificationModel;
