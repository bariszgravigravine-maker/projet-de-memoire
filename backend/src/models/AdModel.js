import { query, queryOne } from '../config/db.js';

/**
 * Modèle Annonce (Ad) — publication commerciale d'un bien.
 */
export const AdModel = {
  async create({ ownerId, propertyId, title, description, price, status = 'ACTIVE' }) {
    const sql = `
      INSERT INTO ads (owner_id, property_id, title, description, price, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    return queryOne(sql, [ownerId, propertyId, title, description, price, status]);
  },

  async findById(id) {
    return queryOne('SELECT * FROM ads WHERE id = $1', [id]);
  },

  async findDetail(id) {
    const sql = `
      SELECT a.*, p.property_type, p.area, p.bedrooms, p.bathrooms, p.address, p.district, p.city, p.latitude, p.longitude,
             u.id AS owner_id, u.first_name AS owner_first_name, u.last_name AS owner_last_name, u.phone AS owner_phone,
             u.email AS owner_email,
             COALESCE(
               (SELECT json_agg(json_build_object('code', pr.code, 'label', pr.label, 'icon', pr.icon, 'note', pp.note, 'distance_m', pp.distance_m) ORDER BY pr.category, pr.label)
                FROM property_preferences pp
                JOIN preferences pr ON pr.pref_id = pp.pref_id
                WHERE pp.property_id = p.id),
               '[]'::json
             ) AS preferences
      FROM ads a
      JOIN properties p ON a.property_id = p.id
      JOIN users u ON a.owner_id = u.id
      WHERE a.id = $1
    `;
    return queryOne(sql, [id]);
  },

  async findByOwner(ownerId) {
    return query('SELECT * FROM ads WHERE owner_id = $1 AND status = $2 ORDER BY published_at DESC', [ownerId, 'ACTIVE']);
  },

  async updateStatus(id, status) {
    return queryOne('UPDATE ads SET status = $2 WHERE id = $1 RETURNING *', [id, status]);
  },

  async incrementViews(id) {
    return queryOne('UPDATE ads SET view_count = view_count + 1 WHERE id = $1 RETURNING view_count', [id]);
  },

  async listPending({ limit = 50, offset = 0 } = {}) {
    return query('SELECT * FROM ads WHERE status = $1 ORDER BY published_at DESC LIMIT $2 OFFSET $3', ['EN_ATTENTE', limit, offset]);
  },

  async listAll({ limit = 100, offset = 0 } = {}) {
    return query('SELECT * FROM ads ORDER BY published_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
  },
};

export default AdModel;
