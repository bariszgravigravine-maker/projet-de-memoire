import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

/**
 * Seeder massif : ajoute ~120 biens répartis dans toutes les grandes villes
 * du Cameroun (Yaoundé, Douala, Bafoussam, Bamenda, Garoua, Kribi, Buea, Limbe,
 * Bertoua, Maroua, Ngaoundéré, Ebolowa, Kumba, Dschang, Edea, Nkongsamba, Bafia,
 * Yagoua, Foumban, Mbouda).
 *
 * Usage : npm run db:seed:massive
 *
 * Idempotent : utilise ON CONFLICT pour les utilisateurs et ne réinsère pas
 * les biens dont le titre + ville existent déjà (via une vérification).
 */

// Coordonnées approximatives des grandes villes camerounaises
const CITIES = {
  'Yaoundé':    { lat: 3.867, lon: 11.502, districts: ['Bastos','Bonas','Ngoa-Ekellé','Mvan','Ekie','Mfandena','Omnisport','Etoudi','Mvog-Mbi','Tsinga','Ekounou','Mvog-Ada','Briqueterie','Mokolo'] },
  'Douala':     { lat: 4.051, lon: 9.768, districts: ['Bonapriso','Akwa','Bonanjo','Bonamoussadi','Deido','New Bell','Bepanda','Logbaba','Makepe','PK8','Bonaberi','Ndokoti'] },
  'Bafoussam':  { lat: 5.478, lon: 10.418, districts: ['Famla','Djeleng','Kamkop','Tamdja','Banengo','Drepan'] },
  'Bamenda':    { lat: 5.959, lon: 10.146, districts: ['Commercial Avenue','Ntarinkon','Mankon','Nkwen','Up Station','Mile 4'] },
  'Garoua':     { lat: 9.302, lon: 13.395, districts: ['Quartier Plateau','Bokle','Doualaré','Djamboutou'] },
  'Kribi':      { lat: 2.944, lon: 9.912,  districts: ['Centre','Londji','Eboundja','Mpolong'] },
  'Buea':       { lat: 4.155, lon: 9.242,  districts: ['Great Soppo','Molyko','Bokwaongo','Buea Town'] },
  'Limbe':      { lat: 4.023, lon: 9.214,  districts: ['Down Beach','Mile One','Mile Two','Bonadikombo'] },
  'Bertoua':    { lat: 4.579, lon: 13.681, districts: ['Centre','Ngbwatis','Koumou'] },
  'Maroua':     { lat: 10.591, lon: 14.319, districts: ['Domayo','Doualaré','Koutéré','Pitoaré'] },
  'Ngaoundéré': { lat: 7.324, lon: 13.583, districts: ['Baladji','Bamyanga','Dang','Sabongarou'] },
  'Ebolowa':    { lat: 2.910, lon: 11.157, districts: ['Centre','Mekoumbou','Nkometou'] },
  'Kumba':      { lat: 4.636, lon: 9.446,  districts: ['Town','Kumba One','Mambanda','Fiango'] },
  'Dschang':    { lat: 5.455, lon: 10.046, districts: ['Centre','Fotetsa','Fongo-Tongo'] },
  'Edea':       { lat: 3.770, lon: 10.126, districts: ['Centre','Bonaloha','Bizamb'] },
  'Nkongsamba': { lat: 5.040, lon: 9.946,  districts: ['Centre','Barem','Nloum'] },
  'Bafia':      { lat: 4.750, lon: 11.230, districts: ['Centre','Dinguel','Tongo'] },
  'Yagoua':     { lat: 10.340, lon: 15.230, districts: ['Centre','Bongor','Kai-Kai'] },
  'Foumban':    { lat: 5.760, lon: 10.910, districts: ['Centre','Mfombassa','Koutaba'] },
  'Mbouda':     { lat: 5.626, lon: 10.255, districts: ['Centre','Famla','Kouogouo'] },
};

const PROPERTY_TYPES = ['maison','appartement','studio','chambre','villa','terrain','bureau'];
const TYPE_WEIGHTS  = { maison: 4, appartement: 5, studio: 3, chambre: 2, villa: 2, terrain: 2, bureau: 1 };

