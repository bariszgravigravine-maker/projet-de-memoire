import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

/**
 * Script de peuplement de la base de données avec des données de démonstration.
 * Inclut : utilisateurs (avec photos), biens, annonces, photos variées,
 * conversations, messages (avec pièces jointes), notifications, favoris.
 *
 * Usage : npm run db:seed
 */

async function seed() {
  console.log('[DB] Peuplement des données de démonstration...');

  try {
    // --- Ajout des colonnes manquantes si elles n'existent pas ---
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`);
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT`);
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50)`);
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255)`);

    // --- Utilisateurs existants ---
    const adminPass = await bcrypt.hash('admin123', 10);
    const agentPass = await bcrypt.hash('agent123', 10);
    const userPass = await bcrypt.hash('user123', 10);

    const admin = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio)
       VALUES ('admin@immo.cm', $1, 'Admin', 'Système', '+237690000000', 'ADMIN', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', 'Administrateur de la plateforme NestFind.')
       ON CONFLICT (email) DO UPDATE SET profile_photo_url = EXCLUDED.profile_photo_url, bio = EXCLUDED.bio
       RETURNING id`,
      [adminPass]
    );

    const agent = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio, active_ads_count, total_views, total_contacts)
       VALUES ('agent@immo.cm', $1, 'Kamga', 'Paul', '+237691111111', 'AGENT', 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=200', 'Agent immobilier à Douala, spécialiste villas et appartements haut standing.', 4, 320, 45)
       ON CONFLICT (email) DO UPDATE SET profile_photo_url = EXCLUDED.profile_photo_url, bio = EXCLUDED.bio
       RETURNING id`,
      [agentPass]
    );

    const agent2 = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio, active_ads_count, total_views, total_contacts)
       VALUES ('ndongo@immo.cm', $1, 'Ndongo', 'Marie', '+237692222222', 'AGENT', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200', 'Agente immobilière à Yaoundé, spécialiste studios et chambres pour étudiants.', 4, 180, 28)
       ON CONFLICT (email) DO UPDATE SET profile_photo_url = EXCLUDED.profile_photo_url, bio = EXCLUDED.bio
       RETURNING id`,
      [agentPass]
    );

    const user = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, preferred_types, preferred_zones, budget_max, profile_photo_url, bio)
       VALUES ('user@immo.cm', $1, 'Atangana', 'Fredy', '+237693333333', 'USER', ARRAY['maison','appartement'], ARRAY['Yaoundé','Bastos'], 150000, 'https://images.unsplash.com/photo-1633332755192-780a8822f9e4?w=200', 'À la recherche d''une maison à Yaoundé pour ma famille.')
       ON CONFLICT (email) DO UPDATE SET profile_photo_url = EXCLUDED.profile_photo_url, bio = EXCLUDED.bio
       RETURNING id`,
      [userPass]
    );

    // --- Nouveaux utilisateurs avec photos de profils noirs ---
    const newUser1 = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio, active_ads_count, total_views, total_contacts)
       VALUES ('aisha.toumba@immo.cm', $1, 'Aisha', 'Toumba', '+237694444444', 'AGENT', 'https://images.unsplash.com/photo-1531259683007-016a7b628fc2?w=200', 'Agente immobilière à Douala, passionnée par l''immobilier moderne.', 3, 250, 30)
       ON CONFLICT (email) DO UPDATE SET profile_photo_url = EXCLUDED.profile_photo_url, bio = EXCLUDED.bio
       RETURNING id`,
      [agentPass]
    );

    const newUser2 = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio)
       VALUES ('brice.ekane@immo.cm', $1, 'Brice', 'Ekane', '+237695555555', 'USER', 'https://images.unsplash.com/photo-1507591064344-4c6ce003b128?w=200', 'Jeune professionnel cherchant un appartement à Yaoundé.')
       ON CONFLICT (email) DO UPDATE SET profile_photo_url = EXCLUDED.profile_photo_url, bio = EXCLUDED.bio
       RETURNING id`,
      [userPass]
    );

    const newUser3 = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio)
       VALUES ('mireille.nkomo@immo.cm', $1, 'Mireille', 'Nkomo', '+237696666666', 'USER', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200', 'Étudiante en recherche d''un studio à Ngoa-Ekellé.')
       ON CONFLICT (email) DO UPDATE SET profile_photo_url = EXCLUDED.profile_photo_url, bio = EXCLUDED.bio
       RETURNING id`,
      [userPass]
    );

    const newUser4 = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio)
       VALUES ('jeanpaul.biya@immo.cm', $1, 'Jean-Paul', 'Biya Jr', '+237697777777', 'USER', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200', 'Investisseur immobilier, cherche des terrains et villas à Douala.')
       ON CONFLICT (email) DO UPDATE SET profile_photo_url = EXCLUDED.profile_photo_url, bio = EXCLUDED.bio
       RETURNING id`,
      [userPass]
    );

    const newUser5 = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio, active_ads_count, total_views, total_contacts)
       VALUES ('sandrine.foka@immo.cm', $1, 'Sandrine', 'Foka', '+237698888888', 'AGENT', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200', 'Agente immobilière à Bafoussam, spécialiste maisons familiales.', 2, 120, 15)
       ON CONFLICT (email) DO UPDATE SET profile_photo_url = EXCLUDED.profile_photo_url, bio = EXCLUDED.bio
       RETURNING id`,
      [agentPass]
    );

    const newUser6 = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio)
       VALUES ('wilfried.kamga@immo.cm', $1, 'Wilfried', 'Kamga', '+237699999999', 'USER', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200', 'Cherche un terrain à Garoua pour construire une maison.')
       ON CONFLICT (email) DO UPDATE SET profile_photo_url = EXCLUDED.profile_photo_url, bio = EXCLUDED.bio
       RETURNING id`,
      [userPass]
    );

    const adminId = admin.rows[0].id;
    const agentId = agent.rows[0].id;
    const agent2Id = agent2.rows[0].id;
    const userId = user.rows[0].id;
    const aishaId = newUser1.rows[0].id;
    const briceId = newUser2.rows[0].id;
    const mireilleId = newUser3.rows[0].id;
    const jeanpaulId = newUser4.rows[0].id;
    const sandrineId = newUser5.rows[0].id;
    const wilfriedId = newUser6.rows[0].id;

    // --- Biens + Annonces avec photos variées ---
    const biens = [
      { owner: agentId, type: 'maison', area: 180, bedrooms: 4, bathrooms: 2, address: 'Bonapriso', district: 'Bonapriso', city: 'Douala', lat: 4.0511, lon: 9.7678, title: 'Villa moderne à Bonapriso', price: 75000, desc: 'Villa spacieuse avec jardin clos.', photos: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800'] },
      { owner: agentId, type: 'appartement', area: 90, bedrooms: 3, bathrooms: 2, address: 'Bastos', district: 'Bastos', city: 'Yaoundé', lat: 3.8896, lon: 11.5286, title: 'Appartement 3 chambres à Bastos', price: 250000, desc: 'Appartement lumineux proche ambassades.', photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800'] },
      { owner: agent2Id, type: 'studio', area: 35, bedrooms: 1, bathrooms: 1, address: 'Ngoa-Ekellé', district: 'Ngoa-Ekellé', city: 'Yaoundé', lat: 3.8634, lon: 11.5031, title: 'Studio meublé Ngoa-Ekellé', price: 80000, desc: 'Studio idéal pour étudiant, proche université.', photos: ['https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800'] },
      { owner: agent2Id, type: 'maison', area: 220, bedrooms: 5, bathrooms: 3, address: 'Bonas', district: 'Bonas', city: 'Yaoundé', lat: 3.8721, lon: 11.5170, title: 'Maison à Bonas 5 chambres', price: 350000, desc: 'Grande maison familiale à Bonas.', photos: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'] },
      { owner: agentId, type: 'terrain', area: 600, bedrooms: null, bathrooms: null, address: 'Mfou', district: 'Mfou', city: 'Mfou', lat: 3.7611, lon: 11.8264, title: 'Terrain 600 m² à Mfou', price: 12000000, desc: 'Terrain titré, idéal pour construction.', photos: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'] },
      { owner: agent2Id, type: 'appartement', area: 70, bedrooms: 2, bathrooms: 1, address: 'Akwa', district: 'Akwa', city: 'Douala', lat: 4.0565, lon: 9.7009, title: 'Appartement 2 chambres Akwa', price: 150000, desc: 'Appartement rénové en plein centre.', photos: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'] },
      { owner: agentId, type: 'villa', area: 320, bedrooms: 6, bathrooms: 4, address: 'Bonanjo', district: 'Bonanjo', city: 'Douala', lat: 4.0463, lon: 9.6957, title: 'Villa de luxe à Bonanjo', price: 850000, desc: 'Villa haut standing avec piscine.', photos: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'] },
      { owner: agent2Id, type: 'chambre', area: 20, bedrooms: 1, bathrooms: 1, address: 'Mvan', district: 'Mvan', city: 'Yaoundé', lat: 3.8339, lon: 11.5333, title: 'Chambre moderne à Mvan', price: 45000, desc: 'Chambre indépendante avec douche.', photos: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800'] },
      // Nouveaux biens des nouveaux agents
      { owner: aishaId, type: 'maison', area: 150, bedrooms: 3, bathrooms: 2, address: 'Bonapriso', district: 'Bonapriso', city: 'Douala', lat: 4.05, lon: 9.77, title: 'Maison moderne Bonapriso', price: 200000, desc: 'Maison moderne avec jardin et garage.', photos: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800'] },
      { owner: aishaId, type: 'appartement', area: 85, bedrooms: 2, bathrooms: 1, address: 'Akwa', district: 'Akwa', city: 'Douala', lat: 4.057, lon: 9.701, title: 'Appartement standing Akwa', price: 180000, desc: 'Bel appartement avec vue sur la ville.', photos: ['https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'] },
      { owner: sandrineId, type: 'maison', area: 200, bedrooms: 4, bathrooms: 2, address: 'Famla', district: 'Famla', city: 'Bafoussam', lat: 5.4777, lon: 10.4178, title: 'Maison familiale Bafoussam', price: 120000, desc: 'Grande maison familiale à Bafoussam.', photos: ['https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'] },
      { owner: sandrineId, type: 'villa', area: 280, bedrooms: 5, bathrooms: 3, address: 'Djeleng', district: 'Djeleng', city: 'Bafoussam', lat: 5.45, lon: 10.42, title: 'Villa avec piscine Bafoussam', price: 400000, desc: 'Villa moderne avec piscine à Djeleng.', photos: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'] },
    ];

    const adIds = [];
    for (const b of biens) {
      const propRes = await pool.query(
        `INSERT INTO properties (owner_id, property_type, area, bedrooms, bathrooms, address, district, city, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [b.owner, b.type, b.area, b.bedrooms, b.bathrooms, b.address, b.district, b.city, b.lat, b.lon]
      );
      const propId = propRes.rows[0].id;
      const adRes = await pool.query(
        `INSERT INTO ads (owner_id, property_id, title, description, price, status, view_count)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6)
         RETURNING id`,
        [b.owner, propId, b.title, b.desc, b.price, Math.floor(Math.random() * 50)]
      );
      const adId = adRes.rows[0].id;
      adIds.push(adId);

      // Photos variées
      if (b.photos) {
        for (let i = 0; i < b.photos.length; i++) {
          await pool.query(
            `INSERT INTO photos (property_id, url, display_order) VALUES ($1, $2, $3)`,
            [propId, b.photos[i], i]
          );
        }
      }
    }

    // --- Critères de recherche de l'utilisateur ---
    await pool.query(
      `INSERT INTO search_criteria (user_id, property_type, city, district, price_max, bedrooms_min)
       VALUES ($1, 'maison', 'Yaoundé', 'Bastos', 300000, 3)
       ON CONFLICT DO NOTHING`,
      [userId]
    );

    // --- Favoris ---
    if (adIds.length >= 4) {
      await pool.query(`INSERT INTO favorites (user_id, ad_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [userId, adIds[0]]);
      await pool.query(`INSERT INTO favorites (user_id, ad_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [userId, adIds[1]]);
      await pool.query(`INSERT INTO favorites (user_id, ad_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [userId, adIds[6]]);
      await pool.query(`INSERT INTO favorites (user_id, ad_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [briceId, adIds[1]]);
      await pool.query(`INSERT INTO favorites (user_id, ad_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [briceId, adIds[5]]);
      await pool.query(`INSERT INTO favorites (user_id, ad_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [mireilleId, adIds[2]]);
      await pool.query(`INSERT INTO favorites (user_id, ad_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [jeanpaulId, adIds[4]]);
      await pool.query(`INSERT INTO favorites (user_id, ad_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [jeanpaulId, adIds[6]]);
      await pool.query(`INSERT INTO favorites (user_id, ad_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [wilfriedId, adIds[4]]);
    }

    // --- Conversations + Messages ---
    // Helper pour créer une conversation entre deux users
    async function createConversation(userA, userB) {
      const [a, b] = userA < userB ? [userA, userB] : [userB, userA];
      // Vérifie si la conversation existe déjà
      const existing = await pool.query(
        'SELECT id FROM conversations WHERE user_a_id = $1 AND user_b_id = $2',
        [a, b]
      );
      if (existing.rows.length > 0) return existing.rows[0].id;
      const res = await pool.query(
        'INSERT INTO conversations (user_a_id, user_b_id, last_message_at) VALUES ($1, $2, NOW()) RETURNING id',
        [a, b]
      );
      return res.rows[0].id;
    }

    async function addMessage(convId, senderId, content, opts = {}) {
      await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, content, attachment_url, attachment_type, attachment_name, is_read, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          convId, senderId, content,
          opts.attachment_url || null,
          opts.attachment_type || null,
          opts.attachment_name || null,
          opts.is_read !== false,
          opts.sent_at || new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        ]
      );
    }

    // Conversation 1: user <-> agent (Kamga Paul) - discussion villa Bonapriso
    const conv1 = await createConversation(userId, agentId);
    await addMessage(conv1, userId, 'Bonjour, je suis intéressé par la villa à Bonapriso. Est-elle encore disponible ?');
    await addMessage(conv1, agentId, 'Bonjour ! Oui, elle est toujours disponible. C\'est une villa de 180m² avec 4 chambres et 2 douches.');
    await addMessage(conv1, userId, 'Parfait. Est-il possible de visiter cette semaine ?');
    await addMessage(conv1, agentId, 'Bien sûr ! Je peux vous proposer une visite jeudi à 14h. Voici le plan de la villa :', { attachment_url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', attachment_type: 'image', attachment_name: 'plan_villa_bonapriso.jpg' });
    await addMessage(conv1, userId, 'Merci ! Je serai là jeudi à 14h.');
    await addMessage(conv1, agentId, 'Excellent ! Voici le contrat de bail pour votre lecture :', { attachment_url: 'https://example.com/docs/contrat_bail_2026.pdf', attachment_type: 'pdf', attachment_name: 'Contrat_bail_2026.pdf' });
    await addMessage(conv1, userId, 'Bien reçu, je vais le lire attentivement.');

    // Conversation 2: user <-> agent2 (Ndongo Marie) - discussion studio Ngoa-Ekellé
    const conv2 = await createConversation(userId, agent2Id);
    await addMessage(conv2, userId, 'Bonjour Marie, le studio de Ngoa-Ekellé est-il meublé ?');
    await addMessage(conv2, agent2Id, 'Bonjour ! Oui, le studio est entièrement meublé : lit, armoire, bureau, cuisine équipée.');
    await addMessage(conv2, userId, 'Quel est le loyer mensuel exact ?');
    await addMessage(conv2, agent2Id, 'Le loyer est de 80 000 FCFA par mois, charges d\'eau incluses.');
    await addMessage(conv2, agent2Id, 'Voici quelques photos supplémentaires du studio :', { attachment_url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800', attachment_type: 'image', attachment_name: 'studio_photo3.jpg' });
    await addMessage(conv2, userId, 'C\'est parfait pour moi. Je souhaite le visiter.');

    // Conversation 3: user <-> aisha - discussion maison Bonapriso
    const conv3 = await createConversation(userId, aishaId);
    await addMessage(conv3, userId, 'Bonjour Aisha, j\'ai vu votre annonce pour la maison moderne à Bonapriso.');
    await addMessage(conv3, aishaId, 'Bonjour ! Oui, c\'est une belle maison de 150m² avec 3 chambres, jardin et garage.');
    await addMessage(conv3, userId, 'Le prix de 200 000 FCFA est-il négociable ?');
    await addMessage(conv3, aishaId, 'On peut discuter d\'une éventuelle négociation lors de la visite. Voici les photos :', { attachment_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', attachment_type: 'image', attachment_name: 'maison_bonapriso.jpg' });
    await addMessage(conv3, userId, 'Très bien, je vous contacte pour fixer une visite.');

    // Conversation 4: brice <-> agent - discussion appartement Bastos
    const conv4 = await createConversation(briceId, agentId);
    await addMessage(conv4, briceId, 'Bonjour, l\'appartement 3 chambres à Bastos m\'intéresse beaucoup.');
    await addMessage(conv4, agentId, 'Bonjour Brice ! L\'appartement est lumineux et proche des ambassades. 250 000 FCFA/mois.');
    await addMessage(conv4, briceId, 'Y a-t-il un parking ?');
    await addMessage(conv4, agentId, 'Oui, un parking sécurisé est inclus. Voici la documentation :', { attachment_url: 'https://example.com/docs/fiche_appartement_bastos.pdf', attachment_type: 'pdf', attachment_name: 'Fiche_appartement_Bastos.pdf' });
    await addMessage(conv4, briceId, 'Parfait, merci pour l\'info !');

    // Conversation 5: brice <-> aisha - discussion appartement Akwa
    const conv5 = await createConversation(briceId, aishaId);
    await addMessage(conv5, briceId, 'Bonjour, l\'appartement standing à Akwa est-il disponible ?');
    await addMessage(conv5, aishaId, 'Bonjour ! Oui, il est disponible. 180 000 FCFA/mois avec vue sur la ville.');
    await addMessage(conv5, aishaId, 'Voici une photo de la vue :', { attachment_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', attachment_type: 'image', attachment_name: 'vue_akwa.jpg' });
    await addMessage(conv5, briceId, 'Magnifique vue ! Je veux le visiter ce weekend.');

    // Conversation 6: mireille <-> agent2 - discussion studio Ngoa-Ekellé
    const conv6 = await createConversation(mireilleId, agent2Id);
    await addMessage(conv6, mireilleId, 'Bonjour, je suis étudiante et le studio de Ngoa-Ekellé m\'intéresse.');
    await addMessage(conv6, agent2Id, 'Bonjour Mireille ! C\'est un studio idéal pour les étudiants, proche de l\'université.');
    await addMessage(conv6, mireilleId, 'Y a-t-il un accès internet ?');
    await addMessage(conv6, agent2Id, 'Oui, la fibre optique est installée. Voici le contrat :', { attachment_url: 'https://example.com/docs/contrat_studio.pdf', attachment_type: 'pdf', attachment_name: 'Contrat_studio.pdf' });
    await addMessage(conv6, mireilleId, 'Merci ! Je vais en discuter avec mes parents.');

    // Conversation 7: jeanpaul <-> agent - discussion terrain Mfou
    const conv7 = await createConversation(jeanpaulId, agentId);
    await addMessage(conv7, jeanpaulId, 'Bonjour, le terrain de 600m² à Mfou a-t-il un titre foncier ?');
    await addMessage(conv7, agentId, 'Bonjour Jean-Paul ! Oui, le terrain est titré. 12 000 000 FCFA.');
    await addMessage(conv7, jeanpaulId, 'Parfait pour un investissement. Voici mon dossier :', { attachment_url: 'https://example.com/docs/dossier_investisseur.pdf', attachment_type: 'pdf', attachment_name: 'Dossier_investisseur.pdf' });
    await addMessage(conv7, agentId, 'Très bien, je vais examiner votre dossier.');

    // Conversation 8: jeanpaul <-> aisha - discussion villa Bonanjo
    const conv8 = await createConversation(jeanpaulId, aishaId);
    await addMessage(conv8, jeanpaulId, 'La villa de luxe à Bonanjo avec piscine m\'intéresse.');
    await addMessage(conv8, aishaId, 'Excellent choix ! 850 000 FCFA/mois, 320m² avec 6 chambres et 4 douches.');
    await addMessage(conv8, jeanpaulId, 'Pouvez-vous m\'envoyer plus de photos ?');
    await addMessage(conv8, aishaId, 'Bien sûr, voici les photos de la piscine :', { attachment_url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800', attachment_type: 'image', attachment_name: 'villa_bonanjo_piscine.jpg' });
    await addMessage(conv8, jeanpaulId, 'Magnifique ! Je veux organiser une visite.');

    // Conversation 9: wilfried <-> sandrine - discussion maison Bafoussam
    const conv9 = await createConversation(wilfriedId, sandrineId);
    await addMessage(conv9, wilfriedId, 'Bonjour, la maison familiale à Bafoussam est-elle disponible ?');
    await addMessage(conv9, sandrineId, 'Bonjour ! Oui, 200m² avec 4 chambres à 120 000 FCFA/mois.');
    await addMessage(conv9, wilfriedId, 'Y a-t-il un jardin ?');
    await addMessage(conv9, sandrineId, 'Oui, un grand jardin. Voici une photo :', { attachment_url: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800', attachment_type: 'image', attachment_name: 'jardin_bafoussam.jpg' });
    await addMessage(conv9, wilfriedId, 'Parfait pour ma famille !');

    // Conversation 10: wilfried <-> agent - discussion terrain Mfou
    const conv10 = await createConversation(wilfriedId, agentId);
    await addMessage(conv10, wilfriedId, 'Bonjour, je cherche un terrain à Garoua, avez-vous quelque chose ?');
    await addMessage(conv10, agentId, 'Bonjour Wilfried ! Pour l\'instant nous avons le terrain à Mfou. Pour Garoua, nous recherchons.');
    await addMessage(conv10, wilfriedId, 'D\'accord, tenez-moi informé. Voici mes critères :', { attachment_url: 'https://example.com/docs/criteres_terrain.pdf', attachment_type: 'pdf', attachment_name: 'Mes_criteres.pdf' });
    await addMessage(conv10, agentId, 'Bien noté, je vous contacterai dès qu\'un terrain correspond.');

    // Conversation 11: mireille <-> aisha - discussion appartement
    const conv11 = await createConversation(mireilleId, aishaId);
    await addMessage(conv11, mireilleId, 'Bonjour, l\'appartement standing à Akwa accepte-t-il les étudiants ?');
    await addMessage(conv11, aishaId, 'Bonjour ! Oui, sous conditions de garant. 180 000 FCFA/mois.');
    await addMessage(conv11, mireilleId, 'C\'est un peu cher pour moi, mais je vais réfléchir.');

    // Conversation 12: brice <-> sandrine - discussion villa Bafoussam
    const conv12 = await createConversation(briceId, sandrineId);
    await addMessage(conv12, briceId, 'Bonjour, la villa avec piscine à Bafoussam est magnifique !');
    await addMessage(conv12, sandrineId, 'Merci ! 400 000 FCFA/mois, 280m² avec 5 chambres et piscine.');
    await addMessage(conv12, sandrineId, 'Voici le dossier complet :', { attachment_url: 'https://example.com/docs/villa_bafoussam.pdf', attachment_type: 'pdf', attachment_name: 'Dossier_villa.pdf' });
    await addMessage(conv12, briceId, 'Merci, je vais l\'étudier.');

    // --- Notifications ---
    const notifs = [
      { recipient: userId, type: 'NOUVEAU_MESSAGE', content: 'Kamga Paul vous a envoyé un message concernant la villa à Bonapriso.', read: false },
      { recipient: userId, type: 'NOUVEAU_MESSAGE', content: 'Ndongo Marie a répondu à votre question sur le studio.', read: false },
      { recipient: userId, type: 'NOUVEAU_MESSAGE', content: 'Aisha Toumba a partagé des photos de la maison.', read: false },
      { recipient: userId, type: 'NOUVELLE_ANNONCE', content: 'Nouvelle annonce : Maison moderne à Bonapriso correspond à vos critères.', read: false },
      { recipient: userId, type: 'NOUVEAU_CONTACT', content: 'Votre demande de contact pour la villa de Bonanjo a été acceptée.', read: true },
      { recipient: userId, type: 'NOUVELLE_ANNONCE', content: 'Nouveau terrain disponible à Mfou, 600m².', read: true },
      { recipient: briceId, type: 'NOUVEAU_MESSAGE', content: 'Kamga Paul a répondu à votre message.', read: false },
      { recipient: briceId, type: 'NOUVEAU_MESSAGE', content: 'Aisha Toumba a partagé une photo.', read: false },
      { recipient: briceId, type: 'NOUVELLE_ANNONCE', content: 'Nouvel appartement 3 chambres à Bastos.', read: true },
      { recipient: mireilleId, type: 'NOUVEAU_MESSAGE', content: 'Ndongo Marie a partagé un document.', read: false },
      { recipient: mireilleId, type: 'NOUVEAU_MESSAGE', content: 'Aisha Toumba a répondu.', read: true },
      { recipient: jeanpaulId, type: 'NOUVEAU_MESSAGE', content: 'Kamga Paul examine votre dossier.', read: false },
      { recipient: jeanpaulId, type: 'NOUVEAU_MESSAGE', content: 'Aisha Toumba a partagé des photos.', read: false },
      { recipient: jeanpaulId, type: 'NOUVELLE_ANNONCE', content: 'Villa de luxe disponible à Bonanjo.', read: true },
      { recipient: wilfriedId, type: 'NOUVEAU_MESSAGE', content: 'Sandrine Foka a partagé une photo.', read: false },
      { recipient: wilfriedId, type: 'NOUVEAU_MESSAGE', content: 'Kamga Paul a bien noté vos critères.', read: true },
      { recipient: agentId, type: 'NOUVEAU_CONTACT', content: 'Nouveau contact de Fredy Atangana pour la villa de Bonapriso.', read: true },
      { recipient: agentId, type: 'NOUVEAU_CONTACT', content: 'Brice Ekane interested par l\'appartement de Bastos.', read: true },
      { recipient: agent2Id, type: 'NOUVEAU_CONTACT', content: 'Mireille Nkomo intéressée par le studio.', read: true },
      { recipient: aishaId, type: 'NOUVEAU_CONTACT', content: 'Jean-Paul Biya interested par la villa de Bonanjo.', read: false },
      { recipient: sandrineId, type: 'NOUVEAU_CONTACT', content: 'Wilfried Kamga interested par la maison de Bafoussam.', read: false },
    ];

    for (const n of notifs) {
      await pool.query(
        `INSERT INTO notifications (recipient_id, type, content, is_read) VALUES ($1, $2, $3, $4)`,
        [n.recipient, n.type, n.content, n.read]
      );
    }

    // --- Transactions pour l'estimation de prix ---
    const transactions = [
      { type: 'maison', area: 180, beds: 4, baths: 2, city: 'Douala', district: 'Bonapriso', lat: 4.0511, lon: 9.7678, price: 75000 },
      { type: 'maison', area: 200, beds: 4, baths: 3, city: 'Douala', district: 'Bonapriso', lat: 4.05, lon: 9.76, price: 80000 },
      { type: 'appartement', area: 90, beds: 3, baths: 2, city: 'Yaoundé', district: 'Bastos', lat: 3.88, lon: 11.52, price: 250000 },
      { type: 'appartement', area: 100, beds: 3, baths: 2, city: 'Yaoundé', district: 'Bastos', lat: 3.89, lon: 11.53, price: 280000 },
      { type: 'studio', area: 35, beds: 1, baths: 1, city: 'Yaoundé', district: 'Ngoa-Ekellé', lat: 3.86, lon: 11.50, price: 80000 },
      { type: 'maison', area: 220, beds: 5, baths: 3, city: 'Yaoundé', district: 'Bonas', lat: 3.87, lon: 11.51, price: 350000 },
      { type: 'appartement', area: 70, beds: 2, baths: 1, city: 'Douala', district: 'Akwa', lat: 4.05, lon: 9.70, price: 150000 },
      { type: 'villa', area: 320, beds: 6, baths: 4, city: 'Douala', district: 'Bonanjo', lat: 4.04, lon: 9.69, price: 850000 },
      { type: 'chambre', area: 20, beds: 1, baths: 1, city: 'Yaoundé', district: 'Mvan', lat: 3.83, lon: 11.53, price: 45000 },
      { type: 'terrain', area: 600, beds: null, baths: null, city: 'Mfou', district: 'Mfou', lat: 3.76, lon: 11.82, price: 12000000 },
      { type: 'maison', area: 150, beds: 3, baths: 2, city: 'Douala', district: 'Bonapriso', lat: 4.05, lon: 9.77, price: 200000 },
      { type: 'villa', area: 280, beds: 5, baths: 3, city: 'Bafoussam', district: 'Djeleng', lat: 5.45, lon: 10.42, price: 400000 },
    ];
    for (const t of transactions) {
      await pool.query(
        `INSERT INTO transactions (property_type, area, bedrooms, bathrooms, city, district, latitude, longitude, price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [t.type, t.area, t.beds, t.baths, t.city, t.district, t.lat, t.lon, t.price]
      );
    }

    console.log('[DB] Données de démonstration insérées avec succès.');
    console.log('[DB] Comptes de test :');
    console.log('  Admin  : admin@immo.cm / admin123');
    console.log('  Agent  : agent@immo.cm / agent123');
    console.log('  Agent2 : ndongo@immo.cm / agent123');
    console.log('  User   : user@immo.cm / user123');
    console.log('  Aisha  : aisha.toumba@immo.cm / agent123');
    console.log('  Brice  : brice.ekane@immo.cm / user123');
    console.log('  Mireille: mireille.nkomo@immo.cm / user123');
    console.log('  Jean-Paul: jeanpaul.biya@immo.cm / user123');
    console.log('  Sandrine: sandrine.foka@immo.cm / agent123');
    console.log('  Wilfried: wilfried.kamga@immo.cm / user123');
  } catch (err) {
    console.error('[DB] Erreur lors du peuplement:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
