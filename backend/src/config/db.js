import { Pool } from 'pg';
import { config } from './index.js';

/**
 * Pool de connexions PostgreSQL partagé par toute l'application.
 * Utilisé par les modèles pour exécuter leurs requêtes.
 */
export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[DB] Erreur inattendue sur le pool PostgreSQL:', err);
});

/**
 * Exécute une requête paramétrée et retourne les lignes.
 * @param {string} text - Requête SQL avec placeholders ($1, $2...).
 * @param {Array} params - Valeurs des placeholders.
 * @returns {Promise<Array>} Lignes résultantes.
 */
export const query = async (text, params) => {
  const res = await pool.query(text, params);
  return res.rows;
};

/**
 * Exécute une requête et retourne la première ligne (ou null).
 */
export const queryOne = async (text, params) => {
  const res = await pool.query(text, params);
  return res.rows[0] || null;
};

export default { pool, query, queryOne };
