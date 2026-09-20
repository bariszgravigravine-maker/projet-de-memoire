-- =====================================================
-- NestFind - Initialisation complète de la base PostgreSQL
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

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

CREATE TABLE IF NOT EXISTS photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_photos_property ON photos(property_id);

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

CREATE TABLE IF NOT EXISTS favorites (
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_id     UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  added_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, ad_id)
);

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

CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  UNIQUE (user_a_id, user_b_id),
  CHECK (user_a_id <> user_b_id)
);

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

CREATE TABLE IF NOT EXISTS interactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_id      UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  type       VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, ad_id, type)
);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);

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

-- Users
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio) VALUES
('9b6320b7-9f31-49cb-be77-105513ac57fc', 'admin@immo.cm', '$2a$10$xGafn3cG..k6fphcT3Z3zeUnJhxp2c3vpU1bUV7IcIKszOgXe7F2m', 'Admin', 'Système', '+237690000000', 'ADMIN', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', 'Administrateur de la plateforme NestFind.')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio, active_ads_count, total_views, total_contacts) VALUES
('9f541222-233b-4278-b610-b1868e638575', 'agent@immo.cm', '$2a$10$PN8Hae.UwMROY8tKIMy53Ookka.69JafHqQe9eOSuCfrsrZCC8Wgi', 'Kamga', 'Paul', '+237691111111', 'AGENT', 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=200', 'Agent immobilier à Douala, spécialiste villas et appartements haut standing.', 4, 320, 45)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio, active_ads_count, total_views, total_contacts) VALUES
('5a7784c6-e81c-431a-b0ae-a4fb9a035491', 'ndongo@immo.cm', '$2a$10$PN8Hae.UwMROY8tKIMy53Ookka.69JafHqQe9eOSuCfrsrZCC8Wgi', 'Ndongo', 'Marie', '+237692222222', 'AGENT', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200', 'Agente immobilière à Yaoundé, spécialiste studios et chambres pour étudiants.', 4, 180, 28)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, preferred_types, preferred_zones, budget_max, profile_photo_url, bio) VALUES
('3ee5d2ff-9eec-4439-b49a-560b6a9f6543', 'user@immo.cm', '$2a$10$VTLrwrrNRNoxD.2KAvSrXe2a01yPmdw6htP1vF0eehARhsfQS0kpO', 'Atangana', 'Fredy', '+237693333333', 'USER', ARRAY['maison','appartement'], ARRAY['Yaoundé','Bastos'], 150000, 'https://images.unsplash.com/photo-1633332755192-780a8822f9e4?w=200', 'À la recherche d''une maison à Yaoundé pour ma famille.')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio, active_ads_count, total_views, total_contacts) VALUES
('ba56d39d-42b1-4965-ab02-7302643697ee', 'aisha.toumba@immo.cm', '$2a$10$PN8Hae.UwMROY8tKIMy53Ookka.69JafHqQe9eOSuCfrsrZCC8Wgi', 'Aisha', 'Toumba', '+237694444444', 'AGENT', 'https://images.unsplash.com/photo-1531259683007-016a7b628fc2?w=200', 'Agente immobilière à Douala, passionnée par l''immobilier moderne.', 3, 250, 30)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio) VALUES
('0beeef71-0820-4fb7-8c3d-4c859036c217', 'brice.ekane@immo.cm', '$2a$10$VTLrwrrNRNoxD.2KAvSrXe2a01yPmdw6htP1vF0eehARhsfQS0kpO', 'Brice', 'Ekane', '+237695555555', 'USER', 'https://images.unsplash.com/photo-1507591064344-4c6ce003b128?w=200', 'Jeune professionnel cherchant un appartement à Yaoundé.')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio) VALUES
('91390f11-d1ec-46d7-a7e6-db24197d6ae8', 'mireille.nkomo@immo.cm', '$2a$10$VTLrwrrNRNoxD.2KAvSrXe2a01yPmdw6htP1vF0eehARhsfQS0kpO', 'Mireille', 'Nkomo', '+237696666666', 'USER', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200', 'Étudiante en recherche d''un studio à Ngoa-Ekellé.')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio) VALUES
('77300973-1e75-4c13-a5d4-fd7ac400c4e1', 'jeanpaul.biya@immo.cm', '$2a$10$VTLrwrrNRNoxD.2KAvSrXe2a01yPmdw6htP1vF0eehARhsfQS0kpO', 'Jean-Paul', 'Biya Jr', '+237697777777', 'USER', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200', 'Investisseur immobilier, cherche des terrains et villas à Douala.')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio, active_ads_count, total_views, total_contacts) VALUES
('0c3fb459-e9bf-4a73-8c5a-c1aee1f5cc79', 'sandrine.foka@immo.cm', '$2a$10$PN8Hae.UwMROY8tKIMy53Ookka.69JafHqQe9eOSuCfrsrZCC8Wgi', 'Sandrine', 'Foka', '+237698888888', 'AGENT', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200', 'Agente immobilière à Bafoussam, spécialiste maisons familiales.', 2, 120, 15)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, profile_photo_url, bio) VALUES
('6838ce3e-442d-467c-9fff-ce8c8dade1fb', 'wilfried.kamga@immo.cm', '$2a$10$VTLrwrrNRNoxD.2KAvSrXe2a01yPmdw6htP1vF0eehARhsfQS0kpO', 'Wilfried', 'Kamga', '+237699999999', 'USER', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200', 'Cherche un terrain à Garoua pour construire une maison.')
ON CONFLICT (email) DO NOTHING;

-- Properties
INSERT INTO properties (id, owner_id, property_type, area, bedrooms, bathrooms, address, district, city, latitude, longitude) VALUES
('d5ca1948-9360-4c93-8df6-984452c4fae7', '9f541222-233b-4278-b610-b1868e638575', 'maison', 180, 4, 2, 'Bonapriso', 'Bonapriso', 'Douala', 4.0511, 9.7678),
('79fdb493-a3b9-4eca-802a-844b8cca6b7b', '9f541222-233b-4278-b610-b1868e638575', 'appartement', 90, 3, 2, 'Bastos', 'Bastos', 'Yaoundé', 3.8896, 11.5286),
('90300aff-652f-47ac-98db-fba7e606fb12', '5a7784c6-e81c-431a-b0ae-a4fb9a035491', 'studio', 35, 1, 1, 'Ngoa-Ekellé', 'Ngoa-Ekellé', 'Yaoundé', 3.8634, 11.5031),
('c2d783d7-d1cc-4b20-9f4f-a9b574eef392', '5a7784c6-e81c-431a-b0ae-a4fb9a035491', 'maison', 220, 5, 3, 'Bonas', 'Bonas', 'Yaoundé', 3.8721, 11.5170),
('be8bca59-c170-46ea-8934-54c4e3595235', '9f541222-233b-4278-b610-b1868e638575', 'terrain', 600, NULL, NULL, 'Mfou', 'Mfou', 'Mfou', 3.7611, 11.8264),
('10aeb378-c844-4eab-a695-2b0a3c34c403', '5a7784c6-e81c-431a-b0ae-a4fb9a035491', 'appartement', 70, 2, 1, 'Akwa', 'Akwa', 'Douala', 4.0565, 9.7009),
('02c24bea-8361-4b48-9bc3-f2ea9c7d4d95', '9f541222-233b-4278-b610-b1868e638575', 'villa', 320, 6, 4, 'Bonanjo', 'Bonanjo', 'Douala', 4.0463, 9.6957),
('7e7812cd-4e68-486a-92c6-b0fe12e78e65', '5a7784c6-e81c-431a-b0ae-a4fb9a035491', 'chambre', 20, 1, 1, 'Mvan', 'Mvan', 'Yaoundé', 3.8339, 11.5333),
('c4706edd-3e9e-46dd-8828-d1b36a2bdd1d', 'ba56d39d-42b1-4965-ab02-7302643697ee', 'maison', 150, 3, 2, 'Bonapriso', 'Bonapriso', 'Douala', 4.05, 9.77),
('bf35ca06-ae7f-4864-8929-f25f1a59659c', 'ba56d39d-42b1-4965-ab02-7302643697ee', 'appartement', 85, 2, 1, 'Akwa', 'Akwa', 'Douala', 4.057, 9.701),
('589d3e87-f8cf-42a7-93d8-38a15e6999a5', '0c3fb459-e9bf-4a73-8c5a-c1aee1f5cc79', 'maison', 200, 4, 2, 'Famla', 'Famla', 'Bafoussam', 5.4777, 10.4178),
('48b0efbc-367f-4bbd-9cce-cca4a5f35d4b', '0c3fb459-e9bf-4a73-8c5a-c1aee1f5cc79', 'villa', 280, 5, 3, 'Djeleng', 'Djeleng', 'Bafoussam', 5.45, 10.42);

-- Ads
INSERT INTO ads (id, owner_id, property_id, title, description, price, status, view_count) VALUES
('fd3e5f42-b973-4a6d-9333-e37479eca983', '9f541222-233b-4278-b610-b1868e638575', 'd5ca1948-9360-4c93-8df6-984452c4fae7', 'Villa moderne à Bonapriso', 'Villa spacieuse avec jardin clos.', 75000, 'ACTIVE', 35),
('aa15c836-8feb-48a5-98c0-b9e2e7d34d8f', '9f541222-233b-4278-b610-b1868e638575', '79fdb493-a3b9-4eca-802a-844b8cca6b7b', 'Appartement 3 chambres à Bastos', 'Appartement lumineux proche ambassades.', 250000, 'ACTIVE', 28),
('471c9a18-97a0-46f1-a09e-2ac4997dc813', '5a7784c6-e81c-431a-b0ae-a4fb9a035491', '90300aff-652f-47ac-98db-fba7e606fb12', 'Studio meublé Ngoa-Ekellé', 'Studio idéal pour étudiant, proche université.', 80000, 'ACTIVE', 15),
('8de25fcb-5e94-43f8-8a29-73bbc8d25350', '5a7784c6-e81c-431a-b0ae-a4fb9a035491', 'c2d783d7-d1cc-4b20-9f4f-a9b574eef392', 'Maison à Bonas 5 chambres', 'Grande maison familiale à Bonas.', 350000, 'ACTIVE', 42),
('4db821a7-76fe-4cad-8410-6cd55593bc09', '9f541222-233b-4278-b610-b1868e638575', 'be8bca59-c170-46ea-8934-54c4e3595235', 'Terrain 600 m² à Mfou', 'Terrain titré, idéal pour construction.', 12000000, 'ACTIVE', 8),
('763c3779-fb3c-4a47-a523-7a7e8abfdc1a', '5a7784c6-e81c-431a-b0ae-a4fb9a035491', '10aeb378-c844-4eab-a695-2b0a3c34c403', 'Appartement 2 chambres Akwa', 'Appartement rénové en plein centre.', 150000, 'ACTIVE', 20),
('0ed90a01-ae70-4b86-a7d7-64573cc90d36', '9f541222-233b-4278-b610-b1868e638575', '02c24bea-8361-4b48-9bc3-f2ea9c7d4d95', 'Villa de luxe à Bonanjo', 'Villa haut standing avec piscine.', 850000, 'ACTIVE', 50),
('0eba8add-7e26-42a5-8e7b-b815687bd9f5', '5a7784c6-e81c-431a-b0ae-a4fb9a035491', '7e7812cd-4e68-486a-92c6-b0fe12e78e65', 'Chambre moderne à Mvan', 'Chambre indépendante avec douche.', 45000, 'ACTIVE', 12),
('c63a8ae2-bd08-4ede-9e41-90ef1d2acaf4', 'ba56d39d-42b1-4965-ab02-7302643697ee', 'c4706edd-3e9e-46dd-8828-d1b36a2bdd1d', 'Maison moderne Bonapriso', 'Maison moderne avec jardin et garage.', 200000, 'ACTIVE', 25),
('7f943c8e-378e-48ae-8da5-0312a136fb0c', 'ba56d39d-42b1-4965-ab02-7302643697ee', 'bf35ca06-ae7f-4864-8929-f25f1a59659c', 'Appartement standing Akwa', 'Bel appartement avec vue sur la ville.', 180000, 'ACTIVE', 18),
('97e8f764-86c0-4f57-b826-b2e816781f64', '0c3fb459-e9bf-4a73-8c5a-c1aee1f5cc79', '589d3e87-f8cf-42a7-93d8-38a15e6999a5', 'Maison familiale Bafoussam', 'Grande maison familiale à Bafoussam.', 120000, 'ACTIVE', 10),
('0f620a46-f29d-42ec-ac71-92d3eab09c75', '0c3fb459-e9bf-4a73-8c5a-c1aee1f5cc79', '48b0efbc-367f-4bbd-9cce-cca4a5f35d4b', 'Villa avec piscine Bafoussam', 'Villa moderne avec piscine à Djeleng.', 400000, 'ACTIVE', 30);

-- Photos
INSERT INTO photos (property_id, url, display_order) VALUES
('d5ca1948-9360-4c93-8df6-984452c4fae7', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 0),
('d5ca1948-9360-4c93-8df6-984452c4fae7', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', 1),
('d5ca1948-9360-4c93-8df6-984452c4fae7', 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800', 2),
('79fdb493-a3b9-4eca-802a-844b8cca6b7b', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 0),
('79fdb493-a3b9-4eca-802a-844b8cca6b7b', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', 1),
('79fdb493-a3b9-4eca-802a-844b8cca6b7b', 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800', 2),
('90300aff-652f-47ac-98db-fba7e606fb12', 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800', 0),
('90300aff-652f-47ac-98db-fba7e606fb12', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800', 1),
('c2d783d7-d1cc-4b20-9f4f-a9b574eef392', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', 0),
('c2d783d7-d1cc-4b20-9f4f-a9b574eef392', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800', 1),
('c2d783d7-d1cc-4b20-9f4f-a9b574eef392', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', 2),
('be8bca59-c170-46ea-8934-54c4e3595235', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', 0),
('be8bca59-c170-46ea-8934-54c4e3595235', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', 1),
('10aeb378-c844-4eab-a695-2b0a3c34c403', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', 0),
('10aeb378-c844-4eab-a695-2b0a3c34c403', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', 1),
('02c24bea-8361-4b48-9bc3-f2ea9c7d4d95', 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800', 0),
('02c24bea-8361-4b48-9bc3-f2ea9c7d4d95', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 1),
('02c24bea-8361-4b48-9bc3-f2ea9c7d4d95', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 2),
('7e7812cd-4e68-486a-92c6-b0fe12e78e65', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 0),
('7e7812cd-4e68-486a-92c6-b0fe12e78e65', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800', 1),
('c4706edd-3e9e-46dd-8828-d1b36a2bdd1d', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 0),
('c4706edd-3e9e-46dd-8828-d1b36a2bdd1d', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', 1),
('bf35ca06-ae7f-4864-8929-f25f1a59659c', 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800', 0),
('bf35ca06-ae7f-4864-8929-f25f1a59659c', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', 1),
('589d3e87-f8cf-42a7-93d8-38a15e6999a5', 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800', 0),
('589d3e87-f8cf-42a7-93d8-38a15e6999a5', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 1),
('48b0efbc-367f-4bbd-9cce-cca4a5f35d4b', 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800', 0),
('48b0efbc-367f-4bbd-9cce-cca4a5f35d4b', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 1);

-- Favoris
INSERT INTO favorites (user_id, ad_id) VALUES
('3ee5d2ff-9eec-4439-b49a-560b6a9f6543', 'fd3e5f42-b973-4a6d-9333-e37479eca983'),
('3ee5d2ff-9eec-4439-b49a-560b6a9f6543', 'aa15c836-8feb-48a5-98c0-b9e2e7d34d8f'),
('3ee5d2ff-9eec-4439-b49a-560b6a9f6543', '0ed90a01-ae70-4b86-a7d7-64573cc90d36'),
('0beeef71-0820-4fb7-8c3d-4c859036c217', 'aa15c836-8feb-48a5-98c0-b9e2e7d34d8f'),
('0beeef71-0820-4fb7-8c3d-4c859036c217', '763c3779-fb3c-4a47-a523-7a7e8abfdc1a'),
('91390f11-d1ec-46d7-a7e6-db24197d6ae8', '471c9a18-97a0-46f1-a09e-2ac4997dc813'),
('77300973-1e75-4c13-a5d4-fd7ac400c4e1', '4db821a7-76fe-4cad-8410-6cd55593bc09'),
('77300973-1e75-4c13-a5d4-fd7ac400c4e1', '0ed90a01-ae70-4b86-a7d7-64573cc90d36'),
('6838ce3e-442d-467c-9fff-ce8c8dade1fb', '4db821a7-76fe-4cad-8410-6cd55593bc09')
ON CONFLICT DO NOTHING;

-- Critère de recherche
INSERT INTO search_criteria (user_id, property_type, city, district, price_max, bedrooms_min) VALUES
('3ee5d2ff-9eec-4439-b49a-560b6a9f6543', 'maison', 'Yaoundé', 'Bastos', 300000, 3)
ON CONFLICT DO NOTHING;