// Banques d'images Unsplash par type de bien (URLs stables)
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

// Plages de prix par type (FCFA / mois pour location)
const PRICE_RANGES = {
  studio:      [30000, 120000],
  chambre:     [20000, 80000],
  appartement: [80000, 400000],
  maison:      [100000, 600000],
  villa:       [400000, 1500000],
  terrain:     [3000000, 25000000],
  bureau:      [200000, 1500000],
};

// Plages de surface par type (m²)
const AREA_RANGES = {
  studio:      [25, 45],
  chambre:     [12, 25],
  appartement: [50, 150],
  maison:      [120, 280],
  villa:       [250, 450],
  terrain:     [300, 1500],
  bureau:      [40, 200],
};

const FIRST_NAMES = ['Atangana','Kamga','Ndongo','Foka','Ekane','Biya','Toumba','Nkomo','Mbarga','Talla','Eyenga','Mballa','Ngono','Aissatou','Bouba','Oumarou','Hamadou','Issa','Moussa','Aboubakar','Pierre','Jean','Marie','Paul','Sandrine','Aisha','Brice','Mireille','Wilfried','Serge','Hervé','Christelle','Nadège','Yann','Ghislain','Linda','Suzanne','Thérèse','Bernadette','Catherine'];
const LAST_NAMES  = ['Paul','Marie','Pierre','Jean','Joseph','David','Daniel','Samuel','Emmanuel','François','Antoine','Benoît','Cyrille','Hervé','Patrick','Serge','Eugène','Luc','Marc','André','Robert','Michel','Jacques','Thomas','Nicolas','Vincent','Laurent','Olivier','Denis','Xavier'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max, decimals = 4) {
  const v = Math.random() * (max - min) + min;
  return parseFloat(v.toFixed(decimals));
}
function randPrice(type) {
  const [min, max] = PRICE_RANGES[type];
  // Arrondi au millier supérieur
  return Math.ceil(randInt(min, max) / 1000) * 1000;
}
function randArea(type) {
  const [min, max] = AREA_RANGES[type];
  return randInt(min, max);
}

function pickType() {
  const total = Object.values(TYPE_WEIGHTS).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [t, w] of Object.entries(TYPE_WEIGHTS)) {
    if (r < w) return t;
    r -= w;
  }
  return 'appartement';
}

function buildTitle(type, district, city) {
  const typeLabel = {
    maison: 'Maison',
    appartement: 'Appartement',
    studio: 'Studio',
    chambre: 'Chambre',
    villa: 'Villa',
    terrain: 'Terrain',
    bureau: 'Bureau',
  }[type] || 'Bien';
  const suffix = type === 'terrain' ? `${randArea(type)} m²` : `${randInt(1, 6)} ch.`;
  return `${typeLabel} ${suffix} à ${district} ${city}`;
}

function buildDescription(type, district, city, area, beds, baths, price) {
  const parts = [];
  parts.push(`Superbe ${type} situé à ${district}, ${city}.`);
  parts.push(`Surface de ${area} m².`);
  if (beds) parts.push(`${beds} chambre(s).`);
  if (baths) parts.push(`${baths} salle(s) de bain.`);
  parts.push(`Loyer mensuel : ${price.toLocaleString('fr-FR')} FCFA.`);
  parts.push(`Proche des commodités (écoles, marchés, transports).`);
  parts.push(`Quartier calme et sécurisé, idéal pour famille ou professionnel.`);
  return parts.join(' ');
}

