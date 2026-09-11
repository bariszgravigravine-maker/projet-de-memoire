import { query, queryOne } from '../config/db.js';

/**
 * Modèle pour les interactions utilisateurs (vues, favoris, recherches)
 * servant de base au moteur de recommandation.
 */
export const InteractionModel = {
  async recordView({ userId, adId }) {
    return queryOne(
      `INSERT INTO interactions (user_id, ad_id, type) VALUES ($1, $2, 'VIEW')
       ON CONFLICT DO NOTHING RETURNING *`,
      [userId, adId]
    );
  },

  async recordFavorite({ userId, adId }) {
    return queryOne(
      `INSERT INTO interactions (user_id, ad_id, type) VALUES ($1, $2, 'FAVORITE')
       ON CONFLICT DO NOTHING RETURNING *`,
      [userId, adId]
    );
  },

  async removeFavorite({ userId, adId }) {
    return query(
      `DELETE FROM interactions WHERE user_id = $1 AND ad_id = $2 AND type = 'FAVORITE' RETURNING id`,
      [userId, adId]
    );
  },

  async getUserHistory(userId) {
    return query(
      `SELECT i.*, a.title, a.price, p.property_type, p.city, p.district, p.latitude, p.longitude
       FROM interactions i
       JOIN ads a ON i.ad_id = a.id
       JOIN properties p ON a.property_id = p.id
       WHERE i.user_id = $1
       ORDER BY i.created_at DESC LIMIT 100`,
      [userId]
    );
  },

  /**
   * Recommandations basées contenu: biens similaires à l'historique.
   */
  async recommendContentBased(userId, limit = 10) {
    const sql = `
      SELECT a.id AS ad_id, a.title, a.price, a.published_at,
             p.property_type, p.city, p.district, p.latitude, p.longitude, p.area, p.bedrooms,
             COUNT(*) AS score
      FROM interactions i
      JOIN ads a ON i.ad_id = a.id
      JOIN properties p ON a.property_id = p.id
      JOIN ads a2 ON a2.property_id IN (
        SELECT p2.id FROM properties p2
        JOIN interactions i2 ON i2.ad_id = (SELECT a3.id FROM ads a3 WHERE a3.property_id = p2.id LIMIT 1)
        WHERE i2.user_id = $1
      )
      WHERE a.status = 'ACTIVE' AND a.owner_id != $1
      GROUP BY a.id, a.title, a.price, a.published_at, p.property_type, p.city, p.district, p.latitude, p.longitude, p.area, p.bedrooms
      ORDER BY score DESC, a.published_at DESC
      LIMIT $2
    `;
    return query(sql, [userId, limit]);
  },

  /**
   * Recommandations par popularité (cold start).
   */
  async recommendPopular(limit = 10) {
    const sql = `
      SELECT a.id AS ad_id, a.title, a.price, a.published_at, a.view_count,
             p.property_type, p.city, p.district, p.latitude, p.longitude, p.area, p.bedrooms
      FROM ads a
      JOIN properties p ON a.property_id = p.id
      WHERE a.status = 'ACTIVE'
      ORDER BY a.view_count DESC, a.published_at DESC
      LIMIT $1
    `;
    return query(sql, [limit]);
  },
};

export default InteractionModel;
