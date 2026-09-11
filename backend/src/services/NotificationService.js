import NotificationModel from '../models/NotificationModel.js';
import SearchCriteriaModel from '../models/SearchCriteriaModel.js';

/**
 * Service de notifications temps réel.
 * Gère la création, la lecture et le déclenchement automatique
 * lors de la publication d'une annonce correspondant aux critères.
 */
export const NotificationService = {
  async create({ recipientId, type, content, adId }) {
    const notif = await NotificationModel.create({ recipientId, type, content, adId });
    // Émission WebSocket si l'IO est configurée
    if (global.io) {
      global.io.to(`user:${recipientId}`).emit('notification', notif);
    }
    return notif;
  },

  async listByUser(userId) {
    return NotificationModel.listByUser(userId);
  },

  async countUnread(userId) {
    return { count: await NotificationModel.countUnread(userId) };
  },

  async markAsRead(userId, notificationId) {
    const notif = await NotificationModel.markAsRead(userId, notificationId);
    if (!notif) {
      const err = new Error('Notification introuvable');
      err.status = 404;
      throw err;
    }
    return notif;
  },

  async markAllAsRead(userId) {
    await NotificationModel.markAllAsRead(userId);
    return { success: true };
  },

  /**
   * Compare une annonce nouvellement publiée aux critères de recherche
   * de tous les utilisateurs et notifie ceux qui correspondent.
   */
  async notifyMatchingCriteria(ad, property) {
    const allCriteria = await SearchCriteriaModel.listAll();
    const notified = new Set();

    for (const c of allCriteria) {
      if (notified.has(c.user_id)) continue;
      if (this.matches(c, ad, property)) {
        notified.add(c.user_id);
        await this.create({
          recipientId: c.user_id,
          type: 'NOUVELLE_ANNONCE',
          content: `Nouvelle annonce correspondant à vos critères : ${ad.title} (${property.city}).`,
          adId: ad.id,
        });
      }
    }
    return { notifiedCount: notified.size };
  },

  matches(critere, ad, property) {
    if (critere.property_type && critere.property_type !== property.property_type) return false;
    if (critere.city && !property.city.toLowerCase().includes(critere.city.toLowerCase())) return false;
    if (critere.district && !String(property.district || '').toLowerCase().includes(critere.district.toLowerCase())) return false;
    if (critere.price_max != null && parseFloat(ad.price) > parseFloat(critere.price_max)) return false;
    if (critere.bedrooms_min != null && (property.bedrooms || 0) < critere.bedrooms_min) return false;
    return true;
  },
};

export default NotificationService;
