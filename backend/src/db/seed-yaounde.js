import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

/**
 * Seeder Yaoundé — ajoute ~50 biens immobiliers répartis dans tous les
 * quartiers de Yaoundé, ainsi que de nouveaux utilisateurs (agents + particuliers).
 *
 * Chaque bien est :
 *  - géolocalisé au sein de son quartier (coordonnées réelles + léger bruit),
 *  - rattaché à un agent propriétaire,
 *  - associé à des préférences de proximité cohérentes avec le quartier
 *    (ex: Ngoa-Ekellé → université, école, transport),
 *  - accompagné de photos, d'une annonce et d'une ligne `transactions`
 *    (pour l'estimation de prix par l'IA).
 *
 * Usage : npm run db:seed:yaounde
 *
 * Idempotent : les biens dont le titre + la ville existent déjà sont ignorés.
 */

// --- Quartiers de Yaoundé : coordonnées réelles + équipements de proximité ---
const YAOUNDE_DISTRICTS = {
  'Bastos':        { lat: 3.8896, lon: 11.5286, prefs: ['centre_ville', 'banque', 'commissariat', 'lycee'] },
  'Bonas':         { lat: 3.8721, lon: 11.5170, prefs: ['ecole', 'marche', 'eglise'] },
  'Ngoa-Ekellé':   { lat: 3.8634, lon: 11.5031, prefs: ['lycee', 'universite', 'ecole', 'transport'] },
  'Mvan':          { lat: 3.8339, lon: 11.5333, prefs: ['transport', 'marche', 'pharmacie'] },
  'Ekie':          { lat: 3.8556, lon: 11.5089, prefs: ['ecole', 'marche', 'pharmacie'] },
  'Mfandena':      { lat: 3.8778, lon: 11.4967, prefs: ['lycee', 'ecole', 'marche'] },
  'Omnisport':     { lat: 3.8861, lon: 11.4900, prefs: ['espace_vert', 'salle_sport', 'transport'] },
  'Etoudi':        { lat: 3.9008, lon: 11.5028, prefs: ['hopital', 'marche', 'transport'] },
  'Tsinga':        { lat: 3.8778, lon: 11.5100, prefs: ['lycee', 'ecole', 'hopital'] },
  'Ekounou':       { lat: 3.8342, lon: 11.5394, prefs: ['lycee', 'marche', 'transport'] },
  'Mvog-Mbi':      { lat: 3.8583, lon: 11.5250, prefs: ['lycee', 'marche', 'eglise'] },
  'Mvog-Ada':      { lat: 3.8606, lon: 11.5206, prefs: ['marche', 'transport', 'eglise'] },
  'Briqueterie':   { lat: 3.8833, lon: 11.5083, prefs: ['centre_ville', 'banque', 'pharmacie'] },
  'Mokolo':        { lat: 3.8833, lon: 11.5000, prefs: ['marche', 'transport', 'centre_ville'] },
  'Nlongkak':      { lat: 3.8778, lon: 11.5153, prefs: ['centre_ville', 'banque', 'eglise'] },
  'Essos':         { lat: 3.8833, lon: 11.5250, prefs: ['hopital', 'pharmacie', 'ecole'] },
  'Mendong':       { lat: 3.8300, lon: 11.5000, prefs: ['transport', 'marche', 'ecole'] },
  'Odza':          { lat: 3.8100, lon: 11.5400, prefs: ['lycee', 'ecole', 'marche'] },
  'Awae':          { lat: 3.9200, lon: 11.5500, prefs: ['ecole', 'espace_vert', 'marche'] },
  'Emana':         { lat: 3.8250, lon: 11.5600, prefs: ['marche', 'transport', 'eglise'] },
  'Nkolbisson':    { lat: 3.8800, lon: 11.4500, prefs: ['lycee', 'universite', 'transport'] },
  'Nsimeyong':     { lat: 3.8550, lon: 11.4950, prefs: ['ecole', 'marche', 'mosquee'] },
  'Damas':         { lat: 3.8450, lon: 11.5450, prefs: ['ecole', 'marche', 'eglise'] },
  'Nkol-Eton':     { lat: 3.8680, lon: 11.4880, prefs: ['lycee', 'transport', 'marche'] },
};

const CITY = 'Yaoundé';

