import { query, queryOne } from '../config/db.js';

export const FavoriteModel = {
  async add(userId, adId) {
    return queryOne(
      `INSERT INTO favorites (user_id, ad_id) VALUES ($1, $2)
       ON CONFLICT (user_id, ad_id) DO NOTHING
       RETURNING user_id, ad_id, added_at`,
      [userId, adId]
    );
  },

  async remove(userId, adId) {
    return queryOne('DELETE FROM favorites WHERE user_id = $1 AND ad_id = $2 RETURNING user_id, ad_id', [userId, adId]);
  },

  async listByUser(userId) {
    const sql = `
      SELECT f.added_at, a.id AS ad_id, a.title, a.price, a.status, a.published_at,
             p.property_type, p.city, p.district, p.latitude, p.longitude, p.area, p.bedrooms
      FROM favorites f
      JOIN ads a ON f.ad_id = a.id
      JOIN properties p ON a.property_id = p.id
      WHERE f.user_id = $1
      ORDER BY f.added_at DESC
    `;
    return query(sql, [userId]);
  },

  async isFavorite(userId, adId) {
    const row = await queryOne('SELECT 1 FROM favorites WHERE user_id = $1 AND ad_id = $2', [userId, adId]);
    return !!row;
  },
};

export default FavoriteModel;
