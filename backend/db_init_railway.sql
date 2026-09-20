-- =====================================================
-- NestFind - Initialisation complète de la base PostgreSQL
-- À coller dans la console Railway PostgreSQL
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
  role            VARCHAR(20) NOT NULL DEFAULT 'USER',
  status          VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
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
  property_type VARCHAR(50) NOT NULL,
  area          NUMERIC(10, 2),
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
  status       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
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
  type         VARCHAR(50) NOT NULL,
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
  attachment_type VARCHAR(50),
  attachment_name VARCHAR(255),
  is_read         BOOLEAN NOT NULL DEFAULT false,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, sent_at);

-- --- Interactions ---
CREATE TABLE IF NOT EXISTS interactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_id      UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  type       VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, ad_id, type)
);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);

-- --- Transactions ---
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

-- =====================================================
-- DONNÉES DE DÉMONSTRATION
-- =====================================================

-- Utilisateurs avec UUID fixes
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@immo.cm', '$2a$10$xGafn3cG..k6fphcT3Z3zeUnJhxp2c3vpU1bUV7IcIKszOgXe7F2m', 'Admin', 'Système', '+237690000000', 'ADMIN', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', 'Administrateur de la plateforme NestFind.')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio, active_ads_count, total_views, total_contacts) VALUES
('22222222-2222-2222-2222-222222222222', 'agent@immo.cm', '$2a$10$PN8Hae.UwMROY8tKIMy53Ookka.69JafHqQe9eOSuCfrsrZCC8Wgi', 'Kamga', 'Paul', '+237691111111', 'AGENT', 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=200', 'Agent immobilier à Douala, spécialiste villas et appartements haut standing.', 4, 320, 45)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio, active_ads_count, total_views, total_contacts) VALUES
('33333333-3333-3333-3333-333333333333', 'ndongo@immo.cm', '$2a$10$PN8Hae.UwMROY8tKIMy53Ookka.69JafHqQe9eOSuCfrsrZCC8Wgi', 'Ndongo', 'Marie', '+237692222222', 'AGENT', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200', 'Agente immobilière à Yaoundé, spécialiste studios et chambres pour étudiants.', 4, 180, 28)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, preferred_types, preferred_zones, budget_max, profile_photo_url, bio) VALUES
('44444444-4444-4444-4444-444444444444', 'user@immo.cm', '$2a$10$VTLrwrrNRNoxD.2KAvSrXe2a01yPmdw6htP1vF0eehARhsfQS0kpO', 'Atangana', 'Fredy', '+237693333333', 'USER', ARRAY['maison','appartement'], ARRAY['Yaoundé','Bastos'], 150000, 'https://images.unsplash.com/photo-1633332755192-780a8822f9e4?w=200', 'À la recherche d''une maison à Yaoundé pour ma famille.')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio, active_ads_count, total_views, total_contacts) VALUES
('55555555-5555-5555-5555-555555555555', 'aisha.toumba@immo.cm', '$2a$10$PN8Hae.UwMROY8tKIMy53Ookka.69JafHqQe9eOSuCfrsrZCC8Wgi', 'Aisha', 'Toumba', '+237694444444', 'AGENT', 'https://images.unsplash.com/photo-1531259683007-016a7b628fc2?w=200', 'Agente immobilière à Douala, passionnée par l''immobilier moderne.', 3, 250, 30)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio) VALUES
('66666666-6666-6666-6666-666666666666', 'brice.ekane@immo.cm', '$2a$10$VTLrwrrNRNoxD.2KAvSrXe2a01yPmdw6htP1vF0eehARhsfQS0kpO', 'Brice', 'Ekane', '+237695555555', 'USER', 'https://images.unsplash.com/photo-1507591064344-4c6ce003b128?w=200', 'Jeune professionnel cherchant un appartement à Yaoundé.')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio) VALUES
('77777777-7777-7777-7777-777777777777', 'mireille.nkomo@immo.cm', '$2a$10$VTLrwrrNRNoxD.2KAvSrXe2a01yPmdw6htP1vF0eehARhsfQS0kpO', 'Mireille', 'Nkomo', '+237696666666', 'USER', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200', 'Étudiante en recherche d''un studio à Ngoa-Ekellé.')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio) VALUES
('88888888-8888-8888-8888-888888888888', 'jeanpaul.biya@immo.cm', '$2a$10$VTLrwrrNRNoxD.2KAvSrXe2a01yPmdw6htP1vF0eehARhsfQS0kpO', 'Jean-Paul', 'Biya Jr', '+237697777777', 'USER', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200', 'Investisseur immobilier, cherche des terrains et villas à Douala.')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio, active_ads_count, total_views, total_contacts) VALUES
('99999999-9999-9999-9999-999999999999', 'sandrine.foka@immo.cm', '$2a$10$PN8Hae.UwMROY8tKIMy53Ookka.69JafHqQe9eOSuCfrsrZCC8Wgi', 'Sandrine', 'Foka', '+237698888888', 'AGENT', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200', 'Agente immobilière à Bafoussam, spécialiste maisons familiales.', 2, 120, 15)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'wilfried.kamga@immo.cm', '$2a$10$VTLrwrrNRNoxD.2KAvSrXe2a01yPmdw6htP1vF0eehARhsfQS0kpO', 'Wilfried', 'Kamga', '+237699999999', 'USER', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200', 'Cherche un terrain à Garoua pour construire une maison.')
ON CONFLICT (email) DO NOTHING;

-- Propriétés et annonces avec UUID fixes
INSERT INTO properties (id, owner_id, property_type, area, bedrooms, bathrooms, address, district, city, latitude, longitude) VALUES
('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'maison', 180, 4, 2, 'Bonapriso', 'Bonapriso', 'Douala', 4.0511, 9.7678),
('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'appartement', 90, 3, 2, 'Bastos', 'Bastos', 'Yaoundé', 3.8896, 11.5286),
('b3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'studio', 35, 1, 1, 'Ngoa-Ekellé', 'Ngoa-Ekellé', 'Yaoundé', 3.8634, 11.5031),
('b4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'maison', 220, 5, 3, 'Bonas', 'Bonas', 'Yaoundé', 3.8721, 11.5170),
('b5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'terrain', 600, NULL, NULL, 'Mfou', 'Mfou', 'Mfou', 3.7611, 11.8264),
('b6666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'appartement', 70, 2, 1, 'Akwa', 'Akwa', 'Douala', 4.0565, 9.7009),
('b7777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'villa', 320, 6, 4, 'Bonanjo', 'Bonanjo', 'Douala', 4.0463, 9.6957),
('b8888888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', 'chambre', 20, 1, 1, 'Mvan', 'Mvan', 'Yaoundé', 3.8339, 11.5333),
('b9999999-9999-9999-9999-999999999999', '55555555-5555-5555-5555-555555555555', 'maison', 150, 3, 2, 'Bonapriso', 'Bonapriso', 'Douala', 4.05, 9.77),
('baaaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'appartement', 85, 2, 1, 'Akwa', 'Akwa', 'Douala', 4.057, 9.701),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999999', 'maison', 200, 4, 2, 'Famla', 'Famla', 'Bafoussam', 5.4777, 10.4178),
('bccccccc-cccc-cccc-cccc-cccccccccccc', '99999999-9999-9999-9999-999999999999', 'villa', 280, 5, 3, 'Djeleng', 'Djeleng', 'Bafoussam', 5.45, 10.42);

INSERT INTO ads (id, owner_id, property_id, title, description, price, status, view_count) VALUES
('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Villa moderne à Bonapriso', 'Villa spacieuse avec jardin clos.', 75000, 'ACTIVE', 35),
('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Appartement 3 chambres à Bastos', 'Appartement lumineux proche ambassades.', 250000, 'ACTIVE', 28),
('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'Studio meublé Ngoa-Ekellé', 'Studio idéal pour étudiant, proche université.', 80000, 'ACTIVE', 15),
('a4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'b4444444-4444-4444-4444-444444444444', 'Maison à Bonas 5 chambres', 'Grande maison familiale à Bonas.', 350000, 'ACTIVE', 42),
('a5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'b5555555-5555-5555-5555-555555555555', 'Terrain 600 m² à Mfou', 'Terrain titré, idéal pour construction.', 12000000, 'ACTIVE', 8),
('a6666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'b6666666-6666-6666-6666-666666666666', 'Appartement 2 chambres Akwa', 'Appartement rénové en plein centre.', 150000, 'ACTIVE', 20),
('a7777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'b7777777-7777-7777-7777-777777777777', 'Villa de luxe à Bonanjo', 'Villa haut standing avec piscine.', 850000, 'ACTIVE', 50),
('a8888888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', 'b8888888-8888-8888-8888-888888888888', 'Chambre moderne à Mvan', 'Chambre indépendante avec douche.', 45000, 'ACTIVE', 12),
('a9999999-9999-9999-9999-999999999999', '55555555-5555-5555-5555-555555555555', 'b9999999-9999-9999-9999-999999999999', 'Maison moderne Bonapriso', 'Maison moderne avec jardin et garage.', 200000, 'ACTIVE', 25),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'baaaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Appartement standing Akwa', 'Bel appartement avec vue sur la ville.', 180000, 'ACTIVE', 18),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Maison familiale Bafoussam', 'Grande maison familiale à Bafoussam.', 120000, 'ACTIVE', 10),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '99999999-9999-9999-9999-999999999999', 'bccccccc-cccc-cccc-cccc-cccccccccccc', 'Villa avec piscine Bafoussam', 'Villa moderne avec piscine à Djeleng.', 400000, 'ACTIVE', 30);

-- Photos
INSERT INTO photos (property_id, url, display_order) VALUES
('b1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 0),
('b1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', 1),
('b1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800', 2),
('b2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 0),
('b2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', 1),
('b2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800', 2),
('b3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800', 0),
('b3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800', 1),
('b4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', 0),
('b4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800', 1),
('b4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', 2),
('b5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', 0),
('b5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', 1),
('b6666666-6666-6666-6666-666666666666', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', 0),
('b6666666-6666-6666-6666-666666666666', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', 1),
('b7777777-7777-7777-7777-777777777777', 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800', 0),
('b7777777-7777-7777-7777-777777777777', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 1),
('b7777777-7777-7777-7777-777777777777', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 2),
('b8888888-8888-8888-8888-888888888888', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 0),
('b8888888-8888-8888-8888-888888888888', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800', 1),
('b9999999-9999-9999-9999-999999999999', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 0),
('b9999999-9999-9999-9999-999999999999', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', 1),
('baaaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800', 0),
('baaaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', 1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800', 0),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 1),
('bccccccc-cccc-cccc-cccc-cccccccccccc', 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800', 0),
('bccccccc-cccc-cccc-cccc-cccccccccccc', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 1);

-- Favoris
INSERT INTO favorites (user_id, ad_id) VALUES
('44444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111'),
('44444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222'),
('44444444-4444-4444-4444-444444444444', 'a7777777-7777-7777-7777-777777777777'),
('66666666-6666-6666-6666-666666666666', 'a2222222-2222-2222-2222-222222222222'),
('66666666-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666'),
('77777777-7777-7777-7777-777777777777', 'a3333333-3333-3333-3333-333333333333'),
('88888888-8888-8888-8888-888888888888', 'a5555555-5555-5555-5555-555555555555'),
('88888888-8888-8888-8888-888888888888', 'a7777777-7777-7777-7777-777777777777'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a5555555-5555-5555-5555-555555555555')
ON CONFLICT DO NOTHING;

-- Critère de recherche
INSERT INTO search_criteria (user_id, property_type, city, district, price_max, bedrooms_min) VALUES
('44444444-4444-4444-4444-444444444444', 'maison', 'Yaoundé', 'Bastos', 300000, 3)
ON CONFLICT DO NOTHING;