// --- Nouveaux agents (propriétaires des biens) ---
const NEW_AGENTS = [
  { first: 'Aristide',  last: 'Mbarga',    phone: '+237677101001', bio: 'Agent immobilier à Bastos et Nlongkak, spécialiste appartements haut standing.' },
  { first: 'Clarisse',  last: 'Eyenga',    phone: '+237677101002', bio: 'Agente immobilière à Ngoa-Ekellé, spécialiste studios et chambres étudiantes.' },
  { first: 'Benoît',    last: 'Talla',     phone: '+237677101003', bio: 'Agent immobilier à Mvan et Ekounou, spécialiste maisons familiales.' },
  { first: 'Nadège',    last: 'Mballa',    phone: '+237677101004', bio: 'Agente immobilière à Etoudi et Tsinga, villas et terrains.' },
  { first: 'Ghislain',  last: 'Nkomo',     phone: '+237677101005', bio: 'Agent immobilier à Mokolo et Briqueterie, locaux commerciaux et bureaux.' },
  { first: 'Christelle',last: 'Fouda',     phone: '+237677101006', bio: 'Agente immobilière à Odza et Emana, terrains titrés.' },
  { first: 'Serge',     last: 'Ngono',     phone: '+237677101007', bio: 'Agent immobilier à Nkolbisson et Nsimeyong, proche universités.' },
  { first: 'Mireille',  last: 'Abanda',    phone: '+237677101008', bio: 'Agente immobilière à Omnisport et Mfandena, appartements neufs.' },
];

// --- Nouveaux particuliers (chercheurs de biens) ---
const NEW_USERS = [
  { first: 'Yannick',   last: 'Fotso',   phone: '+237678202001', bio: 'Jeune cadre cherchant un appartement à Bastos.' },
  { first: 'Suzanne',   last: 'Ndoumbe', phone: '+237678202002', bio: 'Enseignante, cherche une maison proche d\'une école à Bonas.' },
  { first: 'Bertrand',  last: 'Kamdem',  phone: '+237678202003', bio: 'Étudiant à l\'Université de Yaoundé I, cherche un studio à Ngoa-Ekellé.' },
  { first: 'Aïcha',     last: 'Bello',   phone: '+237678202004', bio: 'Commerçante, cherche un local proche du marché Mokolo.' },
  { first: 'Olivier',   last: 'Manga',   phone: '+237678202005', bio: 'Investisseur, cherche des terrains à Odza et Emana.' },
  { first: 'Bernadette',last: 'Ayissi',  phone: '+237678202006', bio: 'Retraitée, cherche un logement proche de l\'hôpital d\'Etoudi.' },
  { first: 'Rodrigue',  last: 'Essomba', phone: '+237678202007', bio: 'Ingénieur, cherche une villa à Omnisport.' },
  { first: 'Chantal',   last: 'Ngo Bassong', phone: '+237678202008', bio: 'Cadre bancaire, cherche un appartement proche du centre-ville.' },
  { first: 'Hervé',     last: 'Djoumessi', phone: '+237678202009', bio: 'Chauffeur de taxi, cherche une chambre à Mvan proche du transport.' },
  { first: 'Estelle',   last: 'Mvondo',  phone: '+237678202010', bio: 'Infirmière, cherche un logement proche de la pharmacie à Essos.' },
];

const PROPERTY_TYPES = ['maison', 'appartement', 'studio', 'chambre', 'villa', 'terrain', 'bureau'];
const TYPE_WEIGHTS = { appartement: 6, maison: 5, studio: 4, chambre: 3, villa: 3, terrain: 3, bureau: 2 };

const PRICE_RANGES = {
  studio:      [30000, 120000],
  chambre:     [20000, 80000],
  appartement: [80000, 400000],
  maison:      [100000, 600000],
  villa:       [400000, 1500000],
  terrain:     [3000000, 25000000],
  bureau:      [200000, 1500000],
};

const AREA_RANGES = {
  studio:      [25, 45],
  chambre:     [12, 25],
  appartement: [50, 150],
  maison:      [120, 280],
  villa:       [250, 450],
  terrain:     [300, 1500],
  bureau:      [40, 200],
};

const PHOTOS = {
  maison: [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
  ],
  appartement: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800',
  ],
  studio: [
    'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800',
    'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
  ],
  chambre: [
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
    'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800',
  ],
  villa: [
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  ],
  terrain: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
  ],
  bureau: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
  ],
};