async function ensureAgent(email, firstName, lastName, phone, passHash) {
  const res = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, bio)
     VALUES ($1, $2, $3, $4, $5, 'AGENT', $6)
     ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name
     RETURNING id`,
    [email, passHash, firstName, lastName, phone, `Agent immobilier à ${lastName}.`]
  );
  return res.rows[0].id;
}

async function seedMassive() {
  console.log('[DB] Démarrage du seeder massif...');

  try {
    const agentPass = await bcrypt.hash('agent123', 10);

    // 1) Crée 12 agents répartis dans différentes villes
    const agents = [];
    const agentCities = Object.keys(CITIES).slice(0, 12);
    for (let i = 0; i < agentCities.length; i++) {
      const city = agentCities[i];
      const first = rand(FIRST_NAMES);
      const last = rand(LAST_NAMES);
      const email = `agent.${city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}${i}@immo.cm`;
      const id = await ensureAgent(email, first, last, `+2376${randInt(90000000, 99999999)}`, agentPass);
      agents.push({ id, city });
    }

    // 2) Pour chaque ville, génère entre 4 et 10 biens
    const allBiens = [];
    for (const [city, info] of Object.entries(CITIES)) {
      const count = randInt(4, 10);
      for (let i = 0; i < count; i++) {
        const district = rand(info.districts);
        const type = pickType();
        const area = randArea(type);
        const beds = type === 'terrain' ? null : (type === 'studio' || type === 'chambre' ? 1 : randInt(1, 6));
        const baths = type === 'terrain' ? null : (type === 'studio' || type === 'chambre' ? 1 : randInt(1, 3));
        const price = randPrice(type);
        // Léger décalage aléatoire autour du centre-ville pour éviter les chevauchements
        const lat = info.lat + randFloat(-0.02, 0.02);
        const lon = info.lon + randFloat(-0.02, 0.02);
        const title = buildTitle(type, district, city);
        const desc = buildDescription(type, district, city, area, beds, baths, price);
        const photos = (PHOTOS[type] || PHOTOS.maison).slice(0, randInt(2, 4));
        // Choix de l'agent : on alterne pour répartir les biens
        const owner = agents[i % agents.length].id;
        allBiens.push({ owner, type, area, beds, baths, district, city, lat, lon, title, desc, price, photos });
      }
    }

    console.log(`[DB] ${allBiens.length} biens à insérer dans ${Object.keys(CITIES).length} villes.`);

    // 3) Insertion des biens + annonces + photos
    let inserted = 0;
    let skipped = 0;
    for (const b of allBiens) {
      // Vérifie l'existence (même titre + ville) pour rester idempotent
      const exists = await pool.query(
        `SELECT a.id FROM ads a
         JOIN properties p ON a.property_id = p.id
         WHERE a.title = $1 AND p.city = $2
         LIMIT 1`,
        [b.title, b.city]
      );
      if (exists.rows.length > 0) { skipped++; continue; }

      const propRes = await pool.query(
        `INSERT INTO properties (owner_id, property_type, area, bedrooms, bathrooms, address, district, city, latitude, longitude, status)
         VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, 'ACTIF')
         RETURNING id`,
        [b.owner, b.type, b.area, b.beds, b.baths, b.district, b.city, b.lat, b.lon]
      );
      const propId = propRes.rows[0].id;

      const adRes = await pool.query(
        `INSERT INTO ads (owner_id, property_id, title, description, price, status, view_count)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6)
         RETURNING id`,
        [b.owner, propId, b.title, b.desc, b.price, randInt(0, 120)]
      );
      const adId = adRes.rows[0].id;

      for (let i = 0; i < b.photos.length; i++) {
        await pool.query(
          `INSERT INTO photos (property_id, url, display_order) VALUES ($1, $2, $3)`,
          [propId, b.photos[i], i]
        );
      }

      // Transactions pour l'estimation de prix IA
      await pool.query(
        `INSERT INTO transactions (property_type, area, bedrooms, bathrooms, city, district, latitude, longitude, price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [b.type, b.area, b.beds, b.baths, b.city, b.district, b.lat, b.lon, b.price]
      );

      inserted++;
    }

    console.log(`[DB] Insertion terminée : ${inserted} biens ajoutés, ${skipped} déjà présents (ignorés).`);
    console.log('[DB] Comptes de test agents : agent.<ville><index>@immo.cm / agent123');
  } catch (err) {
    console.error('[DB] Erreur lors du seeder massif:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedMassive();
