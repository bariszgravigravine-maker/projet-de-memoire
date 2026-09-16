import { pool } from '../config/db.js';
import { PREFERENCE_CATALOG } from '../constants/preferences.js';

/**
 * Migration + seed du système de préférences de proximité.
 *
 * Usage : npm run db:seed:preferences
 *
 * Idempotent :
 *  - crée les tables si elles n'existent pas (utile sur une base déjà en prod
 *    qui n'a pas été recréée avec db:init),
 *  - insère/met à jour le catalogue (ON CONFLICT sur le code),
 *  - associe des préférences aux biens existants qui n'en ont pas encore
 *    (les autres — déjà référencés — ne sont pas touchés).
 */

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS preferences (
  pref_id     SERIAL PRIMARY KEY,
  code        VARCHAR(50) UNIQUE NOT NULL,
  label       VARCHAR(120) NOT NULL,
  icon        VARCHAR(50),
  category    VARCHAR(30),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_preferences (
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  pref_id      INT NOT NULL REFERENCES preferences(pref_id) ON DELETE CASCADE,
  note         TEXT,
  distance_m   INT,
  PRIMARY KEY (property_id, pref_id)
);
CREATE INDEX IF NOT EXISTS idx_prop_pref_prop ON property_preferences(property_id);
CREATE INDEX IF NOT EXISTS idx_prop_pref_pref ON property_preferences(pref_id);
`;

// Nombre de préférences associées aléatoirement à chaque bien non référencé
const MIN_PREFS_PER_PROPERTY = 1;
const MAX_PREFS_PER_PROPERTY = 4;

// Notes crédibles générées selon la préférence (ex: "à 200m du marché")
const NOTE_TEMPLATES = {
  ecole: 'École primaire à proximité immédiate',
  lycee: 'Lycée à moins de 10 minutes à pied',
  universite: 'Campus universitaire à proximité',
  creche: 'Crèche dans le quartier',
  hopital: 'Hôpital / centre de santé à proximité',
  pharmacie: 'Pharmacie à quelques minutes',
  centre_ville: 'Accès rapide au centre-ville',
  marche: 'Marché du quartier à pied',
  supermarche: 'Supermarché à proximité',
  transport: 'Arrêt de transport en commun à proximité',
  banque: 'Agence bancaire dans le quartier',
  commissariat: 'Commissariat à proximité',
  mosquee: 'Mosquée à quelques minutes',
  eglise: 'Église à quelques minutes',
  espace_vert: 'Espace vert / parc à proximité',
  salle_sport: 'Salle de sport dans le quartier',
};

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seedPreferences() {
  console.log('[DB] Migration + seed des préférences de proximité...');
  try {
    // 1) Schéma
    await pool.query(SCHEMA_SQL);
    console.log('[DB] Tables preferences / property_preferences prêtes.');

    // 2) Catalogue
    for (const p of PREFERENCE_CATALOG) {
      await pool.query(
        `INSERT INTO preferences (code, label, icon, category)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (code) DO UPDATE
           SET label = EXCLUDED.label,
               icon = EXCLUDED.icon,
               category = EXCLUDED.category`,
        [p.code, p.label, p.icon, p.category]
      );
    }
    console.log(`[DB] Catalogue : ${PREFERENCE_CATALOG.length} préférences enregistrées.`);

    // 3) Récupère les identifiants de préférences par code
    const prefRows = await pool.query('SELECT pref_id, code FROM preferences');
    const prefByCode = new Map(prefRows.rows.map((r) => [r.code, r.pref_id]));

    // 4) Biens qui n'ont encore aucune préférence ("basiques")
    const propRes = await pool.query(`
      SELECT p.id, p.city, p.district
      FROM properties p
      WHERE NOT EXISTS (
        SELECT 1 FROM property_preferences pp WHERE pp.property_id = p.id
      )
    `);
    console.log(`[DB] ${propRes.rows.length} bien(s) sans préférence à référencer.`);

    // 5) Association aléatoire mais déterministe par bien (même tirage si relancé)
    let linked = 0;
    for (const prop of propRes.rows) {
      const count = randInt(MIN_PREFS_PER_PROPERTY, MAX_PREFS_PER_PROPERTY);
      const shuffled = [...PREFERENCE_CATALOG].sort(() => Math.random() - 0.5).slice(0, count);
      for (const pref of shuffled) {
        const prefId = prefByCode.get(pref.code);
        if (!prefId) continue;
        await pool.query(
          `INSERT INTO property_preferences (property_id, pref_id, note, distance_m)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (property_id, pref_id) DO NOTHING`,
          [prop.id, prefId, NOTE_TEMPLATES[pref.code] || null, randInt(80, 1500)]
        );
        linked++;
      }
    }

    console.log(`[DB] ${linked} association(s) bien <-> préférence créées.`);
    console.log('[DB] Terminé.');
  } catch (err) {
    console.error('[DB] Erreur lors du seed des préférences:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedPreferences();
