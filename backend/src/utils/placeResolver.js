import { query } from '../config/db.js';

/**
 * Résolution canonique des noms de lieux.
 *
 * Problème : l'utilisateur (ou l'IA) écrit "Ngoa ekele", "ngoa-ekélé",
 * "Ngoa Ekelle"… mais la base contient "Ngoa-Ekellé". Un simple ILIKE échoue
 * (tiret, accents, doubles lettres).
 *
 * Solution : on normalise les DEUX côtés (sans accents, tirets → espaces,
 * lettres doublées réduites : "ekelle" → "ekele") puis on remplace le nom
 * approximatif par l'orthographe EXACTE présente en base. La requête SQL
 * travaille ensuite sur une valeur canonique.
 */

let cache = { at: 0, cities: new Map(), districts: new Map() };
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export function normalizePlace(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')        // accents
    .toLowerCase()
    .replace(/[-_']/g, ' ')       // tirets, underscores, apostrophes → espace
    .replace(/(.)\1+/g, '$1')    // lettres doublées : "ekelle" → "ekele"
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadPlaces() {
  if (Date.now() - cache.at < CACHE_TTL && cache.districts.size) return cache;
  const [cities, districts] = await Promise.all([
    query('SELECT DISTINCT city FROM properties WHERE city IS NOT NULL'),
    query('SELECT DISTINCT district FROM properties WHERE district IS NOT NULL'),
  ]);
  cache = {
    at: Date.now(),
    cities: new Map(cities.map((r) => [normalizePlace(r.city), r.city])),
    districts: new Map(districts.map((r) => [normalizePlace(r.district), r.district])),
  };
  return cache;
}

function lookup(map, name) {
  if (!name) return null;
  const norm = normalizePlace(name);
  if (!norm) return null;
  // 1. Correspondance exacte normalisée
  if (map.has(norm)) return map.get(norm);
  // 2. Correspondance par inclusion ("ngoa ekele yaounde" contient "ngoa ekele")
  for (const [key, canonical] of map) {
    if (norm.includes(key) || key.includes(norm)) return canonical;
  }
  // 3. Correspondance mot à mot (tous les mots du nom sont dans la clé)
  const words = norm.split(' ').filter(Boolean);
  for (const [key, canonical] of map) {
    const keyWords = key.split(' ');
    if (words.every((w) => keyWords.some((k) => k.startsWith(w) || w.startsWith(k)))) {
      return canonical;
    }
  }
  return null;
}

/** "ngoa ekele" → "Ngoa-Ekellé" (orthographe exacte en base) ou null */
export async function resolveDistrict(name) {
  const { districts } = await loadPlaces();
  return lookup(districts, name);
}

/** "yaounde" → "Yaoundé" ou null */
export async function resolveCity(name) {
  const { cities } = await loadPlaces();
  return lookup(cities, name);
}
