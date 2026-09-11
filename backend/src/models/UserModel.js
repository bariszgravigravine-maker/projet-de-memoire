import { query, queryOne } from '../config/db.js';
import bcrypt from 'bcryptjs';

/**
 * Modèle Utilisateur — couche d'accès aux données.
 * Gère utilisateurs, agents immobiliers et administrateurs.
 */
export const UserModel = {
  /**
   * Crée un nouvel utilisateur.
   */
  async create({ email, password, firstName, lastName, phone, role = 'USER', budgetMax = 0, preferredTypes = [], preferredZones = [] }) {
    const hash = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role, budget_max, preferred_types, preferred_zones)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, first_name, last_name, phone, role, budget_max, preferred_types, preferred_zones, created_at
    `;
    return queryOne(sql, [email, hash, firstName, lastName, phone, role, budgetMax, preferredTypes, preferredZones]);
  },

  async findByEmail(email) {
    return queryOne('SELECT * FROM users WHERE email = $1', [email]);
  },

  async findById(id) {
    return queryOne(
      'SELECT id, email, first_name, last_name, phone, role, budget_max, preferred_types, preferred_zones, created_at FROM users WHERE id = $1',
      [id]
    );
  },

  async existsByEmail(email) {
    const row = await queryOne('SELECT 1 FROM users WHERE email = $1', [email]);
    return !!row;
  },

  async verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },

  async updateProfile(id, { firstName, lastName, phone }) {
    return queryOne(
      `UPDATE users SET first_name = COALESCE($2, first_name), last_name = COALESCE($3, last_name), phone = COALESCE($4, phone)
       WHERE id = $1
       RETURNING id, email, first_name, last_name, phone, role, budget_max, preferred_types, preferred_zones`,
      [id, firstName, lastName, phone]
    );
  },

  async updatePreferences(id, { preferredTypes, preferredZones, budgetMax }) {
    return queryOne(
      `UPDATE users SET preferred_types = $2, preferred_zones = $3, budget_max = $4
       WHERE id = $1
       RETURNING id, email, first_name, last_name, phone, role, budget_max, preferred_types, preferred_zones`,
      [id, preferredTypes || [], preferredZones || [], budgetMax || 0]
    );
  },

  async incrementStat(id, field, amount = 1) {
    const allowed = ['active_ads_count', 'total_views', 'total_contacts'];
    if (!allowed.includes(field)) throw new Error(`Champ invalide: ${field}`);
    return queryOne(`UPDATE users SET ${field} = ${field} + $2 WHERE id = $1 RETURNING id, ${field}`, [id, amount]);
  },

  async listAll({ limit = 50, offset = 0 } = {}) {
    return query(
      'SELECT id, email, first_name, last_name, phone, role, created_at, active_ads_count FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
  },

  async setStatus(id, status) {
    return queryOne('UPDATE users SET status = $2 WHERE id = $1 RETURNING id, status', [id, status]);
  },

  async delete(id) {
    return queryOne('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  },
};

export default UserModel;
