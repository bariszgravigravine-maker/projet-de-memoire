import { query, queryOne } from '../config/db.js';

export const SearchCriteriaModel = {
  async replaceAll(userId, items) {
    // Supprime puis réinsère (logique identique au code d'inspiration)
    await query('DELETE FROM search_criteria WHERE user_id = $1', [userId]);
    if (!items || items.length === 0) return [];
    const inserted = [];
    for (const it of items) {
      const row = await queryOne(
        `INSERT INTO search_criteria (user_id, property_type, city, district, price_min, price_max, bedrooms_min)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [userId, it.type || null, it.city || null, it.district || null, it.priceMin || null, it.priceMax || null, it.bedroomsMin || null]
      );
      inserted.push(row);
    }
    return inserted;
  },

  async listByUser(userId) {
    return query('SELECT * FROM search_criteria WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  },

  async clear(userId) {
    return query('DELETE FROM search_criteria WHERE user_id = $1 RETURNING id', [userId]);
  },

  async listAll() {
    return query('SELECT * FROM search_criteria');
  },
};

export default SearchCriteriaModel;
