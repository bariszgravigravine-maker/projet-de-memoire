-- =====================================================
-- Migration : préférences de proximité
-- Ajoute les tables `preferences` et `property_preferences`.
-- Idempotent : peut être exécuté plusieurs fois sans risque.
--
-- Usage sur le VPS :
--   psql -U postgres -d immo_db -f backend/db_preferences_migration.sql
--
-- (Alternative équivalente : npm run db:seed:preferences, qui crée les tables,
--  remplit le catalogue ET associe des préférences aux biens existants.)
-- =====================================================

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

-- Catalogue des préférences (mêmes codes que src/constants/preferences.js)
INSERT INTO preferences (code, label, icon, category) VALUES
  ('ecole',        'Proche d''une école',          'graduation-cap', 'education'),
  ('lycee',        'Proche d''un lycée',           'graduation-cap', 'education'),
  ('universite',   'Proche d''une université',     'graduation-cap', 'education'),
  ('creche',       'Proche d''une crèche',         'baby',           'education'),
  ('hopital',      'Proche d''un hôpital',         'hospital',       'sante'),
  ('pharmacie',    'Proche d''une pharmacie',      'pill',           'sante'),
  ('centre_ville', 'Proche du centre-ville',       'building',       'commodites'),
  ('marche',       'Proche d''un marché',          'shopping-cart',  'commodites'),
  ('supermarche',  'Proche d''un supermarché',     'shopping-bag',   'commodites'),
  ('transport',    'Proche des transports',        'bus',            'commodites'),
  ('banque',       'Proche d''une banque',         'credit-card',    'commodites'),
  ('commissariat', 'Proche d''un commissariat',    'shield',         'securite'),
  ('mosquee',      'Proche d''une mosquée',        'church',         'spiritualite'),
  ('eglise',       'Proche d''une église',         'church',         'spiritualite'),
  ('espace_vert',  'Proche d''un espace vert',     'trees',          'loisirs'),
  ('salle_sport',  'Proche d''une salle de sport', 'dumbbell',       'loisirs')
ON CONFLICT (code) DO UPDATE
  SET label = EXCLUDED.label,
      icon = EXCLUDED.icon,
      category = EXCLUDED.category;

-- Vérification
SELECT
  (SELECT COUNT(*) FROM preferences) AS total_preferences,
  (SELECT COUNT(DISTINCT property_id) FROM property_preferences) AS biens_references,
  (SELECT COUNT(*) FROM properties) AS total_biens;
