import { query, queryOne } from '../config/db.js';

/**
 * Modèle Bien (Property) — décrit un bien immobilier géolocalisé.
 */
export const PropertyModel = {
  async create({ ownerId, type, area, bedrooms, address, district, city, latitude, longitude, status = 'ACTIF' }) {
    const sql = `
      INSERT INTO properties (owner_id, property_type, area, bedrooms, address, district, city, latitude, longitude, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    return queryOne(sql, [ownerId, type, area, bedrooms, address, district, city, latitude, longitude, status]);
  },

  async findById(id) {
    return queryOne('SELECT * FROM properties WHERE id = $1', [id]);
  },

  async findByOwner(ownerId) {
    return query('SELECT * FROM properties WHERE owner_id = $1 ORDER BY created_at DESC', [ownerId]);
  },

  async update(id, fields) {
    const allowed = ['property_type', 'area', 'bedrooms', 'address', 'district', 'city', 'latitude', 'longitude', 'status'];
    const sets = [];
    const vals = [id];
    let i = 2;
    for (const [k, v] of Object.entries(fields)) {
      if (allowed.includes(k)) {
        sets.push(`${k} = $${i++}`);
        vals.push(v);
      }
    }
    if (sets.length === 0) return this.findById(id);
    return queryOne(`UPDATE properties SET ${sets.join(', ')} WHERE id = $1 RETURNING *`, vals);
  },

  async delete(id) {
    return queryOne('DELETE FROM properties WHERE id = $1 RETURNING id', [id]);
  },

  /**
   * Recherche géographique multicritère.
   * @param {Object} c - Critères: latMin, latMax, lonMin, lonMax, type, priceMin, priceMax, bedroomsMin, bathroomsMin, radius, centerLat, centerLon, sortBy
   */
  async search(c = {}) {
    const conditions = [`a.status = 'ACTIVE'`];
    const params = [];
    let i = 1;

    // Bounding box
    if (c.latMin != null && c.latMax != null) {
      conditions.push(`p.latitude BETWEEN $${i++} AND $${i++}`);
      params.push(c.latMin, c.latMax);
    }
    if (c.lonMin != null && c.lonMax != null) {
      conditions.push(`p.longitude BETWEEN $${i++} AND $${i++}`);
      params.push(c.lonMin, c.lonMax);
    }

    // Rayon (formule de Haversine simplifiée via approximation)
    if (c.centerLat != null && c.centerLon != null && c.radius != null) {
      // Approximation: 1 degré ~ 111 km
      const deg = c.radius / 111;
      conditions.push(`p.latitude BETWEEN $${i++} AND $${i++}`);
      conditions.push(`p.longitude BETWEEN $${i++} AND $${i++}`);
      params.push(c.centerLat - deg, c.centerLat + deg, c.centerLon - deg, c.centerLon + deg);
    }

    if (c.type) {
      conditions.push(`p.property_type = $${i++}`);
      params.push(c.type);
    }
    if (c.priceMin != null) {
      conditions.push(`a.price >= $${i++}`);
      params.push(c.priceMin);
    }
    if (c.priceMax != null) {
      conditions.push(`a.price <= $${i++}`);
      params.push(c.priceMax);
    }
    if (c.bedroomsMin != null) {
      conditions.push(`p.bedrooms >= $${i++}`);
      params.push(c.bedroomsMin);
    }
    if (c.city) {
      conditions.push(`unaccent(p.city) ILIKE unaccent($${i++})`);
      params.push(`%${c.city}%`);
    }
    if (c.district) {
      conditions.push(`unaccent(p.district) ILIKE unaccent($${i++})`);
      params.push(`%${c.district}%`);
    }
    if (c.bathroomsMin != null) {
      conditions.push(`p.bathrooms >= $${i++}`);
      params.push(c.bathroomsMin);
    }

    let orderBy = 'a.published_at DESC';
    if (c.sortBy === 'price_asc') orderBy = 'a.price ASC';
    else if (c.sortBy === 'price_desc') orderBy = 'a.price DESC';
    else if (c.sortBy === 'recent') orderBy = 'a.published_at DESC';

    const sql = `
      SELECT a.id AS ad_id, a.title, a.description, a.price, a.status, a.published_at, a.view_count,
             p.id AS property_id, p.property_type, p.area, p.bedrooms, p.bathrooms, p.address, p.district, p.city,
             p.latitude, p.longitude,
             u.id AS owner_id, u.first_name AS owner_first_name, u.last_name AS owner_last_name, u.phone AS owner_phone,
             COALESCE(
               (SELECT json_agg(json_build_object('id', ph.id, 'url', ph.url, 'display_order', ph.display_order) ORDER BY ph.display_order)
                FROM photos ph WHERE ph.property_id = p.id),
               '[]'::json
             ) AS photos
      FROM ads a
      JOIN properties p ON a.property_id = p.id
      JOIN users u ON a.owner_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT 200
    `;
    return query(sql, params);
  },
};

export default PropertyModel;
