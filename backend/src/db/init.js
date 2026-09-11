import { pool } from '../config/db.js';

/**
 * Script d'initialisation de la base de données.
 * Crée toutes les tables nécessaires au fonctionnement du backend.
 *
 * Usage : npm run db:init
 */
const SCHEMA_SQL = `
-- =====================================================
-- Schéma de la base de données immo_db
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- --- Utilisateurs ---
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  first_name      VARCHAR(100),
  last_name       VARCHAR(100),
  phone           VARCHAR(30),
  role            VARCHAR(20) NOT NULL DEFAULT 'USER', -- USER | AGENT | ADMIN
  status          VARCHAR(20) NOT NULL DEFAULT 'ACTIF', -- ACTIF | SUSPENDU | SUPPRIME
  budget_max      NUMERIC(14, 2) DEFAULT 0,
  preferred_types TEXT[] DEFAULT '{}',
  preferred_zones TEXT[] DEFAULT '{}',
  active_ads_count INT DEFAULT 0,
  total_views     INT DEFAULT 0,
  total_contacts  INT DEFAULT 0,
  profile_photo_url TEXT,
  bio             TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --- Biens immobiliers ---
CREATE TABLE IF NOT EXISTS properties (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_type VARCHAR(50) NOT NULL,        -- maison, appartement, studio, chambre, villa, terrain...
  area          NUMERIC(10, 2),              -- superficie en m²
  bedrooms      INT,
  bathrooms     INT,
  address       TEXT,
  district      VARCHAR(150),
  city          VARCHAR(150) NOT NULL,
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_properties_type_status ON properties(property_type, status);
CREATE INDEX IF NOT EXISTS idx_properties_lat_lon ON properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);

-- --- Photos ---
CREATE TABLE IF NOT EXISTS photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_photos_property ON photos(property_id);

-- --- Annonces ---
CREATE TABLE IF NOT EXISTS ads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  price        NUMERIC(14, 2) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | EN_ATTENTE | REJETEE | SUPPRIMEE
  view_count   INT DEFAULT 0,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_owner ON ads(owner_id);
CREATE INDEX IF NOT EXISTS idx_ads_price ON ads(price);

-- --- Favoris ---
CREATE TABLE IF NOT EXISTS favorites (
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_id     UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  added_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, ad_id)
);

-- --- Critères de recherche ---
CREATE TABLE IF NOT EXISTS search_criteria (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_type VARCHAR(50),
  city          VARCHAR(150),
  district      VARCHAR(150),
  price_min     NUMERIC(14, 2),
  price_max     NUMERIC(14, 2),
  bedrooms_min  INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_criteria_user ON search_criteria(user_id);

-- --- Notifications ---
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(50) NOT NULL,  -- NOUVELLE_ANNONCE | NOUVEAU_MESSAGE | NOUVEAU_CONTACT | ...
  content      TEXT NOT NULL,
  ad_id        UUID REFERENCES ads(id) ON DELETE SET NULL,
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_recipient_read ON notifications(recipient_id, is_read);

-- --- Conversations ---
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  UNIQUE (user_a_id, user_b_id),
  CHECK (user_a_id <> user_b_id)
);

-- --- Messages ---
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  attachment_url  TEXT,
  attachment_type VARCHAR(50), -- image | document | pdf
  attachment_name VARCHAR(255),
  is_read         BOOLEAN NOT NULL DEFAULT false,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, sent_at);

-- --- Interactions (vues / favoris) pour la recommandation ---
CREATE TABLE IF NOT EXISTS interactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_id      UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  type       VARCHAR(20) NOT NULL,  -- VIEW | FAVORITE
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, ad_id, type)
);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);

-- --- Transactions (échantillons pour l'estimation de prix) ---
CREATE TABLE IF NOT EXISTS transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_type VARCHAR(50) NOT NULL,
  area          NUMERIC(10, 2),
  bedrooms      INT,
  bathrooms     INT,
  city          VARCHAR(150),
  district      VARCHAR(150),
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  price         NUMERIC(14, 2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_type_city ON transactions(property_type, city);
`;

async function initDatabase() {
  console.log('[DB] Initialisation du schéma immo_db...');
  try {
    await pool.query(SCHEMA_SQL);
    console.log('[DB] Schéma créé avec succès.');
  } catch (err) {
    console.error('[DB] Erreur lors de l\'initialisation:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