// Note de proximité lisible, cohérente avec le code de préférence
const PREF_NOTES = {
  ecole: 'École primaire à proximité immédiate',
  lycee: 'Lycée à moins de 10 minutes à pied',
  universite: 'Campus universitaire à proximité',
  creche: 'Crèche dans le quartier',
  hopital: 'Hôpital / centre de santé à proximité',
  pharmacie: 'Pharmacie à quelques minutes',
  centre_ville: 'Accès rapide au centre-ville',
  marche: 'Marché du quartier accessible à pied',
  supermarche: 'Supermarché à proximité',
  transport: 'Arrêt de transport en commun à proximité',
  banque: 'Agence bancaire dans le quartier',
  commissariat: 'Commissariat à proximité',
  mosquee: 'Mosquée à quelques minutes',
  eglise: 'Église à quelques minutes',
  espace_vert: 'Espace vert / parc à proximité',
  salle_sport: 'Salle de sport dans le quartier',
};

// --- Générateur pseudo-aléatoire DÉTERMINISTE (mulberry32) ---
// Indispensable : sans graine fixe, chaque exécution produirait des biens
// différents et le contrôle d'idempotence (titre + ville) ne matcherait plus,
// ce qui dupliquerait les données à chaque lancement du seeder.
function createRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = createRng(20260916);

// --- Utilitaires ---
const rand = (arr) => arr[Math.floor(rng() * arr.length)];
const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
const randFloat = (min, max) => rng() * (max - min) + min;

function pickType() {
  const total = Object.values(TYPE_WEIGHTS).reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (const [t, w] of Object.entries(TYPE_WEIGHTS)) {
    if (r < w) return t;
    r -= w;
  }
  return 'appartement';
}

function randPrice(type) {
  const [min, max] = PRICE_RANGES[type];
  return Math.ceil(randInt(min, max) / 1000) * 1000;
}

const TYPE_LABEL = {
  maison: 'Maison', appartement: 'Appartement', studio: 'Studio',
  chambre: 'Chambre', villa: 'Villa', terrain: 'Terrain', bureau: 'Bureau',
};

function buildTitle(type, district) {
  const suffix = type === 'terrain'
    ? `${randInt(3, 15)} ares`
    : `${randInt(1, 6)} chambres`;
  return `${TYPE_LABEL[type]} ${suffix} à ${district} Yaoundé`;
}

function buildDescription(type, district, area, beds, baths, price, prefCodes) {
  const parts = [
    `${TYPE_LABEL[type]} situé(e) à ${district}, Yaoundé.`,
    `Surface de ${area} m².`,
  ];
  if (beds) parts.push(`${beds} chambre(s).`);
  if (baths) parts.push(`${baths} salle(s) de bain.`);
  parts.push(`Loyer mensuel : ${price.toLocaleString('fr-FR')} FCFA.`);
  if (prefCodes.length > 0) {
    const labels = prefCodes.map((c) => PREF_NOTES[c]).filter(Boolean);
    if (labels.length) parts.push(`À proximité : ${labels.join(', ')}.`);
  }
  parts.push('Quartier animé et bien desservi, idéal pour famille ou professionnel.');
  return parts.join(' ');
}

