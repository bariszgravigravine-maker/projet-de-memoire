import { query, queryOne } from '../config/db.js';

export const PhotoModel = {
  async create({ propertyId, url, displayOrder = 0 }) {
    return queryOne(
      'INSERT INTO photos (property_id, url, display_order) VALUES ($1, $2, $3) RETURNING *',
      [propertyId, url, displayOrder]
    );
  },

  async findByProperty(propertyId) {
    return query('SELECT * FROM photos WHERE property_id = $1 ORDER BY display_order ASC', [propertyId]);
  },

  async delete(id) {
    return queryOne('DELETE FROM photos WHERE id = $1 RETURNING id', [id]);
  },
};

export default PhotoModel;
