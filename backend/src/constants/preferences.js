/**
 * Catalogue des préférences de proximité (tags attachés à un bien).
 *
 * Source unique de vérité : utilisé par
 *  - le script de seed (db/seed-preferences.js) pour peupler la table `preferences`,
 *  - le prompt Mistral (services/MistralService.js) pour que l'IA ne renvoie
 *    que des codes valides,
 *  - le frontend (via GET /api/preferences) pour afficher les puces de filtre.
 *
 * `code` est la clé stable utilisée partout (API, URL, JSON de l'IA).
 */
export const PREFERENCE_CATALOG = [
  { code: 'ecole',        label: "Proche d'une école",          icon: 'graduation-cap', category: 'education' },
  { code: 'lycee',        label: "Proche d'un lycée",           icon: 'graduation-cap', category: 'education' },
  { code: 'universite',   label: "Proche d'une université",     icon: 'graduation-cap', category: 'education' },
  { code: 'creche',       label: "Proche d'une crèche",         icon: 'baby',           category: 'education' },
  { code: 'hopital',      label: "Proche d'un hôpital",         icon: 'hospital',       category: 'sante' },
  { code: 'pharmacie',    label: "Proche d'une pharmacie",      icon: 'pill',           category: 'sante' },
  { code: 'centre_ville', label: 'Proche du centre-ville',      icon: 'building',       category: 'commodites' },
  { code: 'marche',       label: "Proche d'un marché",          icon: 'shopping-cart',  category: 'commodites' },
  { code: 'supermarche',  label: "Proche d'un supermarché",     icon: 'shopping-bag',   category: 'commodites' },
  { code: 'transport',    label: 'Proche des transports',       icon: 'bus',            category: 'commodites' },
  { code: 'banque',       label: "Proche d'une banque",         icon: 'credit-card',    category: 'commodites' },
  { code: 'commissariat', label: "Proche d'un commissariat",    icon: 'shield',         category: 'securite' },
  { code: 'mosquee',      label: "Proche d'une mosquée",        icon: 'church',         category: 'spiritualite' },
  { code: 'eglise',       label: "Proche d'une église",         icon: 'church',         category: 'spiritualite' },
  { code: 'espace_vert',  label: "Proche d'un espace vert",     icon: 'trees',          category: 'loisirs' },
  { code: 'salle_sport',  label: "Proche d'une salle de sport", icon: 'dumbbell',       category: 'loisirs' },
];

/** Codes valides — sert à valider ce que renvoie l'IA ou l'API. */
export const PREFERENCE_CODES = PREFERENCE_CATALOG.map((p) => p.code);

/** Filtre une liste quelconque pour ne garder que des codes connus. */
export function sanitizePreferenceCodes(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  for (const item of list) {
    const code = typeof item === 'string' ? item : item?.code;
    if (code && PREFERENCE_CODES.includes(code)) seen.add(code);
  }
  return [...seen];
}

export default PREFERENCE_CATALOG;