async function ensureUser({ email, passHash, first, last, phone, role, bio }) {
  const res = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, bio, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIF')
     ON CONFLICT (email) DO UPDATE
       SET first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           bio = EXCLUDED.bio
     RETURNING id`,
    [email, passHash, first, last, phone, role, bio]
  );
  return res.rows[0].id;
}

async function seedYaounde() {
  console.log('[DB] Seeder Yaoundé : démarrage...');

  try {
    // --- Vérifie que les tables de préférences existent ---
    const prefTable = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'preferences'
      ) AS exists
    `);
    const hasPrefs = prefTable.rows[0].exists;
    if (!hasPrefs) {
      console.warn('[DB] Table "preferences" absente. Lancez d\'abord : npm run db:seed:preferences');
    }
    const prefRows = hasPrefs
      ? await pool.query('SELECT pref_id, code FROM preferences')
      : { rows: [] };
    const prefByCode = new Map(prefRows.rows.map((r) => [r.code, r.pref_id]));

    const agentPass = await bcrypt.hash('agent123', 10);
    const userPass = await bcrypt.hash('user123', 10);

    // --- 1) Nouveaux agents ---
    const agentIds = [];
    for (let i = 0; i < NEW_AGENTS.length; i++) {
      const a = NEW_AGENTS[i];
      const email = `agent.${a.first.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${a.last.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@immo.cm`;
      const id = await ensureUser({
        email, passHash: agentPass, first: a.first, last: a.last,
        phone: a.phone, role: 'AGENT', bio: a.bio,
      });
      agentIds.push(id);
    }
    console.log(`[DB] ${agentIds.length} agents Yaoundé créés/vérifiés.`);

    // --- 2) Nouveaux particuliers ---
    const userIds = [];
    for (const u of NEW_USERS) {
      const email = `user.${u.first.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${u.last.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@immo.cm`;
      const id = await ensureUser({
        email, passHash: userPass, first: u.first, last: u.last,
        phone: u.phone, role: 'USER', bio: u.bio,
      });
      userIds.push(id);
    }
    console.log(`[DB] ${userIds.length} particuliers Yaoundé créés/vérifiés.`);

    // --- 3) Génération des biens : 2 à 3 par quartier ---
    const districts = Object.keys(YAOUNDE_DISTRICTS);
    const biens = [];
    let agentCursor = 0;

    for (const district of districts) {
      const info = YAOUNDE_DISTRICTS[district];
      const count = randInt(2, 3);
      for (let i = 0; i < count; i++) {
        const type = pickType();
        const area = randInt(...AREA_RANGES[type]);
        const beds = type === 'terrain' ? null
          : (type === 'studio' || type === 'chambre' ? 1 : randInt(1, 6));
        const baths = type === 'terrain' ? null
          : (type === 'studio' || type === 'chambre' ? 1 : randInt(1, 3));
        const price = randPrice(type);

        // 2 à 3 préférences cohérentes avec le quartier (+ 1 aléatoire parfois)
        const shuffled = [...info.prefs].sort(() => rng() - 0.5);
        const chosen = shuffled.slice(0, randInt(2, Math.min(3, shuffled.length)));

        biens.push({
          owner: agentIds[agentCursor % agentIds.length],
          type, area, beds, baths, price,
          district,
          city: CITY,
          // Léger décalage (~±500 m) pour éviter la superposition des marqueurs
          lat: parseFloat((info.lat + randFloat(-0.005, 0.005)).toFixed(5)),
          lon: parseFloat((info.lon + randFloat(-0.005, 0.005)).toFixed(5)),
          title: buildTitle(type, district),
          prefs: chosen,
          photos: (PHOTOS[type] || PHOTOS.maison).slice(0, randInt(2, 4)),
        });
        agentCursor++;
      }
    }

    console.log(`[DB] ${biens.length} biens générés sur ${districts.length} quartiers de Yaoundé.`);

    // --- 4) Insertion ---
    let inserted = 0;
    let skipped = 0;
    let prefLinks = 0;

    for (const b of biens) {
      // Idempotence : même titre + même ville => déjà présent
      const exists = await pool.query(
        `SELECT p.id AS property_id FROM ads a
         JOIN properties p ON a.property_id = p.id
         WHERE a.title = $1 AND p.city = $2
         LIMIT 1`,
        [b.title, b.city]
      );
      if (exists.rows.length > 0) {
        // Le bien existe déjà. On garantit quand même que ses préférences de
        // proximité sont à jour : si on enrichit la liste d'un quartier, un
        // nouveau passage du seeder complète les biens existants.
        if (hasPrefs) {
          const existingPropId = exists.rows[0].property_id;
          for (const code of b.prefs) {
            const prefId = prefByCode.get(code);
            if (!prefId) continue;
            const linked = await pool.query(
              `INSERT INTO property_preferences (property_id, pref_id, note, distance_m)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (property_id, pref_id) DO NOTHING
               RETURNING property_id`,
              [existingPropId, prefId, PREF_NOTES[code] || null, randInt(80, 1800)]
            );
            if (linked.rows.length > 0) prefLinks++;
          }
        }
        skipped++;
        continue;
      }

      const propRes = await pool.query(
        `INSERT INTO properties (owner_id, property_type, area, bedrooms, bathrooms, address, district, city, latitude, longitude, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIF')
         RETURNING id`,
        [b.owner, b.type, b.area, b.beds, b.baths, b.district, b.district, b.city, b.lat, b.lon]
      );
      const propId = propRes.rows[0].id;

      const desc = buildDescription(b.type, b.district, b.area, b.beds, b.baths, b.price, b.prefs);

      await pool.query(
        `INSERT INTO ads (owner_id, property_id, title, description, price, status, view_count)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6)`,
        [b.owner, propId, b.title, desc, b.price, randInt(0, 150)]
      );

      for (let i = 0; i < b.photos.length; i++) {
        await pool.query(
          `INSERT INTO photos (property_id, url, display_order) VALUES ($1, $2, $3)`,
          [propId, b.photos[i], i]
        );
      }

      // Préférences de proximité
      if (hasPrefs) {
        for (const code of b.prefs) {
          const prefId = prefByCode.get(code);
          if (!prefId) continue;
          await pool.query(
            `INSERT INTO property_preferences (property_id, pref_id, note, distance_m)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (property_id, pref_id) DO NOTHING`,
            [propId, prefId, PREF_NOTES[code] || null, randInt(80, 1800)]
          );
          prefLinks++;
        }
      }

      // Échantillon pour l'estimation de prix IA
      await pool.query(
        `INSERT INTO transactions (property_type, area, bedrooms, bathrooms, city, district, latitude, longitude, price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [b.type, b.area, b.beds, b.baths, b.city, b.district, b.lat, b.lon, b.price]
      );

      // Compteur d'annonces actives de l'agent
      await pool.query(
        `UPDATE users SET active_ads_count = COALESCE(active_ads_count, 0) + 1 WHERE id = $1`,
        [b.owner]
      );

      inserted++;
    }

    // --- 5) Convergence : chaque bien de Yaoundé reçoit les préférences de
    //        son quartier, même s'il a été créé par un autre seeder. C'est
    //        cette étape qui garantit la cohérence de la recherche IA
    //        ("proche du lycée de Ngoa-Ekellé") sur toute la base.
    let synced = 0;
    if (hasPrefs) {
      for (const [district, info] of Object.entries(YAOUNDE_DISTRICTS)) {
        const props = await pool.query(
          `SELECT id FROM properties WHERE city = $1 AND unaccent(district) ILIKE unaccent($2)`,
          [CITY, district]
        );
        for (const prop of props.rows) {
          for (const code of info.prefs) {
            const prefId = prefByCode.get(code);
            if (!prefId) continue;
            const linked = await pool.query(
              `INSERT INTO property_preferences (property_id, pref_id, note, distance_m)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (property_id, pref_id) DO NOTHING
               RETURNING property_id`,
              [prop.id, prefId, PREF_NOTES[code] || null, randInt(150, 1800)]
            );
            if (linked.rows.length > 0) synced++;
          }
        }
      }
    }
    console.log(`[DB] ${synced} préférence(s) ajoutée(s) par convergence sur les biens existants.`);

    // --- 6) Favoris de démonstration pour les nouveaux particuliers ---
    const recentAds = await pool.query(
      `SELECT a.id FROM ads a
       JOIN properties p ON a.property_id = p.id
       WHERE p.city = $1 AND a.status = 'ACTIVE'
       ORDER BY a.published_at DESC
       LIMIT 40`,
      [CITY]
    );
    const adIds = recentAds.rows.map((r) => r.id);
    let favCount = 0;
    for (const uid of userIds) {
      const picks = [...adIds].sort(() => rng() - 0.5).slice(0, randInt(1, 3));
      for (const adId of picks) {
        await pool.query(
          `INSERT INTO favorites (user_id, ad_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [uid, adId]
        );
        favCount++;
      }
    }

    console.log(`[DB] Insertion terminée : ${inserted} biens ajoutés, ${skipped} déjà présents (ignorés).`);
    console.log(`[DB] ${prefLinks} préférences de proximité associées, ${favCount} favoris de démonstration.`);
    console.log('[DB] Comptes de test : agent.<prenom>.<nom>@immo.cm / agent123 — user.<prenom>.<nom>@immo.cm / user123');
  } catch (err) {
    console.error('[DB] Erreur lors du seeder Yaoundé:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedYaounde();
