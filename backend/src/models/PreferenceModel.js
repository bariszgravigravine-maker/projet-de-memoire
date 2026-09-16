import { query, queryOne } from '../config/db.js';
import { sanitizePreferenceCodes } from '../constants/preferences.js';

/**
 * Modèle Préférence de proximité.
 *
 * Deux usages :
 *  - catalogue (table `preferences`) : liste des tags disponibles ;
 *  - association (table `property_preferences`) : quels tags sont attachés
 *    à un bien, avec une note et une distance optionnelles.
 */
export const PreferenceModel = {
  /** Catalogue complet des préférences. */
  async findAll() {
    return query(
      'SELECT pref_id, code, label, icon, category FROM preferences ORDER BY category, label'
    );
  },

  /** Map code -> pref_id (utilisé pour valider/insérer les associations). */
  async codeToIdMap() {
    const rows = await query('SELECT pref_id, code FROM preferences');
    return new Map(rows.map((r) => [r.code, r.pref_id]));
  },

  /** Préférences d'un bien. */
  async findByProperty(propertyId) {
    return query(
      `SELECT pr.code, pr.label, pr.icon, pr.category, pp.note, pp.distance_m
       FROM property_preferences pp
       JOIN preferences pr ON pr.pref_id = pp.pref_id
       WHERE pp.property_id = $1
       ORDER BY pr.category, pr.label`,
      [propertyId]
    );
  },

  /** Préférences de plusieurs biens, groupées par property_id. */
  async findByPropertyIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return new Map();
    const rows = await query(
      `SELECT pp.property_id, pr.code, pr.label, pr.icon, pr.category, pp.note, pp.distance_m
       FROM property_preferences pp
       JOIN preferences pr ON pr.pref_id = pp.pref_id
       WHERE pp.property_id = ANY($1)
       ORDER BY pr.category, pr.label`,
      [ids]
    );
    const map = new Map();
    for (const r of rows) {
      const list = map.get(r.property_id) || [];
      list.push({
        code: r.code,
        label: r.label,
        icon: r.icon,
        category: r.category,
        note: r.note,
        distance_m: r.distance_m,
      });
      map.set(r.property_id, list);
    }
    return map;
  },

  /**
   * Remplace les préférences d'un bien.
   * @param {string} propertyId
   * @param {Array<string|{code:string,note?:string,distance_m?:number}>} prefs
   */
  async replaceForProperty(propertyId, prefs) {
    const codes = sanitizePreferenceCodes(prefs);
    await query('DELETE FROM property_preferences WHERE property_id = $1', [propertyId]);
    if (codes.length === 0) return [];

    const idMap = await this.codeToIdMap();
    const detailsByCode = new Map(
      (Array.isArray(prefs) ? prefs : [])
        .filter((p) => p && typeof p === 'object')
        .map((p) => [p.code, p])
    );

    for (const code of codes) {
      const prefId = idMap.get(code);
      if (!prefId) continue;
      const detail = detailsByCode.get(code) || {};
      const distance = Number.isFinite(Number(detail.distance_m)) ? Number(detail.distance_m) : null;
      await query(
        `INSERT INTO property_preferences (property_id, pref_id, note, distance_m)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (property_id, pref_id) DO UPDATE
           SET note = EXCLUDED.note, distance_m = EXCLUDED.distance_m`,
        [propertyId, prefId, detail.note || null, distance]
      );
    }
    return this.findByProperty(propertyId);
  },

  /** Nombre de biens référencés (au moins une préférence) vs total. */
  async stats() {
    const row = await queryOne(`
      SELECT
        (SELECT COUNT(*)::int FROM properties) AS total_properties,
        (SELECT COUNT(DISTINCT property_id)::int FROM property_preferences) AS referenced_properties,
        (SELECT COUNT(*)::int FROM preferences) AS total_preferences
    `);
    return row;
  },
};

export default PreferenceModel;
