import { query } from '../config/db.js';

/**
 * Modèle pour les transactions immobilières utilisées par le module
 * d'estimation automatique des prix (Random Forest simulé).
 */
export const TransactionModel = {
  async create({ propertyType, area, bedrooms, bathrooms, city, district, latitude, longitude, price }) {
    const sql = `
      INSERT INTO transactions (property_type, area, bedrooms, bathrooms, city, district, latitude, longitude, price)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `;
    const { rows } = await require('../config/db.js').pool.query(sql, [
      propertyType, area, bedrooms, bathrooms, city, district, latitude, longitude, price,
    ]);
    return rows[0];
  },

  async listAll({ limit = 5000 } = {}) {
    return query('SELECT * FROM transactions ORDER BY created_at DESC LIMIT $1', [limit]);
  },

  /**
   * Estimation simple par moyenne des transactions similaires (k-NN approximatif).
   * En production, remplacer par un vrai modèle Random Forest (Python microservice).
   */
  async estimatePrice({ propertyType, area, bedrooms, bathrooms, city, district }) {
    const conditions = [];
    const params = [];
    let i = 1;
    if (propertyType) { conditions.push(`property_type = $${i++}`); params.push(propertyType); }
    if (city) { conditions.push(`city ILIKE $${i++}`); params.push(`%${city}%`); }
    if (district) { conditions.push(`district ILIKE $${i++}`); params.push(`%${district}%`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT
        AVG(price)::float AS estimated_price,
        STDDEV(price)::float AS std_dev,
        COUNT(*)::int AS sample_size,
        MIN(price)::float AS price_min,
        MAX(price)::float AS price_max
      FROM transactions
      ${where}
    `;
    const rows = await query(sql, params);
    const r = rows[0] || {};
    const estimated = r.estimated_price || 0;
    const std = r.std_dev || 0;
    return {
      estimatedPrice: Math.round(estimated),
      confidenceLow: Math.round(Math.max(0, estimated - 1.96 * std)),
      confidenceHigh: Math.round(estimated + 1.96 * std),
      sampleSize: r.sample_size || 0,
      priceMin: r.price_min || 0,
      priceMax: r.price_max || 0,
    };
  },
};

export default TransactionModel;
